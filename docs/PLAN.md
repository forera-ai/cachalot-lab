# Implementation plan

## 0.1.0 Foundation

1. Select one of three vector brand directions. Finalize runtime and Studio marks, icon exports, wordmarks, and usage rules.
2. Define primitive, semantic, and component tokens for Abyss and Surface. Create high-fidelity static mockups for ten named surfaces in both themes. Review before screen implementation.
3. Scaffold Tauri 2, React 19, TypeScript, Vite, and Tailwind CSS v4. Add navigation, theme control, command palette, and a development style guide.
4. Add a controllable mock HTTP runtime with slow startup, long prefill keep-alives, missing telemetry fields, auth failures, queueing, and crashes. Cover mock behavior with tests.
5. Add CI gates for format, lint, typecheck, Rust tests, frontend tests, and builds. Record screenshots and update this plan and `HANDOFF.md`.

## Later milestones

- 0.2.0: profile schema and compiler, supervision, Dive, Logs, Doctor.
- 0.3.0: local conversations and streaming chat.
- 0.4.0: cockpit, telemetry, silent running, measured performance.
- 0.5.0: API snippets, model discovery, Keychain.
- 0.6.0: signed Studio and managed runtime updates with rollback.
- 0.7.0: menu bar, accessibility, onboarding.
- 1.0.0: reviewed release candidate.

## Gates

Brand selection precedes tokens and screen design. Mockup review precedes screen implementation. Signing and remote publication need owner approval. Real model performance claims require measured results.
