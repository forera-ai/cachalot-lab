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
}

#[derive(Default)]
struct SupervisorInner {
    active: Option<ManagedChild>,
    last_exit_code: Option<i32>,
}

#[derive(Default)]
pub struct Supervisor(Mutex<SupervisorInner>);

#[derive(Serialize)]
pub struct ManagedStatus {
    running: bool,
    ready: bool,
    profile_id: Option<String>,
    endpoint: Option<String>,
    pid: Option<u32>,
    last_exit_code: Option<i32>,
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
        .map_err(|error| format!("Could not locate Studio data directory: {error}"))
}

fn runtime_log(app: &AppHandle) -> Result<File, String> {
    let path = log_path(app)?;
    let directory = path.parent().ok_or("Managed log path has no parent.")?;
    fs::create_dir_all(directory)
        .map_err(|error| format!("Could not create Studio data directory: {error}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(directory, fs::Permissions::from_mode(0o700))
            .map_err(|error| format!("Could not protect Studio data directory: {error}"))?;
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
    for key in ["CACHALOT_MINIMAX_BANK", "CACHALOT_MINIMAX_BANK_MIRROR"] {
        if let Some(path) = launch.environment.get(key) {
            if !Path::new(path).join("bank.json").is_file() {
                return Err(format!(
                    "{key} must point to an expert bank containing bank.json."
                ));
            }
        }
    }
    let mut inner = state
        .0
        .lock()
        .map_err(|_| "Managed runtime is unavailable.".to_owned())?;
    inner.refresh()?;
    if inner.active.is_some() {
        return Err("Studio already has a managed runtime running.".to_owned());
    }
    let address = SocketAddrV4::new(Ipv4Addr::LOCALHOST, profile.port);
    let reservation = TcpListener::bind(address).map_err(|_| {
        format!(
            "Port {} is in use. Stop the previous Cachalot server in Activity Monitor or choose another port. Studio will not attach to or stop a process it does not own.",
            profile.port
        )
    })?;
    drop(reservation);
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
