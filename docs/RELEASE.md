# macOS release

## Required for every pushed implementation

An implementation commit pushed to the Studio GitHub repository is a release
event. Complete the following in one workflow; do not leave pushed code ahead of
its versioned GitHub Release.

1. Review the implementation and update `CHANGELOG.md`, `README.md`,
   `HANDOFF.md`, and every other document affected by its behavior, runtime
   contract, requirements, architecture, plan, or limitations. Move the
   unreleased notes into a dated version section. Update the download and feature
   descriptions in the README for the new release.
2. Compare with the latest published Studio release and choose the next version
   for the depth of the changes: **major** for a breaking public contract or
   major product milestone, **minor** for a new backward-compatible capability,
   or **patch** for a backward-compatible fix or polish. Use the highest level
   required by any included change. Record the reason in release notes. Never
   reuse a version for a different source commit; corrected artifacts from the
   same commit may replace assets on that release. Bump the same version in
   `package.json`, `src-tauri/tauri.conf.json`, and
   `src-tauri/Cargo.toml`; update `src-tauri/Cargo.lock` and any other lockfile
   changed by the package manager.
   Commit code, tests, version, and documentation together.
3. From that clean commit, run `scripts/release/build-release.sh <version>` and
   verify the fresh signed and notarized app, DMG, ZIP, checksums, notarization
   receipts, source-commit record, and release verification report. Check the
   mounted DMG and the app installed from it.
4. Push the commit and an annotated `v<version>` tag. Create the matching GitHub
   Release, or update it if publishing corrected artifacts from the same exact
   commit. Attach the new DMG, ZIP, `SHA256SUMS`, `SOURCE_COMMIT`, notarization
   receipts, and verification report. Replace stale assets when updating a
   release. Release notes must describe the shipped features, requirements, and
   known limits.
5. Compare published asset hashes with `SHA256SUMS`, confirm the release is
   public, and check CI. Record the planned release URL in `HANDOFF.md` before
   committing; record the exact source commit in `SOURCE_COMMIT` and the release
   verification report. Add a documentation-only follow-up if `HANDOFF.md`
   needs a post-publication correction.
6. Install the newly published app locally from that release's verified DMG,
   launch it, and confirm the installed bundle's version and behavior match the
   release. Keep the local installation on the latest released version after
   every future release.

If the release cannot be built, notarized, published, or verified, keep the
implementation local and report the blocker before pushing an implementation
commit. A documentation-only edit does not itself require a new binary release.

For local implementation testing before publication, build the current checkout,
install it at `/Applications/Cachalot Studio.app`, preserve the prior installed
bundle for rollback, and verify the installed executable matches the fresh build.
This local test installation does not make an uncommitted build a release.

## Scope

The [0.4.0 release](https://github.com/prooshani/cachalot-studio/releases/tag/v0.4.0) adds GLM and DeepSeek launch controls, optional runtime totals, and saved visual quiet mode. It retains earlier chat settings, managed process ownership, and host telemetry fixes. Live GLM/DeepSeek model validation and performance measurements remain outstanding. The macOS artifact targets Apple Silicon. The installer does not include Python, Cachalot, checkpoints, or an update service.

## One-time signing setup

Releases require a valid **Developer ID Application** certificate, Xcode command line tools, and an Apple notarization Keychain profile. The current maintainer Mac already has the StageBeacon signing identity for team `ZKC68BDK5F` and a working `stagebeacon-notary` profile. The release script uses those by default; it never stores Apple credentials in the repository.

On another Mac, import the Developer ID Application certificate and create a notarytool profile using Apple's documented Keychain flow. Set `CACHALOT_TEAM_ID`, `CACHALOT_SIGNING_IDENTITY`, and `CACHALOT_NOTARY_PROFILE` if the identity or profile names differ.

## Build and verify

From a committed, clean checkout with the same version in `package.json`,
`src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `src-tauri/Cargo.lock`,
and the matching version in `CHANGELOG.md` and the README release link:

```sh
./scripts/release/build-release.sh <version>
```

The script runs frontend and Rust checks, builds a Developer ID signed app with Hardened Runtime and secure timestamp, submits it to Apple, staples and verifies it, and packages a branded drag-to-Applications DMG. It then signs, notarizes, staples, and verifies the DMG. Outputs are under `.release/<version>/`:

- `Cachalot-Studio-<version>-macOS-arm64.dmg` for direct distribution.
- `Cachalot-Studio-<version>-macOS-arm64.zip` containing the notarized app.
- `SHA256SUMS`, notarization receipts, and `SOURCE_COMMIT`.

The script refuses an existing output directory to prevent accidental overwrite. Before publication, mount the DMG, confirm the drag-to-Applications layout and the installed app, and compare its SHA-256 hash to `SHA256SUMS`.

## Publish a release

Release from the exact commit recorded in `SOURCE_COMMIT`. After verification, push that commit and an annotated `v<version>` tag, then create or update the GitHub Release with the DMG, ZIP, checksums, source commit, notarization receipts, and verification report. Release notes must state minimum macOS, architecture, runtime requirements, working features, and limitations. Do not upload the temporary notary submission ZIP.

After publishing, compare GitHub's asset SHA-256 digests with local `SHA256SUMS`, confirm the release is public, and inspect the repository CI run. The 0.1.0 release used this procedure; its [verification report](https://github.com/prooshani/cachalot-studio/releases/download/v0.1.0/RELEASE-REPORT.md) records the exact commit, hashes, and Apple submission IDs.
