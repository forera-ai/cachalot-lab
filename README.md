# Cachalot Studio

Mac desktop instrument panel for the [Cachalot](https://github.com/prooshani/cachalot) out-of-memory inference runtime.

## Status

Foundation in progress. Repository and three brand directions exist. Application code follows brand selection. No runtime or model files are modified by this repository.

## Product

Studio will supervise one Cachalot server, manage versioned YAML launch profiles, display memory and expert-cache telemetry, provide a streaming chat client, and expose API setup for agent tools. Runtime work remains in the Cachalot repository.

See [implementation plan](docs/PLAN.md), [architecture](docs/ARCHITECTURE.md), and [handoff](HANDOFF.md).

## Development prerequisites

- Apple Silicon Mac running macOS 14 or newer for the desktop runtime.
- Node.js 22 and pnpm for the frontend.
- Stable Rust toolchain with `clippy` and `rustfmt` for Tauri.
- Python 3.12 or newer for the mock runtime and an external Cachalot installation.

The mock runtime will let UI and end-to-end tests run without a model checkpoint.

## Privacy

Telemetry and conversations stay local. Studio will not include analytics or accounts.
