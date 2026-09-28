use std::process::Command;

use serde::Serialize;

mod conversations;
mod runtime;

#[derive(Serialize)]
struct PlatformInfo {
    architecture: &'static str,
    macos_version: String,
    memory_gib: f64,
}

#[cfg(target_os = "macos")]
fn read_command(path: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new(path)
        .args(args)
        .output()
        .map_err(|error| format!("Could not run {path}: {error}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("{path} failed: {}", stderr.trim()));
    }

    String::from_utf8(output.stdout)
        .map(|value| value.trim().to_owned())
        .map_err(|error| format!("{path} returned invalid text: {error}"))
}

#[tauri::command]
fn platform_info() -> Result<PlatformInfo, String> {
    #[cfg(target_os = "macos")]
    {
        let macos_version = read_command("/usr/bin/sw_vers", &["-productVersion"])?;
        let memory_bytes = read_command("/usr/sbin/sysctl", &["-n", "hw.memsize"])?
            .parse::<u64>()
            .map_err(|error| format!("Could not read unified memory size: {error}"))?;

        Ok(PlatformInfo {
            architecture: match std::env::consts::ARCH {
                "aarch64" => "arm64",
                architecture => architecture,
            },
            macos_version,
            memory_gib: memory_bytes as f64 / 1024_f64.powi(3),
        })
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Cachalot Studio requires macOS.".to_owned())
    }
}

pub fn run() {
    let result = tauri::Builder::default()
        .manage(runtime::RuntimeState::default())
        .manage(conversations::ConversationStore::default())
        .invoke_handler(tauri::generate_handler![
            platform_info,
            conversations::list_conversations,
            conversations::save_conversation,
            conversations::delete_conversation,
            runtime::connect_runtime,
            runtime::disconnect_runtime,
            runtime::poll_runtime,
            runtime::start_chat,
            runtime::stop_chat,
        ])
        .run(tauri::generate_context!());

    if let Err(error) = result {
        eprintln!("Cachalot Studio failed to start: {error}");
        std::process::exit(1);
    }
}
