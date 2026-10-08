# Runtime requests

## Research direction and priority

[Cachalot Lab's mission](PRODUCT_DIRECTION.md) prioritizes trustworthy evidence,
reproducible runs, and a measured token timeline. The [observability proposal](../runtime-contract/observability-proposal.md)
orders runtime requests: identity/capabilities and counter lifetimes; request timing
and active settings; correlated token/dependency events; memory/I/O/expert lifecycle;
power provenance; validated performance models. This is a request backlog, not a
supported API. Each item needs source verification, compatibility fallback, raw-evidence
semantics, and measured overhead before adoption. Existing requests below remain valid.

Requests will be recorded here with motivation, proposed API shape, and Lab fallback. Initial candidates: per-expert residency, structured startup events, telemetry parity across families, native YAML config, and prefill progress.

The Cockpit currently plots reported `decode_tps`, `expert_hit_rate`, `ssd_gbps`, and available counters from `/v1/stats`. Whole-Mac CPU/GPU/RAM samples come from macOS, not Cachalot. To make model attribution and the four memory tiers measurable, request these optional fields in the runtime API:

- Per-tier occupied bytes, capacity bytes, and residency or eviction counts for Surface, Twilight, Midnight, and Abyss. Until exposed, Lab labels tier occupancy unavailable.
- SSD read/write throughput, queue depth, and read latency for Cachalot's own I/O. `ssd_gbps` gives a read-rate trace; it does not measure SSD pressure.
- Prefill tokens per second, time to first token, and per-request decode history or counters. Lab currently plots sampled aggregate `decode_tps` only.
- Runtime-process CPU, GPU, and memory usage if supported by the runtime. Whole-Mac load cannot be attributed to the model.

New fields should be optional for compatibility with older runtime versions. Missing values must remain visibly unavailable in Lab.

Runtime 0.47.0 still needs a machine-readable active numerics mode in `/v1/stats` (for example `numerics_tag` plus explicit decode and prefill miss-substitution settings). MiniMax defaults to approximate miss substitution; Lab cannot infer the mode of an independently started server from the model name or its output rate. Structured per-request loop-guard and cut-reply events or counters would let Cockpit and Logs attach warnings to the correct request. Since 0.46.0, the text log has both repeated-block and incrementing-list guard lines with a common prefix. Those lines are available only from Lab's managed process; external runtime logs are unavailable to Lab.

## Prefetch telemetry parity

Resolved for prediction counters in runtime 0.61.1 (`eef2bc5`): `GlmEngine.stats()` now exports `predicted_loads` and `predicted_used` alongside hit/miss, read, byte, busy-time, and decode-wait totals. The brief defines these as cumulative since server start; Lab displays independent reported values and preserves missing fields on older runtimes. Stable session identity, aligned request timing, and active configuration remain requested before delta-based comparisons or wait percentages.

The source keeps `ssd_bytes_read` and `read_bytes` as separate internal tallies; the HTTP response exports only the former. Please document their accounting populations and byte/busy-time alignment before Lab derives a drive busy rate. Report `CACHALOT_READ_THROTTLE_GBPS` as an active emulated-drive-bandwidth setting so externally throttled runs can be identified. Lab currently labels that setting unreported.

## Vision capability discovery

The 0.51.0 brief adds GLM image input, but an `images_served` total is not a capability signal (including zero from the shared GLM/MiniMax engine). Please expose explicit model capabilities and supported content types through a documented API before Lab offers attachments based on external-server discovery. Lab currently displays the optional counter only; attachment storage and transport remain pending.

## DeepSeek active settings

Runtime 0.60.0 reports `decode_miss_budget` and `skipped_experts` through DeepSeek stats; this does not describe every output-changing path or a quality magnitude. Please also expose runtime version, system-date reuse enabled state and window, and per-request true/shown dates through documented optional fields. Lab's new Dive controls describe next-launch intent only. The GLM/MiniMax prediction-counter gap existed in 0.60.0 and is resolved in 0.61.1. Explicit video content capability remains requested alongside images; `images_served` now includes video steps and still cannot advertise support.

## GLM decode budget and trace provenance (reviewed 0.62.18)

GLM 0.62.14 adds `skipped_experts` but does not report its active miss budget. Please expose family/version, requested-versus-active budget and trace mode through optional structured fields with lifetimes and compatibility semantics. Zero drops cannot establish exact outputs. GLM/MiniMax routing-trace positions are per-run layer counters without request boundaries; a future viewer or manifest needs authoritative request association and collection/overhead metadata. Trace weights and predicted sets are routing evidence, not timing or critical-path evidence. Lab now records explicit next-launch budget intent and cumulative drops only.
