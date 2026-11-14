# Runtime 0.73–0.85 adoption — Lab 0.12.0

Reviewed every new brief after 0.72.2, through 0.85.1, against clean Cachalot
**0.85.2**, commit `a8638c1860d32484ce518596190830f96d14eec7`, on 2026-11-14.
Compared launcher scripts, CLI, both serving engines, snapshot identity, image
preprocessing, GLM expert reads, and changelog. 0.85.2 adds measurements and
instruments only. Runtime source was not modified.

## Explicit next-launch settings

Lab uses `python -m cachalot.cli serve`, not the convenience launch scripts.
All eight new profile fields are nullable, omitted fields retain direct CLI
defaults, inherited environment values for these controls are removed, and
family changes clear them. Profile store version and existing saved paths stay
unchanged. Newer settings require the indicated runtime; older versions may
ignore unsupported keys. Requested settings never establish active mode.

| Setting                                | Direct CLI default               | Script difference       | Lab validation                         |
| -------------------------------------- | -------------------------------- | ----------------------- | -------------------------------------- |
| DeepSeek DI-2 decoder keep, 0.74+      | Unset: DI-1 exact 2,541-row tail | serve.sh 0.75+: 140     | 128–2,541; explicit DI-1 On required   |
| DeepSeek exact tool-call decode, 0.76+ | Off                              | serve.sh 0.77+: On      | Nullable On/Off                        |
| DeepSeek vision minimum pixels, 0.79+  | Off                              | serve.sh 0.80+: 810,000 | 0–16,000,000; upper bound is Lab limit |
| GLM vision minimum pixels, 0.81+       | Off                              | None                    | 0–16,000,000; Lab limit                |
| GLM block snapshot pins, 0.83+         | 3                                | None                    | 0–8; Lab limit, 0 disables             |
| GLM whole-layer read-ahead threshold   | 128                              | serve-glm.sh 0.84+: 512 | 0–1,048,576; Lab limit                 |
| GLM prefill predicted experts, 0.85+   | 0, Off                           | None                    | 0–288                                  |
| GLM per-layer prefill log, 0.85.1+     | Off                              | None                    | Nullable On/Off                        |

DI-2 is approximate and output-changing. Its 1017 long quality gate was within
noise, not a universal guarantee. Snapshot tags append `-keepN`; changing the
setting can require one cold prefill per system block. Empty keeps DI-1's exact
tail; disabling DI-1 requires clearing the replay setting. Tool-exact lifts an
enabled decode miss budget from the DSML opener through reply end, then restores
it; it can change outputs and slow cold tool calls. It is inert without a budget.

Vision settings change small-image outputs and increase prompt tokens under the
runtime token ceilings. DeepSeek values at or below 544 × 544 retain checkpoint
preprocessing; GLM 0 disables upscale and video is unchanged. DeepSeek image
span keys include the nonstandard minimum; GLM image digests include its setting.
Lab Chat still does not accept media attachments. These controls support other
clients using the managed server, without claiming live OCR quality validation.

GLM pins and read-ahead preserve outputs. Pins persist chunk-boundary snapshots,
approximately 0.3 GiB each, at most eight; MiniMax keeps none. `reused=` can name
a chunk boundary and is not a whole-system-block hit. Predicted prefill read-ahead
remains Off: runtime 0.85.1 closed its speed benefit within machine variation.
No performance improvement is promised by Lab.

## Observed evidence and its limits

Question: which checkpoint, bank, and output-changing modes did this owned process
announce? Dive extends the existing first-64-KiB startup reader with DI-2 row
count, exact tool-call On, family-specific vision minima, and GLM bank basename.
Only complete lines before server readiness qualify. Missing lines, older runtimes,
stopped processes, and external servers stay unreported; absence never means Off.
DeepSeek 0.73 script checkpoint defaults to 1017; Lab keeps explicit saved paths.
GLM 0.82 script prefers a byte-verified internal bank, but Lab does not silently
select it. Baselines from different checkpoint/storage configurations cannot be
treated as equivalent.

Question: which GLM prefill layer calls waited longest for experts? Logs and Dive
offer a collapsed table of the latest 100 complete `[prefill-layer]` observations
within the existing recent 64 KiB output. Fields are visible line number, layer,
chunk row count, routed expert count, read-ahead kind/count, and store hand-back
wait in milliseconds. These are measured runtime waits, not request latency,
exposed stalls, or critical-path evidence. No request/chunk IDs are emitted;
repeated row counts or groups of 42 lines cannot safely establish boundaries in
partial/interleaved logs. Lab does not sum waits or infer request totals. Raw
output stays unchanged; a poll replaces the excerpt and rows can be omitted.

Collection is explicitly Off by default and can emit about 380 lines for a cold
15.6k-token block. Runtime logging, polling, and rendering overhead are unmeasured.
No new collector, endpoint, durable history, export, request, or storage schema is
added. Existing local log retention/privacy rules apply; no credentials or prompt
capture fields are added.

## Other reviewed changes

- 0.77.1 shortens oversized chat `max_tokens`/`max_completion_tokens` to remaining
  context room for all three families. A prompt leaving no room still fails;
  reaching the cap reports `finish=length`. `/v1/completions` still rejects
  oversized requests. Lab's existing content/finish/error handling remains valid;
  no client-side cap or failure inference is added.
- 0.78 rare-expert skip and minimum-row knobs remain contract-only. 0.78.1 failed
  the long quality gate and closed the lever. Its optional `rare_skip=` is
  cumulative expert count plus cumulative mass percentage, not per-request data;
  percentage subtraction cannot recover per-request mass. Raw logs preserve it.
- 0.79–0.81 measurements and 0.85.2's parked larger-budget GLM experiment do not
  establish general speed/quality gains or justify automatic memory tuning.

Validation covers profile serialization/compilation, family/bounds/dependency
rejection, explicit Off/zero, older-field defaults, save/reopen/family clearing,
startup unknowns/partial lines, bounded layer parsing and collapsed/raw rendering.
Native synthetic inspection and release artifact checks are recorded in HANDOFF
and the release report. No live family generation, independent model quality,
matched performance/overhead, or authenticated saved-key restart is certified.
