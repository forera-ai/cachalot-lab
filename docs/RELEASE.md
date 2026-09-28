# macOS release

## Scope

The 0.1.0 release is a local client for a separately installed Cachalot runtime. The macOS artifact targets Apple Silicon. The installer does not include Python, checkpoints, or an update service.

## One-time signing setup

Releases require a valid **Developer ID Application** certificate, Xcode command line tools, and an Apple notarization Keychain profile. The current maintainer Mac already has the StageBeacon signing identity for team `ZKC68BDK5F` and a working `stagebeacon-notary` profile. The release script uses those by default; it never stores Apple credentials in the repository.

On another Mac, import the Developer ID Application certificate and create a notarytool profile using Apple's documented Keychain flow. Set `CACHALOT_TEAM_ID`, `CACHALOT_SIGNING_IDENTITY`, and `CACHALOT_NOTARY_PROFILE` if the identity or profile names differ.

## Build and verify

From a committed, clean checkout with version `0.1.0` in both `package.json` and `src-tauri/tauri.conf.json`:

```sh
./scripts/release/build-release.sh 0.1.0
```

The script runs frontend and Rust checks, builds a Developer ID signed app with Hardened Runtime and secure timestamp, submits it to Apple, staples and verifies it, and packages a branded drag-to-Applications DMG. It then signs, notarizes, staples, and verifies the DMG. Outputs are under `.release/0.1.0/`:

- `Cachalot-Studio-0.1.0-macOS-arm64.dmg` for direct distribution.
- `Cachalot-Studio-0.1.0-macOS-arm64.zip` containing the notarized app.
- `SHA256SUMS`, notarization receipts, and `SOURCE_COMMIT`.

The script refuses an existing output directory to prevent accidental overwrite. Before publication, mount the DMG, confirm the drag-to-Applications layout and the installed app, and compare its SHA-256 hash to `SHA256SUMS`. Publishing the artifacts and creating a Git tag are separate maintainer actions.
