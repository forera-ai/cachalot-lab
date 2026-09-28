<p align="center">
  <img src="assets/logo/cachalot-mark.svg" width="104" height="104" alt="Cachalot Studio mark">
</p>

# Cachalot Studio

<p align="center">A native macOS control surface for the <a href="https://github.com/prooshani/cachalot">Cachalot</a> local inference runtime.</p>

[![Release](https://img.shields.io/github/v/release/prooshani/cachalot-studio)](https://github.com/prooshani/cachalot-studio/releases/latest)
[![CI](https://github.com/prooshani/cachalot-studio/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/prooshani/cachalot-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Studio makes a local Cachalot server easier to use: connect, inspect live health and cache metrics, chat with streaming and reasoning, and copy API details for other clients. It connects only to a server on the same Mac.

## Download

**Current release:** [Cachalot Studio 0.1.0](https://github.com/prooshani/cachalot-studio/releases/tag/v0.1.0) for Apple Silicon, macOS 14 or newer.

1. Download the signed and notarized [DMG](https://github.com/prooshani/cachalot-studio/releases/download/v0.1.0/Cachalot-Studio-0.1.0-macOS-arm64.dmg).
2. Open it and drag **Cachalot Studio** into **Applications**.
3. Start your Cachalot server, then open Studio. It first tries `http://127.0.0.1:8011`.
4. If your server uses another loopback port or an API key, enter it in the **API** screen.

The release also includes a [ZIP](https://github.com/prooshani/cachalot-studio/releases/download/v0.1.0/Cachalot-Studio-0.1.0-macOS-arm64.zip) and [SHA-256 checksums](https://github.com/prooshani/cachalot-studio/releases/download/v0.1.0/SHA256SUMS). The [release notes](https://github.com/prooshani/cachalot-studio/releases/tag/v0.1.0) state the exact scope and verification.

Studio does not install Cachalot, Python, or model weights. Prepare a model and environment using the [runtime documentation](https://github.com/prooshani/cachalot), then start its server. One example, after that preparation:

```sh
python -m cachalot.cli serve --model /path/to/your/model --port 8011
```

## What 0.1.0 includes

- **Cockpit:** connection state, health, and live metrics reported by the runtime.
- **Chat:** streaming responses, optional reasoning, generation stop, and conversation retention during the current app session.
- **API:** local endpoint, optional in-memory API key, and connection details.
- **Doctor and Settings:** connection checks, appearance, and system information available in this release.
- **Navigation:** Abyss, Surface, or system appearance and a `⌘K` command palette.

Runtime launch, saved conversations, profiles, model discovery, logs, and automatic updates remain [planned](docs/PLAN.md). Studio keeps conversations and the optional API key in memory for the app session. It saves the last endpoint and appearance locally. See [Privacy](PRIVACY.md).

## Develop

Requires Node.js 22, pnpm 10, a stable Rust toolchain, and Xcode command line tools.

```sh
pnpm install --frozen-lockfile
pnpm tauri dev
```

`pnpm dev` opens a browser preview; local server access and machine data require the native app. The [mock runtime](mock-runtime/README.md) supports development without model weights.

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
cd src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
```

## Project documents

- [Changelog](CHANGELOG.md) and [release procedure](docs/RELEASE.md)
- [Architecture](docs/ARCHITECTURE.md) and [implementation plan](docs/PLAN.md)
- [Runtime compatibility workflow](docs/RUNTIME_SYNC.md) and [runtime requests](docs/RUNTIME_REQUESTS.md)
- [Contributing](CONTRIBUTING.md), [privacy](PRIVACY.md), and [license](LICENSE)
