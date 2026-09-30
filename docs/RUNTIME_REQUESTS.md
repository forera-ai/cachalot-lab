# Runtime requests

Requests will be recorded here with motivation, proposed API shape, and Studio fallback. Initial candidates: per-expert residency, structured startup events, telemetry parity across families, native YAML config, and prefill progress.

The Cockpit currently plots reported `decode_tps`, `expert_hit_rate`, `ssd_gbps`, and available counters from `/v1/stats`. Whole-Mac CPU/GPU/RAM samples come from macOS, not Cachalot. To make model attribution and the four memory tiers measurable, request these optional fields in the runtime API:

- Per-tier occupied bytes, capacity bytes, and residency or eviction counts for Surface, Twilight, Midnight, and Abyss. Until exposed, Studio labels tier occupancy unavailable.
- SSD read/write throughput, queue depth, and read latency for Cachalot's own I/O. `ssd_gbps` gives a read-rate trace; it does not measure SSD pressure.
- Prefill tokens per second, time to first token, and per-request decode history or counters. Studio currently plots sampled aggregate `decode_tps` only.
- Runtime-process CPU, GPU, and memory usage if supported by the runtime. Whole-Mac load cannot be attributed to the model.

New fields should be optional for compatibility with older runtime versions. Missing values must remain visibly unavailable in Studio.

Runtime 0.47.0 still needs a machine-readable active numerics mode in `/v1/stats` (for example `numerics_tag` plus explicit decode and prefill miss-substitution settings). MiniMax defaults to approximate miss substitution; Studio cannot infer the mode of an independently started server from the model name or its output rate. Structured per-request loop-guard and cut-reply events or counters would let Cockpit and Logs attach warnings to the correct request. Since 0.46.0, the text log has both repeated-block and incrementing-list guard lines with a common prefix. Those lines are available only from Studio's managed process; external runtime logs are unavailable to Studio.
