#!/bin/bash
set -euo pipefail

APP_PATH="${1:-}"
OUTPUT_PATH="${2:-}"
VOLUME_NAME="${3:-Cachalot Lab}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKGROUND="$ROOT/assets/dmg/background.png"

if [[ ! -d "$APP_PATH" || "$APP_PATH" != *.app || -z "$OUTPUT_PATH" || -e "$OUTPUT_PATH" ]]; then
  echo "Usage: $0 /path/to/Cachalot\ Lab.app /new/path/Cachalot\ Lab.dmg [volume-name]" >&2
  exit 64
fi
[[ -f "$BACKGROUND" ]] || { echo "DMG background is missing" >&2; exit 1; }

WORK="$(mktemp -d "${TMPDIR:-/tmp}/cachalot-dmg.XXXXXX")"
MOUNT="$WORK/mount"
STAGING="$WORK/staging"
WRITABLE="$WORK/layout.dmg"
IS_MOUNTED=0
cleanup() {
  if [[ "$IS_MOUNTED" -eq 1 ]]; then hdiutil detach "$MOUNT" -quiet || true; fi
  rm -rf "$WORK"
}
trap cleanup EXIT

mkdir -p "$MOUNT" "$STAGING" "$(dirname "$OUTPUT_PATH")"
ditto "$APP_PATH" "$STAGING/Cachalot Lab.app"
ln -s /Applications "$STAGING/Applications"
ditto "$BACKGROUND" "$STAGING/.background.png"
chflags hidden "$STAGING/.background.png"

hdiutil create -volname "Cachalot layout $$" -srcfolder "$STAGING" -fs HFS+ -format UDRW "$WRITABLE" >/dev/null
hdiutil attach "$WRITABLE" -readwrite -noverify -noautoopen -mountpoint "$MOUNT" >/dev/null
IS_MOUNTED=1

osascript - "$MOUNT" <<'APPLESCRIPT'
on run argv
  set mountPath to item 1 of argv
  set volumeFolder to (POSIX file mountPath) as alias
  set backgroundFile to (POSIX file (mountPath & "/.background.png")) as alias
  tell application "Finder"
    open volumeFolder
    delay 1
    set dmgWindow to container window of volumeFolder
    set current view of dmgWindow to icon view
    set toolbar visible of dmgWindow to false
    set statusbar visible of dmgWindow to false
    set bounds of dmgWindow to {120, 120, 840, 612}
    set viewOptions to icon view options of dmgWindow
    set arrangement of viewOptions to not arranged
    set icon size of viewOptions to 112
    set text size of viewOptions to 13
    set label position of viewOptions to bottom
    set background picture of viewOptions to backgroundFile
    set position of item ".background.png" of volumeFolder to {605, 105}
    set position of item "Cachalot Lab.app" of volumeFolder to {188, 262}
    set position of item "Applications" of volumeFolder to {530, 262}
    update volumeFolder without registering applications
    delay 2
    close dmgWindow
  end tell
end run
APPLESCRIPT

rm -rf "$MOUNT/.fseventsd" "$MOUNT/.Trashes" "$MOUNT/.Spotlight-V100"
/usr/sbin/diskutil renameVolume "$MOUNT" "$VOLUME_NAME" >/dev/null
sync
hdiutil detach "$MOUNT" -quiet
IS_MOUNTED=0
hdiutil convert "$WRITABLE" -format UDZO -imagekey zlib-level=9 -o "$OUTPUT_PATH" >/dev/null
echo "Created $OUTPUT_PATH"
