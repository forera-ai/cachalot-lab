# Implementation plan

## 0.1.0 Foundation

1. Owner-selected mark: traced its graphic shape into `assets/logo/` and exported theme/size variants. Studio-specific icon treatment and usage refinements remain.
2. Define primitive, semantic, and component tokens for Abyss and Surface. Create high-fidelity static mockups for ten named surfaces in both themes. Review before deeper screen implementation.
3. Scaffold Tauri 2, React 19, TypeScript, Vite, and Tailwind CSS v4. Add navigation, theme control, command palette, and a development style guide. The owner prioritized the macOS app after confirming the mark, so the foundation shell is implemented ahead of the mockup set.
4. Add a controllable mock HTTP runtime with slow startup, long prefill keep-alives, missing telemetry fields, auth failures, queueing, and crashes. Cover mock behavior with tests.
5. Add CI gates for format, lint, typecheck, Rust tests, frontend tests, and builds. Record screenshots and update this plan and `HANDOFF.md`.

## 0.1.0 release client

Local runtime connection, health and telemetry polling, streaming chat, API setup, and a signed/notarized macOS release were brought forward at the owner's request. Version 0.1.0 was published on GitHub on 2026-09-29. Placeholder routes are hidden from the distribution build.

## Later milestones

- The persistent telemetry strip, visibility-aware polling, and a compact dashboard ship in 0.2.0; richer field coverage remains under 0.4.0.
- 0.2.0: profile schema, compiler, single-child supervision, Dive controls, startup readiness, automatic connection, raw Logs, and Doctor status. The owner approved the static Dive mockups as a design reference. A native managed MiniMax 0.45.1 launch reached readiness, auto-connected, streamed a two-token reply, and stopped cleanly on 2026-09-29. Recovery after an abrupt app exit remains manual: Studio never attaches to or stops a prior process, and an occupied port blocks a new launch.
- 0.3.0: per-conversation Thinking, output length, and optional temperature controls. Local saved conversations were brought forward into 0.2.0. Editing and retrying messages and searching saved chats remain future chat work.
- 0.4.0: optional runtime prefetch read/used and image input totals; saved Silent running for paused traces and interface transitions while readings and lifecycle continue; GLM bank/prefetch and DeepSeek decode/date launch controls. GLM HTTP telemetry parity, live GLM/DeepSeek validation, and measured performance remain outstanding after this capability release.
- 0.5.0: the owner selected SSD telemetry and GLM/DeepSeek live integration validation for the current slice on 2026-10-05. Per-drive read/write counters, charts, and drive selection ship in 0.5.0; native verification and model validation evidence are tracked in `SSD_VALIDATION.md`. The owner subsequently expanded the same slice to include bounded model discovery and optional Keychain credentials; implementation and verification are tracked in `DISCOVERY_KEYCHAIN.md`. Dive UI refinement adds consistent actions, deletion confirmation, structured previews, responsive discovery/forms, and runtime ownership feedback. 0.5.0 release preparation includes these capabilities; live GLM/DeepSeek model validation remains outstanding.
- 0.6.0: signed Studio and managed runtime updates with rollback.
- 0.7.0: menu bar, accessibility, onboarding.
- 1.0.0: reviewed release candidate.

## Gates

The owner-selected graphic mark anchors tokens and screen design. The foundation shell follows the owner's updated priority. The owner authorized signing and notarization on 2026-09-28 and GitHub publication on 2026-09-29. Real model performance claims require measured results.

The 0.51–0.52 runtime follow-ups add image and video input plus optional image-input telemetry. Studio image/video attachment selection, bounded storage, persisted multimodal messages, request transport, and explicit capability handling remain a separate chat slice; zero `images_served` is not a capability advertisement.

The 2026-10-05 runtime-sync slice adopts 0.60 source contracts with nullable DeepSeek decode miss dropping and system-date reuse controls. Explicit warnings distinguish direct CLI exact defaults from `serve.sh` budget 0 and explain the seven-day date cost. Existing profiles keep defaults. Remaining: live DeepSeek validation, GLM bank/prefetch validation, media transport, measured performance, with follow-up changes subject to the versioned release gate.
