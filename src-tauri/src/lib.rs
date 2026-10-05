use std::{ffi::CString, mem::MaybeUninit, process::Command};

use serde::Serialize;
use serde_json::Value;

mod conversations;
mod credentials;
mod discovery;
mod host;
#[cfg(target_os = "macos")]
mod machine_icon;
mod profiles;
mod runtime;
mod supervisor;

#[derive(Serialize)]
struct PlatformInfo {
    architecture: &'static str,
    macos_version: String,
    memory_gib: f64,
    machine_name: Option<String>,
    model_identifier: Option<String>,
    machine_icon_data_url: Option<String>,
    chip_name: Option<String>,
    cpu_cores: Option<u32>,
    gpu_cores: Option<u32>,
    storage_total_gib: Option<f64>,
    storage_available_gib: Option<f64>,
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

#[cfg(target_os = "macos")]
fn profiler_field<'a>(data: &'a Value, section: &str, field: &str) -> Option<&'a str> {
    data.get(section)?.as_array()?.first()?.get(field)?.as_str()
}

#[cfg(target_os = "macos")]
fn startup_volume_gib() -> Option<(f64, f64)> {
    let root = CString::new("/").ok()?;
    let mut stats = MaybeUninit::<libc::statvfs>::uninit();
    // SAFETY: root is a valid C string and statvfs initializes stats on success.
    if unsafe { libc::statvfs(root.as_ptr(), stats.as_mut_ptr()) } != 0 {
        return None;
    }
    let stats = unsafe { stats.assume_init() };
    let gib = 1024_f64.powi(3);
    let block_size = stats.f_frsize as f64;
    Some((
        stats.f_blocks as f64 * block_size / gib,
        stats.f_bavail as f64 * block_size / gib,
    ))
}

#[tauri::command]
fn platform_info() -> Result<PlatformInfo, String> {
    #[cfg(target_os = "macos")]
    {
        let macos_version = read_command("/usr/bin/sw_vers", &["-productVersion"])?;
        let memory_bytes = read_command("/usr/sbin/sysctl", &["-n", "hw.memsize"])?
            .parse::<u64>()
            .map_err(|error| format!("Could not read unified memory size: {error}"))?;
        let profiler = read_command(
            "/usr/sbin/system_profiler",
            &["-json", "SPHardwareDataType", "SPDisplaysDataType"],
        )
        .ok()
        .and_then(|text| serde_json::from_str::<Value>(&text).ok());
        let field = |section, name| {
            profiler
                .as_ref()
                .and_then(|value| profiler_field(value, section, name))
                .map(str::to_owned)
        };
        let storage = startup_volume_gib();

        let model_identifier = field("SPHardwareDataType", "machine_model");
        let machine_icon_data_url = machine_icon::data_url(model_identifier.as_deref());

        Ok(PlatformInfo {
            architecture: match std::env::consts::ARCH {
                "aarch64" => "arm64",
                architecture => architecture,
            },
            macos_version,
            memory_gib: memory_bytes as f64 / 1024_f64.powi(3),
            machine_name: field("SPHardwareDataType", "machine_name"),
            model_identifier,
            machine_icon_data_url,
            chip_name: field("SPHardwareDataType", "chip_type"),
            cpu_cores: read_command("/usr/sbin/sysctl", &["-n", "hw.physicalcpu"])
                .ok()
                .and_then(|value| value.parse().ok()),
            gpu_cores: field("SPDisplaysDataType", "sppci_cores")
                .and_then(|value| value.parse().ok()),
            storage_total_gib: storage.map(|(total, _)| total),
            storage_available_gib: storage.map(|(_, available)| available),
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
        .manage(profiles::ProfileStore::default())
        .manage(supervisor::Supervisor::default())
        .invoke_handler(tauri::generate_handler![
            platform_info,
            discovery::discover_models,
            credentials::has_runtime_key,
            credentials::save_runtime_key,
            credentials::delete_runtime_key,
            host::host_sample,
            profiles::list_profiles,
            profiles::save_profile,
            profiles::delete_profile,
            profiles::preview_profile,
            supervisor::managed_runtime_status,
            supervisor::start_managed_runtime,
            supervisor::stop_managed_runtime,
            supervisor::read_managed_log,
            conversations::list_conversations,
            conversations::save_conversation,
            conversations::delete_conversation,
            runtime::connect_runtime,
            runtime::disconnect_runtime,
            runtime::poll_runtime,
            runtime::start_chat,
            runtime::stop_chat,
        ])
        .build(tauri::generate_context!());

    match result {
        Ok(app) => app.run(|handle, event| {
            if matches!(event, tauri::RunEvent::Exit) {
                supervisor::stop_on_exit(handle);
            }
        }),
        Err(error) => {
            eprintln!("Cachalot Studio failed to start: {error}");
            std::process::exit(1);
        }
    }
}
