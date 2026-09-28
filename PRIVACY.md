# Privacy

Cachalot Studio 0.1.0 makes HTTP requests only to a loopback Cachalot server selected by the user. It does not transmit prompts, generated content, telemetry, or model paths to the Studio developer or an analytics service.

The published 0.1.0 app saves appearance and screen preferences, plus the last server address, in local WebView storage. It holds conversation text and an optional server API key in memory during the current app session. Closing 0.1.0 clears those in-memory values.

Development builds with the **Unreleased** saved-chat feature save conversations in `conversations.json` under Studio's macOS app data directory. The file is local, readable by the signed-in user, and not encrypted separately from the Mac's storage. It can contain prompts, generated text, and reasoning. Starting a new chat keeps earlier saved chats; deleting one in Studio removes it from the file. Studio still keeps the optional server API key only in memory and clears it when the app closes.

Studio does not collect diagnostic logs. A Cachalot server may have its own logging and data-handling behavior; consult that runtime's documentation.
