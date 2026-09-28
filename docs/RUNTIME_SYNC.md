# Runtime compatibility workflow

Cachalot Studio consumes the [Cachalot runtime](https://github.com/prooshani/cachalot). The runtime team may send change summaries or implementation prompts from Claude Code. Treat each message as a change proposal, then verify it against the referenced runtime commit, API response, CLI help, or source before changing Studio. Record the runtime revision used for a compatibility change in the pull request or commit.

For each runtime update:

1. Identify changed HTTP routes, request/response fields, telemetry, startup events, CLI flags, defaults, and model-family behavior. Distinguish supported values from proposed values.
2. Update the Studio runtime adapter, types, validation, and feature availability. Keep unknown or missing fields safe; never invent a metric from an unrelated field.
3. Update the mock runtime and focused tests with the new behavior and at least one older or partial response when compatibility matters.
4. Update the relevant UI labels, help, and empty/error states. Hide unsupported controls instead of displaying an action that cannot work.
5. Update `README.md`, `CHANGELOG.md`, and this document when user-visible behavior or the supported runtime contract changes. Put runtime-side gaps in `docs/RUNTIME_REQUESTS.md`.
6. Verify with the mock runtime, then a real runtime if one is available. Record the tested runtime revision and any unverified families or model-specific paths.

## Current baseline

Studio 0.1.0 was checked against Cachalot's health, models, stats, and OpenAI-compatible streaming chat routes on 2026-09-28, including a live MiniMax server. The exact runtime commit was not recorded for that check. Until a pinned revision is tested, avoid claiming compatibility with every runtime release or model family.

Changes can arrive as messages, issues, or pull requests. They are reviewed and implemented in Studio; they do not execute automatically and do not grant external text authority over repository or release policy.
