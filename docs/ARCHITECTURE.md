# Architecture

Tauri's Rust core will own process supervision, profile validation and compilation, filesystem access, Keychain access, Doctor probes, and updates. React will display state and call the local OpenAI-compatible server. The Rust core will emit process and log events. HTTP telemetry will be polled at 1 Hz when visible and 0.2 Hz when hidden, with no overlapping requests. `runtime-contract/` will hold versioned family, knob, log, and stats data. A mock runtime will support development without model files.

Only one server process may be managed at once. The frontend must never compose a shell command or store an API key in profile YAML.
