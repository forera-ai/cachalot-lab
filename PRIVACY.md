# Privacy

Cachalot Studio 0.3.0 makes HTTP requests only to a loopback Cachalot server selected or started by the user. It does not transmit prompts, generated content, telemetry, or model paths to the Studio developer or an analytics service.

The app saves appearance and screen preferences, plus the last server address, in local WebView storage. It holds an optional server API key in memory during the current app session; closing Studio clears it.

Studio saves conversations in `conversations.json` under its macOS app data directory. The file is local, readable by the signed-in user, and not encrypted separately from the Mac's storage. It can contain prompts, generated text, reasoning, and each chat's generation settings. Starting a new chat keeps earlier saved chats; deleting one in Studio removes it from the file. Studio still keeps the optional server API key only in memory and clears it when the app closes.

Studio captures the output of a server it starts in `managed-runtime.log` under the same private app data directory. The log is replaced on each managed launch; Dive and Logs display its latest 64 KiB locally. Runtime output may include model paths, errors, or request details, depending on the runtime's logging settings. Studio does not upload this log or collect logs from independently started servers. Consult the Cachalot runtime documentation for its logging and data-handling behavior.
