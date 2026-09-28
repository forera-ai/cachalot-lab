# Cachalot Studio

Native macOS client for the [Cachalot](https://github.com/prooshani/cachalot) local inference server. The first release connects to an existing server on this Mac and provides live health, cache telemetry, streaming chat, and API connection details.

## Install

Requires Apple Silicon and macOS 14 or newer. Open the signed, notarized `Cachalot-Studio-0.1.0-macOS-arm64.dmg`, drag **Cachalot Studio** into **Applications**, then launch it. The release ZIP contains the same notarized app. Source builds and release verification are described in [docs/RELEASE.md](docs/RELEASE.md).

Studio is a client: it does not install model weights, Python, or the Cachalot runtime. Start a local Cachalot server first, for example with a model and environment prepared according to the [runtime documentation](https://github.com/prooshani/cachalot):

```sh
python -m cachalot.cli serve --model /path/to/your/model --port 8011
```

Studio tries `http://127.0.0.1:8011` at launch. Use the **API** screen to connect to another loopback port or supply a server API key. The **Chat** screen streams responses and optional reasoning. **Cockpit** shows values reported by the server. Chats stay in app memory for the current session; the last endpoint is saved locally, while API keys are not saved.

The 0.1.0 installer is arm64 only. Runtime launching, profile management, checkpoint discovery, logs, and automatic updates are planned for later releases. These controls are not shown in this release.

## Develop

Requires Node.js 22, pnpm, a stable Rust toolchain, and Xcode command line tools.

```sh
pnpm install
pnpm tauri dev
```

`pnpm dev` opens a browser preview; local server access and machine data require the native app. The [mock runtime](mock-runtime/README.md) provides a model-free development server.

Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. In `src-tauri/`, run `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, and `cargo test`.

## Privacy

Studio connects only to loopback HTTP addresses. Telemetry and conversations stay on this Mac. Studio has no analytics, accounts, or cloud relay. See [PRIVACY.md](PRIVACY.md).
