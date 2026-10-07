# Cachalot Lab: name, mission, and compatibility

Adopted by the owner on 2026-10-05. **Cachalot Lab** is the current product name;
**Cachalot Studio** is its former name. The inference engine remains **Cachalot**.
The governing [product direction](PRODUCT_DIRECTION.md) and [roadmap](PLAN.md)
implement the owner's observability, profiling, and experimentation mission.

## Current names

- Product, native window, application, installer, and current documentation: Cachalot Lab.
- Repository/package: `cachalot-lab`; Rust library: `cachalot_lab_lib`.
- Canonical workspace: `/Volumes/X10Pro/Cachalot Lab`.
- Installed local app: `/Applications/Cachalot Lab.app`.
- GitHub repository: `https://github.com/prooshani/cachalot-lab`.
- `/ca` keeps its invocation and Cachalot runtime default; explicit Lab work loads the
  Lab workspace, `AGENTS.md`, product direction, roadmap, and handoff.

## Compatibility identities retained deliberately

The brand change must not create a second empty profile, conversation, preference,
or credential store. These are stable machine identifiers, not display names:

| Identity                      | Retained value                        | Reason                                                                 |
| ----------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| macOS/Tauri bundle identifier | `com.prooshani.cachalotstudio`        | Preserves application support, WebKit origin, and application identity |
| WebView preference key        | `cachalot-studio-ui`                  | Reopens existing navigation, appearance, and Silent running settings   |
| Keychain service              | `com.cachalot.studio.runtime-api-key` | Continues locating explicitly saved endpoint-bound credentials         |

The existing data formats, endpoint key, conversation/profile files, and managed-child
ownership rules are unchanged. No credential is copied into documents, JavaScript,
or a new namespace. A future identifier migration needs a separately tested migration
and rollback design. Do not run the old and renamed applications concurrently against
the shared state.

The old workspace path may remain as a compatibility symlink while existing chats,
tools, and graph registrations still use it. It is an alias, not a second checkout.
Use the new path for new work. Existing graph project identifiers are lookup keys;
resolve them with `list_projects` rather than guessing a renamed key.

The runtime owner moved the brief inbox to `docs/lab/briefs/` and committed it in
0.60.4 (`193aa662b6fa681f39f7a17309a3fc40d06dd5a2`). Lab follows the verified new location. Older
`docs/studio/` references in historical records describe the former path.

## Historical evidence

Published versions through 0.5.0, their tags, release titles, artifact filenames,
source commits, notarization records, and hashes retain the names actually published.
GitHub repository links may follow the renamed repository, but never rewrite an old
asset filename to a file that was not published. The original owner mission is kept
verbatim in `mission/2026-10-05-owner-mission.txt`; its old name is historical.
The archived plan, dated runtime briefs, historical handoff entries, prior build
backups, and conversation transcripts retain their original evidence.

Hardware and other products named Mac Studio, LM Studio, or Unsloth Studio are not
this project and must not be renamed. Generated build caches and previously signed
bundles are replaced through fresh builds, never by text editing signed contents.

## Verification and publication status

The rename ships with 0.6.0, the first Cachalot Lab release. Earlier 0.5.0
artifacts retain their original name and source. Do not publish different source
as another 0.5.0 artifact.
Before any implementation push, choose the appropriate new version and complete the
exact-source signed/notarized [release gate](RELEASE.md).

### Historical local rename verification

The following records the earlier development pass; the published 0.6.0 checks
and installation below supersede its development artifact and test counts.

- GitHub repository renamed to `prooshani/cachalot-lab`; description and local
  origin updated and verified. The previous repository URL redirects correctly.
  The 0.5.0 release and all seven asset names remain accessible in the renamed repo.
- Workspace moved to `/Volumes/X10Pro/Cachalot Lab`; the previous path is a symlink
  to the same checkout. Canonical code graph `Volumes-X10Pro-Cachalot-Lab` was
  indexed successfully. The old graph remains a temporary compatibility lookup.
  The known `src/ChatScreen.test.tsx` parse gap (lines 1–207) was read directly;
  graph coverage is best-effort, not proof of exhaustive coverage.
- Product/window/menu/About/sidebar/in-app wording, package/crate/library names,
  installer paths and artwork, issue templates, current docs, roadmap, and project
  instructions updated. SVG and rendered PNG installer artwork both show Lab.
- A fresh Developer ID signed application was built and installed at the new path.
  All four installed bundle files match the build; strict signature verification
  passed. Native inspection confirmed the name, existing MiniMax profile, and
  restored Dive navigation. All five application-support files remained
  byte-identical. No runtime was launched or stopped and no generation was sent.
- 45 frontend tests, 31 Rust tests, and five Python mock tests passed. Prettier,
  ESLint, TypeScript, production build, Rust formatting and clippy, and shell syntax
  checks passed. Initial verification discovered source backups inside Vitest's
  search scope; moving backups outside the repository resolved it. The known
  optional `rust-objcopy`/`libLLVM.dylib` stripping warning remains; signed build
  succeeded. The isolated native Keychain CRUD test was not rerun, and real saved-key
  reconnect across restart remains unverified.
- `/ca` launchers for Claude and Codex, the shared Cachalot skill and companion
  documents/UI metadata, and the linked project memories now route explicit Lab
  work to its canonical workspace and governing mission. Runtime remains the default.
  Shared skill symlinks, YAML parsing, activation/version consistency, and whitespace
  were verified. The generic skill validator rejects inherited `author`, `platforms`,
  and `version` frontmatter; those existing fields were preserved, and a temporary
  copy with normalized frontmatter passed. Runtime-owned concurrent edits were
  preserved rather than overwritten.

The audit covered tracked/current project files, the canonical Cachalot skill and
aliases, Claude/Codex `/ca` launchers, relevant Markdown memories and runtime docs,
GitHub metadata, the installed application, and the code graph. Historical transcripts,
signed release archives, and unrelated projects were not rewritten. No claim of a
whole-machine or remote-history rewrite is intended.

### Recovery records and remaining work

Source backups: `/Users/hamedprooshani/.codex/backups/cachalot-lab-rename-2026-10-05/`.
External-file backups and the exact changed-file manifest:
`/Users/hamedprooshani/.codex/backups/cachalot-lab-external-20261005/changed-files.json`.
The previous installed app, installation hashes, and pre-launch data hashes are under
`.release/rename-2026-10-05/`. Restore the previous bundle only after closing Lab;
both names share state.

Codex's saved project sidebar label still says Cachalot Studio. Its project listing
tool is read-only, no rename tool is exposed, and UI automation of Codex was denied
by the tool's safety policy. This label requires a manual product-level rename.
The old path alias keeps the existing chat usable. No private Codex database was edited.

The [published 0.6.0 release](https://github.com/prooshani/cachalot-lab/releases/tag/v0.6.0)
ships the rename and read/wait telemetry from exact committed source
`769a6c652867a9b838d3112597b34556d4662f08`. Both app and DMG were signed,
notarized, stapled and verified. All seven public assets were downloaded and
hash-compared, and the verified public DMG is installed at the canonical app path.
Native sidebar and About show 0.6.0; saved application-support files remained
byte-identical. Fresh checks include 46 frontend, six Python and 31 normal Rust
tests, plus isolated native Keychain CRUD. Real saved-key restart remains unverified.
See the release's `RELEASE-REPORT.md` and `HANDOFF.md` for exact hashes, receipts,
CI results and installation evidence.
