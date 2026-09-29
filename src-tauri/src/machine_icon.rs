use std::{
    collections::{HashMap, HashSet, VecDeque},
    fs,
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

use base64::{engine::general_purpose::STANDARD, Engine};
use plist::Value;

const CORE_TYPES: &str = "/System/Library/CoreServices/CoreTypes.bundle";

struct DeviceType {
    icon: Option<PathBuf>,
    parents: Vec<String>,
}

fn strings(value: Option<&Value>) -> Vec<String> {
    match value {
        Some(Value::String(text)) => vec![text.clone()],
        Some(Value::Array(values)) => values
            .iter()
            .filter_map(Value::as_string)
            .map(str::to_owned)
            .collect(),
        _ => Vec::new(),
    }
}

fn bundle_plists(root: &Path) -> Vec<PathBuf> {
    let mut paths = vec![root.join("Contents/Info.plist")];
    if let Ok(entries) = fs::read_dir(root.join("Contents/Library")) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().is_some_and(|ext| ext == "bundle") {
                paths.push(path.join("Contents/Info.plist"));
            }
        }
    }
    paths
}

fn icon_for_model(model: &str, root: &Path) -> Option<PathBuf> {
    let mut types = HashMap::<String, DeviceType>::new();
    let mut matched_type = None;

    for plist_path in bundle_plists(root) {
        let Ok(plist) = Value::from_file(&plist_path) else {
            continue;
        };
        let Some(bundle) = plist.as_dictionary() else {
            continue;
        };
        for key in ["UTExportedTypeDeclarations", "UTImportedTypeDeclarations"] {
            let Some(declarations) = bundle.get(key).and_then(Value::as_array) else {
                continue;
            };
            for declaration in declarations {
                let Some(declaration) = declaration.as_dictionary() else {
                    continue;
                };
                let Some(identifier) = declaration
                    .get("UTTypeIdentifier")
                    .and_then(Value::as_string)
                else {
                    continue;
                };
                let model_codes = declaration
                    .get("UTTypeTagSpecification")
                    .and_then(Value::as_dictionary)
                    .and_then(|tags| tags.get("com.apple.device-model-code"));
                if strings(model_codes).iter().any(|code| code == model) {
                    matched_type = Some(identifier.to_owned());
                }
                let icon_name = declaration
                    .get("UTTypeIcons")
                    .and_then(Value::as_dictionary)
                    .and_then(|icons| {
                        icons
                            .get("UTTypeIconFile")
                            .or_else(|| icons.get("UTTypeIconName"))
                    })
                    .and_then(Value::as_string);
                let icon = icon_name.map(|name| {
                    let name = if name.ends_with(".icns") {
                        name.to_owned()
                    } else {
                        format!("{name}.icns")
                    };
                    plist_path
                        .parent()
                        .expect("Info.plist has a parent")
                        .join("Resources")
                        .join(name)
                });
                types.insert(
                    identifier.to_owned(),
                    DeviceType {
                        icon,
                        parents: strings(declaration.get("UTTypeConformsTo")),
                    },
                );
            }
        }
    }

    let mut queue = VecDeque::from([matched_type?]);
    let mut visited = HashSet::new();
    while let Some(identifier) = queue.pop_front() {
        if !visited.insert(identifier.clone()) {
            continue;
        }
        let Some(device_type) = types.get(&identifier) else {
            continue;
        };
        if let Some(icon) = &device_type.icon {
            if icon.is_file() {
                return Some(icon.clone());
            }
        }
        queue.extend(device_type.parents.iter().cloned());
    }
    None
}

pub fn data_url(model_identifier: Option<&str>) -> Option<String> {
    let icon = icon_for_model(model_identifier?, Path::new(CORE_TYPES))?;
    icon_data_url(&icon)
}

fn icon_data_url(icon: &Path) -> Option<String> {
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .ok()?
        .as_nanos();
    let png = std::env::temp_dir().join(format!(
        "cachalot-machine-icon-{}-{unique}.png",
        std::process::id()
    ));
    let result = Command::new("/usr/bin/sips")
        .args(["-s", "format", "png", "-Z", "256"])
        .arg(icon)
        .arg("--out")
        .arg(&png)
        .output();
    let image = if result.is_ok_and(|output| output.status.success()) {
        fs::read(&png).ok()
    } else {
        None
    };
    let _ = fs::remove_file(png);
    let image = image?;
    if !image.starts_with(b"\x89PNG\r\n\x1a\n") {
        return None;
    }
    Some(format!("data:image/png;base64,{}", STANDARD.encode(image)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn model_codes_map_to_distinct_icons() {
        let root = std::env::temp_dir().join(format!("cachalot-icon-test-{}", std::process::id()));
        let contents = root.join("Contents");
        let resources = contents.join("Resources");
        fs::create_dir_all(&resources).unwrap();
        fs::write(
            contents.join("Info.plist"),
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>UTExportedTypeDeclarations</key><array>
<dict><key>UTTypeIdentifier</key><string>com.apple.macstudio</string><key>UTTypeTagSpecification</key><dict><key>com.apple.device-model-code</key><string>Mac15,14</string></dict><key>UTTypeIcons</key><dict><key>UTTypeIconFile</key><string>com.apple.macstudio.icns</string></dict></dict>
<dict><key>UTTypeIdentifier</key><string>com.apple.macmini-2024</string><key>UTTypeTagSpecification</key><dict><key>com.apple.device-model-code</key><string>Mac16,10</string></dict><key>UTTypeIcons</key><dict><key>UTTypeIconFile</key><string>com.apple.macmini-2024.icns</string></dict></dict>
</array></dict></plist>"#,
        )
        .unwrap();
        fs::write(resources.join("com.apple.macstudio.icns"), []).unwrap();
        fs::write(resources.join("com.apple.macmini-2024.icns"), []).unwrap();

        let path = icon_for_model("Mac15,14", &root).unwrap();
        assert_eq!(path.file_name().unwrap(), "com.apple.macstudio.icns");
        let path = icon_for_model("Mac16,10", &root).unwrap();
        assert_eq!(path.file_name().unwrap(), "com.apple.macmini-2024.icns");
        assert!(icon_for_model("Unknown999,999", &root).is_none());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn bundled_icon_converts_to_displayable_png() {
        let icon = Path::new(env!("CARGO_MANIFEST_DIR")).join("icons/icon.icns");
        let data = icon_data_url(&icon).unwrap();
        assert!(data.starts_with("data:image/png;base64,iVBOR"));
    }

    #[test]
    fn unknown_model_has_no_assumed_icon() {
        assert!(icon_for_model("Unknown999,999", Path::new(CORE_TYPES)).is_none());
    }
}
