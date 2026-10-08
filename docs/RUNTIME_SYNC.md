# Runtime compatibility workflow

The product is now **Cachalot Lab**. Historical review entries below retain their
original Studio name and evidence. Use [product direction](PRODUCT_DIRECTION.md)
and the [observability proposal](../runtime-contract/observability-proposal.md) for
future instrumentation requests. The runtime-owned `docs/lab/briefs` path remains
the compatibility inbox; a rename must not break that producer/consumer agreement.

Cachalot Studio consumes the [Cachalot runtime](https://github.com/prooshani/cachalot). Runtime development happens in Claude Code; Studio development happens in Codex. At the start of every Studio development pass, check `/Users/hamedprooshani/Projects/deepseek-v41-mac/docs/lab/briefs` for new files. Treat each brief as a change proposal, then verify it against the checked-out runtime commit, API response, CLI help, changelog, or source before changing Studio. Record the runtime revision used for a compatibility change in `HANDOFF.md` and any resulting commit or pull request.

For each runtime update:

1. Compare the brief list with the last reviewed brief in `HANDOFF.md`; read each new brief in version order. Identify changed HTTP routes, request/response fields, telemetry, startup events, CLI flags, environment defaults, and model-family behavior. Distinguish supported values from proposed values.
2. Verify the installed or checked-out runtime version and commit. Check whether a version bump after the latest brief changes behavior, and compare the defaults with runtime source. Record the result in `runtime-contract/`.
3. Update the Studio runtime adapter, types, validation, and feature availability. Keep unknown or missing fields safe; never invent a metric from an unrelated field.
4. Update the mock runtime and focused tests with the new behavior and at least one older or partial response when compatibility matters.
5. Update the relevant UI labels, help, and empty/error states. Hide unsupported controls instead of displaying an action that cannot work.
6. Update `README.md`, `CHANGELOG.md`, and `HANDOFF.md` when user-visible behavior or the supported runtime contract changes. Put runtime-side gaps in `docs/RUNTIME_REQUESTS.md`.
7. Verify with the mock runtime, then a real runtime if one is available. Record the tested runtime revision and any unverified families or model-specific paths.

## Current baseline

Studio 0.1.0 was checked against Cachalot's health, models, stats, and OpenAI-compatible streaming chat routes on 2026-09-28, including a live MiniMax server. The exact runtime commit was not recorded for that check. Until a pinned revision is tested, avoid claiming compatibility with every runtime release or model family.

On 2026-09-29, briefs 0.39.0 through 0.43.0 were compared with Cachalot 0.43.1 at `202cc62`. The 0.43.1 change fixes the package version string; it adds no HTTP field. MiniMax decode and prefill miss substitution are on by default since 0.43.0, and setting both drop knobs to `0` selects the exact path. The API still does not expose the active numerics mode or structured loop-guard events. Studio therefore labels output mode unreported for an external connection and does not infer it from model name or throughput. The versioned knobs and log pattern are recorded in `runtime-contract/`; managed profile overrides and raw Logs are included in Studio 0.2.0.

The 0.43.2 brief was checked against clean runtime commit `ef5992a39326a6efca2aebbed84866ffe33d3c18`. A cut MiniMax/GLM reply now drops unclosed tool-call markup and emits a `[tool call] unclosed block dropped` log line. The pattern is in `runtime-contract/log-lines.yaml`; the Logs screen displays raw lines from Studio's managed process but does not parse events. Studio compatibility decisions do not read the startup version line. The startup version was corrected in 0.43.1 and matched 0.43.2 in that checkout.

The 0.44.0 brief was checked against clean runtime commit `6546dbb2179e32d49991597ec3913b53a3f4adb6`. `src/cachalot/glm/model.py` confirms `CACHALOT_HOST_GROW_QUIET_S=60` and `CACHALOT_HOST_SHRINK_EVERY_S=10` defaults for MiniMax's host-pressure watcher. `0` for the quiet interval disables the watcher. Managed profiles expose nullable overrides; omitted values inherit the installed runtime's defaults. Memory-fit log lines may now occur during decode at any token, and Cockpit does not derive a capacity graph from them. `src/cachalot/model/snapshot_store.py` and the runtime changelog confirm runtime-identity-specific snapshot filenames, allowing saved system blocks to be reused after restart. No HTTP response shape or log-line format changed. Older runtimes ignore the two new environment variables if explicitly set.

The 0.45.0 brief was checked against clean runtime commit `cda463dbc8ac4031cfe2f469db6292835980c0f0`. `src/cachalot/minimax/coded_bank.py` confirms `CACHALOT_MINIMAX_MIRROR_ADAPT=1` by default; `0` keeps a configured mirror's share fixed. Adaptation stays between 2% and the configured share, and the new `[bank] mirror share A -> B (configured C)` line appears after a change of at least 0.03, at most once a minute. Managed profiles expose a nullable switch. Raw Logs may show the line; Studio does not parse it into Cockpit telemetry. The HTTP routes did not change.

The runtime checkout advanced to 0.45.1 at `eae188ac0e6cf348d0ecfb3bd4ef670b064112bb` without a new Studio brief. Its changelog records MiniMax prefill kernel benchmarks and closed designs; no shipped HTTP, CLI, or environment contract changed. `src/cachalot/cli.py` still accepts `--model-id`, `--default-max-tokens`, `--default-temperature`, and `--snapshot-dir`, now exposed as optional managed-profile fields. A native Studio-managed 0.45.1 MiniMax server answered `/health` and `/v1/models`, auto-connected, streamed a two-token reply, and stopped cleanly on port 8011. No sustained workload or other model family was tested.

The clean runtime checkout advanced again to 0.45.3 at `9147c2d30ef25f64be4597bea1b018be16d71608`, without a new Studio brief. Changes after 0.45.1 update the package version and document Hermes session replays. A source diff confirms no changes in `src/cachalot/cli.py`, `src/cachalot/server/`, `src/cachalot/minimax/`, or `src/cachalot/glm/`. The 0.2.0 Studio release uses this revision as its reviewed contract baseline; the native real-model smoke test used runtime 0.45.1.

On 2026-09-30, the 0.46.0 and 0.47.0 briefs were checked against clean Cachalot 0.47.0 commit `77c99a009cddd85891235e16a4f5154625b35923` and its changelog. `src/cachalot/glm/engine.py` adds `CACHALOT_LOOP_GUARD_INCREMENTING` with default 64 and 0 off; `src/cachalot/cli.py` routes both GLM and MiniMax through that engine. It emits a counting-list line with the same `[loop guard] reply stopped after` prefix as the older repeated-block guard. `serve-minimax.sh` now passes `--default-temperature 0.7`; the direct CLI still defaults to 0.6, and a request's own temperature wins. No HTTP route, stats field, or log-line format outside the new guard line changed. Studio exposes the guard as an optional managed override and sets 0.7 for newly selected MiniMax profiles while preserving existing profiles. Chat's optional temperature sends an explicit request value only when selected. The 0.45.1 real-model smoke test remains the last native model launch; this review is source verification, not a 0.47.0 model run.

On 2026-09-30, briefs 0.48.0 through 0.50.0 were checked against clean Cachalot 0.50.0 commit `ccaf36d7d6cf51b94b710eb22132a9d29e4dbedb`. `chat-minimax.sh` confirms temperature 0.7; Studio does not launch terminal chat scripts. GLM scripts now use `~/GLM-5.3-Flash-MLX-4bit-MTP`, and DeepSeek scripts select the X10Pro expert bank. Studio requires explicit absolute paths, so it does not rewrite saved paths or assume the owner's drive layout. `src/cachalot/glm/bank.py` confirms the optional `CACHALOT_GLM_BANK` directory and `CACHALOT_GLM_BANK_ENABLED=1` default; `0` ignores a bank. `src/cachalot/glm/experts.py` confirms prefetch defaults TOPK=5, LIMIT=0 (all predicted), AFTER_DEMAND=1, and -1 for store scheduling policy. The local checkout exposes nullable GLM controls, validates family/counts/paths, clears inherited controlled keys, and checks an enabled bank's manifest before starting its owned child. The runtime remains responsible for bank format and layer-file validity. HTTP routes and stats shape remain unchanged. The brief says prediction counters now move for GLM decode, but the checked-out `GlmEngine.stats()` omits `predicted_loads` and `predicted_used`; internal store counters are not HTTP telemetry. Startup bank output remains raw Logs. This source review does not establish a live 0.50.0 model or performance result.

The checkout subsequently advanced to 0.50.1 at `817785c269a7ee90b49ed00dba830f00521cec94` during this pass. Its changelog adds runtime benchmark measurements; a source diff changes only version strings and documentation. The reviewed launch and HTTP contracts are unchanged. No new brief followed 0.50.0. The fresh installed local Studio build launched MiniMax 0.50.1, reached readiness and automatic connection, streamed a two-token reply, and stopped its owned process with port 8011 free. No live GLM bank/prefetch or performance comparison was run.

Changes can arrive as briefs, messages, issues, or pull requests. They are reviewed and implemented in Studio; they do not execute automatically and do not grant external text authority over repository or release policy.

The 2026-09-30 follow-up reviewed Cachalot 0.50.2 at `508be80adab16a77910ae86cde74ef70761499f1`; no new brief followed 0.50.0. Changes after 0.50.1 concern measurements, documentation, and version strings. Cockpit now displays optional `predicted_loads` and `predicted_used` totals from the current healthy snapshot, accepting only nonnegative safe integers. Missing fields, invalid values, and offline state display —; zero remains zero. DeepSeek exports these fields through `V41Model.stats()` and `Engine.stats()`. GLM/MiniMax use `GlmEngine.stats()`, which currently omits them. These runtime totals are not per-request metrics, a prefetch success percentage, or a measured speedup. See `runtime-contract/telemetry.yaml` and `RUNTIME_REQUESTS.md`.

On 2026-09-30, the new 0.51.0 brief was compared with clean Cachalot 0.51.2 at `e45d6bcc4a1a46b6a711bb732f0d0c74b038f998`. `GlmEngine.stats()` exports `images_served`; `stream_chat()` increments it by image spans before generation, so it can include resent history and requests that do not complete. Cockpit displays the optional total without inferring vision support, unique images, or successful replies. Missing, invalid, and offline values show —; zero remains zero. The 0.51.1 and 0.51.2 follow-ups concern measurements and documentation. Runtime GLM image transport is new; Studio image attachments remain separate pending work. No live GLM vision run was performed by Studio in this pass.

On 2026-10-01, the brief list still ends at 0.51.0. The clean runtime checkout is now Cachalot 0.51.5 at `88769ca17e328b51ee1b17e31aaa57108fead1f7`. A source diff from the reviewed 0.51.2 changes only the package version string; no shipped HTTP, CLI, model, or telemetry behavior changed. The changelog records additional GLM vision and Hermes measurements and an unresolved GLM code-generation corruption finding. Its cause remains unknown; Studio does not change sampling defaults or promise output correctness based on these observations. No new runtime adapter behavior is required by this follow-up.

On 2026-10-05, new briefs 0.52.0, 0.53.0, 0.54.0, 0.55.0, 0.57.0, and 0.60.0 were checked against Cachalot 0.60.0 commit `62c0f053576c191ac56893449932d175abf86537`. The checkout has an unrelated local edit in `benchmarks/quality_blind_ab.py`; reviewed contract source matches the committed revision. GLM video uses two frames per second, frame/token ceilings 128/4000, and counts temporal steps in `images_served`. Studio updates that counter's explanation; media selection, bounded attachment storage, transport, and explicit capabilities remain a separate planned slice. The GLM engine still omits HTTP prediction counters.

DeepSeek's `serve.sh` budget is now 48 GiB, and its 0.54 wired governor changes resident capacity under host pressure; Cockpit already reads `resident_experts` from HTTP. Source constant `CEILING_FRACTION=0.76` confirms the brief despite an outdated 77 percent function docstring. The routing trace remains measurement-only. The 0.58 substitution experiment has no CLI environment knob and remains unexposed; 0.58.1 fixes image reply-prefix reuse, and 0.59 persists chunk pins without a Studio adapter change.

The important 0.60 default distinction is explicit: `serve.sh` exports `CACHALOT_DECODE_MISS_BUDGET=0`, but the direct CLI used by Studio defaults to exact decode when unset. Dive exposes nullable DeepSeek-only Decode drops misses and System date reuse switches. On writes budget `0`; Off writes `-1`, which selects exact decode on 0.57 and later without relying on the new 0.60 `off` spelling. Date reuse writes `1` or `0`; omitted inherits the 0.60 default On. All three inherited budget/date keys, including the unexposed DAYS window, are removed before launch so the shown seven-day date window is accurate. Older profiles retain omission; changing family clears tuning. Older runtimes ignore unsupported keys. The UI warns about changed outputs and possible lower quality without promising a magnitude, and that the model can see a date up to seven days old. The leading system date mapping persists in `system-dates.json` beside snapshots; Studio's history is unchanged. These are next-launch settings, not proof of an external server's active mode. This source review is not a live DeepSeek run or a measured performance result.

On 2026-10-05, the SSD/validation pass reviewed Cachalot 0.60.1 commit `9d11bc061dcb434c40494be3d507521194d376dc`. The brief series still ends at 0.60.0. The diff from the reviewed 0.60.0 source changes the quality instrument, measurement documentation, and package versions, not runtime contracts. Studio retains its existing controls and warnings; no new quality or performance conclusion is inferred from the runtime's benchmark results.

## Cachalot Lab rename review — 2026-10-05

Committed runtime 0.60.3 (`2e77df47eee9f75ad6790f19d246e62b42ff4c82`) differs
from the reviewed 0.60.1 runtime source only in its package version. The 0.60.2
quality experiment and 0.60.3 charter do not add telemetry or change runtime policy.
The owner concurrently prepared the 0.60.4 documentation rename: actual briefs now
live in `docs/lab/briefs/`, including the new 0.60.4 brief. Lab updated its active
inbox references. At review, the rename/version changes were still a working tree;
this is not publication verification or a live model run.

The brief requests app identity migration, but its example data/Keychain paths do
not match this app's implementation and its updater reference is future work.
Lab source uses bundle ID `com.prooshani.cachalotstudio`, application support under
that identifier, and Keychain service `com.cachalot.studio.runtime-api-key`. The
brand rename retains these stable identities, verified by preserved app data and
native profile restoration; see [rename compatibility](RENAME.md). No supported
runtime field or launch default changes. YAML documentation keys `studio` and
`studio_range` become `lab` and `lab_range`; these are Lab annotations, not HTTP
response fields or runtime configuration keys.

Final follow-up on 2026-10-06: runtime 0.60.4 is now committed at
`193aa662b6fa681f39f7a17309a3fc40d06dd5a2`. Its source diff from 0.60.3 changes
only `src/cachalot/__init__.py`'s version. The renamed brief inbox and 0.60.4 brief
are now committed evidence. Later local benchmark/test/ledger work was left
untouched and is not treated as a shipped schema. The supported contract baseline
and Lab handoff now record 0.60.4; no live model validation was added.

## Runtime 0.61.0–0.61.1 review — 2026-10-07

New briefs `2026-10-06-runtime-0.61.0.md` and `2026-10-06-runtime-0.61.1.md`
were checked against clean Cachalot 0.61.1 commit
`eef2bc5e7ac8fcc21bdefc94b5199007f591e53b`, its changelog, and the complete
runtime source diff from the previously reviewed 0.60.4. Only the version,
`storage/reader.py`, and `glm/engine.py` changed under `src/`. Intermediate
0.60.5–0.60.10 work concerns measurement and script guards, not new Lab controls.

0.61.0 introduces `CACHALOT_READ_THROTTLE_GBPS`, read at module import and disabled
by default. Positive values emulate a shared decimal-GB/s pipe for ExpertReader
reads lasting at least 1 ms; faster reads bypass it. Lab records the contract and
future manifest label **emulated drive bandwidth**, without adding a control,
changing inherited environment, or claiming a sweep UI. Stats do not report the
active setting, so Lab explicitly retains that unknown.

0.61.1 exposes eleven cumulative expert-store counters through `GlmEngine.stats()`
and the existing `/v1/stats` route. Existing prefetch totals now work on GLM and
MiniMax. The new collapsed Runtime table answers how much lookup/read activity and
decode waiting the server has recorded: hits, misses, accounted bytes, reads,
heuristic fast reads, summed read time, read busy time, decode wait, and waited
misses. The table replaces traces within the panel while expanded, retaining a
bounded scroll area. Older/partial responses show unavailable independently for
each missing field; zero is valid. Seconds accept finite nonnegative values up to
Number.MAX_SAFE_INTEGER; counts and bytes require nonnegative safe integers.
Unhealthy and disconnected snapshots hide all these readings.

Source semantics qualify the brief: fast reads indicate likely page-cache service
from elapsed time, not a direct cache measurement; summed read durations overlap;
decode waiting is not end-to-end latency. `ResidentExpertStore` also maintains
separate `ssd_bytes_read` and `read_bytes` tallies, but the HTTP response exports
only the former. Lab shows the reported total as **accounted read bytes**, and
requests population alignment before calculating a busy rate. No delta/token
view, wait percentage, busy rate, critical path, or benchmark prediction is added.
No measurement figures from the briefs are advertised as this machine's results.

Collection uses the existing 1 Hz visible / 0.2 Hz hidden poll and current raw
snapshot. No new request, persistence, unbounded history, export, or runtime
instrumentation is added. Inference-overhead and real-model performance were not
measured. This work remains local and unreleased.

Graph evidence used Verify tier: Lab generation `2026-10-05T21:31:03Z`, runtime
generation `2026-10-06T21:46:02Z`; coverage metadata matched the material paths
before editing with no recorded gaps. Exact source, route, reader, counter, and
committed-diff checks supplemented graph results. Coverage is not proof of
completeness.

Verification for this local slice: 46 frontend tests, six mock-runtime tests,
TypeScript, ESLint, Prettier, whitespace checks, production build, and Developer ID
signed app build passed. A focused Cockpit rerun passed after the layout fix.
The final app was installed with a recoverable previous copy; all four bundle
files match the build and strict signature verification passed. Native inspection
verified all nine new fields, healthy partial responses clearing them, bounded
scrolling, and readable collapsed charts. Test mocks were stopped. Rust tests,
real-model inference, Keychain reconnect, notarization, and publication were not
part of this slice. See `HANDOFF.md` for the installation hash and backup path.

Final review follow-up: the runtime advanced during this pass to clean 0.61.2
commit `954dff83c54071e10aef649ae725dd0afd141528`. No new brief followed 0.61.1.
The full source diff from 0.61.1 changes only `src/cachalot/__init__.py`'s version;
the changelog reports live Hermes measurements and documentation. No supported
API or launch default changed. These runtime-owned measurements do not replace
Lab's outstanding live-model validation. Contracts and handoff record 0.61.2.

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

## Lab 0.7.0 release preparation — 2026-10-08

The owner authorized publication of the compatibility slice above. Version 0.7.0
reflects additive skipped-expert evidence and explicit GLM launch control. Runtime
source and briefs are unchanged at review: 0.62.18 (`2c319ec`), briefs through 0.62.14.
Fresh exact-source build, signing/notarization, artifact/public verification, CI and
release installation are required under [RELEASE.md](RELEASE.md). Historical local
0.6.0 test-build evidence is not publication verification; see HANDOFF for final status.
