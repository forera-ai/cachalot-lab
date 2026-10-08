# Changelog

## [Unreleased]

## [0.7.0] - 2026-10-08

This backward-compatible minor release adds skipped-expert evidence and an explicit GLM decode miss-budget control. Existing profiles, conversations, app/credential identities and direct CLI defaults are preserved.

- Review runtime briefs through 0.62.14 against clean 0.62.18 (`2c319ec`). Record script-only GLM bank/prefetch defaults, family-specific routing-trace formats, and MiniMax bank read-emulation coverage.
- Show optional skipped-expert totals in Cockpit read/wait evidence and qualify positive drops beside cache hit rate. Preserve missing, invalid, zero and offline values; zero is not proof of exact outputs.
- Add an explicit GLM-only decode miss budget for next launch, with output-changing warnings, family/range validation, inherited-key isolation, older-profile fallback, and save/reopen coverage. Existing prefetch and bank choices retain direct CLI behavior.

- Document the repository transfer to `forera-ai/cachalot-lab` and Forera AI ownership. Update active repository, release, CI, and runtime links and persistent agent project references. This documentation-only change does not alter the 0.6.0 app or its compatibility identities.
- Update the copyright notice to `Copyright (c) 2026 forera.ai and contributors` at the owner's request; retain the MIT license terms.

Validation: local preparation passed 47 frontend tests, 32 normal Rust tests and six mock tests, types/lint/format/clippy, signed production builds and native zero/positive-drop/form inspection. The exact-source release report records fresh signed/notarized artifacts and release checks. Live miss-budget inference, output quality, sustained performance, instrumentation overhead and authenticated saved-key restart remain unverified.

## [0.6.0] - 2026-10-07

This backward-compatible minor release adds runtime read/wait evidence and ships the Cachalot Lab rename. The new telemetry view is an additive capability; existing data formats, bundle identity, credentials, inference workflows, and launch defaults are preserved.

- Review runtime 0.61.0/0.61.1 briefs against `eef2bc5`. Record optional emulated-drive bandwidth and GLM/MiniMax telemetry parity without changing launch settings. Review the 0.61.2 follow-up (`954dff8`), which changes measurements/docs/version only.
- Add a collapsed Cockpit Runtime read/wait evidence table with independently validated counts, bytes, and seconds; preserve missing values and label overlapping durations, heuristic fast reads, and unknown throttle state. No derived latency percentage, busy rate, or critical path is claimed.
- Extend synthetic mock telemetry and compatibility tests for the new fields, older/partial responses, invalid values, zero, and disconnects.

- Rename the product to **Cachalot Lab** across the local app, packages, installer tooling, active documentation, and development guidance. Preserve established data/credential identifiers and historical release records; see `docs/RENAME.md`.
- Adopt the owner's inference observability, profiling, and experimentation mission. Replace speculative version-based milestones with evidence-led phases, explicit runtime dependencies, preservation requirements, and acceptance criteria. These planning changes do not implement the proposed research features.

Validation: release preparation passed 46 frontend tests and six mock-runtime tests, TypeScript/lint/format checks, a signed local build, and native telemetry/disclosure/partial-response inspection. The exact-source release report records fresh Rust checks, signed/notarized packaging, and installed-app verification. Live GLM/DeepSeek inference, saved-key restart, and sustained performance/overhead remain unverified.

Versions below were published under the **Cachalot Studio** name. Their artifact names, hashes, and historical claims remain unchanged.

## [0.5.0] - 2026-10-05

This backward-compatible minor release adds physical-drive telemetry, local model discovery, optional macOS Keychain credentials, and a refined Dive interface. Existing profiles and conversations keep their format and defaults.

- Add Cockpit Drives/Runtime storage views, physical-drive selection, decimal read/write MB/s, and two-minute histories. Rates cover all applications on the selected drive and work while Cachalot is offline. First samples, unavailable/reset counters, sampling failures, and long gaps show unavailable; disconnected selected drives do not silently switch.
- Add bounded metadata discovery for DeepSeek V4.1, GLM 5 Next, and MiniMax M3. A chosen folder is scanned within explicit depth/count/size limits; results create editable unsaved drafts, without downloads, runtime launches, or complete-checkpoint claims.
- Add explicit optional Keychain save/replace/forget for API credentials, bound to the normalized loopback origin and port. Typed session keys override saved keys; startup can use saved credentials, while managed auto-connect does not. Stored secrets never return to JavaScript or copied examples. Disable runtime HTTP redirects. Settings accurately describes optional persistence.
- Refine Dive action alignment, destructive-action confirmation, state display, forms, discovery rows, theme contrast, and collapsible output. Add labeled, dismissible, bounded launch previews. Discard stale preview responses and prevent one profile's controls from stopping another profile's runtime.
- Review runtime briefs through 0.60.0 against clean Cachalot 0.60.1 commit `9d11bc061dcb434c40494be3d507521194d376dc`; the follow-up changes measurement tooling/docs/version only.

Validation: 45 frontend tests, 31 normal Rust tests, isolated real macOS Keychain CRUD, native SSD/discovery/Dive inspection, types/lint/format/clippy, and signed local builds passed before release preparation. The release verification report records fresh exact-source checks and artifact verification. Live GLM/DeepSeek launch/generation/stop validation, authenticated saved-key reconnect across restart, physical unplug testing, and sustained performance remain unverified. SSD counters are not a speed benchmark or per-model I/O measurement.

## [0.4.0] - 2026-10-05

This backward-compatible minor release adds family-specific launch capabilities, optional runtime totals, and a saved visual quiet preference. Existing profiles, conversations, and preferences retain their defaults.

- Add GLM contiguous expert bank path and enable switch (Cachalot 0.49+), plus prefetch expert count, read limit, and scheduling controls (0.50+). Validate paths, counts, and family; check enabled banks contain `bank.json`. Off retains a saved bank path while using checkpoint experts.
- Add DeepSeek Decode drops misses (0.57+) and System date reuse (0.60+) switches with output-quality and stale-date warnings. Empty preserves direct CLI defaults: exact decode, date reuse On on 0.60+. Off selects exact decode with budget -1. Distinguish Studio's CLI launch from the 0.60 `serve.sh` default of budget 0. Remove inherited controlled environment keys before applying profile overrides, including the date window so the shown seven-day cost remains accurate.
- Add Cockpit prefetch read/used and image input totals from reported runtime fields. Preserve zero; show unavailable for missing, malformed, unhealthy, or offline snapshots. Image inputs include video steps and resent history and do not establish vision capability or successful replies. GLM/MiniMax still omit prediction totals in the reviewed HTTP source.
- Add saved Silent running in Settings: pause Cockpit trace rendering and remove interface transitions while readings, sampling, connection checks, and runtime generation continue. Default Off preserves existing behavior.
- Review runtime briefs through Cachalot 0.60.0 at `62c0f053576c191ac56893449932d175abf86537`; record video, wired governor, script budget, measurement-only tracing, chunk pins, and date reuse contracts. Update mock fixtures and compatibility tests.

Validation: 35 frontend tests, 27 Rust tests, 5 Python mock tests, TypeScript, production build, lint, formatting, and clippy passed in local preflight. Native profile save/reopen/preview, Cockpit totals, and silent-running behavior were inspected in installed local builds. Live MiniMax 0.50.1 readiness, streamed reply, and clean stop were verified in prior integration work. Live GLM bank/prefetch and DeepSeek 0.60 controls, media attachments, and sustained performance measurements remain unverified or planned. No performance gain or output-quality magnitude is promised.

## [0.3.0] - 2026-09-30

This backward-compatible minor release adds per-conversation generation controls and Cachalot 0.46–0.47 launch compatibility.

- Save Thinking, maximum output tokens, and optional temperature with each conversation. Existing conversation files load with previous defaults; an empty temperature leaves the server default in control.
- Expose Cachalot 0.46's incrementing-list loop guard for managed GLM and MiniMax profiles. Omitted values inherit runtime default 64; 0 disables it. Record the new raw log pattern without inferring per-request warnings from text logs.
- Start newly selected MiniMax profiles at temperature 0.7, matching the Cachalot 0.47 MiniMax launch script. Existing profiles retain their saved value or the direct CLI default when empty.
- Review runtime 0.47.0 source and briefs. HTTP routes and stats fields are unchanged.

## [0.2.1] - 2026-09-29

This backward-compatible patch fixes host memory sampling on macOS versions that return fewer Mach VM fields than the current SDK declares. The calculation still uses active, wired, and compressed pages. Machine icon tests now use a local fixture and bundled icon so CI does not depend on model artwork installed on the runner.

## [0.2.0] - 2026-09-29

This backward-compatible minor release adds managed local runtimes, saved conversations, and expanded telemetry. It keeps the 0.1.0 loopback client contract.

- Read the displayed Studio version from the package manifest so the sidebar matches the installed release.

- Let managed profiles set the served model ID, default response length and temperature, and an optional persistent prefix-snapshot directory. Existing profiles inherit runtime defaults.
- Review Cachalot 0.45.1: its measured MiniMax prefill kernels are benchmark artifacts, with no new server contract.
- Expose Cachalot 0.45.0's adaptive MiniMax mirror-share override and expert bank/mirror paths in managed profiles; record its new log line without inventing a live Cockpit metric. Clarify recovery when a previous server still holds the launch port.
- Keep Studio's connection form and new managed profiles on the configured local port 8011; show that default and offer a one-click reset when an older address is saved.
- Support Cachalot 0.44.0's MiniMax host-memory quiet and shrink intervals in managed profiles, and document the revised snapshot and memory-fit behavior.
- Show the matching macOS system device icon in Cockpit’s “This Mac” card, including the front-facing Mac Studio artwork and model-specific icons where available.
- Add Dive profile editing, launch preview, managed start/stop, readiness checks, automatic connection, live Logs, and managed status in Doctor. Managed process output stays local and the UI reads a bounded log tail.
- Record Cachalot 0.43.2's cut-reply log pattern and corrected startup version for future managed-runtime Logs support; current Studio behavior is unchanged.
- Document the standing rule that every pushed implementation commit ships with updated documentation, a major/minor/patch Studio version bump appropriate to the changes, verified release artifacts, and a matching GitHub Release.
- Sync the runtime contract with Cachalot 0.43.1: record versioned MiniMax miss-substitution defaults, loop guard, decode-cache and spill knobs; add validated managed-profile environment overrides and an explicit unknown-output-mode label for connected servers.
- Redesign Cockpit as a compact telemetry dashboard with rolling model and whole-Mac graphs, accurate Mac hardware details, and explicit unavailable states for unsupported metrics.
- Fit the full Cockpit in the normal window without page scrolling; connected telemetry appears in the dashboard and in the strip on other screens.
- Add native launch-profile storage, fixed-argument command preview, and single-child process supervision groundwork.
- Keep the connected model, state, decode speed, expert hit rate, and SSD read rate visible in a persistent telemetry strip. Poll runtime stats at 1 Hz while visible and 0.2 Hz while hidden without overlapping scheduled polls.
- Save conversations in Studio's local app data, reopen them after restart, and keep chats bound to their original endpoint and model. Add in-app deletion and a saved-chat list.
- Repository documentation, contribution guidance, and runtime compatibility workflow for ongoing development.
- Copy-ready curl, Python OpenAI SDK, and JavaScript OpenAI SDK chat completion examples using the connected endpoint and model, with safe quoting and optional API key instructions.

## [0.1.0] - 2026-09-29

- Native Apple Silicon macOS app with Cockpit, Chat, API, Doctor, Settings, and command palette.
- Local Cachalot connection with optional API key, health checks, live runtime metrics, streaming responses, reasoning display, and generation stop.
- Owner-approved graphic mark, theme variants, app icon, and Abyss/Surface appearance.
- Signed and notarized drag-to-Applications release workflow, mock runtime, tests, and CI checks.
