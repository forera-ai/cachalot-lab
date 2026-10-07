//! Bounded metadata-only discovery. Never opens weights or follows descendant symlinks.
use serde::Serialize;
use std::{
    collections::VecDeque,
    fs,
    io::Read,
    path::{Path, PathBuf},
};
const MAX_DIRS: usize = 1000;
const MAX_MODELS: usize = 64;
const MAX_CONFIG: u64 = 2 * 1024 * 1024;
#[derive(Serialize, Debug)]
pub struct Candidate {
    name: String,
    path: String,
    family: String,
    model_type: String,
    weights_present: bool,
    tokenizer_present: bool,
}
#[derive(Serialize, Debug)]
pub struct Discovery {
    root: String,
    models: Vec<Candidate>,
    scanned_dirs: usize,
    skipped_dirs: usize,
    invalid_configs: usize,
    truncated: bool,
}
fn inspect(path: &Path) -> Result<Option<Candidate>, ()> {
    let config = path.join("config.json");
    if !config.exists() {
        return Ok(None);
    }
    let meta = fs::symlink_metadata(&config).map_err(|_| ())?;
    if !meta.is_file() || meta.len() > MAX_CONFIG {
        return Err(());
    }
    let mut bytes = Vec::new();
    fs::File::open(config)
        .map_err(|_| ())?
        .take(MAX_CONFIG + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| ())?;
    if bytes.len() as u64 > MAX_CONFIG {
        return Err(());
    }
    let value: serde_json::Value = serde_json::from_slice(&bytes).map_err(|_| ())?;
    let model_type = value
        .get("model_type")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let family = match model_type {
        "deepseek_v41" | "deepseek_v41_text" => "deepseek",
        "glm5_next" | "glm5_next_text" => "glm",
        "minimax_m3" => "minimax",
        _ => return Ok(None),
    };
    let weights_present = fs::read_dir(path)
        .map_err(|_| ())?
        .take(10_000)
        .filter_map(Result::ok)
        .any(|entry| {
            entry.path().extension().is_some_and(|v| v == "safetensors")
                && entry.file_type().is_ok_and(|v| v.is_file())
        });
    Ok(Some(Candidate {
        name: path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned(),
        path: path.to_string_lossy().into_owned(),
        family: family.into(),
        model_type: model_type.into(),
        weights_present,
        tokenizer_present: path.join("tokenizer.json").is_file(),
    }))
}
fn scan(root_path: String) -> Result<Discovery, String> {
    let input = PathBuf::from(root_path.trim());
    if !input.is_absolute() {
        return Err("Choose an absolute folder path.".into());
    }
    let root = input
        .canonicalize()
        .map_err(|_| "Could not open that folder.".to_owned())?;
    if !root.is_dir() {
        return Err("Choose a folder.".into());
    }
    let mut result = Discovery {
        root: root.to_string_lossy().into_owned(),
        models: vec![],
        scanned_dirs: 0,
        skipped_dirs: 0,
        invalid_configs: 0,
        truncated: false,
    };
    let mut queue = VecDeque::from([(root, 0)]);
    let mut entries_seen = 0;
    while let Some((path, depth)) = queue.pop_front() {
        if result.scanned_dirs >= MAX_DIRS || result.models.len() >= MAX_MODELS {
            result.truncated = true;
            break;
        }
        result.scanned_dirs += 1;
        match inspect(&path) {
            Ok(Some(candidate)) => {
                result.models.push(candidate);
                continue;
            }
            Err(()) => result.invalid_configs += 1,
            _ => {}
        }
        if depth >= 3 {
            continue;
        }
        match fs::read_dir(path) {
            Ok(entries) => {
                for entry in entries {
                    entries_seen += 1;
                    if entries_seen > 10_000 {
                        result.truncated = true;
                        return Ok(result);
                    }
                    let Ok(entry) = entry else {
                        result.skipped_dirs += 1;
                        continue;
                    };
                    let name = entry.file_name();
                    if name.to_string_lossy().starts_with('.')
                        || matches!(name.to_str(), Some("node_modules" | "venv" | "target"))
                    {
                        continue;
                    }
                    if entry.file_type().is_ok_and(|kind| kind.is_dir()) {
                        if queue.len() + result.scanned_dirs >= MAX_DIRS {
                            result.truncated = true;
                            continue;
                        }
                        queue.push_back((entry.path(), depth + 1));
                    }
                }
            }
            Err(_) => result.skipped_dirs += 1,
        }
    }
    result.models.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(result)
}
#[tauri::command]
pub async fn discover_models(root_path: String) -> Result<Discovery, String> {
    tauri::async_runtime::spawn_blocking(move || scan(root_path))
        .await
        .map_err(|_| "Discovery could not finish.".to_owned())?
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn reports_scan_limits_and_oversized_configs() {
        let root =
            std::env::temp_dir().join(format!("lab-discovery-limits-{}", std::process::id()));
        fs::create_dir_all(&root).unwrap();
        fs::write(
            root.join("config.json"),
            vec![b' '; MAX_CONFIG as usize + 1],
        )
        .unwrap();
        for i in 0..1005 {
            fs::create_dir(root.join(format!("folder-{i}"))).unwrap();
        }
        let result = scan(root.to_string_lossy().into_owned()).unwrap();
        assert!(result.truncated);
        assert!(result.scanned_dirs <= MAX_DIRS);
        assert_eq!(result.invalid_configs, 1);
        fs::remove_dir_all(root).unwrap();
    }
    #[test]
    fn recognizes_metadata_without_following_symlinks_or_deep_trees() {
        let root = std::env::temp_dir().join(format!(
            "lab-discovery-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&root).unwrap();
        for (name, kind) in [
            ("glm", "glm5_next"),
            ("ds", "deepseek_v41"),
            ("mini", "minimax_m3"),
            ("other", "llama"),
        ] {
            let path = root.join(name);
            fs::create_dir(&path).unwrap();
            fs::write(
                path.join("config.json"),
                format!("{{\"model_type\":\"{kind}\"}}"),
            )
            .unwrap();
        }
        fs::create_dir(root.join("bad")).unwrap();
        fs::write(root.join("bad/config.json"), "invalid").unwrap();
        let deep = root.join("a/b/c/d");
        fs::create_dir_all(&deep).unwrap();
        fs::write(deep.join("config.json"), "{\"model_type\":\"glm5_next\"}").unwrap();
        #[cfg(unix)]
        std::os::unix::fs::symlink(&root, root.join("loop")).unwrap();
        let result = scan(root.to_string_lossy().into_owned()).unwrap();
        assert_eq!(result.models.len(), 3);
        assert_eq!(result.invalid_configs, 1);
        assert!(!result.truncated);
        assert!(!result.models[0].weights_present);
        assert!(scan("relative".into()).is_err());
        fs::remove_dir_all(root).unwrap();
    }
}
