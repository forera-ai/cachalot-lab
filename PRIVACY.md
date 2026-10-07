# Privacy

Cachalot Lab 0.5.0 makes HTTP requests only to a loopback Cachalot server selected or started by the user. It does not transmit prompts, generated content, telemetry, or model paths to the Lab developer or an analytics service.

The app saves appearance, silent-running, and screen preferences, plus the last server address, in local WebView storage. API keys remain in session memory unless explicitly saved in macOS Keychain, described below. Closing Lab clears connection memory, but explicitly saved Keychain credentials persist until forgotten.

Lab saves conversations in `conversations.json` under its macOS app data directory. The file is local, readable by the signed-in user, and not encrypted separately from the Mac's storage. It can contain prompts, generated text, reasoning, and each chat's generation settings. Starting a new chat keeps earlier saved chats; deleting one in Lab removes it from the file. API keys are never saved in conversation files.

Lab captures the output of a server it starts in `managed-runtime.log` under the same private app data directory. The log is replaced on each managed launch; Dive and Logs display its latest 64 KiB locally. Runtime output may include model paths, errors, or request details, depending on the runtime's logging settings. Lab does not upload this log or collect logs from independently started servers. Consult the Cachalot runtime documentation for its logging and data-handling behavior.

Launch profiles save local model/bank/snapshot paths and optional tuning choices in `profiles.json`. On Cachalot 0.60+, DeepSeek system-date reuse can retain a date mapping in `system-dates.json` beside runtime prefix snapshots. That file belongs to the runtime; the Lab client keeps its original conversation history. Turning reuse Off affects subsequent launches and does not erase existing runtime snapshot files.

SSD telemetry reads whole-drive byte counters, the driver registry ID, drive model name, and BSD device name from macOS IOKit. It keeps derived throughput histories in memory for two minutes. It does not expose drive serial numbers, inspect file contents, collect per-file access, or upload disk activity. The selector is session-local.

Model discovery reads only configuration metadata in a user-chosen folder and at most three levels below it. It checks for weight/tokenizer filenames without opening weights or tokenizers. It does not download, move, or index model contents persistently. Choosing a discovered model creates an unsaved draft; saving a profile persists its local path. Descendant directory symlinks are skipped.

API credentials remain session-only by default. Explicit Save key in Keychain stores a generic password under `com.cachalot.studio.runtime-api-key`, indexed by the normalized loopback HTTP origin (scheme, hostname, and port). `/v1` and trailing slashes normalize to the same origin; localhost and 127.0.0.1 remain separate. Saved keys are read by Rust for optional reconnection, never returned to the WebView, copied into API examples, or written into profile/log/conversation/WebView storage. Typed keys cross the native command bridge once and remain in Rust connection memory. Forget saved key removes that Keychain item but does not disconnect or erase the current in-memory key. Closing Lab clears connection memory. HTTP redirects are disabled.
