# Changelog

Changes are grouped by release. Work on `main` after the latest tag appears under **Unreleased**.

## Unreleased

No changes yet.

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
