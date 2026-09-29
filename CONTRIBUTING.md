# Contributing

Thanks for helping improve Cachalot Studio. Open an issue for a bug or proposed feature before starting a large change.

## Local setup

Use an Apple Silicon Mac with macOS 14 or newer, Node.js 22, pnpm 10, stable Rust, and Xcode command line tools.

```sh
pnpm install --frozen-lockfile
pnpm tauri dev
```

The [mock runtime](mock-runtime/README.md) supports UI development without model weights. The browser preview does not expose all native capabilities.

## Before a pull request

Run the checks in [README.md](README.md#develop). Add focused tests for changed behavior. Keep TypeScript strict and Rust free of Clippy warnings. Use conventional commits such as `feat:`, `fix:`, and `docs:`.

Update `README.md` when installation, supported behavior, or requirements change. Add a user-facing entry under **Unreleased** in `CHANGELOG.md` for each behavior change; release work moves those entries to a dated version. Update [runtime compatibility notes](docs/RUNTIME_SYNC.md) when a Cachalot API or option changes.

Before pushing an implementation commit, follow the [release gate](docs/RELEASE.md#required-for-every-pushed-implementation): update affected docs, choose a major/minor/patch bump based on the shipped changes, build and verify fresh artifacts, then publish and verify the matching GitHub Release. Documentation-only edits do not need a binary release.

Do not commit API keys, model files, snapshots, Apple signing credentials, or notarization profiles. Release artifacts live in GitHub Releases, not in Git history.
