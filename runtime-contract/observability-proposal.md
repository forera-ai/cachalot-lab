# Observability contract requirements — proposal

Status: proposed requirements, not a supported API, event schema, or new runtime capability. Adopted 2026-10-05 for [Lab's product direction](../docs/PRODUCT_DIRECTION.md). Existing YAML contracts remain the source-reviewed baseline; do not advertise these requirements as implemented.

Reviewed runtime: Cachalot 0.60.4, `193aa662b6fa681f39f7a17309a3fc40d06dd5a2`; latest reviewed brief 0.60.4. `V41Model.stats()` exposes aggregate expert, resident, prefix-cache, MLX memory, and I/O counters. `Engine.stats()` forwards those with server totals. `GlmEngine.stats()` exposes a smaller aggregate set and still omits prediction counters. These HTTP snapshots do not supply a token event/dependency contract. Existing aggregate read time must not be relabeled exposed stall.

## Contract negotiation and common semantics

Request explicit runtime version/commit, telemetry schema version, engine/model identity, active settings, capabilities per model family, and collection modes. Capability absence must preserve existing stats/chat behavior and leave advanced views unavailable. Unknown event types must be handled without corrupting known data. Runtime and Lab must agree versioning, unit conventions, and compatibility fixtures before adopting an API shape; no new endpoint name is prescribed here.

For each field/event, specify producer, measured/derived provenance, units, resource scope, monotonic clock domain, request/run/session identity, reset lifetime, sampling interval, aggregation window, missing/zero meaning, valid bounds, and model-family availability. Include event ordering, sequence identifiers, loss/truncation indicators, restart behavior, transport limits, and cancellation semantics. Wall-clock timestamps support human history; monotonic timestamps support duration and ordering within their declared domain.

## Prioritized requirements

| Priority | Required evidence                                                                                                                                     | Lab fallback                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A        | Identity, capabilities, active settings, counter lifetimes and telemetry modes; cross-family parity                                                   | Show source-reviewed aggregates, unknown active settings, and explicit gaps              |
| B        | Request completion boundaries, prompt/generated token counts, TTFT and prefill/decode timing definitions, warm/cold state, reproducible configuration | Retain only supported metrics; mark incomplete metadata and incomparable windows         |
| C        | Correlated per-token operation intervals, CPU/GPU completion semantics, dependencies, waits, transfer causes, event loss and clock semantics          | No phase timeline or critical-path claim from polling snapshots                          |
| D        | Residency and transfer events; runtime I/O distributions; expert lifecycle and prefetch usefulness                                                    | Keep whole-drive context and aggregate counters separate; unsupported detail unavailable |
| E        | Reliable power/energy source and integration/attribution rules                                                                                        | Energy unavailable, or explicitly estimated with method and scope                        |
| F        | Validated model identity, input domain, predictions, validation/error artifacts                                                                       | No measured label for predictions; outside-domain scenarios hypothetical                 |

## Token and concurrency evidence

Require run/session, request, token index, phase (prefill/decode), operation identity, resource/lane, start/end or duration, and runtime-defined operation type. Expert events additionally need model/layer/expert identity. GPU dispatch is not GPU completion: document asynchronous timing and synchronization costs. Dependencies and blocked/waiting relationships must support any critical-path interpretation.

Define activity, useful overlap, exposed wait, and idle separately. Specify whether attribution is measured by the runtime or derived from validated dependencies; document uncertainty and incomplete traces. Summed concurrent activity can exceed token wall time. An aggregate I/O timer or high drive utilization cannot establish its latency contribution. Trace export must retain enough timestamps and relationships to audit the view.

## Memory, I/O, and experts

Memory fields must distinguish physical/shared backing from logical ownership: total capacity, resident model/expert bytes, KV, runtime allocations, pressure, and paging where measurable. Document overlapping categories; avoid summing duplicate buffers. Transfer evidence needs bytes, source/destination, purpose, request/token linkage where valid, and timing.

I/O evidence needs demand/speculative origin, request size, queued/start/completion times, cache-miss linkage, queue depth definition, actual bytes, and usefulness outcome. p50/p95/p99 require a declared population and histogram/raw samples or authoritative quantiles, not averages. Define submitted versus completed reads and how cancellation/failure affects totals. Wasted prefetch needs a use/eviction horizon, not merely predicted reads minus used reads during unrelated windows.

Expert evidence needs selections, residency entries/exits, hit/miss, eviction reason, prefetch submission/completion/use/unused outcomes, load latency, reuse, and residency duration. Bound cardinality and collection volume. Expert IDs must not cross model or layer boundaries accidentally.

## Experiment artifacts and overhead

Agree a versioned run manifest covering runtime/Lab identity, model/quantization, workload identity, generation and active settings, machine/OS/storage/memory, relevant sanitized environment, warm/cold state, time, repetitions/order, collection mode, run outcome, and unknown metadata. Store raw evidence with derivation provenance and export schema. Prompts and secrets need explicit retention/export handling, not indiscriminate environment dumps.

Define collection-off, low-overhead, and detailed modes where appropriate; explicit enablement, bounded buffering, backpressure/drop policy, event-volume limits, and raw storage limits. Measure inference and collector/UI overhead on matched workloads before accepting a budget. A partial trace remains inspectable as partial and must not support an unqualified critical-path verdict.

## Acceptance before Lab adoption

Verify runtime measurement semantics against source and live controlled runs, record the exact commit, and add fixtures for supported, older, missing, malformed, reset, cancelled, reordered, and dropped-event cases as applicable. Reconcile timestamps and token boundaries, validate parallel intervals without double-counting, audit exported raw evidence, and quantify mode overhead. Adopt only verified fields into supported contracts; leave remaining requirements marked proposed. Runtime instrumentation work belongs in Cachalot, not this documentation pass.
