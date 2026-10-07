//! Optional, endpoint-bound macOS Keychain credentials. Secrets never return to the WebView.
use crate::runtime::parse_local_endpoint;

#[cfg(target_os = "macos")]
// Stable Keychain namespace: the Lab rename must retain saved credentials.
const SERVICE: &str = "com.cachalot.studio.runtime-api-key";

fn account(endpoint: &str) -> Result<String, String> {
    Ok(parse_local_endpoint(endpoint)?
        .as_str()
        .trim_end_matches('/')
        .to_owned())
}

pub fn validate_key(key: &str) -> Result<String, String> {
    let key = key.trim();
    if key.is_empty() || key.len() > 4096 || key.chars().any(char::is_control) {
        return Err("Enter an API key of 1–4096 bytes without control characters.".to_owned());
    }
    Ok(key.to_owned())
}

pub fn load(endpoint: &str) -> Result<Option<String>, String> {
    let account = account(endpoint)?;
    #[cfg(target_os = "macos")]
    {
        match security_framework::passwords::get_generic_password(SERVICE, &account) {
            Ok(bytes) => String::from_utf8(bytes).map(Some).map_err(|_| "The saved Keychain key is invalid. Replace it in API.".to_owned()),
            Err(error) if error.code() == -25300 => Ok(None), // errSecItemNotFound
            Err(error) => Err(format!("Could not read Keychain (macOS status {}). Unlock or allow access, or connect without a saved key.", error.code())),
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = account;
        Err("Keychain requires macOS.".to_owned())
    }
}

#[tauri::command]
pub async fn has_runtime_key(endpoint_url: String) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || load(&endpoint_url).map(|key| key.is_some()))
        .await
        .map_err(|_| "Could not check Keychain.".to_owned())?
}

#[tauri::command]
pub async fn save_runtime_key(endpoint_url: String, api_key: String) -> Result<(), String> {
    let account = account(&endpoint_url)?;
    let key = validate_key(&api_key)?;
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(target_os = "macos")]
        {
            security_framework::passwords::set_generic_password(SERVICE, &account, key.as_bytes())
                .map_err(|error| {
                    format!(
                        "Could not save Keychain key (macOS status {}).",
                        error.code()
                    )
                })
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = (account, key);
            Err("Keychain requires macOS.".to_owned())
        }
    })
    .await
    .map_err(|_| "Could not save Keychain key.".to_owned())?
}

#[tauri::command]
pub async fn delete_runtime_key(endpoint_url: String) -> Result<(), String> {
    let account = account(&endpoint_url)?;
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(target_os = "macos")]
        {
            match security_framework::passwords::delete_generic_password(SERVICE, &account) {
                Ok(()) => Ok(()),
                Err(error) if error.code() == -25300 => Ok(()),
                Err(error) => Err(format!(
                    "Could not delete Keychain key (macOS status {}).",
                    error.code()
                )),
            }
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = account;
            Err("Keychain requires macOS.".to_owned())
        }
    })
    .await
    .map_err(|_| "Could not delete Keychain key.".to_owned())?
}

#[cfg(test)]
mod tests {
    use super::{account, validate_key};
    #[test]
    fn binds_keys_to_normalized_local_origins_and_rejects_unsafe_addresses() {
        assert_eq!(
            account("http://127.0.0.1:8011/v1/").unwrap(),
            account("http://127.0.0.1:8011").unwrap()
        );
        assert_ne!(
            account("http://127.0.0.1:8011").unwrap(),
            account("http://127.0.0.1:8012").unwrap()
        );
        for address in [
            "https://example.com:8011",
            "http://127.0.0.1:8011/?key=secret",
            "http://user:secret@localhost:8011",
        ] {
            assert!(account(address).is_err());
        }
        assert!(validate_key("").is_err());
        assert!(validate_key("a\nb").is_err());
        assert!(validate_key(&"a".repeat(4097)).is_err());
    }

    #[test]
    #[cfg(target_os = "macos")]
    #[ignore = "Creates and removes an isolated synthetic Keychain item; run explicitly on macOS."]
    fn real_keychain_create_replace_read_delete() {
        use security_framework::passwords::{
            delete_generic_password, get_generic_password, set_generic_password,
        };
        let service = format!(
            "com.cachalot.lab.test.{}.{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        );
        let account = "synthetic-only";
        assert_eq!(
            get_generic_password(&service, account).unwrap_err().code(),
            -25300
        );
        set_generic_password(&service, account, b"first-synthetic-value").unwrap();
        assert_eq!(
            get_generic_password(&service, account).unwrap(),
            b"first-synthetic-value"
        );
        set_generic_password(&service, account, b"replacement-synthetic-value").unwrap();
        assert_eq!(
            get_generic_password(&service, account).unwrap(),
            b"replacement-synthetic-value"
        );
        delete_generic_password(&service, account).unwrap();
        assert_eq!(
            get_generic_password(&service, account).unwrap_err().code(),
            -25300
        );
    }
}
