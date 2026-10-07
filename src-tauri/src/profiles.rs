use std::collections::BTreeMap;
use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

const STORE_VERSION: u8 = 1;
const MAX_STORE_BYTES: usize = 256 * 1024;
const MAX_PROFILES: usize = 50;

pub(crate) const CONTROLLED_ENV_KEYS: [&str; 23] = [
    "CACHALOT_DECODE_MISS_BUDGET",
    "CACHALOT_SYSTEM_DATE_REUSE",
    "CACHALOT_SYSTEM_DATE_REUSE_DAYS",
    "CACHALOT_MINIMAX_MISS_DROP",
    "CACHALOT_MINIMAX_MISS_SUB",
    "CACHALOT_MINIMAX_MISS_DROP_ARMED",
    "CACHALOT_LOOP_GUARD_REPEATS",
    "CACHALOT_LOOP_GUARD_INCREMENTING",
    "CACHALOT_MINIMAX_DECODE_CACHE_GIB",
    "CACHALOT_MINIMAX_SPILL_BLOCKS",
    "CACHALOT_MINIMAX_PREFILL_MISS_DROP",
    "CACHALOT_MINIMAX_PREFILL_SUB_MAX_ROWS",
    "CACHALOT_HOST_GROW_QUIET_S",
    "CACHALOT_HOST_SHRINK_EVERY_S",
    "CACHALOT_MINIMAX_MIRROR_ADAPT",
    "CACHALOT_MINIMAX_BANK",
    "CACHALOT_MINIMAX_BANK_MIRROR",
    "CACHALOT_MIRROR_FRACTION",
    "CACHALOT_GLM_BANK",
    "CACHALOT_GLM_BANK_ENABLED",
    "CACHALOT_GLM_PREDICT_TOPK",
    "CACHALOT_GLM_PREDICT_LIMIT",
    "CACHALOT_GLM_PREDICT_AFTER_DEMAND",
];

#[derive(Default)]
pub struct ProfileStore(Mutex<()>);

#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ModelFamily {
    #[default]
    Auto,
    Deepseek,
    Glm,
    Minimax,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct RuntimeTuning {
    #[serde(default)]
    deepseek_decode_drop_misses: Option<bool>,
    #[serde(default)]
    deepseek_system_date_reuse: Option<bool>,
    // None inherits the installed runtime's default. Some(false) explicitly
    // selects the exact path, including on runtime >= 0.43.0.
    #[serde(default)]
    minimax_decode_miss_substitution: Option<bool>,
    #[serde(default)]
    minimax_prefill_miss_substitution: Option<bool>,
    #[serde(default)]
    loop_guard_repeats: Option<u8>,
    #[serde(default)]
    loop_guard_incrementing: Option<u16>,
    #[serde(default)]
    minimax_decode_cache_gib: Option<f64>,
    #[serde(default)]
    minimax_spill_blocks: Option<bool>,
    #[serde(default)]
    host_grow_quiet_s: Option<f64>,
    #[serde(default)]
    host_shrink_every_s: Option<f64>,
    #[serde(default)]
    minimax_mirror_adapt: Option<bool>,
    #[serde(default)]
    minimax_bank_path: Option<String>,
    #[serde(default)]
    minimax_mirror_path: Option<String>,
    #[serde(default)]
    minimax_mirror_fraction: Option<f64>,
    #[serde(default)]
    glm_bank_path: Option<String>,
    #[serde(default)]
    glm_bank_enabled: Option<bool>,
    #[serde(default)]
    glm_predict_topk: Option<u16>,
    #[serde(default)]
    glm_predict_limit: Option<u16>,
    #[serde(default)]
    glm_predict_after_demand: Option<i8>,
}

impl ModelFamily {
    fn as_cli_value(self) -> &'static str {
        match self {
            Self::Auto => "auto",
            Self::Deepseek => "deepseek",
            Self::Glm => "glm",
            Self::Minimax => "minimax",
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LaunchProfile {
    pub(crate) id: String,
    name: String,
    pub(crate) python_executable: String,
    pub(crate) model_path: String,
    pub(crate) port: u16,
    #[serde(default)]
    family: ModelFamily,
    #[serde(default)]
    expert_budget_gib: Option<f64>,
    #[serde(default)]
    max_seq_len: Option<u32>,
    #[serde(default)]
    io_workers: Option<u16>,
    #[serde(default)]
    model_id: Option<String>,
    #[serde(default)]
    default_max_tokens: Option<u32>,
    #[serde(default)]
    default_temperature: Option<f64>,
    #[serde(default)]
    snapshot_dir: Option<String>,
    #[serde(default)]
    tuning: RuntimeTuning,
}

#[derive(Serialize)]
pub struct LaunchCommand {
    pub(crate) executable: String,
    pub(crate) args: Vec<String>,
    pub(crate) environment: BTreeMap<String, String>,
    pub(crate) endpoint: String,
}

#[derive(Deserialize, Serialize)]
struct Document {
    version: u8,
    profiles: Vec<LaunchProfile>,
}

fn store_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|directory| directory.join("profiles.json"))
        .map_err(|error| format!("Could not locate Lab data directory: {error}"))
}

fn lock_store(path: &Path) -> Result<File, String> {
    let directory = path
        .parent()
        .ok_or_else(|| "Profile path has no parent directory.".to_owned())?;
    fs::create_dir_all(directory)
        .map_err(|error| format!("Could not create Lab data directory: {error}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(directory, fs::Permissions::from_mode(0o700))
            .map_err(|error| format!("Could not protect Lab data directory: {error}"))?;
    }
    let mut options = OpenOptions::new();
    options.read(true).write(true).create(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let file = options
        .open(directory.join(".profiles.lock"))
        .map_err(|error| format!("Could not open profile lock: {error}"))?;
    #[cfg(unix)]
    {
        use std::os::fd::AsRawFd;
        if unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX) } != 0 {
            return Err(format!(
                "Could not lock profiles: {}",
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
                profiles: Vec::new(),
            });
        }
        Err(error) => return Err(format!("Could not read profiles: {error}")),
    };
    if bytes.len() > MAX_STORE_BYTES {
        return Err("Profile file exceeds the 256 KiB limit.".to_owned());
    }
    let document: Document = serde_json::from_slice(&bytes)
        .map_err(|error| format!("Profile file is invalid: {error}"))?;
    if document.version != STORE_VERSION {
        return Err(format!(
            "Unsupported profile file version {}.",
            document.version
        ));
    }
    if document.profiles.len() > MAX_PROFILES {
        return Err("Profile file exceeds the 50 profile limit.".to_owned());
    }
    for profile in &document.profiles {
        validate(profile)?;
    }
    Ok(document)
}

fn validate(profile: &LaunchProfile) -> Result<(), String> {
    let id = profile.id.as_bytes();
    if id.len() != 36
        || id.iter().enumerate().any(|(index, byte)| {
            if matches!(index, 8 | 13 | 18 | 23) {
                *byte != b'-'
            } else {
                !byte.is_ascii_hexdigit()
            }
        })
    {
        return Err("Profile ID must be a UUID.".to_owned());
    }
    if profile.name.trim().is_empty()
        || profile.name.len() > 80
        || profile.name.chars().any(char::is_control)
    {
        return Err("Profile name is invalid.".to_owned());
    }
    if profile.python_executable.len() > 1024
        || profile.model_path.len() > 1024
        || !Path::new(&profile.python_executable).is_absolute()
        || !Path::new(&profile.model_path).is_absolute()
    {
        return Err("Python executable and model paths must be absolute.".to_owned());
    }
    if profile.port < 1024 {
        return Err("Profile port must be between 1024 and 65535.".to_owned());
    }
    if profile
        .expert_budget_gib
        .is_some_and(|value| !value.is_finite() || value <= 0.0 || value > 512.0)
    {
        return Err("Expert budget must be greater than 0 and at most 512 GiB.".to_owned());
    }
    if profile
        .max_seq_len
        .is_some_and(|value| !(1..=1_048_576).contains(&value))
    {
        return Err("Maximum sequence length is invalid.".to_owned());
    }
    if profile
        .io_workers
        .is_some_and(|value| !(1..=64).contains(&value))
    {
        return Err("I/O worker count must be between 1 and 64.".to_owned());
    }
    if profile.model_id.as_ref().is_some_and(|value| {
        value.is_empty()
            || value.len() > 128
            || !value
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.'))
    }) {
        return Err(
            "Model ID must use 1–128 letters, digits, dots, hyphens, or underscores.".to_owned(),
        );
    }
    if profile
        .default_max_tokens
        .is_some_and(|value| !(1..=1_048_576).contains(&value))
    {
        return Err("Default maximum output tokens is invalid.".to_owned());
    }
    if profile
        .default_temperature
        .is_some_and(|value| !value.is_finite() || !(0.0..=2.0).contains(&value))
    {
        return Err("Default temperature must be between 0 and 2.".to_owned());
    }
    if profile
        .snapshot_dir
        .as_ref()
        .is_some_and(|value| value.len() > 1024 || !Path::new(value).is_absolute())
    {
        return Err("Snapshot directory must be an absolute path.".to_owned());
    }
    let tuning = &profile.tuning;
    if (tuning.deepseek_decode_drop_misses.is_some() || tuning.deepseek_system_date_reuse.is_some())
        && profile.family != ModelFamily::Deepseek
    {
        return Err("DeepSeek tuning requires a DeepSeek profile family.".to_owned());
    }
    if (tuning.glm_bank_path.is_some()
        || tuning.glm_bank_enabled.is_some()
        || tuning.glm_predict_topk.is_some()
        || tuning.glm_predict_limit.is_some()
        || tuning.glm_predict_after_demand.is_some())
        && profile.family != ModelFamily::Glm
    {
        return Err("GLM tuning requires a GLM profile family.".to_owned());
    }
    if tuning.glm_bank_path.as_ref().is_some_and(|path| {
        path.len() > 1024 || path.chars().any(char::is_control) || !Path::new(path).is_absolute()
    }) {
        return Err(
            "GLM bank directory must be an absolute path without control characters.".to_owned(),
        );
    }
    if [tuning.glm_predict_topk, tuning.glm_predict_limit]
        .into_iter()
        .flatten()
        .any(|value| value > 288)
    {
        return Err("GLM prefetch counts must be between 0 and 288.".to_owned());
    }
    if tuning
        .glm_predict_after_demand
        .is_some_and(|value| !(-1..=1).contains(&value))
    {
        return Err("GLM prefetch scheduling must be -1, 0, or 1.".to_owned());
    }
    if (tuning.minimax_decode_miss_substitution.is_some()
        || tuning.minimax_prefill_miss_substitution.is_some()
        || tuning.minimax_decode_cache_gib.is_some()
        || tuning.minimax_spill_blocks.is_some()
        || tuning.host_grow_quiet_s.is_some()
        || tuning.host_shrink_every_s.is_some()
        || tuning.minimax_mirror_adapt.is_some()
        || tuning.minimax_bank_path.is_some()
        || tuning.minimax_mirror_path.is_some()
        || tuning.minimax_mirror_fraction.is_some())
        && profile.family != ModelFamily::Minimax
    {
        return Err("MiniMax tuning requires a MiniMax profile family.".to_owned());
    }
    if (tuning.loop_guard_repeats.is_some() || tuning.loop_guard_incrementing.is_some())
        && !matches!(profile.family, ModelFamily::Glm | ModelFamily::Minimax)
    {
        return Err("Loop guard tuning requires a GLM or MiniMax profile family.".to_owned());
    }
    if tuning.loop_guard_repeats.is_some_and(|value| value > 50) {
        return Err("Loop guard repeats must be between 0 and 50.".to_owned());
    }
    if tuning
        .loop_guard_incrementing
        .is_some_and(|value| value == 1 || value > 4096)
    {
        return Err("Incrementing-list guard must be 0 or between 2 and 4096.".to_owned());
    }
    if tuning
        .minimax_decode_cache_gib
        .is_some_and(|value| !value.is_finite() || !(-1.0..=8.0).contains(&value))
    {
        return Err("MiniMax decode cache must be between -1 and 8 GiB.".to_owned());
    }
    if [tuning.host_grow_quiet_s, tuning.host_shrink_every_s]
        .into_iter()
        .flatten()
        .any(|value| !value.is_finite() || !(0.0..=3600.0).contains(&value))
    {
        return Err("Host memory intervals must be between 0 and 3600 seconds.".to_owned());
    }
    for path in [&tuning.minimax_bank_path, &tuning.minimax_mirror_path]
        .into_iter()
        .flatten()
    {
        if path.len() > 1024 || !Path::new(path).is_absolute() {
            return Err("MiniMax bank and mirror paths must be absolute.".to_owned());
        }
    }
    if tuning.minimax_mirror_path.is_some() && tuning.minimax_bank_path.is_none() {
        return Err("MiniMax mirror requires an expert bank path.".to_owned());
    }
    if tuning
        .minimax_mirror_fraction
        .is_some_and(|value| !value.is_finite() || !(0.0..=0.9).contains(&value))
    {
        return Err("MiniMax mirror fraction must be between 0 and 0.9.".to_owned());
    }
    if tuning.minimax_mirror_fraction.is_some() && tuning.minimax_mirror_path.is_none() {
        return Err("MiniMax mirror fraction requires a mirror path.".to_owned());
    }
    Ok(())
}

pub(crate) fn compile(profile: &LaunchProfile) -> Result<LaunchCommand, String> {
    validate(profile)?;
    let mut args = vec![
        "-m".to_owned(),
        "cachalot.cli".to_owned(),
        "serve".to_owned(),
        "--host".to_owned(),
        "127.0.0.1".to_owned(),
        "--port".to_owned(),
        profile.port.to_string(),
        "--model".to_owned(),
        profile.model_path.clone(),
        "--family".to_owned(),
        profile.family.as_cli_value().to_owned(),
    ];
    if let Some(value) = profile.expert_budget_gib {
        args.extend(["--expert-budget-gib".to_owned(), value.to_string()]);
    }
    if let Some(value) = profile.max_seq_len {
        args.extend(["--max-seq-len".to_owned(), value.to_string()]);
    }
    if let Some(value) = profile.io_workers {
        args.extend(["--io-workers".to_owned(), value.to_string()]);
    }
    if let Some(value) = &profile.model_id {
        args.extend(["--model-id".to_owned(), value.clone()]);
    }
    if let Some(value) = profile.default_max_tokens {
        args.extend(["--default-max-tokens".to_owned(), value.to_string()]);
    }
    if let Some(value) = profile.default_temperature {
        args.extend(["--default-temperature".to_owned(), value.to_string()]);
    }
    if let Some(value) = &profile.snapshot_dir {
        args.extend(["--snapshot-dir".to_owned(), value.clone()]);
    }
    let tuning = &profile.tuning;
    let mut environment = BTreeMap::new();
    if let Some(enabled) = tuning.deepseek_decode_drop_misses {
        // -1 selects exact decode on 0.57+, including before the off spelling.
        environment.insert(
            "CACHALOT_DECODE_MISS_BUDGET".to_owned(),
            if enabled { "0" } else { "-1" }.to_owned(),
        );
    }
    if let Some(enabled) = tuning.deepseek_system_date_reuse {
        environment.insert(
            "CACHALOT_SYSTEM_DATE_REUSE".to_owned(),
            if enabled { "1" } else { "0" }.to_owned(),
        );
    }

    if let Some(path) = &tuning.glm_bank_path {
        environment.insert("CACHALOT_GLM_BANK".to_owned(), path.clone());
    }
    if let Some(enabled) = tuning.glm_bank_enabled {
        environment.insert(
            "CACHALOT_GLM_BANK_ENABLED".to_owned(),
            if enabled { "1" } else { "0" }.to_owned(),
        );
    }
    for (key, value) in [
        ("CACHALOT_GLM_PREDICT_TOPK", tuning.glm_predict_topk),
        ("CACHALOT_GLM_PREDICT_LIMIT", tuning.glm_predict_limit),
    ] {
        if let Some(value) = value {
            environment.insert(key.to_owned(), value.to_string());
        }
    }
    if let Some(value) = tuning.glm_predict_after_demand {
        environment.insert(
            "CACHALOT_GLM_PREDICT_AFTER_DEMAND".to_owned(),
            value.to_string(),
        );
    }
    if let Some(enabled) = tuning.minimax_decode_miss_substitution {
        environment.insert(
            "CACHALOT_MINIMAX_MISS_DROP".to_owned(),
            if enabled { "0.20" } else { "0" }.to_owned(),
        );
    }
    if let Some(enabled) = tuning.minimax_prefill_miss_substitution {
        environment.insert(
            "CACHALOT_MINIMAX_PREFILL_MISS_DROP".to_owned(),
            if enabled { "0.20" } else { "0" }.to_owned(),
        );
    }
    if tuning.minimax_decode_miss_substitution == Some(true)
        || tuning.minimax_prefill_miss_substitution == Some(true)
    {
        environment.insert("CACHALOT_MINIMAX_MISS_SUB".to_owned(), "4".to_owned());
    }
    if let Some(value) = tuning.loop_guard_repeats {
        environment.insert("CACHALOT_LOOP_GUARD_REPEATS".to_owned(), value.to_string());
    }
    if let Some(value) = tuning.loop_guard_incrementing {
        environment.insert(
            "CACHALOT_LOOP_GUARD_INCREMENTING".to_owned(),
            value.to_string(),
        );
    }
    if let Some(value) = tuning.minimax_decode_cache_gib {
        environment.insert(
            "CACHALOT_MINIMAX_DECODE_CACHE_GIB".to_owned(),
            value.to_string(),
        );
    }
    if let Some(value) = tuning.minimax_spill_blocks {
        environment.insert(
            "CACHALOT_MINIMAX_SPILL_BLOCKS".to_owned(),
            if value { "1" } else { "0" }.to_owned(),
        );
    }
    if let Some(value) = tuning.host_grow_quiet_s {
        environment.insert("CACHALOT_HOST_GROW_QUIET_S".to_owned(), value.to_string());
    }
    if let Some(value) = tuning.host_shrink_every_s {
        environment.insert("CACHALOT_HOST_SHRINK_EVERY_S".to_owned(), value.to_string());
    }
    if let Some(enabled) = tuning.minimax_mirror_adapt {
        environment.insert(
            "CACHALOT_MINIMAX_MIRROR_ADAPT".to_owned(),
            if enabled { "1" } else { "0" }.to_owned(),
        );
    }
    if let Some(path) = &tuning.minimax_bank_path {
        environment.insert("CACHALOT_MINIMAX_BANK".to_owned(), path.clone());
    }
    if let Some(path) = &tuning.minimax_mirror_path {
        environment.insert("CACHALOT_MINIMAX_BANK_MIRROR".to_owned(), path.clone());
    }
    if let Some(value) = tuning.minimax_mirror_fraction {
        environment.insert("CACHALOT_MIRROR_FRACTION".to_owned(), value.to_string());
    }
    Ok(LaunchCommand {
        executable: profile.python_executable.clone(),
        args,
        environment,
        endpoint: format!("http://127.0.0.1:{}", profile.port),
    })
}

fn write_document(path: &Path, document: &Document) -> Result<(), String> {
    let bytes = serde_json::to_vec(document)
        .map_err(|error| format!("Could not encode profiles: {error}"))?;
    if bytes.len() > MAX_STORE_BYTES {
        return Err("Profiles exceed the 256 KiB limit.".to_owned());
    }
    let directory = path
        .parent()
        .ok_or_else(|| "Profile path has no parent directory.".to_owned())?;
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("Could not timestamp profile save: {error}"))?
        .as_nanos();
    let temporary = directory.join(format!(".profiles-{}-{stamp}.tmp", std::process::id()));
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
            .map_err(|error| format!("Could not create profile update: {error}"))?;
        file.write_all(&bytes)
            .and_then(|()| file.sync_all())
            .map_err(|error| format!("Could not save profiles: {error}"))?;
        fs::rename(&temporary, path)
            .map_err(|error| format!("Could not finish profile save: {error}"))
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result
}

#[tauri::command]
pub fn list_profiles(
    app: AppHandle,
    store: State<'_, ProfileStore>,
) -> Result<Vec<LaunchProfile>, String> {
    let _guard = store
        .0
        .lock()
        .map_err(|_| "Profile store is unavailable.".to_owned())?;
    let path = store_path(&app)?;
    let _file_lock = lock_store(&path)?;
    Ok(read_document(&path)?.profiles)
}

#[tauri::command]
pub fn save_profile(
    app: AppHandle,
    store: State<'_, ProfileStore>,
    profile: LaunchProfile,
) -> Result<(), String> {
    validate(&profile)?;
    let _guard = store
        .0
        .lock()
        .map_err(|_| "Profile store is unavailable.".to_owned())?;
    let path = store_path(&app)?;
    let _file_lock = lock_store(&path)?;
    let mut document = read_document(&path)?;
    document
        .profiles
        .retain(|existing| existing.id != profile.id);
    if document.profiles.len() >= MAX_PROFILES {
        return Err("Profile limit reached. Delete an older profile first.".to_owned());
    }
    document.profiles.insert(0, profile);
    write_document(&path, &document)
}

#[tauri::command]
pub fn delete_profile(
    app: AppHandle,
    store: State<'_, ProfileStore>,
    id: String,
) -> Result<(), String> {
    let _guard = store
        .0
        .lock()
        .map_err(|_| "Profile store is unavailable.".to_owned())?;
    let path = store_path(&app)?;
    let _file_lock = lock_store(&path)?;
    let mut document = read_document(&path)?;
    document.profiles.retain(|profile| profile.id != id);
    write_document(&path, &document)
}

#[tauri::command]
pub fn preview_profile(profile: LaunchProfile) -> Result<LaunchCommand, String> {
    compile(&profile)
}

pub(crate) fn find_profile(
    app: AppHandle,
    store: State<'_, ProfileStore>,
    id: &str,
) -> Result<LaunchProfile, String> {
    let _guard = store
        .0
        .lock()
        .map_err(|_| "Profile store is unavailable.".to_owned())?;
    let path = store_path(&app)?;
    let _file_lock = lock_store(&path)?;
    read_document(&path)?
        .profiles
        .into_iter()
        .find(|profile| profile.id == id)
        .ok_or_else(|| "Profile not found.".to_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> LaunchProfile {
        LaunchProfile {
            id: "ef9194e0-69e1-4c1a-af0b-3c25b013329c".to_owned(),
            name: "Local model".to_owned(),
            python_executable: "/opt/cachalot/bin/python".to_owned(),
            model_path: "/models/DeepSeek V4.1".to_owned(),
            port: 8011,
            family: ModelFamily::Auto,
            expert_budget_gib: Some(24.5),
            max_seq_len: Some(32768),
            io_workers: Some(8),
            model_id: None,
            default_max_tokens: None,
            default_temperature: None,
            snapshot_dir: None,
            tuning: RuntimeTuning::default(),
        }
    }

    #[test]
    fn compiles_arguments_without_a_shell() {
        let command = compile(&sample()).expect("compile");
        assert_eq!(command.executable, "/opt/cachalot/bin/python");
        assert_eq!(command.endpoint, "http://127.0.0.1:8011");
        assert_eq!(command.args[0..3], ["-m", "cachalot.cli", "serve"]);
        assert!(command
            .args
            .windows(2)
            .any(|pair| pair == ["--model", "/models/DeepSeek V4.1"]));
        assert!(command
            .args
            .windows(2)
            .any(|pair| pair == ["--expert-budget-gib", "24.5"]));
    }

    #[test]
    fn rejects_invalid_profile_fields() {
        let mut profile = sample();
        profile.python_executable = "python3".to_owned();
        assert!(validate(&profile).is_err());
        profile = sample();
        profile.port = 80;
        assert!(validate(&profile).is_err());
        profile = sample();
        profile.name = "bad\nname".to_owned();
        assert!(validate(&profile).is_err());
        profile = sample();
        profile.model_id = Some("bad id".to_owned());
        assert!(validate(&profile).is_err());
        profile = sample();
        profile.snapshot_dir = Some("relative/snapshots".to_owned());
        assert!(validate(&profile).is_err());
    }

    #[test]
    fn compiles_optional_serve_defaults() {
        let mut profile = sample();
        profile.model_id = Some("minimax-m3".to_owned());
        profile.default_max_tokens = Some(8192);
        profile.default_temperature = Some(1.0);
        profile.snapshot_dir = Some("/tmp/cachalot snapshots".to_owned());
        let command = compile(&profile).expect("compile defaults");
        for expected in [
            ["--model-id", "minimax-m3"],
            ["--default-max-tokens", "8192"],
            ["--default-temperature", "1"],
            ["--snapshot-dir", "/tmp/cachalot snapshots"],
        ] {
            assert!(command.args.windows(2).any(|pair| pair == expected));
        }
    }

    #[test]
    fn compiles_version_independent_numerics_overrides() {
        let mut profile = sample();
        profile.family = ModelFamily::Minimax;
        assert!(compile(&profile)
            .expect("default compile")
            .environment
            .is_empty());

        profile.tuning.minimax_decode_miss_substitution = Some(false);
        profile.tuning.minimax_prefill_miss_substitution = Some(false);
        let exact = compile(&profile).expect("exact compile");
        assert_eq!(exact.environment["CACHALOT_MINIMAX_MISS_DROP"], "0");
        assert_eq!(exact.environment["CACHALOT_MINIMAX_PREFILL_MISS_DROP"], "0");
        assert!(!exact.environment.contains_key("CACHALOT_MINIMAX_MISS_SUB"));

        profile.tuning.minimax_decode_miss_substitution = Some(true);
        let mixed = compile(&profile).expect("mixed compile");
        assert_eq!(mixed.environment["CACHALOT_MINIMAX_MISS_DROP"], "0.20");
        assert_eq!(mixed.environment["CACHALOT_MINIMAX_MISS_SUB"], "4");
        assert_eq!(mixed.environment["CACHALOT_MINIMAX_PREFILL_MISS_DROP"], "0");
    }

    #[test]
    fn validates_family_and_new_runtime_knobs() {
        let mut profile = sample();
        profile.tuning.minimax_decode_miss_substitution = Some(true);
        assert!(validate(&profile).is_err());
        profile.tuning.minimax_decode_miss_substitution = None;
        profile.tuning.loop_guard_incrementing = Some(64);
        assert!(validate(&profile).is_err());
        profile.family = ModelFamily::Minimax;
        profile.tuning.loop_guard_repeats = Some(51);
        assert!(validate(&profile).is_err());
        profile.tuning.loop_guard_repeats = Some(0);
        profile.tuning.loop_guard_incrementing = Some(1);
        assert!(validate(&profile).is_err());
        profile.tuning.loop_guard_incrementing = Some(64);
        profile.tuning.minimax_decode_cache_gib = Some(-1.0);
        profile.tuning.minimax_spill_blocks = Some(false);
        let command = compile(&profile).expect("valid tuning");
        assert_eq!(command.environment["CACHALOT_LOOP_GUARD_REPEATS"], "0");
        assert_eq!(
            command.environment["CACHALOT_LOOP_GUARD_INCREMENTING"],
            "64"
        );
        assert_eq!(
            command.environment["CACHALOT_MINIMAX_DECODE_CACHE_GIB"],
            "-1"
        );
        assert_eq!(command.environment["CACHALOT_MINIMAX_SPILL_BLOCKS"], "0");
        profile.tuning.loop_guard_incrementing = Some(0);
        assert_eq!(
            compile(&profile).expect("disabled guard").environment
                ["CACHALOT_LOOP_GUARD_INCREMENTING"],
            "0"
        );
    }

    #[test]
    fn compiles_host_pressure_intervals_for_runtime_044() {
        let mut profile = sample();
        profile.tuning.host_grow_quiet_s = Some(0.0);
        assert!(validate(&profile).is_err());
        profile.family = ModelFamily::Minimax;
        profile.tuning.host_shrink_every_s = Some(12.5);
        let command = compile(&profile).expect("valid host memory tuning");
        assert_eq!(command.environment["CACHALOT_HOST_GROW_QUIET_S"], "0");
        assert_eq!(command.environment["CACHALOT_HOST_SHRINK_EVERY_S"], "12.5");
        profile.tuning.host_shrink_every_s = Some(f64::INFINITY);
        assert!(validate(&profile).is_err());
    }

    #[test]
    fn compiles_minimax_mirror_adaptation_for_runtime_045() {
        let mut profile = sample();
        profile.tuning.minimax_mirror_adapt = Some(false);
        assert!(validate(&profile).is_err());
        profile.family = ModelFamily::Minimax;
        let fixed = compile(&profile).expect("fixed mirror share");
        assert_eq!(fixed.environment["CACHALOT_MINIMAX_MIRROR_ADAPT"], "0");
        profile.tuning.minimax_mirror_adapt = Some(true);
        let adaptive = compile(&profile).expect("adaptive mirror share");
        assert_eq!(adaptive.environment["CACHALOT_MINIMAX_MIRROR_ADAPT"], "1");
    }

    #[test]
    fn compiles_minimax_expert_bank_and_mirror() {
        let mut profile = sample();
        profile.family = ModelFamily::Minimax;
        profile.tuning.minimax_bank_path = Some("/models/bank".to_owned());
        profile.tuning.minimax_mirror_path = Some("/Volumes/mirror/bank".to_owned());
        profile.tuning.minimax_mirror_fraction = Some(0.13);
        let command = compile(&profile).expect("bank launch");
        assert_eq!(command.environment["CACHALOT_MINIMAX_BANK"], "/models/bank");
        assert_eq!(
            command.environment["CACHALOT_MINIMAX_BANK_MIRROR"],
            "/Volumes/mirror/bank"
        );
        assert_eq!(command.environment["CACHALOT_MIRROR_FRACTION"], "0.13");
        profile.tuning.minimax_bank_path = None;
        assert!(validate(&profile).is_err());
    }

    #[test]
    fn compiles_deepseek_choices_and_preserves_legacy_defaults() {
        let mut profile = sample();
        profile.family = ModelFamily::Deepseek;
        assert!(compile(&profile)
            .expect("inherited CLI defaults")
            .environment
            .is_empty());
        for (drops, dates, budget, reuse) in [(true, false, "0", "0"), (false, true, "-1", "1")] {
            profile.tuning.deepseek_decode_drop_misses = Some(drops);
            profile.tuning.deepseek_system_date_reuse = Some(dates);
            let command = compile(&profile).expect("DeepSeek choices");
            assert_eq!(command.environment["CACHALOT_DECODE_MISS_BUDGET"], budget);
            assert_eq!(command.environment["CACHALOT_SYSTEM_DATE_REUSE"], reuse);
            let loaded: LaunchProfile =
                serde_json::from_slice(&serde_json::to_vec(&profile).expect("encode"))
                    .expect("decode");
            assert_eq!(
                compile(&loaded).expect("restored choices").environment,
                command.environment
            );
        }
        for key in [
            "CACHALOT_DECODE_MISS_BUDGET",
            "CACHALOT_SYSTEM_DATE_REUSE",
            "CACHALOT_SYSTEM_DATE_REUSE_DAYS",
        ] {
            assert!(CONTROLLED_ENV_KEYS.contains(&key));
        }
        let mut old = serde_json::to_value(sample()).expect("legacy JSON");
        old["family"] = serde_json::json!("deepseek");
        old["tuning"] = serde_json::json!({});
        let loaded = serde_json::from_value(old).expect("legacy read");
        assert!(compile(&loaded)
            .expect("legacy compile")
            .environment
            .is_empty());
    }

    #[test]
    fn rejects_deepseek_choices_on_other_families() {
        for family in [ModelFamily::Auto, ModelFamily::Glm, ModelFamily::Minimax] {
            for tuning in [
                RuntimeTuning {
                    deepseek_decode_drop_misses: Some(false),
                    ..Default::default()
                },
                RuntimeTuning {
                    deepseek_system_date_reuse: Some(true),
                    ..Default::default()
                },
            ] {
                let mut profile = sample();
                profile.family = family;
                profile.tuning = tuning;
                assert!(compile(&profile).is_err());
            }
        }
    }

    #[test]
    fn compiles_glm_bank_and_prefetch_overrides() {
        let mut value = serde_json::to_value(sample()).expect("profile JSON");
        value["family"] = serde_json::json!("glm");
        value["tuning"] = serde_json::json!({
            "glm_bank_path": "/models/GLM bank",
            "glm_bank_enabled": false,
            "glm_predict_topk": 0,
            "glm_predict_limit": 0,
            "glm_predict_after_demand": -1
        });
        let profile = serde_json::from_value(value).expect("GLM profile");
        let command = compile(&profile).expect("GLM launch");
        for (key, expected) in [
            ("CACHALOT_GLM_BANK", "/models/GLM bank"),
            ("CACHALOT_GLM_BANK_ENABLED", "0"),
            ("CACHALOT_GLM_PREDICT_TOPK", "0"),
            ("CACHALOT_GLM_PREDICT_LIMIT", "0"),
            ("CACHALOT_GLM_PREDICT_AFTER_DEMAND", "-1"),
        ] {
            assert_eq!(
                command.environment.get(key).map(String::as_str),
                Some(expected)
            );
            assert!(CONTROLLED_ENV_KEYS.contains(&key));
        }
    }

    #[test]
    fn validates_glm_controls_and_preserves_older_tuning() {
        for tuning in [
            serde_json::json!({"glm_bank_path": "relative/bank"}),
            serde_json::json!({"glm_predict_topk": 289}),
            serde_json::json!({"glm_predict_limit": 289}),
            serde_json::json!({"glm_predict_after_demand": 2}),
            serde_json::json!({"glm_predict_after_demand": -2}),
        ] {
            let mut value = serde_json::to_value(sample()).expect("profile JSON");
            value["family"] = serde_json::json!("glm");
            value["tuning"] = tuning;
            let profile = serde_json::from_value(value).expect("GLM profile");
            assert!(compile(&profile).is_err());
        }
        for family in ["auto", "deepseek", "minimax"] {
            for tuning in [
                serde_json::json!({"glm_bank_path": "/models/bank"}),
                serde_json::json!({"glm_bank_enabled": false}),
                serde_json::json!({"glm_predict_topk": 5}),
                serde_json::json!({"glm_predict_limit": 0}),
                serde_json::json!({"glm_predict_after_demand": -1}),
            ] {
                let mut value = serde_json::to_value(sample()).expect("profile JSON");
                value["family"] = serde_json::json!(family);
                value["tuning"] = tuning;
                let profile = serde_json::from_value(value).expect("profile");
                assert!(compile(&profile).is_err());
            }
        }
        let mut value = serde_json::to_value(sample()).expect("profile JSON");
        value["family"] = serde_json::json!("glm");
        value["tuning"] = serde_json::json!({"loop_guard_repeats": 6});
        let profile = serde_json::from_value(value).expect("older GLM profile");
        let command = compile(&profile).expect("older GLM launch");
        assert_eq!(command.environment.len(), 1);
        assert_eq!(command.environment["CACHALOT_LOOP_GUARD_REPEATS"], "6");
    }

    #[test]
    fn round_trips_and_rejects_corrupt_document() {
        let directory = std::env::temp_dir().join(format!(
            "cachalot-profiles-test-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock")
                .as_nanos()
        ));
        fs::create_dir_all(&directory).expect("create directory");
        let path = directory.join("profiles.json");
        let mut glm = sample();
        glm.id = "16bdca45-5cea-4d35-a38d-bfcba49ef097".to_owned();
        glm.family = ModelFamily::Glm;
        glm.tuning.glm_bank_path = Some("/models/GLM bank".to_owned());
        glm.tuning.glm_bank_enabled = Some(true);
        glm.tuning.glm_predict_topk = Some(5);
        glm.tuning.glm_predict_limit = Some(3);
        glm.tuning.glm_predict_after_demand = Some(1);
        write_document(
            &path,
            &Document {
                version: STORE_VERSION,
                profiles: vec![sample(), glm.clone()],
            },
        )
        .expect("write");
        let loaded = read_document(&path).expect("read");
        assert_eq!(loaded.profiles[0].name, "Local model");
        assert_eq!(
            compile(&loaded.profiles[1])
                .expect("saved GLM compile")
                .environment,
            compile(&glm).expect("original GLM compile").environment
        );
        let mut legacy = serde_json::to_value(&loaded).expect("encode document");
        legacy["profiles"][0]
            .as_object_mut()
            .expect("profile object")
            .remove("tuning");
        for key in [
            "model_id",
            "default_max_tokens",
            "default_temperature",
            "snapshot_dir",
        ] {
            legacy["profiles"][0]
                .as_object_mut()
                .expect("profile object")
                .remove(key);
        }
        fs::write(&path, serde_json::to_vec(&legacy).expect("legacy JSON"))
            .expect("write legacy profile");
        let legacy_command = compile(&read_document(&path).expect("legacy read").profiles[0])
            .expect("legacy compile");
        assert!(legacy_command.environment.is_empty());
        assert!(!legacy_command.args.iter().any(|arg| arg == "--model-id"));
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
}
