# Runtime requests

Requests will be recorded here with motivation, proposed API shape, and Studio fallback. Initial candidates: per-expert residency, structured startup events, telemetry parity across families, native YAML config, and prefill progress.

The Cockpit currently plots reported `decode_tps`, `expert_hit_rate`, `ssd_gbps`, and available counters from `/v1/stats`. Whole-Mac CPU/GPU/RAM samples come from macOS, not Cachalot. To make model attribution and the four memory tiers measurable, request these optional fields in the runtime API:

- Per-tier occupied bytes, capacity bytes, and residency or eviction counts for Surface, Twilight, Midnight, and Abyss. Until exposed, Studio labels tier occupancy unavailable.
- SSD read/write throughput, queue depth, and read latency for Cachalot's own I/O. `ssd_gbps` gives a read-rate trace; it does not measure SSD pressure.
- Prefill tokens per second, time to first token, and per-request decode history or counters. Studio currently plots sampled aggregate `decode_tps` only.
- Runtime-process CPU, GPU, and memory usage if supported by the runtime. Whole-Mac load cannot be attributed to the model.

New fields should be optional for compatibility with older runtime versions. Missing values must remain visibly unavailable in Studio.

Runtime 0.47.0 still needs a machine-readable active numerics mode in `/v1/stats` (for example `numerics_tag` plus explicit decode and prefill miss-substitution settings). MiniMax defaults to approximate miss substitution; Studio cannot infer the mode of an independently started server from the model name or its output rate. Structured per-request loop-guard and cut-reply events or counters would let Cockpit and Logs attach warnings to the correct request. Since 0.46.0, the text log has both repeated-block and incrementing-list guard lines with a common prefix. Those lines are available only from Studio's managed process; external runtime logs are unavailable to Studio.

## Prefetch telemetry parity

Runtime 0.50.2 (`508be80`) keeps `predicted_loads` and `predicted_used` in the resident store, and DeepSeek exports them through `V41Model.stats()`. GLM/MiniMax use `GlmEngine.stats()`, which returns neither field despite the 0.50.0 brief describing moving GLM counters. Please expose optional nonnegative cumulative counters through that engine and document their reset lifetime. Cockpit displays each reported counter independently and shows — for absent fields. No success percentage or speedup is inferred.

## Vision capability discovery

The 0.51.0 brief adds GLM image input, but an `images_served` total is not a capability signal (including zero from the shared GLM/MiniMax engine). Please expose explicit model capabilities and supported content types through a documented API before Studio offers attachments based on external-server discovery. Studio currently displays the optional counter only; attachment storage and transport remain pending.

## DeepSeek active settings

Runtime 0.60.0 reports `decode_miss_budget` and `skipped_experts` through DeepSeek stats; this does not describe every output-changing path or a quality magnitude. Please also expose runtime version, system-date reuse enabled state and window, and per-request true/shown dates through documented optional fields. Studio's new Dive controls describe next-launch intent only. The GLM/MiniMax prediction-counter gap still exists in 0.60.0. Explicit video content capability remains requested alongside images; `images_served` now includes video steps and still cannot advertise support.
