<p align="center">
  <img src="assets/logo/cachalot-mark.svg" width="104" height="104" alt="Cachalot Lab mark">
</p>

# Cachalot Lab

Owned and maintained by [Forera AI](https://github.com/forera-ai). The canonical repository is [forera-ai/cachalot-lab](https://github.com/forera-ai/cachalot-lab).

Copyright (c) 2026 forera.ai and contributors. Licensed under the [MIT License](LICENSE).

<p align="center">An inference observability and experimentation environment for <a href="https://github.com/forera-ai/cachalot">Cachalot</a> on macOS.</p>

[![Release](https://img.shields.io/github/v/release/forera-ai/cachalot-lab)](https://github.com/forera-ai/cachalot-lab/releases/latest)
[![CI](https://github.com/forera-ai/cachalot-lab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/forera-ai/cachalot-lab/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Cachalot Lab** is the new name of Cachalot Studio. Its governing goal is to make invisible inference behavior visible: explain time, concurrency, resource activity, data movement, and experimental tradeoffs. Cachalot remains the inference engine; Lab is the human-facing instrument panel. See [product direction](docs/PRODUCT_DIRECTION.md), [delivery roadmap](docs/PLAN.md), and [rename compatibility](docs/RENAME.md).

The existing app launches or connects to local Cachalot, inspects live health and cache metrics, streams chat and reasoning, and provides API details. Token profiling, durable experiment comparisons, sweeps, energy analysis, and validated counterfactuals are planned capabilities, not features of the 0.7.0 binary. Connections remain limited to the same Mac.

## The app in use — 0.7.1

Fresh native captures show the refined panels at 1380 × 860 logical pixels, in
System-dark/Abyss and Surface. The runtime was unavailable during these captures;
saved conversations, profiles, and earlier managed logs remain readable. Host activity
is whole-Mac context, not model-specific inference. Unavailable values remain —.
These images document layout and observed state, not performance benchmarks.

**Chat** fills the workspace, with history beside the transcript and an anchored composer.

![Cachalot Lab 0.7.1 full-panel Chat with a preserved saved conversation](assets/screenshots/v0.7.1/chat.png)

**Settings** places appearance and motion side by side, with every option visible.

![Cachalot Lab 0.7.1 Settings with compact appearance and motion panels](assets/screenshots/v0.7.1/settings.png)

<details>
<summary>Cockpit, runtime evidence, Dive, API, Doctor, and Logs</summary>

![Cockpit keeps whole-Mac telemetry available while runtime measurements are unavailable](assets/screenshots/v0.7.1/cockpit.png)

![Paired runtime read and wait counters preserve unknowns while offline](assets/screenshots/v0.7.1/runtime-evidence.png)

![Dive pairs saved profiles with details and optional discovery](assets/screenshots/v0.7.1/dive.png)

![API connection setup beside client examples, with the unavailable server reported](assets/screenshots/v0.7.1/api.png)

![Doctor separates machine basics from connection and managed-process checks](assets/screenshots/v0.7.1/doctor.png)

![Logs contains scrolling inside the historical managed-runtime output](assets/screenshots/v0.7.1/logs.png)

</details>

<details>
<summary>Surface appearance</summary>

![Cachalot Lab 0.7.1 Chat in Surface appearance](assets/screenshots/v0.7.1/chat-surface.png)

![Cachalot Lab 0.7.1 Settings in Surface appearance](assets/screenshots/v0.7.1/settings-surface.png)

</details>

<details>
<summary>Original owner screenshots from 0.7.0</summary>

### Historical owner captures — 0.7.0

These owner-provided screenshots show the released macOS app connected to a real local
GLM server. They capture this stage of development before the panel-layout improvements
in the current local build. Values are observations from that session, not benchmark results.
Unavailable readings remain —; whole-Mac and whole-drive activity are not inference-only
measurements. The saved MiniMax chat/profile and connected GLM server are separate sources.

![Cachalot Lab 0.7.0 Cockpit with physical-drive histories and Mac telemetry](assets/screenshots/v0.7.0/cockpit-drives.png)

<details>
<summary>Runtime evidence, Chat, Dive, API, and Doctor</summary>

**Runtime telemetry** keeps expert reuse and runtime counters separate from physical-drive
traffic. The expanded read/wait evidence reports cumulative counters with their original scope.

![Cockpit Runtime view with expert and prefetch evidence](assets/screenshots/v0.7.0/cockpit-runtime.png)

![Expanded cumulative runtime read and wait counters](assets/screenshots/v0.7.0/read-wait-evidence.png)

**Chat** preserves each conversation's original endpoint and model. A saved MiniMax reply
remains readable while GLM is connected; continuing it requires its original source.

![Saved MiniMax conversation while connected to GLM](assets/screenshots/v0.7.0/chat.png)

**Dive** separates saved launch intent from the externally running server and offers local
model discovery. **API** connects clients to the local endpoint. **Doctor** distinguishes
host readiness, connection health, and Lab-owned process state.

![Dive with a saved MiniMax launch profile and local discovery](assets/screenshots/v0.7.0/dive.png)

![API connection controls for the local GLM server](assets/screenshots/v0.7.0/api.png)

![Doctor with hardware and runtime checks](assets/screenshots/v0.7.0/doctor.png)

</details>

</details>

## Download

**Current release:** [Cachalot Lab 0.7.1](https://github.com/forera-ai/cachalot-lab/releases/tag/v0.7.1) for Apple Silicon, macOS 14 or newer. This patch improves panel layouts and Surface contrast, retaining skipped-expert evidence and explicit GLM decode miss-budget controls. Existing profiles, conversations, preferences, and credential namespaces are preserved.

1. Download the signed and notarized [DMG](https://github.com/forera-ai/cachalot-lab/releases/download/v0.7.1/Cachalot-Lab-0.7.1-macOS-arm64.dmg).
2. Open it and drag **Cachalot Lab** into **Applications**.
3. Open Lab. It first tries an existing Cachalot server at `http://127.0.0.1:8011`.
4. Use **Dive** to launch a local runtime, or enter another loopback port and optional API key in **API**.

The release also includes a [ZIP](https://github.com/forera-ai/cachalot-lab/releases/download/v0.7.1/Cachalot-Lab-0.7.1-macOS-arm64.zip) and [SHA-256 checksums](https://github.com/forera-ai/cachalot-lab/releases/download/v0.7.1/SHA256SUMS). The [release notes](https://github.com/forera-ai/cachalot-lab/releases/tag/v0.7.1) state the exact scope and verification.

Lab does not install Cachalot, Python, or model weights. Prepare a model and environment using the [runtime documentation](https://github.com/forera-ai/cachalot). Dive needs the absolute path to a Python interpreter with Cachalot installed, the model directory, and any separate expert bank. You can also start the server yourself:

```sh
python -m cachalot.cli serve --model /path/to/your/model --port 8011
```

## What 0.7.1 includes

0.7.0 adds skipped-expert evidence and explicit GLM decode miss-budget controls to the collapsed runtime read/wait evidence table introduced in 0.6.0. It retains the Cachalot Lab name. It retains physical-drive read/write telemetry, local model discovery, optional macOS Keychain credentials, and a refined Dive interface. It retains GLM/DeepSeek launch controls, runtime totals, Silent running, chat settings, and managed runtime capabilities.

- **Cockpit:** physical-drive selection and read/write MB/s histories, with separate Drives and Runtime views; a compact dashboard with two-minute decode-speed, expert-hit, SSD-read, and resident-expert traces; whole-Mac CPU, GPU, and memory graphs; and macOS hardware details. Optional image-input and prefetch totals preserve zero; missing metrics remain unavailable.
- **Chat:** streaming responses, optional reasoning, generation stop, and saved local conversations bound to their original endpoint and model. Generation settings persist per chat; an empty temperature uses the server default.
- **Dive:** bounded local model discovery, editable unsaved drafts, aligned controls, deletion confirmation, labeled previews, collapsible logs; versioned launch profiles, fixed-argument preview, one Lab-owned runtime at a time, readiness checks, automatic connection, and GLM, DeepSeek, and MiniMax family-specific controls.
- **API:** local endpoint, optional session API key or explicitly saved macOS Keychain credential, and copy-ready curl, Python OpenAI SDK, and JavaScript OpenAI SDK examples.
- **Doctor and Logs:** connection checks, managed startup state, and a bounded tail of the managed process's private log.
- **Navigation:** Abyss, Surface, or system appearance and a `⌘K` command palette. Settings includes Silent running, which pauses traces and transitions while live readings and generation continue.

Lab polls runtime stats at 1 Hz while visible and 0.2 Hz while hidden. Whole-Mac graphs describe the host, not model-specific utilization. The telemetry strip remains visible on screens other than Cockpit while connected.

Managed profiles can set the served model ID, default response length and temperature, and an optional persistent prefix-snapshot directory. Omitted fields inherit the installed runtime's defaults. Lab starts only the process it owns and stops it on normal app exit. After an abrupt exit, an occupied port blocks a new launch; stop the earlier process yourself or choose another port. Lab does not attach to or terminate an unknown process. See [managed runtime](docs/MANAGED_RUNTIME.md).

MiniMax's decode and prefill miss substitution can change outputs. Dive provides explicit overrides; for an external server, the active numerics mode remains unreported because Cachalot does not expose it in `/v1/stats`. Runtime 0.46 added an incrementing-list loop guard; 0.47 set the MiniMax launch script's temperature default to 0.7. Lab launches the CLI directly, so an empty managed temperature still inherits the CLI's 0.6 default. The brief series through 0.61.1 and runtime source at 0.61.2 (`954dff83c54071e10aef649ae725dd0afd141528`) were reviewed for the 0.6.0 release. The latest native managed MiniMax smoke test used 0.50.1. See [runtime compatibility](docs/RUNTIME_SYNC.md).

API keys stay in session memory unless explicitly saved in Keychain; stored secrets never return to JavaScript or copied API examples. Saved conversations and managed logs remain local; see [Privacy](PRIVACY.md). Automatic updates remain [planned](docs/PLAN.md); discovery and Keychain ship in 0.5.0. The [Abyss and Surface Dive mockups](design/mockups/managed-runtime.html) remain a design reference.

## Panel layout in 0.7.1

0.7.1 fills Chat’s panel with an anchored composer and independently scrolling history. Settings and Doctor use compact columns; API places setup beside examples; Logs keeps scrolling inside its output. Dive places profiles beside details, with discovery and optional settings expanded on demand. All seven default panels fit the normal native window in both themes; offline browser preview also fits 1100 × 720. Connected native layout at that exact minimum remains unverified. Expanded detail and long collections remain scrollable. The current gallery shows 0.7.1; original owner captures remain under their historical 0.7.0 label.

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

## Runtime 0.62.14 compatibility (Lab 0.7.0)

Briefs through 0.62.20 were reviewed against Cachalot 0.62.22 (`5faababa6bc098400147611d3ffd11cd00e3100d`). Lab 0.7.0 adds skipped-expert evidence in Cockpit and an explicit GLM decode miss budget in Dive. Empty or -1 disables that budget; 0–288 caps non-resident reads per decode layer, changes outputs, and may lower quality. Settings apply on next launch; active server mode stays unknown. Missing counters remain unavailable, zero does not prove exact outputs, and positive totals qualify cache hit rate. Lab's direct CLI retains prefetch default 5; the runtime script now defaults to 0 and can auto-select an owner-specific bank. Since 0.62.20, the GLM shell script also defaults to decode miss budget 2, which changes outputs. Lab’s direct CLI empty budget remains off; Lab does not silently adopt those script defaults. Routing-trace formats are documented; a viewer remains planned. These backward-compatible capabilities ship in 0.7.0; live miss-budget inference and output quality remain unverified. See [runtime sync](docs/RUNTIME_SYNC.md).
