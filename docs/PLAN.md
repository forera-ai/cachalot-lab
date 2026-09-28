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

- 0.2.0: profile schema and compiler, supervision, Dive, Logs, Doctor.
- 0.3.0: richer chat controls. Local saved conversations were brought forward after 0.1.0 and are currently unreleased.
- 0.4.0: expanded telemetry, silent running, measured performance.
- 0.5.0: model discovery and Keychain credential storage.
- 0.6.0: signed Studio and managed runtime updates with rollback.
- 0.7.0: menu bar, accessibility, onboarding.
- 1.0.0: reviewed release candidate.

## Gates

The owner-selected graphic mark anchors tokens and screen design. The foundation shell follows the owner's updated priority. The owner authorized signing and notarization on 2026-09-28 and GitHub publication on 2026-09-29. Real model performance claims require measured results.
