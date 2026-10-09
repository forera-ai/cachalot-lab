# Handoff

## Start here — Cachalot Lab 0.7.1 published, 2026-10-09

Published [v0.7.1](https://github.com/forera-ai/cachalot-lab/releases/tag/v0.7.1)
from clean implementation commit `a2192612cf807d62950b10d4d48f79e18a3d8dcf`
and its annotated tag. This backward-compatible patch ships compact panel layouts,
full-panel Chat, optional details on demand, and improved Surface action contrast.
All package/native manifests and Cargo.lock are 0.7.1. Stable app/data identities,
profiles, conversations, credentials, process ownership, and inference policy remain
compatible. This section is a documentation-only post-publication follow-up; the
release source and tag stay fixed at the implementation commit above.

The public release contains seven verified assets: DMG, ZIP, SHA256SUMS,
SOURCE_COMMIT, app and DMG notarization receipts, and RELEASE-REPORT.md. Every
downloaded asset matches its local SHA-256 and GitHub digest. GitHub confirms the
release is public and latest. The published README and all 17 PNG Git blobs match
the tag: ten new native 0.7.1 captures and seven byte-identical owner-provided 0.7.0
historical images. New captures show the endpoint unavailable at capture time;
the independently inspected final app later observed the returning external GLM.
Capture provenance is in `assets/screenshots/v0.7.1/README.md`.

The exact-source release build passed formatting, lint, types, 47 frontend tests,
six Python mock tests, Rust formatting/clippy, 32 Rust tests (one existing real
Keychain test ignored), production Vite and signed Tauri builds. The known optional
rust-objcopy/libLLVM stripping warning was nonfatal. Developer ID signing,
Hardened Runtime, secure timestamp, strict signatures, stapling, Gatekeeper app/DMG
assessment, ZIP integrity, and final DMG checksums passed. Unpublished DMG layouts
were discarded during Finder inspection; the unchanged notarized app was repackaged
with corrected Finder metadata, visually inspected, and the final DMG was freshly
signed and notarized. No discarded installer was published. Details are in the
release's verification report.

- App Apple submission: `75b56951-5dfb-4c76-80f1-dd95f6381952` — Accepted.
- Final DMG Apple submission: `6e41d44b-f2e7-4630-836a-37a8e6d1b23b` — Accepted.
- DMG SHA-256: `e473ea24771a8a730d1266fe3a5d84d0d916bc955a3175568b1a2dc49a2edbd8`.
- ZIP SHA-256: `d57c8f26f1390ce7268d2e24b6ff6e17b83ceb4596519b9b0d8c2fab6c274c3c`.
- Installed executable SHA-256: `9d94583dbde9803aac1b91290dfac93b2cf0c556a658cb69744069e6c4286573`.

Exact-source GitHub CI passed on both [main](https://github.com/forera-ai/cachalot-lab/actions/runs/37934448141)
and [v0.7.1](https://github.com/forera-ai/cachalot-lab/actions/runs/37934448098). The published README gallery was also inspected
on GitHub: its new Chat and Settings images render correctly.

Installed the app from the verified public DMG at `/Applications/Cachalot Lab.app`
after publication. All five bundle files match the mounted public app, authoritative
release app, and extracted ZIP. Strict signature, stapling, Gatekeeper, version,
and native Chat/Settings inspection passed. The prior installation is recoverable
at `.release/0.7.1/before-public-Cachalot Lab.app`; the original public 0.7.0 backup
remains at `.release/local-panels-2026-10-09/previous-Cachalot Lab.app`.
All five existing app-data files remained byte-identical. Original System appearance
and Silent running Off were preserved. No model launch/stop, generation request,
profile save/delete, credential action, or inference tuning was performed.

All seven default panels in the exact-source release app were visually inspected
at 1380 × 860 logical pixels in both themes and fit without page scrolling.
Logs/history retain their own bounded scrolling; expanded details and long forms
may scroll. Offline browser minimum checks at 1100 × 720 remain narrower evidence
than connected native minimum layout. Exact minimum connected native layout,
long native history/streaming, managed GLM/DeepSeek inference, output quality,
sustained performance, instrumentation overhead, and authenticated saved-key restart
remain unverified. No speed or quality benefit is claimed.

Last reviewed runtime: clean Cachalot **0.62.22**, commit
`5faababa6bc098400147611d3ffd11cd00e3100d`; briefs through 0.62.20. Lab uses the
direct CLI, keeps an empty GLM decode miss budget off, and does not adopt the shell
script's budget 2. Release receipts, hashes, public download/digest checks, native
captures, installation/data records, and CI logs are in `.release/0.7.1/`.

## Historical release preparation — Cachalot Lab 0.7.1, 2026-10-09

Planned release: [v0.7.1](https://github.com/forera-ai/cachalot-lab/releases/tag/v0.7.1).
This patch ships the panel layout and Surface contrast refinements described below.
No public contract, app/data identity, runtime policy, or storage format breaks.
All package/native manifests and the Cargo lock entry are 0.7.1. The release must
be built, signed, notarized, packaged, published, and verified from the clean
implementation commit before it is considered complete; the post-publication
follow-up will record exact source, receipts, artifact hashes, CI, and installation.

README now leads with ten fresh native 0.7.1 captures covering all seven panels,
raw runtime evidence, and two Surface views. They show runtime-unavailable state,
with preserved conversations/profiles/logs and scoped host readings. The original
seven owner-provided 0.7.0 screenshots remain byte-identical as historical views.
No screenshot pixels were edited. Capture provenance is in
`assets/screenshots/v0.7.1/README.md`. The signed versioned capture build was
installed and its full bundle matched the fresh build; this is pre-release evidence,
not a claim that the final artifacts have already been verified.

Runtime briefs still end at 0.62.20. Rechecked clean Cachalot **0.62.22**, commit
`5faababa6bc098400147611d3ffd11cd00e3100d`; no later brief/source commit was
found during release preparation. GLM’s shell-script budget 2 remains separate
from Lab’s direct CLI empty-budget off default. Existing inference workflows and
saved values are preserved. Prior local checks below cover connected native layout
at normal size, both themes, and offline minimum browser layout. Exact minimum
connected native layout, long native streaming/history, inference quality/speed,
instrumentation overhead, and authenticated saved-key restart remain unverified.

## Historical local panel refinement, 2026-10-09 (before 0.7.1)

The owner’s seven original screenshots are copied byte-for-byte into
`assets/screenshots/v0.7.0/` and shown in README with version and evidence-scope
captions. They document the published 0.7.0 interface before this local refinement.
The public 0.7.0 artifacts and historical release evidence below remain unchanged.

Chat now fills its panel with an anchored composer and separate history/transcript
scroll areas. Settings and Doctor use compact columns; API places connection setup
beside client examples. Dive pairs its profile rail with details, collapses discovery
and optional draft settings, and keeps explicit output-changing budget intent visible
when tuning closes. Logs owns its output scroll area. Cockpit preserves trace space,
pairs wide raw read/wait counters, and discloses interpretation limits on demand.
Surface primary actions use white labels. Long histories, logs, expanded help, and
complex forms retain scrolling where necessary; this pass does not remove evidence
or change inference policy, process controls, credentials, or storage formats.

Reviewed the new `2026-10-09-runtime-0.62.20.md` brief against clean Cachalot
**0.62.22**, commit `5faababa6bc098400147611d3ffd11cd00e3100d`, source and
changelog. Since 0.62.20, `serve-glm.sh` selects decode miss budget 2 when its
variable is empty/unset. Lab launches the direct CLI, whose empty budget remains
off, and removes inherited budget settings. Lab does not adopt the script default
or rewrite profiles. Versions 0.62.19/21 add measurements; 0.62.22 adds metadata.
No new HTTP/log format was found in this bounded review. Updated runtime-contract,
launch help, README, architecture, product/plan, runtime-sync, and changelog records.

Validation: types, lint, formatting, 47 frontend tests across 11 files, production
Vite/Tauri build and strict Developer ID signature verification passed. The optional
rust-objcopy/libLLVM stripping warning remains nonfatal. No Rust source changed.
All seven default panels were visually inspected in the installed native app at
1380 × 860 in Abyss/System-dark and Surface. Default panels fit without page
scrolling; the ten runtime evidence counters are visible together at that size.
The unsaved GLM draft retained its explicit budget warning with tuning closed and
was canceled. Existing saved MiniMax conversation/source guard, profile, external
GLM connection, and managed output remained visible.

Offline browser preview checked all seven default panels at 1380 × 860 and
1100 × 720: no outer content overflow or clipped Cockpit panels. This does not
verify connected native layout at the exact minimum; native resize attempts did
not establish that size. Long native chat history, live streaming, managed inference,
quality/performance/overhead, and authenticated saved-key restart remain unverified.
No model launch, stop, generation request, profile save/delete, or credential action
was performed. Original System appearance and Silent running Off were restored.
All five existing app-data files remained byte-identical.

The latest local build is installed at `/Applications/Cachalot Lab.app`; all four
bundle files match the fresh build and strict signature verification passes. Package
and native manifests remain 0.7.0 for this local test build. It is **not notarized or
published**, and no implementation commit/tag was pushed during this pass. A future
publication must choose a new version and follow `docs/RELEASE.md` in full.
Executable SHA-256: `9e34a9746868a24c848f4052f4441abe66874e1c2f027a51e270502f6fc6107a`.
Recoverable previous public installation:
`.release/local-panels-2026-10-09/previous-Cachalot Lab.app`.
Local captures, build log, installation/data hashes, browser minimum measurements,
and verification report are in `.release/local-panels-2026-10-09/`.

Graph evidence used Verify tier for this bounded pass. Coverage reported partial
`src/ChatScreen.test.tsx` lines 1–207; the full source was read before relying on
its tests. No recorded gap on other checked material code paths is only a
best-effort coverage signal, not proof of completeness.

## Historical release — Cachalot Lab 0.7.0 published, 2026-10-08

Published [v0.7.0](https://github.com/forera-ai/cachalot-lab/releases/tag/v0.7.0)
from implementation commit `6d75c5437f4ae4094bf1966fd42c0483264813f1`
and its annotated tag. This minor release adds skipped-expert evidence and an explicit
GLM decode miss-budget control. All package/native manifests are 0.7.0; stable app/data
identifiers and direct CLI defaults remain compatible. This section is a documentation-only
post-publication follow-up; the release's source commit remains the one above.

Runtime review remains **0.62.18**, commit
`2c319ec36c2930bc7b754ecc590a818364ca8f5d`, briefs through 0.62.14.
No later brief or runtime source change was found during release preparation.
The historical local 0.6.0 evidence below describes the earlier uncommitted test build.

The fresh exact-source release build passed formatting, lint, types, 47 frontend tests,
six Python mock tests, Rust formatting/clippy, 32 Rust tests (one existing real Keychain
test ignored), production Vite and signed Tauri builds. The known optional
rust-objcopy/libLLVM stripping warning was nonfatal. Developer ID signing, Hardened
Runtime, secure timestamp, strict signatures, stapling, Gatekeeper app/DMG assessment,
DMG integrity and ZIP integrity passed. App notarization
`122862d8-3bd3-4cba-93a1-491582501e20` and DMG notarization
`b2535f8d-f28c-4d4e-b179-503dbf59c46c` were Accepted.

The release is public and latest. All seven downloaded assets matched local bytes and
GitHub SHA-256 digests: DMG, ZIP, SHA256SUMS, SOURCE_COMMIT, both Apple receipts and
[RELEASE-REPORT.md](https://github.com/forera-ai/cachalot-lab/releases/download/v0.7.0/RELEASE-REPORT.md).
Published package hashes:

- DMG: `aa9c362d85836a60541c4ff4ba3c6f019d3c2291aae99d3d2a74d6672f2dbea1`
- ZIP: `f92d86dd3fe87c8dbad27d3073ba568efd0dfb633b68dbc6c96176d12af5c3ee`

Exact-source GitHub CI passed on both
[main](https://github.com/forera-ai/cachalot-lab/actions/runs/37846848265) and
[v0.7.0](https://github.com/forera-ai/cachalot-lab/actions/runs/37846847800), including
the macOS native build. All release gates are complete.

Installed `/Applications/Cachalot Lab.app` from the verified public DMG, with all five
bundle files matching the release. Executable SHA-256:
`d3d9ebf2ece206add5425b7c338c7f71940c5ad165ac7638f331772e4afacd93`.
Strict signatures, stapled ticket and Gatekeeper passed again after installation.
Native inspection confirmed LAB 0.7.0, the preserved MiniMax profile, existing external
GLM connection, cumulative positive skipped-expert counter and outputs-changed warning.
The exact same bundle was inspected before publication for GLM's empty budget default,
unsaved value 2, output warning and direct CLI prefetch distinction; the draft was canceled.
Every app-data file remained byte-identical across both installations and inspections.
No model launch, stop, generation request or credential change was performed.

The branded drag-to-Applications DMG layout was inspected in Finder; the mounted
volumes were ejected after verification. Local receipts are in `.release/0.7.0/`, including
`public-verification.json`, `public-installation.json` and CI logs. Recoverable prior
installations remain in `.release/local-before-v0.7.0/previous-Cachalot Lab.app` and
`.release/local-before-public-v0.7.0/previous-Cachalot Lab.app`.

Live managed GLM budget inference, output quality, performance gains, instrumentation
overhead, saved-key restart and other theme/breakpoint inspection remain unverified.
The external GLM observation does not validate Lab-managed budget launches. Active output
mode remains unreported; routing trace capture/viewer remains planned. Published notes and
the verification report retain these limits. Release requirements remain Apple Silicon,
macOS 14+, and separately installed Python/runtime/checkpoints.

## Runtime 0.61.9–0.62.14 briefs — local compatibility pass, 2026-10-08

Reviewed all four new briefs (0.61.9, 0.62.0, 0.62.10, 0.62.14) against clean
Cachalot **0.62.18**, commit `2c319ec36c2930bc7b754ecc590a818364ca8f5d`,
the changelog and source diff from the last reviewed 0.61.2. Versions 0.62.15–18
add measurements and metadata, not new HTTP or launch behavior. Runtime-owned
measurements are not Lab performance or quality validation.

Cockpit now shows optional `skipped_experts` in read/wait evidence and qualifies
the hit-rate readout when positive. Missing, invalid, unhealthy and disconnected
values remain unavailable; zero remains zero and never establishes exact outputs.
GLM adds this field in 0.62.14; MiniMax reports zero from the shared engine.

Dive adds an explicit GLM-only decode miss budget (-1 off, 0–288 capped reads,
empty off). Nonnegative settings are marked output-changing next-launch intent;
active mode is unreported. Rust validates family/range, removes the inherited key,
and compiles only explicit overrides. Older profiles remain valid. GLM prefill
is unchanged; no quality magnitude or speed gain is promised.

Lab launches the CLI directly. Its omitted GLM prefetch remains 5; `serve-glm.sh`
now defaults to 0. The script's conditional owner-specific bank selection is not
adopted by Lab. Existing bank/prefetch profiles retain their choices. Routing
trace extension and GLM weight/prediction arrays are recorded in the contract;
no trace viewer, capture, per-request routing attribution or profiler is claimed.
Trace positions do not restart per request. MiniMax substitution affects trace
semantics. Traced runs must not be presented as uninstrumented speed baselines.
The source diff also confirms 0.61.14 read emulation covers MiniMax coded banks.

Engineering question: did a reported cache hit rate coexist with expert drops,
and which explicit next-launch budget did the user select? Evidence remains
runtime cumulative counters and requested profile configuration. The existing
poll, raw snapshot and bounded UI remain unchanged; no new collector, request,
persistence, export, or inferred critical path is added. Inference overhead and
live GLM budget behavior remain unmeasured.

Graph Verify tier used Lab generation `2026-10-08T19:22:58Z` and runtime generation
`2026-10-08T19:23:51Z`; material coverage metadata matched with no recorded gaps.
Exact source checks supplemented graph evidence; coverage is best-effort only.
This pass is local, uncommitted and unreleased; app version remains 0.6.0.

Verification: 47 frontend tests, 32 Rust tests (one unrelated real Keychain test ignored),
six Python mock tests, TypeScript, ESLint, Prettier, Rust formatting/clippy,
production build, and diff whitespace checks passed. Final JSX copy/tooltip changes
passed the 20 affected frontend tests and fresh types/lint/format checks. Developer ID
signed native build passed, with the known nonfatal rust-objcopy/libLLVM stripping
warning. This local build is not notarized or published and still reports 0.6.0.

Installed at `/Applications/Cachalot Lab.app`; all four bundle files match the fresh
build and strict signature verification passed. Executable SHA-256:
`069b84c99fa86f1bfaccae171c365d8c44202a800abf3cc2d4497811e80672ad`.
Backup and receipts: `.release/local-runtime-0.62.14-2026-10-08/`, including
`previous-Cachalot Lab.app` and `installation.json`. Native standard-window inspection
verified live GLM zero drops, the synthetic positive-drop warning, and GLM's empty
budget default, unsaved entry and visible output warning/direct CLI distinction.
The unsaved draft was discarded and original endpoint 8011 restored. Profiles,
conversations and managed log remained byte-identical. No real model launch, stop,
generation or credential change was performed. Live budget inference, output quality,
instrumentation overhead and other theme/breakpoint inspection remain unverified.

## Repository transfer — 2026-10-08

Cachalot Lab is now owned and maintained by [Forera AI](https://github.com/forera-ai).
The canonical repository is [forera-ai/cachalot-lab](https://github.com/forera-ai/cachalot-lab),
and local `origin` now uses `https://github.com/forera-ai/cachalot-lab.git` for fetch
and push. GitHub's API resolves the previous `prooshani/cachalot-lab` address to
the same repository ID (`1393165525`) under Forera AI. The separate
`forera-ai/cachalot` repository is the runtime, not Lab.

README ownership, badges, downloads, and runtime links now use Forera AI. Active
release and naming documentation, repository instructions, and shared agent
project references record the transfer. Historical names, original author
attribution, signed release artifacts, stable app/data identifiers, and the
workspace remain unchanged. This is a documentation and local Git configuration
update; app version remains 0.6.0 and no new binary release is required under
`docs/RELEASE.md`. The runtime review and release evidence below remain the last
completed implementation verification.

At the owner's request, `LICENSE` and README now state
`Copyright (c) 2026 forera.ai and contributors`. The MIT license terms are unchanged;
shared project memory records this explicit copyright update.

## Start here — Cachalot Lab 0.6.0 release, 2026-10-07

The owner renamed this product **Cachalot Lab** and adopted the full long-term
observability/profiling/experimentation mission. Read `docs/PRODUCT_DIRECTION.md`,
`docs/PLAN.md`, and `docs/RENAME.md` before continuing. Preserve the 0.5.0 inference
workflows and data. The next slice is the metric/provenance inventory and reproducible
run-manifest design; token tracing requires authoritative Cachalot instrumentation.
The former fixed 0.6/0.7/1.0 roadmap assignments are superseded, with useful work retained
as backlog. No research capability is claimed as shipped by these document changes.

Release **0.6.0 is published** at
[GitHub Release](https://github.com/forera-ai/cachalot-lab/releases/tag/v0.6.0),
from implementation commit `769a6c652867a9b838d3112597b34556d4662f08`
and matching annotated tag `v0.6.0`. The minor version reflects the additive
runtime read/wait evidence capability and compatible Lab rename. Package and
native versions are 0.6.0. All seven public assets were downloaded and hash-compared
with local files and GitHub digests. The source record, signed/notarized DMG and ZIP,
checksums, notarization receipts, and
[verification report](https://github.com/forera-ai/cachalot-lab/releases/download/v0.6.0/RELEASE-REPORT.md)
are published.

Release evidence: app notarization `d4d9564b-572f-4c55-90a5-5904ae5829eb`;
DMG notarization `13c39d71-d4f4-479c-a86b-3838cf6574e3`, both Accepted.
Strict signatures, staple validation, Gatekeeper and DMG internal checksum checks
passed. ZIP SHA-256 `6c455d6487975b17aeee59c76113566ba358186fba5a84c8901806f4afe9817c`;
DMG `7bc194fe2a303a938bca00ab79e4631cf327a674fceffa3de6a66ad18ea71b3d`.
Fresh exact-source checks passed: 46 frontend tests, six Python mock tests, 31
normal Rust tests, explicit isolated native Keychain CRUD, formatting, lint,
TypeScript, clippy and the signed production build. The initial explicit PATH
selected unsupported Node 26; repeating preflight with Node 22.23.1 passed.
Optional debug-info stripping retains the known nonfatal missing-libLLVM warning.

The downloaded public DMG is installed at `/Applications/Cachalot Lab.app`.
Every installed bundle file matches the public DMG and release app; executable
SHA-256 `aad6521617667b4a8d638244fc78a78e1af55f776ae1be4a48a630ddde7a7d20`.
Native sidebar and About show Cachalot Lab 0.6.0. Offline fallback and the nine
synthetic read/wait totals were inspected, with charts restored on collapse.
Application-support files remained byte-identical across installation and native
smoke. No real model launch, generation, profile or user credential change.
Mocks were disconnected and stopped; app left on Cockpit/Drives. The prior local
app is recoverable under `.release/local-before-v0.6.0/previous-Cachalot Lab.app`;
local installation and public verification records are under `.release/0.6.0/`.

Both exact-source [main CI](https://github.com/forera-ai/cachalot-lab/actions/runs/37599719902)
and [tag CI](https://github.com/forera-ai/cachalot-lab/actions/runs/37599719511)
passed, including native app builds. Runner annotations note action-runtime Node
20 deprecation/forced Node 24 and possible arm64 queue delays; checks succeeded.
The app's test/build Node version remains 22.

Last committed runtime source reviewed on **2026-10-07**: **0.61.2**, commit
`954dff83c54071e10aef649ae725dd0afd141528`, with briefs through **0.61.1**.
The 0.61.2 follow-up changes measurements, documentation, and the package version only.
The reviewed runtime adds optional expert-read bandwidth emulation (0.61.0)
and GLM/MiniMax expert-store stats parity (0.61.1). Lab now has a collapsed Runtime
read/wait evidence table, preserves independent unknowns and zero, and documents
the emulation knob without changing launch policy. Busy-rate and wait-percentage
calculations remain deferred pending aligned evidence; see `docs/RUNTIME_SYNC.md`.
Live GLM/DeepSeek and authenticated saved-key restart validation remain outstanding.

Historical pre-release local verification (superseded by the published app above):
the 2026-10-07 compatibility pass passed 46 frontend tests, six Python mock tests,
TypeScript, ESLint, Prettier, production build, and signed native build. No Rust
source changed in this pass; the prior rename's 31 Rust tests and format/clippy
checks remain historical evidence, not a new run. Those local artifacts carried development version
0.5.0 and were not notarized or published. The completed release workflow superseded
them with fresh exact-source 0.6.0 artifacts before the implementation push.
Final installed executable SHA-256:
`b395edcc2150b04336710796c2726b4927088da087c2cdf4f2d473fa0891b9ee`.
Strict signature verification and all four bundle-file hash comparisons passed.
Previous installation and `installation.json` are in
`.release/local-runtime-0.61.1-2026-10-07/`. Native inspection of the final build
verified reported totals, healthy partial-response fallback, bounded disclosure
scrolling, and restored chart space when collapsed. Synthetic mocks were stopped;
no real model launch, generation, profile edit, or credential change was performed.
The initial build needed the installed Rust toolchain added to PATH; the known
optional `rust-objcopy`/`libLLVM.dylib` stripping warning remains nonfatal.
See `docs/RENAME.md` for the earlier rename's data-preservation and UI evidence.

## Historical release and development record

Entries below retain the name and paths used when their evidence was recorded.
They are historical evidence, not the current product name or current roadmap.

- Studio version: **0.5.0**, published on 2026-10-05 from implementation commit `a3078658251d1ec66f5092c54038583d30630b47`. [GitHub Release](https://github.com/prooshani/cachalot-studio/releases/tag/v0.5.0) ships SSD telemetry, bounded local model discovery, optional macOS Keychain credentials, and Dive refinement. This is a backward-compatible minor capability release. Signed/notarized DMG and ZIP, checksums, source record, notarization receipts and [verification report](https://github.com/prooshani/cachalot-studio/releases/download/v0.5.0/RELEASE-REPORT.md) are published. All seven public assets were downloaded and hash-compared; the public DMG is installed at `/Applications/Cachalot Studio.app`, every bundle file matches, and native version/Dive/credentials copy inspection passed. Prior app retained under `.release/local-before-v0.5.0/previous-Cachalot Studio.app`. Historical development entries below describe pre-release states; live GLM/DeepSeek validation and authenticated saved-key restart remain unverified.
- 0.5.0 release evidence: app notarization `91d301b5-751c-4311-b447-5bcb80d203cb`; DMG notarization `8bd6fd64-d04b-40b5-a4f9-b7211dc41912`, both Accepted. Strict signature, staple and Gatekeeper checks pass. ZIP SHA-256 `30f40a74a9cd3d9ac731bfe10916074116f27978d8666c0a3532302941e9fe6b`; DMG `f8e5b80e91a00a65beee36cb3b7912faff788082f54ceb5c77382ea0426b3407`; installed executable `f6bc0fd52fec209c61df3bcb4aaab3887c9b6e767382b294c4f78648d011f615`. Fresh checks: 45 UI tests, 31 normal Rust tests, explicit isolated native Keychain CRUD, five Python mock tests, formatting/lint/types/clippy and production signed build. Both exact-source [main CI](https://github.com/prooshani/cachalot-studio/actions/runs/37345572827) and [tag CI](https://github.com/prooshani/cachalot-studio/actions/runs/37345573004) passed, including their native app builds.
- Prior Studio version: 0.4.0 remains available at its [release](https://github.com/prooshani/cachalot-studio/releases/tag/v0.4.0), source `aa8d1a2a36ba19eb774d32ebd78d7419b01f74ca`.
- Standing release rule: every implementation commit pushed to GitHub must include current `CHANGELOG.md`, `README.md`, `HANDOFF.md`, and other affected docs, a major/minor/patch Studio version bump chosen for the depth of the shipped changes, fresh signed/notarized artifacts, and a created or updated GitHub Release with those artifacts. Never reuse a published version for a different source commit. Verify release assets and hashes before reporting completion. The full gate is in `AGENTS.md` and `docs/RELEASE.md`; documentation-only edits do not require a binary release.
- Runtime contract reference: Cachalot HTTP routes verified against `src/cachalot/server/app.py` and the live MiniMax server on 2026-09-28.
- Runtime brief watch: before every Studio development pass, check `/Users/hamedprooshani/Projects/deepseek-v41-mac/docs/lab/briefs`, then verify new claims against the runtime checkout. Last reviewed on 2026-10-05: briefs 0.39.0 through 0.60.0, Cachalot 0.60.1 commit `9d11bc061dcb434c40494be3d507521194d376dc` (`main`; clean checkout; follow-up measurement tools/docs/version only). The 0.48 script defaults, 0.49 GLM bank, and 0.50 GLM prefetch controls were checked against source and changelog. The 0.50.1 follow-up changes only measurements, documentation, and version strings. Studio does not infer compatibility from startup logs. See `docs/RUNTIME_SYNC.md`.
- Done: repository initialized locally, `main` and `origin` configured, baseline documentation, three exploratory concepts, and a traced owner-selected graphic mark in `assets/logo/` with dark/light variants and 16–1024 px exports. Design tokens generate CSS and TypeScript. Tauri 2 + React 19 app includes Cockpit, Chat, API, Doctor, Settings, system/Abyss/Surface themes, and a ⌘K command palette. Vitest UI checks and macOS CI are present.
- Current state: native app connects to an existing local Cachalot server, reads health and real metrics, streams chat with cancellation and per-conversation generation controls, and shows API setup. Dive manages one Studio-owned runtime process with profile editing, launch preview, readiness, logs, and automatic connection. A native MiniMax 0.50.1 launch, streamed reply, and clean stop passed on 2026-09-30; the current runtime contract source review is 0.60.1. A controllable Python mock covers startup delay, keep-alives, partial stats, authentication, queueing, and a scripted crash.
- v0.1.0 release verification: Prettier, ESLint, TypeScript, Vitest, mock runtime unittest, `cargo fmt`, `cargo clippy -D warnings`, `cargo test`, and a Developer ID signed Tauri `.app` build. The native window connected to the mock runtime, streamed a reply, updated telemetry, and retained chat across navigation. App and DMG notarization were accepted; the mounted DMG and Gatekeeper checks passed. See the [release report](https://github.com/prooshani/cachalot-studio/releases/download/v0.1.0/RELEASE-REPORT.md).
- GitHub: `main` and `v0.1.0` pushed; [release](https://github.com/prooshani/cachalot-studio/releases/tag/v0.1.0) published with DMG, ZIP, checksums, and verification records.
- Unreleased telemetry work adds a persistent strip for connected state, model, decode speed, expert hit rate, and SSD rate; polling runs at 1 Hz while visible and 0.2 Hz while hidden. The native build was visually checked against the mock runtime.
- Local saved conversations are merged into `main` and remain unreleased. On 2026-09-29, a native development build connected to the mock runtime, streamed a reply, and reopened the saved chat after restart. The synthetic test chat was removed afterward.
- Unreleased native groundwork now includes versioned launch profiles, a fixed-argument Cachalot CLI compiler, and single-child process supervision. CLI flags were checked against runtime commit `0a8530efbacab596322d94070ac7bc9c66edcb2b`. Rust tests, clippy, and formatting checks passed. See [managed runtime](docs/MANAGED_RUNTIME.md).
- Runtime 0.43 compatibility: MiniMax decode and prefill miss substitution now default on and can change outputs. Managed profiles accept independent, version-safe overrides: omitted means inherit the runtime default, `false` explicitly writes `0` for the exact path, and `true` writes `0.20` plus substitution depth `4`. Loop-guard repeats, decode-cache cap, and persisted-block retention can also be compiled into a validated environment. The profile store remains backward compatible. See `runtime-contract/` for knobs, version gates, and the loop-guard log pattern. These controls and raw Logs are visible in unreleased native builds.
- The current `/v1/stats` response still has no version, active numerics mode, or loop-guard event. Cockpit now marks connected output mode as unreported; it does not guess from the model name. Request these runtime fields in `docs/RUNTIME_REQUESTS.md` before promising exact/approximate or per-request loop warnings for external servers.
- 2026-09-29 runtime-sync verification: frontend build, lint, Prettier, Vitest (18 tests), Rust tests (13 tests), `cargo fmt`, `cargo clippy -D warnings`, signed Tauri build, Apple notarization, stapling, and Gatekeeper checks passed. The installed `/Applications/Cachalot Studio.app` matches the signed build; the prior local app is saved at `.release/local-runtime-sync-2026-09-29/previous-Cachalot Studio.app`. The installed app showed the output-mode-unreported label against the local mock runtime and cleared it after disconnect. This pass verified runtime 0.43.1 source and defaults, not a live 0.43.1 model launch.
- The new unreleased Cockpit replaces the oversized hero with a dense instrument panel. A normal 1380 × 860 window shows every section without page scrolling, both offline and connected. It has 2-minute traces for decode speed, expert reuse, runtime SSD read, resident experts, and whole-Mac CPU/GPU/RAM load. The connected telemetry strip is hidden on Cockpit because its readings now appear in the dashboard; it remains on other screens.
- The new host sampler reads Mach CPU and memory counters and an optional IOKit GPU utilization value every 2 seconds. The machine card reads the actual Mac name, chip, core counts, unified memory, startup-volume capacity/free space, macOS version, and model identifier. On the owner's Mac Studio these resolve to Apple M3 Ultra, 28 CPU cores, 60 GPU cores, 96 GiB, macOS 27.2, and Mac15,14. “This Mac” now resolves that model through macOS CoreTypes to Apple's front-facing Mac Studio icon; other Macs use their matching installed system icon where available. No Apple artwork is bundled. No serial number or hardware UUID is sent to the UI.
- The memory-tier explanation is now explicit: Surface, Twilight, Midnight, and Abyss are Cachalot architecture tiers. Current runtime stats do not expose per-tier occupancy or SSD pressure, so Cockpit does not invent those values. See [runtime telemetry contract](docs/RUNTIME_REQUESTS.md) for the proposed additions.
- 2026-09-29 local verification: the redesigned native Cockpit was visually checked offline and against the mock runtime in the standard 1380 × 860 window, with no page scrollbar. The charts use a fixed 2-minute axis, and Cockpit clears the displayed model name when the runtime disconnects. Frontend build, lint, Prettier, Vitest (17 tests), Rust tests (11 tests), signed Tauri app build, notarization, stapling, and Gatekeeper assessment passed. The signed app is installed at `/Applications/Cachalot Studio.app`; the previous v0.1.0 app is saved at `.release/local-cockpit-2026-09-29/previous-Cachalot Studio.app`. These changes are local and unreleased; they are not in the published v0.1.0 DMG.
- 2026-09-29 managed-runtime development: Dive now exposes profile creation/editing/deletion, launch preview, single-child start/stop, MiniMax tuning with an exact-output preset and warning, readiness, and automatic connection. The status probe requires a healthy `/health` and a model ID from `/v1/models`; it runs without holding the supervisor lock over network I/O. Logs shows a bounded tail of Studio's private process output; Doctor shows managed state. The saved external endpoint remains unchanged when managed auto-connection runs. This work is local and unreleased; the local test installation includes it, while the published v0.1.0 DMG does not.
- Runtime brief watch rechecked on 2026-09-29: no new brief after 0.43.2; clean Cachalot 0.43.2 commit `ef5992a39326a6efca2aebbed84866ffe33d3c18` remains the last reviewed runtime version and commit. Its health/model routes were rechecked against source. Raw managed Logs can show the 0.43.2 cut-reply line; Studio still does not parse it or read the startup version for compatibility.
- Managed-runtime verification: frontend build, lint, and Prettier pass; Vitest 22 tests, Rust 14 tests, and `cargo clippy -D warnings` pass, including automatic connection, retry timing, crash disconnect, and readiness against a mock HTTP server. Browser preview visually checked offline Dive and profile form. The native development binary compiled and launched, but macOS was locked during UI inspection, so native Dive visual review remains outstanding. Real model launch, abrupt-kill recovery policy, and signed/notarized release verification also remain outstanding.
- 2026-09-29 Mac icon pass: Cockpit's hand-drawn Studio chassis has been replaced with the host macOS model icon. CoreTypes maps Mac15,14 to `com.apple.macstudio.icns`; Mac16,10 maps to the distinct 2024 Mac mini icon. Unknown models fall back to a generic glyph. The newly installed native app visibly shows the correct Mac Studio icon. This change is local and unreleased.
- 2026-09-29 local install and runtime 0.44 sync: that pass added nullable MiniMax `CACHALOT_HOST_GROW_QUIET_S` and `CACHALOT_HOST_SHRINK_EVERY_S` controls (0.44+), documented in `runtime-contract/`. Studio uses port 8011 for the connection field and new managed profiles, and offers a reset when a saved custom address differs. Frontend build, lint, Prettier, Vitest (26 tests), Rust tests (19 tests), formatting, and clippy passed. That Developer ID signed local app had executable SHA-256 `11a6467e1eea18416e71d6a3e7b424bbd9b59ed48ed9720517e44f9838d8a8bf`. The prior notarized installation is saved at `.release/local-dev-2026-09-29-icon-port-runtime044/previous-Cachalot Studio.app`. The installed app was launched and visually checked: Cockpit displays the system Mac Studio icon; API and a new Dive profile show port 8011; MiniMax Dive fields show the 0.44 defaults. The local build is signed but not notarized or published, and still carries package version 0.1.0. The GitHub v0.1.0 release remains the only published release. After every future implementation pass, install the fresh local build for native testing; after every release, install that verified release locally.
- Orphan recovery policy for 0.2.0: after an abrupt app exit, Studio does not reattach to or stop a prior server. An occupied port blocks a new launch and the error instructs the user to stop the prior server in Activity Monitor or choose a different port. This avoids killing an unrelated process after PID or port reuse. See [managed runtime](docs/MANAGED_RUNTIME.md).
- Runtime 0.45 sync: managed MiniMax profiles now offer a nullable adaptive mirror-share switch. Omitted uses runtime default, explicit Off keeps the configured fraction fixed, and On enables adaptation. Raw Logs can show the new `[bank] mirror share` line; Cockpit does not turn it into a live value. The runtime source and changelog at commit `cda463d` confirm no API change. This implementation is local and unreleased.
- Real-model verification exposed a missing profile input: the owner's MiniMax checkpoint is 5.3 GiB of non-expert weights and needs its separate 158 GiB coded expert bank. Profiles now accept absolute bank and optional mirror directories and a fraction, with checks for `bank.json`. The first native attempt used a system Python without Cachalot and exited; the profile now uses `/Users/hamedprooshani/venvs/deepseek-v41/bin/python`. A second launch reached startup but was stopped before readiness because it lacked the bank path. Full real-model readiness remains pending.
- 2026-09-29 latest local installation: frontend build, lint, Prettier, Vitest (26 tests), Rust tests (21 tests), formatting, and clippy passed. A fresh Developer ID signed app is installed at `/Applications/Cachalot Studio.app`; its executable SHA-256 matches the fresh build: `e455666a997de2f560223c3f0499276508158eee66d3ea4c12eff333401140db`. The previous local app is saved at `.release/local-dev-2026-09-29-minimax-bank/previous-Cachalot Studio.app`, and the earlier signed builds remain in their own `.release/` backups. The app is not notarized or published and still carries version 0.1.0. macOS locked after installation, so native visual review and real-model launch of this final build require an unlocked session.
- 2026-09-29 runtime review: no new brief after 0.45.0. The clean runtime checkout advanced to Cachalot 0.45.1 commit `eae188ac0e6cf348d0ecfb3bd4ef670b064112bb`; its changelog describes benchmark-only MiniMax prefill kernels and no shipped server contract change. Studio's `runtime-contract/` records this reviewed version. The 0.45.1 CLI source confirms optional `--model-id`, `--default-max-tokens`, `--default-temperature`, and `--snapshot-dir` flags. Managed profiles now expose them without changing older profile defaults.
- 2026-09-29 local verification: frontend build, lint, Prettier, Vitest (26 tests), Rust tests (22 tests), formatting, and clippy passed. Fresh Developer ID signed app installed at `/Applications/Cachalot Studio.app`; executable SHA-256 matches the build: `2529171aaaa305e5854773177f90c4da29cfc77f3b3a637d32131432ed0cfb3a`. Previous installation is recoverable at `.release/local-dev-2026-09-29-serve-defaults/previous-Cachalot Studio.app`. Local build remains version 0.1.0 and is not notarized or published. Its saved MiniMax profile now names the internal expert bank, X10Pro mirror at fraction 0.13, model ID `minimax-m3`, 8192 default output tokens, temperature 1.0, and the existing prefix-snapshot directory.
- Native real-model gate passed on that installation: Dive launched Cachalot 0.45.1 MiniMax as Studio-owned PID 67976, reached Ready, and auto-connected. Chat replied `ready` with 2 output tokens to a short smoke prompt. Log recorded 170 prompt tokens, 23.25 s prefill, and 8.78 tok/s decode for this one request; these are diagnostic timings, not performance claims. Dive stopped the child and port 8011 became free. The test conversation remains in Studio's local saved chats. No abrupt-kill recovery or other model family was tested.
- 2026-09-29 owner response: "go ahead" approves proceeding with the current Abyss and Surface Dive mockups as the 0.2.0 design reference. The release is a backward-compatible minor capability release: managed local runtime control, saved conversations, and expanded Cockpit telemetry. Runtime 0.45.3 changed no shipped CLI or server code after the 0.45.1 native smoke test.
- 2026-09-29 release preflight: the first signed/notarized 0.2.0 build passed tests, Apple acceptance, Gatekeeper, DMG layout, and installed-bundle hash checks, but native inspection found a hard-coded `STUDIO 0.1.0` sidebar label. That preflight artifact was not published. The sidebar now reads the package version; a fresh source commit and fresh release artifacts are required.
- 2026-09-29 release verification: corrected source commit `e344ee92d8e93117d52fc137c41e9872c4a94878` built cleanly and passed Prettier, ESLint, TypeScript, Vitest (26 tests), Python mock tests (3), Rust formatting, clippy, and Rust tests (22). Apple accepted and notarized both app and DMG. The published ZIP SHA-256 is `d681c0bcf2108f34da46b9f7f7402488e804fa7430754167a9c0d379d03c7806`; DMG SHA-256 is `ece61f63f0642deac5fb239157070f8f7efb57d7fead212f5f5f654b8e18a506`. GitHub asset digests matched local hashes; the downloaded published DMG and checksum file matched byte for byte. The published DMG's app was installed at `/Applications/Cachalot Studio.app`, passed Gatekeeper, reported version 0.2.0, and its executable SHA-256 `f648edb9a0c7f533a158d7e82ab1a2262e8e60533a386aaad10028c47868888d` matched the mounted app. Earlier native inspection of the same release build showed `STUDIO 0.2.0`; the Mac was locked during post-download UI inspection. Prior local installation is recoverable at `.release/local-before-v0.2.0/previous-Cachalot Studio.app`. See the release's `RELEASE-REPORT.md` asset.
- 2026-09-29 CI follow-up: the 0.2.0 GitHub Actions run failed four machine-dependent Rust tests on the macOS 14 runner. Its Mach VM response returned fewer fields than the current libc structure, exposing a real host-memory telemetry compatibility issue; the runner also lacks Mac15,14 and Mac16,10 CoreTypes artwork assumed by icon tests. The 0.2.1 patch accepts a successful Mach VM response containing the fields actually used by the working-set calculation, and tests icon mapping with a local plist fixture plus the bundled icon. Local Rust tests and clippy pass. The runtime brief list is unchanged through 0.45.0; runtime source remains clean 0.45.3 at `9147c2d30ef25f64be4597bea1b018be16d71608` with no new Studio contract change.
- 2026-09-29 patch release verification: commit `f009a2de9260145d760588bcf265d5ffd4748ff7` passed Prettier, ESLint, TypeScript, Vitest (26), Python mock tests (3), Rust formatting, clippy, and Rust tests (21). Apple accepted and notarized the signed app and DMG; GitHub tag and release match the source commit. Published ZIP SHA-256 `f29cd3e330ad5900bdd21bf38b468d20efa355457dfa61a0a40d53bef155b6b8` and DMG SHA-256 `4b276b13e57e45f196329c1260e7dce23a748b2b24d3a92766976efd35df0c86` match GitHub asset digests. The downloaded public DMG and checksum file matched local artifacts. The app was installed from that DMG at `/Applications/Cachalot Studio.app`, passed Gatekeeper, reported version 0.2.1, and had executable SHA-256 `78c59732b046c9ee1c3bd9f83c03e436cbe4b8d274f3a079a56a21a45a1f5161`, identical to the mounted app. Native inspection showed `STUDIO 0.2.1`, Dive controls, Cockpit memory telemetry, and the matching Mac Studio icon. Both [push CI](https://github.com/prooshani/cachalot-studio/actions/runs/36635487006) and [tag CI](https://github.com/prooshani/cachalot-studio/actions/runs/36635487740) passed on macOS 14. Prior 0.2.0 installation is recoverable at `.release/local-before-v0.2.1/previous-Cachalot Studio.app`; see the 0.2.1 release's `RELEASE-REPORT.md` asset.
- 2026-09-30 release verification: Chat stores Thinking, maximum output tokens, and optional temperature per conversation using an optional field in the existing conversation file. Older files load with 2048 tokens, Thinking off, and server-default temperature. Dive adds optional `CACHALOT_LOOP_GUARD_INCREMENTING` for managed GLM/MiniMax profiles; new MiniMax profiles prefill 0.7 temperature while existing profiles keep their saved or inherited CLI value. Runtime contract and docs track Cachalot 0.47.0. Implementation commit `d0048e03f8338007e51131a7a2481e52d2020f6e` passed Prettier, ESLint, TypeScript, Vitest (27), Python mock tests (3), Rust formatting, clippy, Rust tests (22), and the Tauri release build. Apple accepted and notarized app and DMG. Published ZIP SHA-256 `160c5d06a5bfb1967cfb8e0b7fece2958012309f9a455bf6ad55f6e21619e32a` and DMG SHA-256 `59026f4edd6395ab951480fd7b18fcbd331122214f1d93e57cea8146ad2fc8b4` match GitHub asset digests. The downloaded public DMG and checksum file match local artifacts byte for byte. The installed app came from that verified DMG, passes Gatekeeper, reports 0.3.0, and has executable SHA-256 `5418f48b7aeaf9f1f2e0350bf6a0047e24bcc2f6e0e18bc63d0e580267526e52`, matching the release build. Native inspection showed Chat controls, Dive loop guard, a new MiniMax profile's 0.7 default, and the existing profile's retained 1.0. Both exact-source [main CI](https://github.com/prooshani/cachalot-studio/actions/runs/36706231164) and [tag CI](https://github.com/prooshani/cachalot-studio/actions/runs/36706229563) passed. The [release report](https://github.com/prooshani/cachalot-studio/releases/download/v0.3.0/RELEASE-REPORT.md) records notarization IDs and checks. The prior 0.2.1 installation is recoverable at `.release/local-before-v0.3.0/previous-Cachalot Studio.app`. Cachalot 0.47.0 integration was source-verified; the last live managed MiniMax smoke used 0.45.1.
- Next: continue runtime brief/source synchronization. Live GLM bank/prefetch and DeepSeek validation, media attachments, measured performance, and future editing/retry/search remain outstanding in [PLAN](docs/PLAN.md).

- 2026-09-30 local runtime-sync implementation: Dive exposes optional GLM bank path and enable switch (0.49+), predicted expert count, read limit, and scheduling (0.50+). Empty inherits the runtime default; explicit zero, Off, and store-policy -1 retain their meanings. Rust validates GLM-only controls, absolute paths, integer counts 0–288, and scheduling -1/0/1. The supervisor removes inherited GLM keys, checks enabled bank manifests, and leaves disabled paths unused. Older profile files remain readable; runtime source remains responsible for bank format/layer-file validity. Script path changes do not rewrite saved profiles. Runtime contract, README, changelog, managed-runtime documentation, and plan were updated. This is local, uncommitted work after published Studio 0.3.0.
- 2026-09-30 local verification: Vitest 29 tests, Rust 25 tests, Python mock 3 tests, TypeScript, ESLint, Prettier, Rust formatting, clippy, and signed Tauri app build passed. Native GLM form saved/reopened explicit 0 experts, read limit 3, and scheduling -1; Preview emitted the correct environment. A configured missing bank blocked launch with the expected bank.json error. The installed app matches all four fresh bundle files, executable SHA-256 `b093d969d4bdb4f3aa5abe115446d3ce01eca639c46db5febd369eeffa06a8ac`. Previous installation is recoverable at `.release/local-glm-runtime050-2026-09-30/previous-Cachalot Studio.app`. This local build is Developer ID signed, version 0.3.0, not notarized or published. The Rust toolchain emitted a missing libLLVM.dylib warning during optional debug stripping; the build completed and code-sign verification passed. A release build must recheck this toolchain warning.
- 2026-09-30 live gate: the installed app launched the saved MiniMax profile with runtime 0.50.1 as owned PID 30645, reached Ready, auto-connected, and streamed `ready` with 2 output tokens (16-token cap, explicit request temperature 0.7). The saved profile retained its server temperature 1.0. The request log recorded 170 prompt tokens, 157 reused, 13 prefilled, 5.31 seconds prefill, and 1.18 seconds decode; these are one-request diagnostics under host pressure, not performance claims. Dive stopped the process, PID exited, and port 8011 became free. Synthetic profiles and the smoke conversation were removed by restoring the byte-identical pre-test files; evidence is in `.release/local-glm-runtime050-2026-09-30/`. No live GLM bank, prefetch comparison, DeepSeek, or abrupt-kill recovery test was performed.

- 2026-09-30 continuation: caveman ultra, Jev MCP, and codebase-memory MCP were loaded and verified. The next bounded 0.4.0 slice adds Cockpit’s optional prefetch read/used totals, clearing missing, malformed, and offline values while preserving zero. Existing uncommitted GLM controls were preserved. Last reviewed runtime is Cachalot 0.50.2 commit `508be80adab16a77910ae86cde74ef70761499f1`; no new brief follows 0.50.0. The follow-up changes no shipped contract. Source contradicts the 0.50.0 brief’s GLM HTTP counter claim: `GlmEngine.stats()` omits the internal prediction totals, while DeepSeek exports them. The gap is recorded in `docs/RUNTIME_REQUESTS.md` and `runtime-contract/telemetry.yaml`. Silent running, measured performance, and live GLM testing remain outstanding. This implementation remains local and unreleased.

- 2026-09-30 prefetch slice verification: Vitest 30 tests, Rust 25 tests, Python mock 4 tests, TypeScript/build, ESLint, Prettier, Rust formatting, clippy, and a Developer ID signed Tauri app build passed. The first Rust command found no cargo on PATH; checks then used the installed stable toolchain explicitly. Optional debug stripping still warns that `rust-objcopy` cannot load `libLLVM.dylib`; the build completed and strict signature verification passed. Installed `/Applications/Cachalot Studio.app` matches all four fresh bundle files; executable SHA-256 `997106dd6f18631c16adbf946003ed34f3fe9d994286172ab2c2f8c230e602ba`. Previous app is recoverable at `.release/local-prefetch-2026-09-30/previous-Cachalot Studio.app`; `installation.json` records hashes. Native Cockpit displayed the synthetic 120/80 fixture without page scrolling in the standard window, cleared both counters on a healthy partial response, and showed offline after mock shutdown. The mock was stopped; no real model, profile, conversation, or credential was changed. This signed local build still reports 0.3.0; it is not notarized, committed, pushed, or published. The GLM controls and telemetry slice need a new minor release before an implementation push.

- 2026-09-30 image telemetry continuation: requested skills are active (caveman ultra, responding Jev MCP, and codebase-memory Verify evidence). Reviewed new 0.51.0 brief against clean Cachalot 0.51.2 commit `e45d6bcc4a1a46b6a711bb732f0d0c74b038f998`. Cockpit adds optional IMAGE INPUTS from `images_served`, preserving zero and clearing invalid, missing, disconnected, or unhealthy snapshots. The count includes resent history and increments before generation; it does not establish vision capability or completed replies. Mock `--image-stats` emits synthetic 7 and partial responses omit it. Existing local GLM/prefetch changes remain preserved. Studio image attachments, live GLM testing, silent running, measured performance, and the versioned release remain outstanding. This pass is local, uncommitted, and unreleased. Verification and local installation records will follow.

- 2026-09-30 image telemetry verification: Vitest 31 tests, Rust 25 tests, Python mock 5 tests, TypeScript/build, ESLint, Prettier, Rust formatting, clippy, and a fresh Developer ID signed Tauri app build passed. The focused new Cockpit test first failed because the image group was absent, then passed with zero, invalid, missing, and offline coverage. Rust checks and build used the installed stable toolchain on an explicit PATH. Optional debug stripping still warns about missing `libLLVM.dylib`; build and strict signature verification passed. Installed `/Applications/Cachalot Studio.app` matches all four fresh bundle files; executable SHA-256 `e76b90f698a5d22c60bc570eb58adc87cedb26d10e64993fa32f6b56f20cc5a0`. Prior app is recoverable at `.release/local-images-2026-09-30/previous-Cachalot Studio.app`. Native Cockpit showed IMAGE INPUTS 1 from the already-running external GLM server, synthetic 7 from the isolated mock on port 18011, then — on a healthy partial response and offline after mock shutdown. Standard window layout fits without scrolling. The external server was not launched, stopped, or sent a chat by this pass; telemetry observation is not a live GLM vision generation test. The mock was stopped and original endpoint `http://127.0.0.1:8011` restored and reconnected. Local build remains 0.3.0, signed but not notarized or published; combined local changes need a new minor release before an implementation push.

- 2026-10-01 continuation: requested ultra compression, Jev MCP, and codebase-memory MCP are available and verified. Both graphs are ready; task evidence uses Verify tier with path coverage checks. Brief list still ends at 0.51.0. Reviewed clean runtime 0.51.5 commit `88769ca17e328b51ee1b17e31aaa57108fead1f7`; source changes since 0.51.2 are package version only. Measurements and the unresolved GLM code-output corruption finding add no Studio contract change.
- 2026-10-01 silent-running slice: the plan did not define silent running. Pending owner preference, this bounded implementation uses visual quiet mode: a saved Settings switch replaces live Cockpit traces with explicit paused states and suppresses CSS and command-palette transitions. Readings, sampling, connection checks, and runtime generation continue. Default is Off, including older saved preferences. Existing local GLM, prefetch, and image telemetry changes are preserved. This is local, uncommitted, and unreleased; measured performance, Chat image attachments, live GLM tests, and a versioned minor release remain outstanding. Verification and installation records will follow.

- 2026-10-01 silent-running verification: Vitest 33 tests, Rust 25 tests, Python mock 5 tests, TypeScript/build, ESLint, Prettier, Rust formatting, clippy, and a fresh Developer ID signed Tauri app build passed. Focused checks cover preference persistence, toggling, paused trace rendering, continued snapshot readings, and restoration of live charts. Optional debug stripping still warns about missing `libLLVM.dylib`; the build completed and strict signature verification passed. Installed `/Applications/Cachalot Studio.app` matches all four fresh bundle files; executable SHA-256 `8867f2a325d113f251be7479651a3443da2cb04fea6a151f10b69a852352e22d`. Prior app is recoverable at `.release/local-silent-running-2026-10-01/previous-Cachalot Studio.app`; `installation.json` records hashes. Native Settings enabled silent running, Cockpit displayed paused traces while CPU/GPU/RAM readings changed, the command palette opened and closed, and app restart preserved the On preference. Turning Off restored live charts; the app was left on Cockpit with silent running Off, its initial setting. The standard Cockpit window fits without scrolling. No model was launched, stopped, or sent a chat. Local build remains 0.3.0, signed but not notarized, committed, pushed, or published. The combined local capability changes require a new minor release before any implementation push.

- 2026-10-05 continuation: caveman ultra, responding Jev MCP, and codebase-memory MCP are available. Verify evidence uses graph-discovered symbols, call traces, exact snippets, coverage, and targeted literal source checks. Read handoff and plan; preserved all existing uncommitted GLM/prefetch/image/silent-running work. Reviewed six new briefs through runtime 0.60.0 at `62c0f053576c191ac56893449932d175abf86537`. Runtime has an unrelated local `benchmarks/quality_blind_ab.py` edit; reviewed contract source is unchanged. Adopted DeepSeek Decode drops misses and System date reuse switches with exact/inherit semantics, compatibility/family validation, and output-quality/date warnings. The direct CLI remains exact by default; `serve.sh` alone changed to budget 0. Older saved profiles keep their defaults. Date reuse defaults On with seven-day window; inherited DAYS is removed to make that warning reliable. Cockpit image-input explanation now includes video steps. Runtime contracts and affected documentation updated. GLM media attachments, live GLM and DeepSeek tests, measured performance, and minor release remain outstanding. Work remains local, uncommitted, and unreleased. Verification and installation evidence will follow.

- 2026-10-05 DeepSeek slice verification: Vitest 35 tests, Rust 27 tests, Python mock 5 tests, TypeScript, production build, ESLint, Prettier, Rust formatting, clippy, diff whitespace checks, and fresh Developer ID signed Tauri app build passed. Native tests saved/reopened drop On/date Off and verified Preview budget 0/date 0, then selected exact Off and verified budget -1/date 0. Both warnings and form layout were inspected. Cockpit help now includes video steps. The installed app matches all four fresh bundle files; executable SHA-256 `e7cc4d0b3cdfa4cf08d4fb46e4b00eb73ad88d226dfb992163f15946a2340d8f`. Previous app is recoverable at `.release/local-deepseek-runtime060-2026-10-05/previous-Cachalot Studio.app`; installation and verification records live in that directory. Optional debug stripping still warns about missing `libLLVM.dylib`; build and strict signature checks passed. Synthetic profile was removed by restoring byte-identical original profiles.json; app restart confirmed only the original MiniMax profile, and the app was left on Cockpit. No runtime was launched/stopped or sent a generation request. Local build remains 0.3.0, signed, not notarized, committed, pushed, or published. Live DeepSeek/GLM validation, media attachments, measured performance, and the combined minor release remain outstanding.

- 2026-10-05 release preparation: the owner requested publication of the combined changes. Latest GitHub release is 0.3.0; 0.4.0 is a backward-compatible minor capability release for GLM/DeepSeek controls, optional telemetry totals, and saved visual quiet mode. Manifests, changelog, README, privacy, architecture, managed-runtime, release, plan, and handoff documents were updated before committing. Runtime briefs still end at 0.60.0; runtime commit remains `62c0f053576c191ac56893449932d175abf86537`. Existing local verification remains evidence of implemented controls, not a live GLM/DeepSeek run or performance claim. Release remains pending fresh exact-source checks, signing/notarization, publication, and local installation.

- 2026-10-05 Studio 0.4.0 publication complete: implementation `aa8d1a2a36ba19eb774d32ebd78d7419b01f74ca` and matching annotated tag `v0.4.0` are pushed. The public [release](https://github.com/prooshani/cachalot-studio/releases/tag/v0.4.0) ships GLM bank/prefetch controls, DeepSeek decode/date controls, optional prefetch/image totals, and saved Silent running. Fresh exact-source checks passed: 35 Vitest, 27 Rust, 5 Python mock tests, TypeScript/build, ESLint, Prettier, Rust formatting, clippy, and signed Tauri build. App notarization `2bfb74ce-448d-47a8-8521-ed68b4926ae1` and DMG notarization `8c165511-d261-4fdc-9b1d-e6c242c5abbd` were accepted; signature, staple, Gatekeeper, and DMG integrity checks passed. All seven public assets downloaded and matched local hashes. ZIP SHA-256 `aa5ff9319dc47a0ba1cd85039e330fca0d9168b89a190c0d75ab7d6c9f36bafc`; DMG `5283c395c9d61c56773ad16c9c77b74b49bf5ad887bd6f9ac223b1783f1ec365`. Both exact-source [main CI](https://github.com/prooshani/cachalot-studio/actions/runs/37299843819) and [tag CI](https://github.com/prooshani/cachalot-studio/actions/runs/37299844138) passed. Installed from the downloaded public DMG at `/Applications/Cachalot Studio.app`; every bundle file matches the fresh notarized build, version is 0.4.0, executable SHA-256 `de889d20ec72963087ed06be1d6d382fc22701993ed5e699f0d943b33763c31f`. Native release inspection confirmed Cockpit, Silent running Off, DeepSeek warnings/defaults, and GLM controls; test draft cancelled and original profile retained. Previous app is recoverable at `.release/local-before-v0.4.0/previous-Cachalot Studio.app`. The [release report](https://github.com/prooshani/cachalot-studio/releases/download/v0.4.0/RELEASE-REPORT.md) records full evidence and the optional libLLVM stripping warning. No live GLM/DeepSeek launch or performance claim; those plan items remain outstanding.

- 2026-10-05 SSD/validation continuation: the owner selected SSD telemetry plus GLM/DeepSeek validation only for the 0.5.0 slice; model discovery and Keychain remain outside scope. Caveman ultra, Jev live decision, and both ready code graphs were verified. Studio was clean after the 0.4.0 publication follow-up. No new runtime brief after 0.60.0; current runtime 0.60.1 `9d11bc061dcb434c40494be3d507521194d376dc` is clean, and its diff changes measurement tools/docs/version only. Cockpit adds physical-drive read/write MB/s, drive selection, two-minute history, explicit unavailable/reset states, and a separate Runtime storage view. 38 UI and 28 Rust tests passed, alongside types/lint/clippy and signed native build. Installed app matches fresh bundle files; 0.4.0 public app preserved under `.release/local-ssd-2026-10-05/previous-Cachalot Studio.app`. Native drive selection and live offline readings passed. GLM/DeepSeek live validation is blocked by another session's `quality_blind_ab.py --n 48` (observed PID 33189, about 56 GiB). It was left untouched; no second model started and no user profile changed. See [SSD and model validation](docs/SSD_VALIDATION.md) for the sequential matrix and pending machine gate. Work remains local, uncommitted, and unreleased; the installed local development app still reports 0.4.0.

- SSD final local verification: after chart spacing refinements, Drives and Runtime both fit the standard 1380 × 860 native window. Silent running pauses SSD traces while current rates continue; the initial Off setting was restored. The app remains on Cockpit/Drives. Final installed executable SHA-256 `16aef4026c0804f6ff9457d3f7253062223fe21e02cc6d49c1e74820a0315988` matches the fresh signed build and every bundle file was compared. TypeScript, lint, Prettier, and diff whitespace checks pass. Native GLM/DeepSeek launch/stream/stop tests remain pending the unrelated quality sweep. No implementation commit or push was made.

- 2026-10-05 Discovery/Keychain continuation: the owner explicitly expanded the local 0.5.0 slice. Earlier SSD changes remain intact. Caveman ultra, Jev decision support, and codebase-memory Verify evidence were used; final material-path coverage generation `2026-10-05T15:40:34Z` reports no recorded gaps and metadata matches (best-effort, not completeness proof). Briefs still end at 0.60.0; reviewed clean runtime 0.60.1 `9d11bc061dcb434c40494be3d507521194d376dc`, with no new Studio API contract. Dive now scans chosen folders for supported model metadata within explicit depth/size/count limits and opens editable unsaved drafts. API adds optional endpoint-bound macOS Keychain save/replace/forget, saved-key startup reconnect, and typed session overrides; stored secrets never return to the WebView or copied examples. Managed auto-connect excludes Keychain. HTTP redirects are disabled. Product/privacy/architecture/plan documentation updated.

- Discovery/Keychain verification: 41 Vitest tests and 31 normal Rust tests passed, plus the explicitly run isolated real macOS Keychain CRUD test. TypeScript, ESLint, Prettier, Rust formatting, clippy, diff whitespace checks, and Developer ID signed Tauri build passed. Optional stripping retains the known missing-libLLVM warning; strict signature verification passed. Every installed bundle file matches the fresh build; executable SHA-256 `9ddcfb4249b7022b156848bfb6def1fed6c8327cf62f45817702b1f6b12c51ba`. Previous SSD app is recoverable under `.release/local-discovery-keychain-2026-10-05/previous-Cachalot Studio.app`, with `installation.json` hash evidence. Native scans found GLM/MiniMax under `/Volumes/X10Pro/models` and DeepSeek under `/Volumes/X10Pro/Flash4-1`; GLM opened as an unsaved draft with blank Python, and Cancel preserved the original MiniMax profile. Missing-folder error and native API Keychain layout/empty-key save-disabled state were inspected. No user key was entered or saved; UI save/forget/override/origin tests use mocks, and native Keychain CRUD uses its isolated synthetic service. Native authenticated saved-key reconnect across restart is not yet exercised. App returned to Cockpit/Drives with original endpoint and preferences. The unrelated quality benchmark PID 33189 still owns about 55 GiB and the GPU; no second runtime launched. Live GLM/DeepSeek validation remains pending. This local build still reports 0.4.0, is signed but not notarized, committed, pushed, or published; the combined new capabilities require a new minor release before an implementation push.

- 2026-10-05 Dive design refinement: the owner supplied screenshots and requested a thorough interface pass. Applied Apple Design and Emil Design Engineering guidance while retaining the existing Studio visual language. Fixed link-margin displacement of Delete with a separate 40-pixel destructive control and inline Keep/Confirm flow; actions share consistent gaps. Launch preview is labeled, separated by a 24-pixel inset/divider, dismissible, and bounded for long code. Profile details use one state badge, wrapping paths, and better spacing. Discovery uses a compact adjacent scan action and separated result/action rows; forms align variable-length labels and distinguish launch settings/tuning. Runtime output is collapsed by default. Surface primary-button text contrast is corrected for Dive. Also fixed cross-profile runtime actions and stale asynchronous previews, with focused regression tests. Existing SSD/discovery/Keychain work remains preserved. No new runtime brief follows 0.60.0; reviewed clean runtime 0.60.1 `9d11bc061dcb434c40494be3d507521194d376dc`. Graph Verify coverage of changed code/styles reports metadata matches with no recorded gaps, generation `2026-10-05T16:43:03Z` (best-effort only).

- Dive verification: 45 frontend tests, TypeScript, ESLint, Prettier, production build, and diff whitespace checks pass. Native signed-app inspection covered overview, action alignment, preview show/hide, Delete/Keep cancellation, editor, discovery results, and log disclosure; both themes were inspected in the standard window and original System appearance/Silent Off restored. Smaller breakpoints are source-reviewed, not a native subminimum-window test. No user profile/conversation/key changed and no runtime started/stopped. Final installation/signature hash evidence follows. This pass remains local, uncommitted, and unreleased, with the development app reporting 0.4.0; any implementation push requires the combined versioned release gate.

Final local installation: all four bundle files match the fresh Developer ID signed build; strict signature checks pass. Executable SHA-256 `7b6c6208032d2cb3748699829f01e0ca9cf38e58b7bcc19481eb99698f33a5fe`. Original pre-design installation is preserved at `.release/local-dive-design-2026-10-05/previous-Cachalot Studio.app`, with hashes in `installation.json`. Local version remains 0.4.0; no notarization or publication.
