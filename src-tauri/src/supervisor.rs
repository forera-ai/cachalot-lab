use std::fs::{self, File, OpenOptions};
use std::io::{Read, Seek, SeekFrom};
use std::net::{Ipv4Addr, SocketAddrV4, TcpListener};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
#[cfg(unix)]
use std::thread;
use std::time::Duration;

use serde::Serialize;
use serde_json::Value;
use tauri::{AppHandle, Manager, State};

use crate::profiles::{self, ProfileStore};

struct ManagedChild {
    child: Child,
    profile_id: String,
    endpoint: String,
    ready: bool,
    log_path: std::path::PathBuf,
}

#[derive(Default)]
struct SupervisorInner {
    active: Option<ManagedChild>,
    last_exit_code: Option<i32>,
}

#[derive(Default)]
pub struct Supervisor(Mutex<SupervisorInner>);

#[derive(Default, Serialize, Debug, PartialEq)]
pub struct StartupEvidence {
    checkpoint: Option<String>,
    expert_bank: Option<String>,
    encoder_only_prefill: Option<bool>,
}

// Only complete lines from the bounded startup prefix qualify. No HTTP model ID,
// saved launch intent or old process log establishes observed checkpoint identity.
fn parse_startup(text: &str) -> StartupEvidence {
    let mut evidence = StartupEvidence::default();
    for line in text
        .split_inclusive('\n')
        .filter(|line| line.ends_with('\n'))
    {
        let line = line.trim_end();
        if line.contains("Uvicorn running on") {
            break;
        }
        if let Some((version, path)) = line
            .strip_prefix("cachalot ")
            .and_then(|s| s.split_once(": loading "))
        {
            if !version.is_empty() && version.chars().all(|c| c.is_ascii_digit() || c == '.') {
                let path = path
                    .strip_prefix("GLM-5.3-Flash from ")
                    .or_else(|| path.strip_prefix("MiniMax-M3 from "))
                    .unwrap_or(path);
                evidence.checkpoint = startup_basename(path);
            }
        }
        if let Some(path) = line.strip_prefix("expert bank: ") {
            // Runtime appends format/count metadata after the path.
            evidence.expert_bank =
                startup_basename(path.rsplit_once(" (").map_or(path, |(path, _)| path));
        }
        if line.starts_with("DI-1 encoder-only prefill on: ") {
            evidence.encoder_only_prefill = Some(true);
        }
    }
    evidence
}

fn startup_basename(path: &str) -> Option<String> {
    if !Path::new(path).is_absolute() {
        return None;
    }
    Path::new(path)
        .file_name()
        .and_then(|s| s.to_str())
        .filter(|s| !s.is_empty())
        .map(str::to_owned)
}

fn read_startup(path: &Path) -> StartupEvidence {
    let Ok(file) = File::open(path) else {
        return StartupEvidence::default();
    };
    let mut bytes = Vec::new();
    if file.take(64 * 1024).read_to_end(&mut bytes).is_err() {
        return StartupEvidence::default();
    }
    parse_startup(&String::from_utf8_lossy(&bytes))
}

#[derive(Serialize)]
pub struct ManagedStatus {
    running: bool,
    ready: bool,
    profile_id: Option<String>,
    endpoint: Option<String>,
    pid: Option<u32>,
    last_exit_code: Option<i32>,
    startup: Option<StartupEvidence>,
}

impl SupervisorInner {
    fn refresh(&mut self) -> Result<(), String> {
        let Some(active) = self.active.as_mut() else {
            return Ok(());
        };
        if let Some(exit) = active
            .child
            .try_wait()
            .map_err(|error| format!("Could not inspect managed runtime: {error}"))?
        {
            self.last_exit_code = exit.code();
            self.active = None;
        }
        Ok(())
    }

    fn status(&self) -> ManagedStatus {
        ManagedStatus {
            running: self.active.is_some(),
            ready: self.active.as_ref().is_some_and(|active| active.ready),
            profile_id: self.active.as_ref().map(|active| active.profile_id.clone()),
            endpoint: self.active.as_ref().map(|active| active.endpoint.clone()),
            pid: self.active.as_ref().map(|active| active.child.id()),
            last_exit_code: self.last_exit_code,
            startup: self
                .active
                .as_ref()
                .map(|active| read_startup(&active.log_path)),
        }
    }

    fn stop(&mut self) -> Result<(), String> {
        self.refresh()?;
        if let Some(active) = self.active.as_mut() {
            #[cfg(unix)]
            {
                let result = unsafe { libc::kill(active.child.id() as i32, libc::SIGTERM) };
                if result != 0 {
                    let error = std::io::Error::last_os_error();
                    if error.raw_os_error() != Some(libc::ESRCH) {
                        return Err(format!("Could not stop managed runtime: {error}"));
                    }
                }
                for _ in 0..100 {
                    if let Some(exit) = active
                        .child
                        .try_wait()
                        .map_err(|error| format!("Could not inspect managed runtime: {error}"))?
                    {
                        self.last_exit_code = exit.code();
                        self.active = None;
                        return Ok(());
                    }
                    thread::sleep(Duration::from_millis(50));
                }
            }
            active
                .child
                .kill()
                .map_err(|error| format!("Could not force-stop managed runtime: {error}"))?;
            let exit = active
                .child
                .wait()
                .map_err(|error| format!("Could not reap managed runtime: {error}"))?;
            self.last_exit_code = exit.code();
            self.active = None;
        }
        Ok(())
    }
}

impl Drop for Supervisor {
    fn drop(&mut self) {
        let inner = self
            .0
            .get_mut()
            .unwrap_or_else(|poison| poison.into_inner());
        let _ = inner.stop();
    }
}

fn log_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|directory| directory.join("managed-runtime.log"))
        .map_err(|error| format!("Could not locate Lab data directory: {error}"))
}

fn runtime_log(app: &AppHandle) -> Result<File, String> {
    let path = log_path(app)?;
    let directory = path.parent().ok_or("Managed log path has no parent.")?;
    fs::create_dir_all(directory)
        .map_err(|error| format!("Could not create Lab data directory: {error}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(directory, fs::Permissions::from_mode(0o700))
            .map_err(|error| format!("Could not protect Lab data directory: {error}"))?;
    }
    let mut options = OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    options
        .open(path)
        .map_err(|error| format!("Could not open managed runtime log: {error}"))
}

#[tauri::command]
pub async fn managed_runtime_status(state: State<'_, Supervisor>) -> Result<ManagedStatus, String> {
    let candidate = {
        let mut inner = state
            .0
            .lock()
            .map_err(|_| "Managed runtime is unavailable.".to_owned())?;
        inner.refresh()?;
        inner
            .active
            .as_ref()
            .map(|active| (active.child.id(), active.endpoint.clone()))
    };
    let ready = if let Some((_, endpoint)) = &candidate {
        probe_ready(endpoint).await
    } else {
        false
    };
    let mut inner = state
        .0
        .lock()
        .map_err(|_| "Managed runtime is unavailable.".to_owned())?;
    inner.refresh()?;
    if let (Some((pid, _)), Some(active)) = (candidate, inner.active.as_mut()) {
        if active.child.id() == pid {
            active.ready = ready;
        }
    }
    Ok(inner.status())
}

async fn probe_ready(endpoint: &str) -> bool {
    let Ok(client) = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .no_proxy()
        .build()
    else {
        return false;
    };
    let Ok(response) = client.get(format!("{endpoint}/health")).send().await else {
        return false;
    };
    let Ok(health) = response.json::<Value>().await else {
        return false;
    };
    if health.get("status").and_then(Value::as_str) != Some("ok") {
        return false;
    }
    let Ok(response) = client.get(format!("{endpoint}/v1/models")).send().await else {
        return false;
    };
    let Ok(models) = response.json::<Value>().await else {
        return false;
    };
    models
        .pointer("/data/0/id")
        .and_then(Value::as_str)
        .is_some_and(|id| !id.is_empty())
}

#[tauri::command]
pub fn read_managed_log(app: AppHandle) -> Result<String, String> {
    let path = log_path(&app)?;
    let mut file = match File::open(path) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(String::new()),
        Err(error) => return Err(format!("Could not read managed runtime log: {error}")),
    };
    let length = file
        .metadata()
        .map_err(|error| format!("Could not inspect managed runtime log: {error}"))?
        .len();
    file.seek(SeekFrom::Start(length.saturating_sub(64 * 1024)))
        .map_err(|error| format!("Could not seek managed runtime log: {error}"))?;
    let mut bytes = Vec::new();
    file.take(64 * 1024)
        .read_to_end(&mut bytes)
        .map_err(|error| format!("Could not read managed runtime log: {error}"))?;
    let text = String::from_utf8_lossy(&bytes);
    Ok(if length > 64 * 1024 {
        match text.split_once('\n') {
            Some((_, tail)) => tail.to_owned(),
            None => text.into_owned(),
        }
    } else {
        text.into_owned()
    })
}

fn check_bank_paths(launch: &profiles::LaunchCommand) -> Result<(), String> {
    for key in [
        "CACHALOT_MINIMAX_BANK",
        "CACHALOT_MINIMAX_BANK_MIRROR",
        "CACHALOT_GLM_BANK",
    ] {
        if key == "CACHALOT_GLM_BANK"
            && launch
                .environment
                .get("CACHALOT_GLM_BANK_ENABLED")
                .is_some_and(|value| value == "0")
        {
            continue;
        }
        if let Some(path) = launch.environment.get(key) {
            if !Path::new(path).join("bank.json").is_file() {
                return Err(format!(
                    "{key} must point to an expert bank containing bank.json."
                ));
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub fn start_managed_runtime(
    app: AppHandle,
    profiles: State<'_, ProfileStore>,
    state: State<'_, Supervisor>,
    id: String,
) -> Result<ManagedStatus, String> {
    let profile = profiles::find_profile(app.clone(), profiles, &id)?;
    let launch = profiles::compile(&profile)?;
    if !Path::new(&launch.executable).is_file() {
        return Err("Python executable does not exist.".to_owned());
    }
    if !Path::new(&profile.model_path).is_dir() {
        return Err("Model directory does not exist.".to_owned());
    }
    check_bank_paths(&launch)?;
    let mut inner = state
        .0
        .lock()
        .map_err(|_| "Managed runtime is unavailable.".to_owned())?;
    inner.refresh()?;
    if inner.active.is_some() {
        return Err("Lab already has a managed runtime running.".to_owned());
    }
    let address = SocketAddrV4::new(Ipv4Addr::LOCALHOST, profile.port);
    let reservation = TcpListener::bind(address).map_err(|_| {
        format!(
            "Port {} is in use. Stop the previous Cachalot server in Activity Monitor or choose another port. Lab will not attach to or stop a process it does not own.",
            profile.port
        )
    })?;
    drop(reservation);
    let startup_log_path = log_path(&app)?;
    let log = runtime_log(&app)?;
    let stderr = log
        .try_clone()
        .map_err(|error| format!("Could not prepare managed runtime log: {error}"))?;
    let mut command = Command::new(&launch.executable);
    for key in profiles::CONTROLLED_ENV_KEYS {
        command.env_remove(key);
    }
    let child = command
        .args(&launch.args)
        .envs(&launch.environment)
        .env_remove("CACHALOT_API_KEY")
        .env_remove("CACHALOT_SNAPSHOT_DIR")
        .stdin(Stdio::null())
        .stdout(Stdio::from(log))
        .stderr(Stdio::from(stderr))
        .spawn()
        .map_err(|error| format!("Could not start managed runtime: {error}"))?;
    inner.active = Some(ManagedChild {
        child,
        profile_id: id,
        endpoint: launch.endpoint,
        ready: false,
        log_path: startup_log_path,
    });
    inner.last_exit_code = None;
    Ok(inner.status())
}

#[tauri::command]
pub fn stop_managed_runtime(state: State<'_, Supervisor>) -> Result<ManagedStatus, String> {
    let mut inner = state
        .0
        .lock()
        .map_err(|_| "Managed runtime is unavailable.".to_owned())?;
    inner.stop()?;
    Ok(inner.status())
}

pub(crate) fn stop_on_exit(app: &AppHandle) {
    if let Some(state) = app.try_state::<Supervisor>() {
        let result = state
            .0
            .lock()
            .map_err(|_| "Managed runtime is unavailable.".to_owned())
            .and_then(|mut inner| inner.stop());
        if let Err(error) = result {
            eprintln!("Could not stop managed runtime on exit: {error}");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};

    #[test]
    fn startup_identity_is_observed_bounded_and_preserves_unknowns() {
        let text = "cachalot 0.72.1: loading /models/DeepSeek-V4.1-Flash-1017\nexpert bank: /Users/me/DeepSeek-V4.1-Flash-1017-q2g128 (q2, 8 experts)\nDI-1 encoder-only prefill on: details\nINFO: Uvicorn running on http://127.0.0.1:8000\ncachalot 0.72.1: loading /wrong/other\n";
        let observed = parse_startup(text);
        assert_eq!(
            observed.checkpoint.as_deref(),
            Some("DeepSeek-V4.1-Flash-1017")
        );
        assert_eq!(
            observed.expert_bank.as_deref(),
            Some("DeepSeek-V4.1-Flash-1017-q2g128")
        );
        assert_eq!(observed.encoder_only_prefill, Some(true));
        assert_eq!(parse_startup("no startup\n"), StartupEvidence::default());
        assert_eq!(
            parse_startup("cachalot 0.72.1: loading /partial"),
            StartupEvidence::default()
        );
        assert_eq!(
            parse_startup("cachalot bogus: loading /wrong\n"),
            StartupEvidence::default()
        );
        assert_eq!(
            parse_startup("cachalot 0.72.1: loading relative\n"),
            StartupEvidence::default()
        );
        assert_eq!(
            parse_startup("cachalot 0.45.1: loading MiniMax-M3 from /models/mini\n")
                .checkpoint
                .as_deref(),
            Some("mini")
        );
        // A long request/log tail cannot displace the startup prefix.
        let path = std::env::temp_dir().join(format!("lab-startup-{}", std::process::id()));
        fs::write(&path, format!("{text}{}", "x".repeat(100_000))).unwrap();
        assert_eq!(read_startup(&path), observed);
        fs::remove_file(path).unwrap();
        let idle = SupervisorInner::default().status();
        assert!(idle.startup.is_none());
    }

    #[test]
    fn checks_glm_bank_only_when_enabled() {
        let directory = std::env::temp_dir().join(format!(
            "lab-glm-bank-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("clock")
                .as_nanos()
        ));
        fs::create_dir_all(&directory).expect("bank directory");
        let mut launch = profiles::LaunchCommand {
            executable: String::new(),
            args: vec![],
            environment: [(
                "CACHALOT_GLM_BANK".to_owned(),
                directory.to_string_lossy().into_owned(),
            )]
            .into(),
            endpoint: String::new(),
        };
        assert!(check_bank_paths(&launch).unwrap_err().contains("bank.json"));
        launch
            .environment
            .insert("CACHALOT_GLM_BANK_ENABLED".to_owned(), "0".to_owned());
        assert!(check_bank_paths(&launch).is_ok());
        launch
            .environment
            .insert("CACHALOT_GLM_BANK_ENABLED".to_owned(), "1".to_owned());
        assert!(check_bank_paths(&launch).is_err());
        fs::write(directory.join("bank.json"), b"{}").expect("bank manifest");
        assert!(check_bank_paths(&launch).is_ok());
        fs::remove_dir_all(directory).expect("cleanup");
    }

    #[test]
    fn stop_only_reaps_the_child_it_owns() {
        let child = Command::new("/bin/sleep")
            .arg("30")
            .spawn()
            .expect("start owned process");
        let mut inner = SupervisorInner {
            active: Some(ManagedChild {
                child,
                profile_id: "test".to_owned(),
                endpoint: "http://127.0.0.1:8011".to_owned(),
                ready: false,
                log_path: std::env::temp_dir().join("lab-no-startup-log"),
            }),
            last_exit_code: None,
        };
        assert!(inner.status().running);
        inner.stop().expect("stop owned process");
        assert!(!inner.status().running);
        inner.stop().expect("stopping twice is safe");
    }

    #[test]
    fn readiness_requires_health_and_model_id() {
        let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).expect("bind mock server");
        let port = listener.local_addr().expect("address").port();
        let server = thread::spawn(move || {
            for (expected, body) in [
                ("/health", r#"{"status":"ok"}"#),
                ("/v1/models", r#"{"data":[{"id":"mock-model"}]}"#),
            ] {
                let (mut stream, _) = listener.accept().expect("accept probe");
                let mut request = [0; 1024];
                let length = stream.read(&mut request).expect("read request");
                assert!(String::from_utf8_lossy(&request[..length]).contains(expected));
                let reply = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(), body
                );
                stream.write_all(reply.as_bytes()).expect("send response");
            }
        });
        assert!(tauri::async_runtime::block_on(probe_ready(&format!(
            "http://127.0.0.1:{port}"
        ))));
        server.join().expect("mock server");
    }
}
