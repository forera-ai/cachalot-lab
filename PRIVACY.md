# Privacy

Cachalot Studio 0.1.0 makes HTTP requests only to a loopback Cachalot server selected by the user. It does not transmit prompts, generated content, telemetry, or model paths to the Studio developer or an analytics service.

The app saves appearance and screen preferences, plus the last server address, in local WebView storage. It holds conversation text and an optional server API key in memory during the current app session. Closing Studio clears those in-memory values. Starting a new chat clears the visible conversation.

Studio does not collect diagnostic logs. A Cachalot server may have its own logging and data-handling behavior; consult that runtime's documentation.
