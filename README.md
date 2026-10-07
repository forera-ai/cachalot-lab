<p align="center">
  <img src="assets/logo/cachalot-mark.svg" width="104" height="104" alt="Cachalot Lab mark">
</p>

# Cachalot Lab

<p align="center">An inference observability and experimentation environment for <a href="https://github.com/prooshani/cachalot">Cachalot</a> on macOS.</p>

[![Release](https://img.shields.io/github/v/release/prooshani/cachalot-lab)](https://github.com/prooshani/cachalot-lab/releases/latest)
[![CI](https://github.com/prooshani/cachalot-lab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/prooshani/cachalot-lab/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Cachalot Lab** is the new name of Cachalot Studio. Its governing goal is to make invisible inference behavior visible: explain time, concurrency, resource activity, data movement, and experimental tradeoffs. Cachalot remains the inference engine; Lab is the human-facing instrument panel. See [product direction](docs/PRODUCT_DIRECTION.md), [delivery roadmap](docs/PLAN.md), and [rename compatibility](docs/RENAME.md).

The existing app launches or connects to local Cachalot, inspects live health and cache metrics, streams chat and reasoning, and provides API details. Token profiling, durable experiment comparisons, sweeps, energy analysis, and validated counterfactuals are planned capabilities, not features of the 0.6.0 binary. Connections remain limited to the same Mac.

## Download

**Current release:** [Cachalot Lab 0.6.0](https://github.com/prooshani/cachalot-lab/releases/tag/v0.6.0) for Apple Silicon, macOS 14 or newer. It adds runtime read/wait evidence and ships the Lab name. Existing profiles, conversations, preferences, and credential namespaces are preserved.

1. Download the signed and notarized [DMG](https://github.com/prooshani/cachalot-lab/releases/download/v0.6.0/Cachalot-Lab-0.6.0-macOS-arm64.dmg).
2. Open it and drag **Cachalot Lab** into **Applications**.
3. Open Lab. It first tries an existing Cachalot server at `http://127.0.0.1:8011`.
4. Use **Dive** to launch a local runtime, or enter another loopback port and optional API key in **API**.

The release also includes a [ZIP](https://github.com/prooshani/cachalot-lab/releases/download/v0.6.0/Cachalot-Lab-0.6.0-macOS-arm64.zip) and [SHA-256 checksums](https://github.com/prooshani/cachalot-lab/releases/download/v0.6.0/SHA256SUMS). The [release notes](https://github.com/prooshani/cachalot-lab/releases/tag/v0.6.0) state the exact scope and verification.

Lab does not install Cachalot, Python, or model weights. Prepare a model and environment using the [runtime documentation](https://github.com/prooshani/cachalot). Dive needs the absolute path to a Python interpreter with Cachalot installed, the model directory, and any separate expert bank. You can also start the server yourself:

```sh
python -m cachalot.cli serve --model /path/to/your/model --port 8011
```

## What 0.6.0 includes

0.6.0 adds a collapsed runtime read/wait evidence table and the Cachalot Lab rename. It retains physical-drive read/write telemetry, local model discovery, optional macOS Keychain credentials, and a refined Dive interface. It retains GLM/DeepSeek launch controls, runtime totals, Silent running, chat settings, and managed runtime capabilities.

- **Cockpit:** physical-drive selection and read/write MB/s histories, with separate Drives and Runtime views; a compact dashboard with two-minute decode-speed, expert-hit, SSD-read, and resident-expert traces; whole-Mac CPU, GPU, and memory graphs; and macOS hardware details. Optional image-input and prefetch totals preserve zero; missing metrics remain unavailable.
- **Chat:** streaming responses, optional reasoning, generation stop, and saved local conversations bound to their original endpoint and model. Generation settings persist per chat; an empty temperature uses the server default.
- **Dive:** bounded local model discovery, editable unsaved drafts, aligned controls, deletion confirmation, labeled previews, collapsible logs; versioned launch profiles, fixed-argument preview, one Lab-owned runtime at a time, readiness checks, automatic connection, and GLM, DeepSeek, and MiniMax family-specific controls.
- **API:** local endpoint, optional session API key or explicitly saved macOS Keychain credential, and copy-ready curl, Python OpenAI SDK, and JavaScript OpenAI SDK examples.
- **Doctor and Logs:** connection checks, managed startup state, and a bounded tail of the managed process's private log.
- **Navigation:** Abyss, Surface, or system appearance and a `⌘K` command palette. Settings includes Silent running, which pauses traces and transitions while live readings and generation continue.

Lab polls runtime stats at 1 Hz while visible and 0.2 Hz while hidden. Whole-Mac graphs describe the host, not model-specific utilization. The telemetry strip remains visible on screens other than Cockpit while connected.

Managed profiles can set the served model ID, default response length and temperature, and an optional persistent prefix-snapshot directory. Omitted fields inherit the installed runtime's defaults. Lab starts only the process it owns and stops it on normal app exit. After an abrupt exit, an occupied port blocks a new launch; stop the earlier process yourself or choose another port. Lab does not attach to or terminate an unknown process. See [managed runtime](docs/MANAGED_RUNTIME.md).

MiniMax's decode and prefill miss substitution can change outputs. Dive provides explicit overrides; for an external server, the active numerics mode remains unreported because Cachalot does not expose it in `/v1/stats`. Runtime 0.46 added an incrementing-list loop guard; 0.47 set the MiniMax launch script's temperature default to 0.7. Lab launches the CLI directly, so an empty managed temperature still inherits the CLI's 0.6 default. The brief series through 0.61.1 and runtime source at 0.61.2 (`954dff83c54071e10aef649ae725dd0afd141528`) were reviewed for this release. The latest native managed MiniMax smoke test used 0.50.1. See [runtime compatibility](docs/RUNTIME_SYNC.md).

API keys stay in session memory unless explicitly saved in Keychain; stored secrets never return to JavaScript or copied API examples. Saved conversations and managed logs remain local; see [Privacy](PRIVACY.md). Automatic updates remain [planned](docs/PLAN.md); discovery and Keychain ship in 0.5.0. The [Abyss and Surface Dive mockups](design/mockups/managed-runtime.html) remain a design reference.

## Storage, discovery, and credentials

Lab 0.5.0 adds Cockpit **Drives** and **Runtime** views. Drives selects a physical storage device and shows decimal read/write MB/s plus a two-minute history, even with Cachalot offline. Rates include all applications on that drive. First samples and unavailable/reset counters show —. Live GLM/DeepSeek validation remains pending; no measured speed or quality claim is made. It also includes **Dive model discovery** and optional **API Keychain credentials**. Scan a chosen folder, create an editable draft, and supply Python/bank paths before saving. API keys remain session-only unless explicitly saved for a local server address; saved keys reconnect after restart and never appear in copied examples. Authenticated saved-key reconnect across restart remains unexercised. See [Discovery and Keychain](docs/DISCOVERY_KEYCHAIN.md). Dive also has refined action spacing, a clear delete-confirmation flow, a labeled launch preview, compact discovery rows, and collapsible runtime output; see [Dive UI](docs/DIVE_UI.md).

GLM launch controls require Cachalot 0.49–0.50: an optional contiguous expert bank and enable switch, prefetch expert count, read limit, and scheduling. Empty fields inherit runtime defaults; bank Off preserves its path while using checkpoint experts. DeepSeek Decode drops misses requires 0.57+ and can change outputs and lower quality; Off selects exact decode. Empty preserves Lab's direct CLI default of exact decode, unlike the 0.60 `serve.sh` default budget 0. System date reuse requires 0.60+, defaults On, and can show the model a date up to seven days old in the leading system message; Off keeps the true date. Changes apply on the next launch. Older profiles keep their defaults and older runtimes ignore unsupported environment controls.

Cockpit shows optional image input and prefetch read/used totals only when reported. GLM/MiniMax expose prediction totals in runtime 0.61.1 and later; older versions show unavailable. Image totals include video steps and resent history and are not a capability or completion signal. Lab media attachments remain planned. Briefs through 0.61.1 and runtime source at 0.61.2 (`954dff8`) were reviewed. Prior native managed MiniMax 0.50.1 testing reached readiness, streamed a short reply, and stopped cleanly; live GLM bank/prefetch and DeepSeek 0.60 tests and sustained performance measurements remain outstanding. See [managed runtime](docs/MANAGED_RUNTIME.md) for compatibility and limits.

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
- [Product direction](docs/PRODUCT_DIRECTION.md), [delivery roadmap](docs/PLAN.md), and [architecture](docs/ARCHITECTURE.md)
- [Rename and compatibility](docs/RENAME.md) and [owner's original mission](docs/mission/2026-10-05-owner-mission.txt)
- [Runtime compatibility workflow](docs/RUNTIME_SYNC.md) and [runtime requests](docs/RUNTIME_REQUESTS.md)
- [Contributing](CONTRIBUTING.md), [privacy](PRIVACY.md), and [license](LICENSE)

## Runtime 0.61.1 compatibility

Briefs 0.61.0 and 0.61.1 were verified against clean runtime commit
`eef2bc5e7ac8fcc21bdefc94b5199007f591e53b` on 2026-10-07. Cockpit's Runtime view
now offers a collapsed **Read and wait evidence** table with optional expert
hits/misses, accounted bytes, reads, heuristic fast reads, summed read time,
busy time, decode wait time, and waited misses. These are runtime totals since
server start, not request latency or physical-drive measurements. Missing,
invalid, unhealthy, and disconnected readings show —; zero remains zero.

The 0.61.0 emulated-drive-bandwidth knob is documented in the runtime contract.
Lab does not set it, and HTTP stats do not report whether it is active. Run
manifests and sweep views remain planned. This compatibility view ships in Lab
0.6.0; no live GLM/DeepSeek performance claim is made.

Final source review also covered runtime 0.61.2 (`954dff83c54071e10aef649ae725dd0afd141528`).
Its follow-up changes measurements, documentation, and package version only;
briefs still end at 0.61.1 and the supported Lab contract is unchanged.
