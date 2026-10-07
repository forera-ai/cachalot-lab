#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION="${1:-}"
TEAM_ID="${CACHALOT_TEAM_ID:-ZKC68BDK5F}"
IDENTITY="${CACHALOT_SIGNING_IDENTITY:-Developer ID Application: Hamed Prooshani ($TEAM_ID)}"
PROFILE="${CACHALOT_NOTARY_PROFILE:-stagebeacon-notary}"
RELEASE="$ROOT/.release/$VERSION"
SOURCE_APP="$ROOT/src-tauri/target/release/bundle/macos/Cachalot Lab.app"
APP="$RELEASE/Cachalot Lab.app"
ZIP="$RELEASE/Cachalot-Lab-$VERSION-macOS-arm64.zip"
DMG="$RELEASE/Cachalot-Lab-$VERSION-macOS-arm64.dmg"

fail() { echo "Release blocked: $*" >&2; exit 1; }
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "pass a semantic version, such as 0.1.0"
[[ ! -e "$RELEASE" ]] || fail "$RELEASE already exists"
for tool in git pnpm cargo xcrun codesign security ditto hdiutil spctl shasum python3; do
  command -v "$tool" >/dev/null || fail "missing $tool"
done
[[ -z "$(git -C "$ROOT" status --porcelain)" ]] || fail "commit or discard source changes before building a release"
python3 - "$ROOT" "$VERSION" <<'PY' || fail "version or release documentation mismatch"
import json, pathlib, sys, tomllib
root, version = pathlib.Path(sys.argv[1]), sys.argv[2]
for file in (root / 'package.json', root / 'src-tauri/tauri.conf.json'):
    assert json.loads(file.read_text())['version'] == version, file
assert tomllib.loads((root / 'src-tauri/Cargo.toml').read_text())['package']['version'] == version
lock = tomllib.loads((root / 'src-tauri/Cargo.lock').read_text())
assert any(p['name'] == 'cachalot-lab' and p['version'] == version for p in lock['package'])
assert f'## [{version}]' in (root / 'CHANGELOG.md').read_text()
assert f'/releases/tag/v{version}' in (root / 'README.md').read_text()
PY
security find-identity -v -p codesigning | grep -F "$IDENTITY" >/dev/null || fail "Developer ID certificate missing: $IDENTITY"
xcrun notarytool history --keychain-profile "$PROFILE" >/dev/null || fail "notary profile unavailable: $PROFILE"

cd "$ROOT"
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
python3 -m unittest discover -s tests -p 'test_*.py'
(cd src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test)

mkdir -p "$RELEASE"
APPLE_SIGNING_IDENTITY="$IDENTITY" pnpm tauri build --bundles app --ci
[[ -d "$SOURCE_APP" ]] || fail "Tauri did not create app bundle"
ditto "$SOURCE_APP" "$APP"
codesign --verify --deep --strict --verbose=2 "$APP"
SIGNATURE="$(codesign -dvvv "$APP" 2>&1)"
grep -F 'runtime' <<<"$SIGNATURE" >/dev/null || fail "Hardened Runtime missing"
grep -F 'Timestamp=' <<<"$SIGNATURE" >/dev/null || fail "secure timestamp missing"
grep -F "TeamIdentifier=$TEAM_ID" <<<"$SIGNATURE" >/dev/null || fail "wrong Developer team"

ditto -c -k --sequesterRsrc --keepParent "$APP" "$RELEASE/notary-submission.zip"
xcrun notarytool submit "$RELEASE/notary-submission.zip" --keychain-profile "$PROFILE" --wait --output-format json > "$RELEASE/app-notary.json"
python3 - "$RELEASE/app-notary.json" <<'PY' || fail "Apple rejected app notarization; inspect app-notary.json"
import json, sys
assert json.load(open(sys.argv[1]))['status'] == 'Accepted'
PY
xcrun stapler staple "$APP"
xcrun stapler validate "$APP"
spctl --assess --type execute --verbose=2 "$APP"
ditto -c -k --sequesterRsrc --keepParent "$APP" "$ZIP"

"$ROOT/scripts/release/create-dmg.sh" "$APP" "$DMG" "Cachalot Lab $VERSION"
codesign --force --sign "$IDENTITY" --timestamp "$DMG"
codesign --verify --verbose=2 "$DMG"
xcrun notarytool submit "$DMG" --keychain-profile "$PROFILE" --wait --output-format json > "$RELEASE/dmg-notary.json"
python3 - "$RELEASE/dmg-notary.json" <<'PY' || fail "Apple rejected DMG notarization; inspect dmg-notary.json"
import json, sys
assert json.load(open(sys.argv[1]))['status'] == 'Accepted'
PY
xcrun stapler staple "$DMG"
xcrun stapler validate "$DMG"
hdiutil verify "$DMG"
spctl --assess --type open --context context:primary-signature --verbose=2 "$DMG"
(cd "$RELEASE" && shasum -a 256 "$(basename "$ZIP")" "$(basename "$DMG")" > SHA256SUMS)
git rev-parse HEAD > "$RELEASE/SOURCE_COMMIT"
echo "Signed, notarized release: $RELEASE"
