<p align="center">
  <img src="assets/logo/cachalot-mark.svg" width="104" height="104" alt="Cachalot Studio mark">
</p>

# Cachalot Studio

<p align="center">A native macOS control surface for the <a href="https://github.com/prooshani/cachalot">Cachalot</a> local inference runtime.</p>

[![Release](https://img.shields.io/github/v/release/prooshani/cachalot-studio)](https://github.com/prooshani/cachalot-studio/releases/latest)
[![CI](https://github.com/prooshani/cachalot-studio/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/prooshani/cachalot-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Studio makes a local Cachalot server easier to use: launch or connect, inspect live health and cache metrics, chat with streaming and reasoning, and copy API details for other clients. It connects only to a server on the same Mac.

## Download

**Current release:** [Cachalot Studio 0.5.0](https://github.com/prooshani/cachalot-studio/releases/tag/v0.5.0) for Apple Silicon, macOS 14 or newer.

1. Download the signed and notarized [DMG](https://github.com/prooshani/cachalot-studio/releases/download/v0.5.0/Cachalot-Studio-0.5.0-macOS-arm64.dmg).
2. Open it and drag **Cachalot Studio** into **Applications**.
3. Open Studio. It first tries an existing Cachalot server at `http://127.0.0.1:8011`.
4. Use **Dive** to launch a local runtime, or enter another loopback port and optional API key in **API**.

The release also includes a [ZIP](https://github.com/prooshani/cachalot-studio/releases/download/v0.5.0/Cachalot-Studio-0.5.0-macOS-arm64.zip) and [SHA-256 checksums](https://github.com/prooshani/cachalot-studio/releases/download/v0.5.0/SHA256SUMS). The [release notes](https://github.com/prooshani/cachalot-studio/releases/tag/v0.5.0) state the exact scope and verification.

Studio does not install Cachalot, Python, or model weights. Prepare a model and environment using the [runtime documentation](https://github.com/prooshani/cachalot). Dive needs the absolute path to a Python interpreter with Cachalot installed, the model directory, and any separate expert bank. You can also start the server yourself:

```sh
python -m cachalot.cli serve --model /path/to/your/model --port 8011
```

## What 0.5.0 includes

0.5.0 adds physical-drive read/write telemetry, local model discovery, optional macOS Keychain credentials, and a refined Dive interface. It retains GLM/DeepSeek launch controls, runtime totals, Silent running, chat settings, and managed runtime capabilities.

- **Cockpit:** physical-drive selection and read/write MB/s histories, with separate Drives and Runtime views; a compact dashboard with two-minute decode-speed, expert-hit, SSD-read, and resident-expert traces; whole-Mac CPU, GPU, and memory graphs; and macOS hardware details. Optional image-input and prefetch totals preserve zero; missing metrics remain unavailable.
- **Chat:** streaming responses, optional reasoning, generation stop, and saved local conversations bound to their original endpoint and model. Generation settings persist per chat; an empty temperature uses the server default.
- **Dive:** bounded local model discovery, editable unsaved drafts, aligned controls, deletion confirmation, labeled previews, collapsible logs; versioned launch profiles, fixed-argument preview, one Studio-owned runtime at a time, readiness checks, automatic connection, and GLM, DeepSeek, and MiniMax family-specific controls.
- **API:** local endpoint, optional session API key or explicitly saved macOS Keychain credential, and copy-ready curl, Python OpenAI SDK, and JavaScript OpenAI SDK examples.
- **Doctor and Logs:** connection checks, managed startup state, and a bounded tail of the managed process's private log.
- **Navigation:** Abyss, Surface, or system appearance and a `⌘K` command palette. Settings includes Silent running, which pauses traces and transitions while live readings and generation continue.

Studio polls runtime stats at 1 Hz while visible and 0.2 Hz while hidden. Whole-Mac graphs describe the host, not model-specific utilization. The telemetry strip remains visible on screens other than Cockpit while connected.

Managed profiles can set the served model ID, default response length and temperature, and an optional persistent prefix-snapshot directory. Omitted fields inherit the installed runtime's defaults. Studio starts only the process it owns and stops it on normal app exit. After an abrupt exit, an occupied port blocks a new launch; stop the earlier process yourself or choose another port. Studio does not attach to or terminate an unknown process. See [managed runtime](docs/MANAGED_RUNTIME.md).

MiniMax's decode and prefill miss substitution can change outputs. Dive provides explicit overrides; for an external server, the active numerics mode remains unreported because Cachalot does not expose it in `/v1/stats`. Runtime 0.46 added an incrementing-list loop guard; 0.47 set the MiniMax launch script's temperature default to 0.7. Studio launches the CLI directly, so an empty managed temperature still inherits the CLI's 0.6 default. The brief series through 0.60.0 and runtime source at 0.60.1 (`9d11bc061dcb434c40494be3d507521194d376dc`) were reviewed for this release. The latest native managed MiniMax smoke test used 0.50.1. See [runtime compatibility](docs/RUNTIME_SYNC.md).

API keys stay in session memory unless explicitly saved in Keychain; stored secrets never return to JavaScript or copied API examples. Saved conversations and managed logs remain local; see [Privacy](PRIVACY.md). Automatic updates remain [planned](docs/PLAN.md); discovery and Keychain ship in 0.5.0. The [Abyss and Surface Dive mockups](design/mockups/managed-runtime.html) remain a design reference.

## Storage, discovery, and credentials

Studio 0.5.0 adds Cockpit **Drives** and **Runtime** views. Drives selects a physical storage device and shows decimal read/write MB/s plus a two-minute history, even with Cachalot offline. Rates include all applications on that drive. First samples and unavailable/reset counters show —. Live GLM/DeepSeek validation remains pending; no measured speed or quality claim is made. It also includes **Dive model discovery** and optional **API Keychain credentials**. Scan a chosen folder, create an editable draft, and supply Python/bank paths before saving. API keys remain session-only unless explicitly saved for a local server address; saved keys reconnect after restart and never appear in copied examples. Authenticated saved-key reconnect across restart remains unexercised. See [Discovery and Keychain](docs/DISCOVERY_KEYCHAIN.md). Dive also has refined action spacing, a clear delete-confirmation flow, a labeled launch preview, compact discovery rows, and collapsible runtime output; see [Dive UI](docs/DIVE_UI.md).

GLM launch controls require Cachalot 0.49–0.50: an optional contiguous expert bank and enable switch, prefetch expert count, read limit, and scheduling. Empty fields inherit runtime defaults; bank Off preserves its path while using checkpoint experts. DeepSeek Decode drops misses requires 0.57+ and can change outputs and lower quality; Off selects exact decode. Empty preserves Studio's direct CLI default of exact decode, unlike the 0.60 `serve.sh` default budget 0. System date reuse requires 0.60+, defaults On, and can show the model a date up to seven days old in the leading system message; Off keeps the true date. Changes apply on the next launch. Older profiles keep their defaults and older runtimes ignore unsupported environment controls.

Cockpit shows optional image input and prefetch read/used totals only when reported. GLM/MiniMax omit prediction totals in the reviewed HTTP source. Image totals include video steps and resent history and are not a capability or completion signal. Studio media attachments remain planned. Briefs through 0.60.0 and runtime source at 0.60.0 (`62c0f05`) were reviewed. Prior native managed MiniMax 0.50.1 testing reached readiness, streamed a short reply, and stopped cleanly; live GLM bank/prefetch and DeepSeek 0.60 tests and sustained performance measurements remain outstanding. See [managed runtime](docs/MANAGED_RUNTIME.md) for compatibility and limits.

Requires Node.js 22, pnpm 10, a stable Rust toolchain, and Xcode command line tools.

## Develop

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
