use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Manager, State};

const STORE_VERSION: u8 = 1;
const MAX_STORE_BYTES: usize = 20 * 1024 * 1024;
const MAX_CONVERSATIONS: usize = 200;
const MAX_MESSAGES: usize = 1_000;

#[derive(Default)]
pub struct ConversationStore(Mutex<()>);

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Message {
    role: String,
    content: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    reasoning: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    usage: Option<Value>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct GenerationSettings {
    thinking: bool,
    max_tokens: u32,
    temperature: Option<f64>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Conversation {
    id: String,
    title: String,
    endpoint: String,
    model_id: String,
    updated_at: u64,
    messages: Vec<Message>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    settings: Option<GenerationSettings>,
}

#[derive(Deserialize, Serialize)]
struct Document {
    version: u8,
    conversations: Vec<Conversation>,
}

fn store_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|directory| directory.join("conversations.json"))
        .map_err(|error| format!("Could not locate Studio data directory: {error}"))
}

fn lock_store(path: &Path) -> Result<File, String> {
    let directory = path
        .parent()
        .ok_or_else(|| "Conversation path has no parent directory.".to_owned())?;
    fs::create_dir_all(directory)
        .map_err(|error| format!("Could not create Studio data directory: {error}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(directory, fs::Permissions::from_mode(0o700))
            .map_err(|error| format!("Could not protect Studio data directory: {error}"))?;
    }
    let mut options = OpenOptions::new();
    options.read(true).write(true).create(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let file = options
        .open(directory.join(".conversations.lock"))
        .map_err(|error| format!("Could not open conversation lock: {error}"))?;
    #[cfg(unix)]
    {
        use std::os::fd::AsRawFd;
        let result = unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX) };
        if result != 0 {
            return Err(format!(
                "Could not lock conversations: {}",
                std::io::Error::last_os_error()
            ));
        }
    }
    Ok(file)
}

fn read_document(path: &Path) -> Result<Document, String> {
    let bytes = match fs::read(path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return Ok(Document {
                version: STORE_VERSION,
                conversations: Vec::new(),
            });
        }
        Err(error) => return Err(format!("Could not read conversations: {error}")),
    };
    if bytes.len() > MAX_STORE_BYTES {
        return Err("Conversation file exceeds the 20 MiB limit.".to_owned());
    }
    let document: Document = serde_json::from_slice(&bytes)
        .map_err(|error| format!("Conversation file is invalid: {error}"))?;
    if document.version != STORE_VERSION {
        return Err(format!(
            "Unsupported conversation file version {}.",
            document.version
        ));
    }
    Ok(document)
}

fn validate(conversation: &Conversation) -> Result<(), String> {
    let valid_id = conversation.id.len() == 36
        && conversation
            .id
            .chars()
            .all(|character| character.is_ascii_hexdigit() || character == '-');
    if !valid_id {
        return Err("Conversation ID is invalid.".to_owned());
    }
    if conversation.title.trim().is_empty() || conversation.title.len() > 512 {
        return Err("Conversation title is invalid.".to_owned());
    }
    if conversation.endpoint.len() > 512 || conversation.model_id.len() > 256 {
        return Err("Conversation source is too long.".to_owned());
    }
    if conversation.messages.is_empty() || conversation.messages.len() > MAX_MESSAGES {
        return Err("Conversation message count is invalid.".to_owned());
    }
    if conversation.settings.as_ref().is_some_and(|settings| {
        !(1..=32_768).contains(&settings.max_tokens)
            || settings
                .temperature
                .is_some_and(|value| !value.is_finite() || !(0.0..=2.0).contains(&value))
    }) {
        return Err("Conversation generation settings are invalid.".to_owned());
    }
    for message in &conversation.messages {
        if !matches!(message.role.as_str(), "user" | "assistant") {
            return Err("Conversation message role is invalid.".to_owned());
        }
        if message.content.len() > 1_000_000
            || message
                .reasoning
                .as_ref()
                .is_some_and(|text| text.len() > 1_000_000)
        {
            return Err("Conversation message exceeds the 1 MiB limit.".to_owned());
        }
    }
    Ok(())
}

fn write_document(path: &Path, document: &Document) -> Result<(), String> {
    let bytes = serde_json::to_vec(document)
        .map_err(|error| format!("Could not encode conversations: {error}"))?;
    if bytes.len() > MAX_STORE_BYTES {
        return Err("Conversations exceed the 20 MiB limit.".to_owned());
    }
    let directory = path
        .parent()
        .ok_or_else(|| "Conversation path has no parent directory.".to_owned())?;
    fs::create_dir_all(directory)
        .map_err(|error| format!("Could not create Studio data directory: {error}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(directory, fs::Permissions::from_mode(0o700))
            .map_err(|error| format!("Could not protect Studio data directory: {error}"))?;
    }

    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("Could not timestamp conversation save: {error}"))?
        .as_nanos();
    let temporary = directory.join(format!(".conversations-{}-{stamp}.tmp", std::process::id()));
    let result = (|| -> Result<(), String> {
        let mut options = OpenOptions::new();
        options.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let mut file = options
            .open(&temporary)
            .map_err(|error| format!("Could not create conversation update: {error}"))?;
        file.write_all(&bytes)
            .and_then(|()| file.sync_all())
            .map_err(|error| format!("Could not save conversations: {error}"))?;
        fs::rename(&temporary, path)
            .map_err(|error| format!("Could not finish conversation save: {error}"))
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result
}

#[tauri::command]
pub fn list_conversations(
    app: AppHandle,
    store: State<'_, ConversationStore>,
) -> Result<Vec<Conversation>, String> {
    let _guard = store
        .0
        .lock()
        .map_err(|_| "Conversation store is unavailable.".to_owned())?;
    let path = store_path(&app)?;
    let _file_lock = lock_store(&path)?;
    Ok(read_document(&path)?.conversations)
}

#[tauri::command]
pub fn save_conversation(
    app: AppHandle,
    store: State<'_, ConversationStore>,
    conversation: Conversation,
) -> Result<(), String> {
    validate(&conversation)?;
    let _guard = store
        .0
        .lock()
        .map_err(|_| "Conversation store is unavailable.".to_owned())?;
    let path = store_path(&app)?;
    let _file_lock = lock_store(&path)?;
    let mut document = read_document(&path)?;
    document
        .conversations
        .retain(|existing| existing.id != conversation.id);
    if document.conversations.len() >= MAX_CONVERSATIONS {
        return Err("Conversation limit reached. Delete an older chat first.".to_owned());
    }
    document.conversations.insert(0, conversation);
    write_document(&path, &document)
}

#[tauri::command]
pub fn delete_conversation(
    app: AppHandle,
    store: State<'_, ConversationStore>,
    id: String,
) -> Result<(), String> {
    let _guard = store
        .0
        .lock()
        .map_err(|_| "Conversation store is unavailable.".to_owned())?;
    let path = store_path(&app)?;
    let _file_lock = lock_store(&path)?;
    let mut document = read_document(&path)?;
    document
        .conversations
        .retain(|conversation| conversation.id != id);
    write_document(&path, &document)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> Conversation {
        Conversation {
            id: "ef9194e0-69e1-4c1a-af0b-3c25b013329c".to_owned(),
            title: "Local model".to_owned(),
            endpoint: "http://127.0.0.1:8011".to_owned(),
            model_id: "cachalot-mock".to_owned(),
            updated_at: 1,
            messages: vec![Message {
                role: "user".to_owned(),
                content: "Hello".to_owned(),
                reasoning: None,
                usage: None,
            }],
            settings: None,
        }
    }

    #[test]
    fn round_trip_and_reject_corrupt_data() {
        let directory = std::env::temp_dir().join(format!(
            "cachalot-conversations-test-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock")
                .as_nanos()
        ));
        let path = directory.join("conversations.json");
        let document = Document {
            version: STORE_VERSION,
            conversations: vec![sample()],
        };
        write_document(&path, &document).expect("write");
        let loaded = read_document(&path).expect("read");
        assert_eq!(loaded.conversations[0].messages[0].content, "Hello");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            assert_eq!(
                fs::metadata(&path).expect("metadata").permissions().mode() & 0o777,
                0o600
            );
        }
        fs::write(&path, b"invalid JSON").expect("corrupt file");
        assert!(read_document(&path).is_err());
        fs::remove_dir_all(directory).expect("cleanup");
    }

    #[test]
    fn reject_invalid_message_role() {
        let mut conversation = sample();
        conversation.messages[0].role = "system".to_owned();
        assert!(validate(&conversation).is_err());
    }

    #[test]
    fn accepts_saved_settings_and_old_conversations() {
        let old = sample();
        let serialized = serde_json::to_string(&old).expect("old conversation");
        assert!(!serialized.contains("settings"));
        assert!(serde_json::from_str::<Conversation>(&serialized).is_ok());

        let mut conversation = old;
        conversation.settings = Some(GenerationSettings {
            thinking: true,
            max_tokens: 4096,
            temperature: Some(0.7),
        });
        assert!(validate(&conversation).is_ok());
        conversation
            .settings
            .as_mut()
            .expect("settings")
            .temperature = Some(2.1);
        assert!(validate(&conversation).is_err());
    }

    #[cfg(unix)]
    #[test]
    fn file_lock_serializes_store_access() {
        use std::sync::mpsc;
        use std::time::Duration;

        let directory = std::env::temp_dir().join(format!(
            "cachalot-lock-test-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock")
                .as_nanos()
        ));
        let path = directory.join("conversations.json");
        let first = lock_store(&path).expect("first lock");
        let (ready_sender, ready_receiver) = mpsc::channel();
        let (acquired_sender, acquired_receiver) = mpsc::channel();
        let second = std::thread::spawn(move || {
            ready_sender.send(()).expect("ready");
            let _guard = lock_store(&path).expect("second lock");
            acquired_sender.send(()).expect("acquired");
        });
        ready_receiver.recv().expect("worker ready");
        assert!(acquired_receiver
            .recv_timeout(Duration::from_millis(50))
            .is_err());
        drop(first);
        acquired_receiver
            .recv_timeout(Duration::from_secs(2))
            .expect("second writer proceeds");
        second.join().expect("worker joins");
        fs::remove_dir_all(directory).expect("cleanup");
    }
}
