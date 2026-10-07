# Product direction

Adopted on 2026-10-05 from the owner's [long-term mission](mission/2026-10-05-owner-mission.txt). This document governs future product choices; [PLAN.md](PLAN.md) orders delivery, and [ARCHITECTURE.md](ARCHITECTURE.md) describes implementation. Future objectives below are not claims about the released app.

## Mission

Cachalot Lab is evolving into a professional inference observability, profiling, and experimentation environment. Cachalot is the experimental inference engine; Lab is the instrument panel through which a human understands it.

Lab should explain what happens during inference, where time is spent, which resources are active or waiting, where data moves, what forms the critical path, and how an experimental change alters that behavior. Throughput remains useful, but the governing objective is to make invisible inference behavior visible and support reproducible explanations.

The research cycle is observe, measure, identify a bottleneck, form a hypothesis, modify Cachalot, run a controlled experiment, compare, validate or reject, and update the performance model. Lab makes this cycle faster, clearer, and more rigorous.

## Preserve and evolve

Do not rewrite Lab to satisfy this direction. Preserve streaming chat, reasoning, cancellation, saved conversations and settings, API connections and credentials, model discovery, managed launch profiles, process ownership, Doctor, Logs, Cockpit, physical-drive monitoring, themes, and accessibility. Preserve historical data and formats when extending them; migrations must be explicit and reversible where practical.

The checked-out 0.5.0 foundation is Tauri 2, React 19, and TypeScript. Rust owns loopback HTTP, secrets, native sampling, local persistence, and the managed child. React presents state and bounded live histories. Runtime and host histories currently retain about two minutes in memory; saved conversations are durable conversation records, not reproducible experiment records. The production navigation contains Cockpit, Chat, Dive, API, Doctor, Logs, and Settings. A dedicated benchmark archive and experiment comparison workflow are future work, not an existing capability to replace.

Whole-Mac and whole-drive observations are valuable context. They must retain their scope and must not become model-specific measurements through relabeling. The current source review remains Cachalot 0.61.2, commit `954dff83c54071e10aef649ae725dd0afd141528`, with briefs through 0.61.1. See [runtime sync](RUNTIME_SYNC.md) for tested versus source-reviewed paths.

## Ownership

Cachalot owns execution, model behavior, runtime/cache/prefetch policy, scheduling, instrumentation generation, authoritative runtime metrics, and validated runtime performance models.

Lab owns visualization, aggregation, exploration, comparison, experiment management, interpretation surfaces, and historical analysis. Experiment management may submit explicit user-selected settings through supported runtime controls; it must not silently tune cache, scheduling, prefetch, or output-changing policy. Requested launch settings and reported active settings are different facts.

When evidence is missing, define the data contract and request authoritative instrumentation from Cachalot. Do not reconstruct token phases, exposed stalls, expert decisions, or critical paths from sampled dashboard values or text-log guesses. New capabilities require a documented runtime contract and compatibility fallback before their UI is promised.

## Evidence language

Use a consistent, accessible visual language, including text labels rather than color alone:

- **Measured:** directly observed telemetry, with source, scope, interval, units, and collection mode.
- **Derived:** calculated from measured inputs, with formula, input provenance, and applicable window. Calculation does not create missing attribution.
- **Predicted:** produced by a validated performance model, with model/version, assumptions, validation range, and confidence or error information where available.
- **Hypothetical:** user-supplied scenarios outside validated observations, including extrapolations.

Mark unavailable, stale, partial, sampled, dropped, and estimated evidence explicitly. Missing is not zero. Estimates must disclose their method and must not carry a measured label; economic estimates remain a separate modeled layer. A heuristic bottleneck interpretation must identify its evidence and uncertainty. Preserve the labels in exports and comparisons.

Keep modeled scenarios visually distinguishable from observed runs even when plotted together. A timestamped host reading does not establish inference attribution. Runtime cumulative counters need a documented reset lifetime before differences or ratios become meaningful. Never imply causality merely from simultaneous resource utilization.

## Investigation surfaces

### Anatomy of a token

The flagship profiler objective is a measured token timeline with runtime-defined lanes and phases. Each event should reveal what happened, when it started, how long it lasted, what overlapped, what waited, and what blocked progress. Router, expert lookup, storage, attention, expert compute, synchronization, and sampling are conceptual examples, not a mandated runtime phase list.

Show resource activity separately from contribution to end-to-end latency: total activity, overlap with useful work, exposed stall, and idle/wait. If a 100 ms storage interval overlaps 70 ms of useful GPU computation, it does not establish a 100 ms latency penalty. Even the remaining 30 ms is an exposed cost only when dependency evidence supports that attribution. Concurrent durations must not be added as if sequential. Apply this rule to CPU, GPU, storage, memory movement, synchronization, and prefetch. A critical path requires dependency evidence, not merely colored durations.

### Memory hierarchy and data movement

Show persistent model storage, unified memory, expert cache, KV state, runtime allocations, and compute when supported. Expose capacity, occupancy, residency, movement, hits, misses, evictions, prefetch, paging, and memory pressure. Explain what is resident, what moved, why it moved, and its measured cost. Avoid double-counting overlapping allocation categories or assuming Cachalot's named architecture tiers equal disjoint physical pools.

### Storage

Retain physical-drive read/write monitoring and its whole-drive label. Add runtime-scoped bytes/token, read requests/token, request-size distributions, queue depth, effective bandwidth, latency and p50/p95/p99, useful demand reads, speculative reads, wasted prefetch, cache-miss traffic, hidden latency, and exposed stall only when supported by reliable instrumentation. A high MB/s figure is not proof of good inference performance. Quantiles require a documented sample population; aggregate throughput cannot recover a latency distribution.

### Expert behavior

For MoE models, expose selected and resident experts, hits, misses, evictions, prefetched and unused prefetched experts, reuse, popularity, residency duration, and load latency. Candidate views include heat maps, residency and hit/miss timelines, popularity distributions, and transition/reuse patterns. Each must answer a concrete performance question. Define expert identity across model, layer, and runtime session; an aggregate hit-rate counter cannot explain which expert caused a stall.

### Experiments, sweeps, and history

Make baseline versus Experiment A versus Experiment B a core workflow. Compare tok/s, ms/token, TTFT, prefill speed, memory, storage traffic, hit rate, exposed I/O, and energy/token where supported. Surface tradeoffs without automatically declaring a winner. Include output-changing settings and applicable quality evidence so faster inference is not mistaken for equivalent behavior.

Parameter sweeps should reveal curves: throughput versus resident memory, latency versus bandwidth or context length, hit rate versus cache size, exposed I/O versus prefetch depth, and energy/token versus throughput. Show saturation, knees, regressions, nonlinearities, thresholds, and bottleneck transitions, with repeat variability and controlled configuration context. Sparse observations are not a validated prediction curve.

Historical analysis should compare Cachalot revisions across storage bytes/token, cache behavior, memory, energy, and latency as well as headline throughput. Compare equivalent workloads/configurations, disclose differences, and retain regression evidence. Optimizations may move the limiting resource; comparison should show that migration using the same evidence rules as live profiling.

### Bottleneck interpretation

Lead with measured evidence such as exposed storage stall, GPU wait, and utilization, then label an interpretation as heuristic when appropriate. Say that evidence suggests storage is on the critical path unless instrumentation establishes stronger causality. Present contradictory evidence and instrumentation limits. Do not declare a bottleneck from a single busy-resource gauge.

### Energy, economics, and counterfactuals

When reliable platform telemetry is available, show current/average power, integrated inference energy, joules/token, and tokens/joule. State measured versus estimated power, scope, sampling interval, idle treatment, and attribution. Throughput and efficiency are tradeoffs, not an automatic ranking.

Later, an optional economic simulation may derive energy, amortized hardware, and total cost per million tokens. Keep it separate from measured hardware telemetry. Require explicit hardware cost, useful lifetime, electricity price, utilization, and maintenance assumptions, including units and editable provenance. Economic output is modeled, never a measured fact.

Counterfactual exploration is gated on Cachalot's validated performance models. Storage bandwidth, resident memory, and prefetch accuracy are example inputs. Predicted throughput, token latency, exposed I/O, and utilization must show the model, validation domain, and uncertainty where available. Outside-domain inputs become hypothetical. Compare predictions with subsequent measured runs to validate or reject the model; never substitute sliders for runtime instrumentation.

## Reproducible evidence

Each future experiment artifact should capture Cachalot and Lab versions/commits, model identity and quantization, model configuration, machine and OS, storage topology, memory configuration, cache budget, context, workload/prompt identity, generation parameters, requested and active runtime settings, relevant environment variables, warm/cold state, seeds where supported, collection mode, and date/time.

Record repetitions, run order, completion/failure/cancellation, units, collection boundaries, counter resets, unsupported fields, sampling/drops, and artifact schema version. Unknown metadata stays unknown. Never claim reproducibility when required context is absent. Compare controlled runs and preserve configuration differences instead of hiding them in one score.

Retain or export detailed raw structured evidence where practical, alongside summaries and derivation versions, for Python, statistical analysis, plotting, regression detection, and external research. The UI is a view over evidence, not the evidence itself. Retention must be bounded and user-visible; exports must disclose truncation and omitted fields. Workloads can contain private prompts, paths, and environment secrets: save required provenance without credentials, make content inclusion explicit, and update privacy guidance before shipping capture/export.

## Layered interface

Use progressive disclosure while keeping ordinary inference approachable:

1. **Runtime:** model, state, throughput, TTFT when supported, memory, storage, CPU/GPU, and existing inference controls.
2. **Performance:** token latency, cache behavior, I/O, compute, utilization, and scoped evidence.
3. **Profiler:** token timeline, experts, request latency, overlap, dependencies, and critical path.
4. **Research:** reproducible comparisons, sweeps, history, validated models, counterfactuals, and energy/economic analysis.

These are conceptual depths, not permission to add four empty navigation routes. Evolve existing Cockpit and workflows first. Honor Abyss/Surface themes, reduced motion, Silent running, readable units, keyboard access, and stable inference controls.

## Delivery criteria

Every proposed visualization must state the engineering question, user decision or testable hypothesis, evidence source, and why the behavior is otherwise hard to see. Prefer a few explanatory views to dashboard inflation. Reject decorative charts without an investigation purpose.

Measure profiler overhead: telemetry frequency/volume, serialization, IPC/network cost, storage, rendering, and inference effect. Compare matched runs with instrumentation off, low-overhead collection, and detailed tracing. Agree a workload-specific overhead budget before claiming an acceptable mode; this direction invents no universal percentage. Bound buffers and rendering, disclose dropped events, and offer lower-overhead modes. Silent running currently pauses visuals while sampling continues; it is not an instrumentation-off baseline.

Each slice needs a supported contract, older/partial-response fallback, meaningful validation, raw-evidence handling, overhead evidence where relevant, and accurate documentation. Existing release, installation, process-ownership, loopback, and secret-handling rules remain in force. Research views may be incremental; unsupported instrumentation must not block useful aggregate comparisons, nor may aggregates impersonate detailed traces.

## Mission coverage

The owner's original sections map to the governing policy here and delivery phases in [PLAN.md](PLAN.md):

| Mission sections | Policy and delivery                                             |
| ---------------- | --------------------------------------------------------------- |
| 1–2              | Preserve and evolve; ownership; Phase A                         |
| 3–4              | Anatomy of a token; Phase C                                     |
| 5                | Memory hierarchy; Phase D                                       |
| 6–7              | Storage and expert behavior; Phases C–D                         |
| 8–9              | Experiments and sweeps; Phases B and E                          |
| 10–11            | Bottleneck interpretation and migration; Phases C and E         |
| 12–14            | Energy, economics, counterfactuals; Phases F–G                  |
| 15               | Evidence language; all phases                                   |
| 16–17            | Reproducibility and revision history; Phases B and E            |
| 18–19            | Layered interface and visualization criteria; all phases        |
| 20–21            | Overhead and raw evidence; Phases A–C and every new collector   |
| 22–24            | Investigation surfaces, research cycle, and mission; all phases |
