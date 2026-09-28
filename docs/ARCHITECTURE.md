# Architecture

The Tauri Rust core owns local HTTP access. It accepts only loopback `http://` endpoints, holds the optional API key in memory, fetches health/models/stats, and streams chat over Server-Sent Events into window events. React never opens the runtime socket directly. Connection state and the active generation live in the Rust process. Cancellation aborts only the request started by Studio.

`src/runtime.ts` wraps native commands, auto-connects to the last local endpoint, and polls every three seconds. `src/RuntimeScreens.tsx` renders connection setup, API example, and chat. The chat component remains mounted while users navigate, preserving the current in-memory conversation and its stream listener. `src/App.tsx` renders the Cockpit, Doctor, Settings, and navigation. `src/store.ts` persists screen and theme preferences; local WebView storage also keeps the last endpoint. No API key or conversation is persisted.

`design/tokens.json` is compiled by `scripts/generate-tokens.mjs` into CSS variables and TypeScript. The owner-selected mark in `assets/logo/` supplies app and theme assets. `mock-runtime/server.py` is a local test double, never bundled into the native app.

Managed runtime launching, profiles, filesystem discovery, logs, Keychain credentials, and updates are later milestones. The frontend must never compose a shell command. The future supervisor must own at most one process and never stop a server it did not launch.
