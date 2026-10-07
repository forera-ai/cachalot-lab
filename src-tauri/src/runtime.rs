use std::{
    net::IpAddr,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};

use futures_util::StreamExt;
use reqwest::{Client, Url};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::async_runtime::JoinHandle;
use tauri::{AppHandle, Emitter, State};

#[derive(Clone)]
struct Connection {
    base_url: Url,
    model_id: String,
    api_key: Option<String>,
}

struct ActiveChat {
    id: u64,
    task: JoinHandle<()>,
}

struct GenerationOptions {
    max_tokens: u32,
    thinking: bool,
    temperature: Option<f64>,
}

pub struct RuntimeState {
    connection: Mutex<Option<Connection>>,
    chat: Arc<Mutex<Option<ActiveChat>>>,
    next_chat_id: AtomicU64,
    client: Result<Client, String>,
}

impl Default for RuntimeState {
    fn default() -> Self {
        let client = Client::builder()
            .connect_timeout(Duration::from_secs(4))
            .no_proxy()
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .map_err(|error| format!("Could not initialize local HTTP client: {error}"));
        Self {
            connection: Mutex::new(None),
            chat: Arc::new(Mutex::new(None)),
            next_chat_id: AtomicU64::new(1),
            client,
        }
    }
}

#[derive(Serialize)]
pub struct ConnectionInfo {
    endpoint: String,
    model_id: String,
}

#[derive(Serialize)]
pub struct RuntimeSnapshot {
    connected: bool,
    healthy: bool,
    busy: bool,
    endpoint: Option<String>,
    model_id: Option<String>,
    stats: Option<Value>,
    error: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Clone, Serialize)]
pub struct ChatEvent {
    chat_id: u64,
    kind: &'static str,
    content: Option<String>,
    reasoning: Option<String>,
    tool_calls: Option<Value>,
    usage: Option<Value>,
    finish_reason: Option<String>,
    error: Option<String>,
}

impl ChatEvent {
    fn new(chat_id: u64, kind: &'static str) -> Self {
        Self {
            chat_id,
            kind,
            content: None,
            reasoning: None,
            tool_calls: None,
            usage: None,
            finish_reason: None,
            error: None,
        }
    }
}

fn lock_error() -> String {
    "Lab's runtime state is unavailable. Restart the app.".to_owned()
}

pub(crate) fn parse_local_endpoint(raw: &str) -> Result<Url, String> {
    let mut url = Url::parse(raw.trim())
        .map_err(|_| "Enter a complete URL such as http://127.0.0.1:8011".to_owned())?;
    if url.scheme() != "http" {
        return Err("The local runtime connection must use http://".to_owned());
    }
    let host = url
        .host_str()
        .ok_or("The endpoint needs a hostname.".to_owned())?;
    let loopback = host.eq_ignore_ascii_case("localhost")
        || host
            .trim_start_matches('[')
            .trim_end_matches(']')
            .parse::<IpAddr>()
            .is_ok_and(|address| address.is_loopback());
    if !loopback {
        return Err("Only loopback endpoints are supported in this release.".to_owned());
    }
    if url.port().is_none() {
        return Err("Include the runtime port, for example :8011.".to_owned());
    }
    if !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err("Remove credentials, queries, and fragments from the endpoint URL.".to_owned());
    }
    let path = url.path().trim_end_matches('/');
    if !path.is_empty() && path != "/v1" {
        return Err("Use the server address, with an optional /v1 suffix.".to_owned());
    }
    url.set_path("/");
    Ok(url)
}

fn endpoint(base: &Url, path: &str) -> Result<Url, String> {
    base.join(path)
        .map_err(|_| "Could not build the runtime URL.".to_owned())
}

fn with_auth(builder: reqwest::RequestBuilder, key: &Option<String>) -> reqwest::RequestBuilder {
    match key {
        Some(key) if !key.is_empty() => builder.bearer_auth(key),
        _ => builder,
    }
}

async fn fetch_json(client: &Client, url: Url, key: &Option<String>) -> Result<Value, String> {
    let response = with_auth(client.get(url), key)
        .timeout(Duration::from_secs(5))
        .send()
        .await
        .map_err(|error| format!("Could not reach the local runtime: {error}"))?;
    if !response.status().is_success() {
        return Err(format!(
            "The runtime returned HTTP {}.",
            response.status().as_u16()
        ));
    }
    response
        .json()
        .await
        .map_err(|error| format!("The runtime returned invalid JSON: {error}"))
}

#[tauri::command]
pub async fn connect_runtime(
    state: State<'_, RuntimeState>,
    endpoint_url: String,
    api_key: Option<String>,
    use_keychain: Option<bool>,
) -> Result<ConnectionInfo, String> {
    if state
        .chat
        .lock()
        .map_err(|_| lock_error())?
        .as_ref()
        .is_some_and(|chat| !chat.task.inner().is_finished())
    {
        return Err("Stop the current generation before changing runtime.".to_owned());
    }
    let client = state.client.as_ref().map_err(Clone::clone)?;
    let base_url = parse_local_endpoint(&endpoint_url)?;
    let key = match api_key.filter(|value| !value.trim().is_empty()) {
        Some(value) => Some(crate::credentials::validate_key(&value)?),
        None if use_keychain.unwrap_or(false) => {
            let address = base_url.as_str().to_owned();
            tauri::async_runtime::spawn_blocking(move || crate::credentials::load(&address))
                .await
                .map_err(|_| "Could not load Keychain key.".to_owned())??
        }
        None => None,
    };
    let health = fetch_json(client, endpoint(&base_url, "health")?, &None).await?;
    if health.get("status").and_then(Value::as_str) != Some("ok") {
        return Err("The server is reachable but is not ready yet.".to_owned());
    }
    let models = fetch_json(client, endpoint(&base_url, "v1/models")?, &key).await?;
    let model_id = models
        .pointer("/data/0/id")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or("The server did not report a model ID.")?
        .to_owned();
    let info = ConnectionInfo {
        endpoint: base_url.as_str().trim_end_matches('/').to_owned(),
        model_id: model_id.clone(),
    };
    let mut connection = state.connection.lock().map_err(|_| lock_error())?;
    *connection = Some(Connection {
        base_url,
        model_id,
        api_key: key,
    });
    Ok(info)
}

#[tauri::command]
pub fn disconnect_runtime(app: AppHandle, state: State<'_, RuntimeState>) -> Result<(), String> {
    if let Some(active) = state.chat.lock().map_err(|_| lock_error())?.take() {
        active.task.abort();
        let _ = app.emit("runtime-chat", ChatEvent::new(active.id, "canceled"));
    }
    *state.connection.lock().map_err(|_| lock_error())? = None;
    Ok(())
}

#[tauri::command]
pub async fn poll_runtime(state: State<'_, RuntimeState>) -> Result<RuntimeSnapshot, String> {
    let client = state.client.as_ref().map_err(Clone::clone)?;
    let connection = state.connection.lock().map_err(|_| lock_error())?.clone();
    let Some(connection) = connection else {
        return Ok(RuntimeSnapshot {
            connected: false,
            healthy: false,
            busy: false,
            endpoint: None,
            model_id: None,
            stats: None,
            error: None,
        });
    };

    let endpoint_label = Some(
        connection
            .base_url
            .as_str()
            .trim_end_matches('/')
            .to_owned(),
    );
    let model_id = Some(connection.model_id.clone());
    let health = fetch_json(client, endpoint(&connection.base_url, "health")?, &None).await;
    let healthy =
        matches!(&health, Ok(value) if value.get("status").and_then(Value::as_str) == Some("ok"));
    if !healthy {
        return Ok(RuntimeSnapshot {
            connected: true,
            healthy: false,
            busy: false,
            endpoint: endpoint_label,
            model_id,
            stats: None,
            error: Some(
                health
                    .err()
                    .unwrap_or_else(|| "The runtime is starting or unavailable.".to_owned()),
            ),
        });
    }
    let busy = health
        .as_ref()
        .ok()
        .and_then(|value| value.get("busy"))
        .and_then(Value::as_bool)
        .unwrap_or(false);
    match fetch_json(
        client,
        endpoint(&connection.base_url, "v1/stats")?,
        &connection.api_key,
    )
    .await
    {
        Ok(stats) => Ok(RuntimeSnapshot {
            connected: true,
            healthy: true,
            busy,
            endpoint: endpoint_label,
            model_id,
            stats: Some(stats),
            error: None,
        }),
        Err(error) => Ok(RuntimeSnapshot {
            connected: true,
            healthy: true,
            busy,
            endpoint: endpoint_label,
            model_id,
            stats: None,
            error: Some(error),
        }),
    }
}

fn parse_stream_line(chat_id: u64, line: &str) -> Option<ChatEvent> {
    let data = line.strip_prefix("data:")?.trim();
    if data == "[DONE]" {
        return Some(ChatEvent::new(chat_id, "done"));
    }
    let value: Value = serde_json::from_str(data).ok()?;
    if let Some(message) = value.pointer("/error/message").and_then(Value::as_str) {
        let mut event = ChatEvent::new(chat_id, "error");
        event.error = Some(message.to_owned());
        return Some(event);
    }
    let mut event = ChatEvent::new(chat_id, "delta");
    if let Some(delta) = value.pointer("/choices/0/delta") {
        event.content = delta
            .get("content")
            .and_then(Value::as_str)
            .map(str::to_owned);
        event.reasoning = delta
            .get("reasoning_content")
            .and_then(Value::as_str)
            .map(str::to_owned);
        event.tool_calls = delta.get("tool_calls").cloned();
    }
    event.usage = value.get("usage").cloned();
    event.finish_reason = value
        .pointer("/choices/0/finish_reason")
        .and_then(Value::as_str)
        .map(str::to_owned);
    if event.content.is_none()
        && event.reasoning.is_none()
        && event.tool_calls.is_none()
        && event.usage.is_none()
        && event.finish_reason.is_none()
    {
        return None;
    }
    Some(event)
}

async fn stream_chat(
    app: AppHandle,
    client: Client,
    connection: Connection,
    chat_id: u64,
    messages: Vec<ChatMessage>,
    options: GenerationOptions,
) -> Result<(), String> {
    let url = endpoint(&connection.base_url, "v1/chat/completions")?;
    let mut request = json!({"model": connection.model_id, "messages": messages, "stream": true, "stream_options": {"include_usage": true}, "max_tokens": options.max_tokens, "thinking": options.thinking});
    if let Some(value) = options.temperature {
        request["temperature"] = json!(value);
    }
    let response = with_auth(client.post(url).json(&request), &connection.api_key)
        .send()
        .await
        .map_err(|error| format!("Could not send the chat request: {error}"))?;
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        let message = serde_json::from_str::<Value>(&body)
            .ok()
            .and_then(|value| {
                value
                    .pointer("/error/message")
                    .and_then(Value::as_str)
                    .map(str::to_owned)
            })
            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
        return Err(format!("The runtime rejected the request: {message}"));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = Vec::<u8>::new();
    let mut done = false;
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|error| format!("Chat stream interrupted: {error}"))?;
        buffer.extend_from_slice(&chunk);
        if buffer.len() > 1_048_576 {
            return Err("The runtime sent an oversized stream event.".to_owned());
        }
        while let Some(position) = buffer.iter().position(|byte| *byte == b'\n') {
            let line = buffer.drain(..=position).collect::<Vec<_>>();
            let line = String::from_utf8_lossy(&line);
            if let Some(event) = parse_stream_line(chat_id, line.trim_end()) {
                if event.kind == "done" {
                    done = true;
                }
                let _ = app.emit("runtime-chat", event);
            }
        }
    }
    if !done {
        return Err("The runtime closed the stream before [DONE].".to_owned());
    }
    Ok(())
}

#[tauri::command]
pub fn start_chat(
    app: AppHandle,
    state: State<'_, RuntimeState>,
    messages: Vec<ChatMessage>,
    max_tokens: u32,
    thinking: bool,
    temperature: Option<f64>,
) -> Result<u64, String> {
    if messages.is_empty()
        || messages.iter().any(|message| {
            !matches!(
                message.role.as_str(),
                "system" | "user" | "assistant" | "tool"
            )
        })
        || messages
            .iter()
            .any(|message| message.content.len() > 1_000_000)
    {
        return Err("Add a valid message before sending.".to_owned());
    }
    if !(1..=32_768).contains(&max_tokens) {
        return Err("Max tokens must be between 1 and 32768.".to_owned());
    }
    if temperature.is_some_and(|value| !value.is_finite() || !(0.0..=2.0).contains(&value)) {
        return Err("Temperature must be between 0 and 2.".to_owned());
    }
    let connection = state
        .connection
        .lock()
        .map_err(|_| lock_error())?
        .clone()
        .ok_or("Connect to a runtime first.")?;
    let mut active = state.chat.lock().map_err(|_| lock_error())?;
    if active
        .as_ref()
        .is_some_and(|chat| !chat.task.inner().is_finished())
    {
        return Err("A generation is already in progress.".to_owned());
    }
    let chat_id = state.next_chat_id.fetch_add(1, Ordering::Relaxed);
    let slot = Arc::clone(&state.chat);
    let client = state.client.as_ref().map_err(Clone::clone)?.clone();
    let app_for_task = app.clone();
    let task = tauri::async_runtime::spawn(async move {
        if let Err(error) = stream_chat(
            app_for_task.clone(),
            client,
            connection,
            chat_id,
            messages,
            GenerationOptions {
                max_tokens,
                thinking,
                temperature,
            },
        )
        .await
        {
            let mut event = ChatEvent::new(chat_id, "error");
            event.error = Some(error);
            let _ = app_for_task.emit("runtime-chat", event);
        }
        if let Ok(mut current) = slot.lock() {
            if current.as_ref().is_some_and(|chat| chat.id == chat_id) {
                *current = None;
            }
        }
    });
    *active = Some(ActiveChat { id: chat_id, task });
    Ok(chat_id)
}

#[tauri::command]
pub fn stop_chat(app: AppHandle, state: State<'_, RuntimeState>) -> Result<(), String> {
    if let Some(active) = state.chat.lock().map_err(|_| lock_error())?.take() {
        active.task.abort();
        let _ = app.emit("runtime-chat", ChatEvent::new(active.id, "canceled"));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{parse_local_endpoint, parse_stream_line};

    #[test]
    fn endpoint_only_accepts_local_http() {
        assert!(parse_local_endpoint("http://127.0.0.1:8011/v1").is_ok());
        assert!(parse_local_endpoint("http://localhost:8011").is_ok());
        assert!(parse_local_endpoint("http://example.com:8011").is_err());
        assert!(parse_local_endpoint("https://127.0.0.1:8011").is_err());
        assert!(parse_local_endpoint("http://127.0.0.1:8011/other").is_err());
    }

    #[test]
    fn stream_parser_preserves_reasoning_and_usage() {
        let line = r#"data: {"choices":[{"delta":{"content":"Hi","reasoning_content":"Think"},"finish_reason":"stop"}],"usage":{"completion_tokens":1}}"#;
        let event = parse_stream_line(3, line).expect("stream delta");
        assert_eq!(event.content.as_deref(), Some("Hi"));
        assert_eq!(event.reasoning.as_deref(), Some("Think"));
        assert!(event.usage.is_some());
        assert!(parse_stream_line(3, ": keep-alive").is_none());
        let final_usage = r#"data: {"choices":[],"usage":{"completion_tokens":4}}"#;
        assert!(parse_stream_line(3, final_usage).unwrap().usage.is_some());
    }
}
