# Delivery roadmap

Reframed on 2026-10-05 under [Product direction](PRODUCT_DIRECTION.md), preserving the [owner's original mission](mission/2026-10-05-owner-mission.txt) and [previous plan](mission/2026-10-05-previous-plan.md). This is a dependency-led roadmap, not a release schedule or a claim that research features already ship.

## Baseline and changed priority

Lab 0.7.0 provides local connection, streaming chat and saved conversations, per-chat generation settings, managed runtime profiles and process supervision, Cockpit runtime/host/physical-drive traces, model discovery, optional Keychain credentials, themes, Doctor, and Logs. Preserve these workflows and data. Live GLM/DeepSeek launch/generation/stop validation and authenticated saved-key reconnect across restart remain outstanding; see [SSD validation](SSD_VALIDATION.md) and [discovery/Keychain](DISCOVERY_KEYCHAIN.md).

Lab 0.6.0 added a collapsed runtime read/wait evidence table and the compatible Lab rename. Lab 0.7.0 adds skipped-expert evidence and explicit GLM decode miss-budget intent with output warnings. Request-level attribution, percentages, and busy-rate derivations remain deferred.

Runtime and host histories are currently bounded live traces, not a durable benchmark archive. Dedicated experiment records, token profiling, and historical benchmark comparison are planned. The reviewed runtime remains Cachalot 0.62.22 at `5faababa6bc098400147611d3ffd11cd00e3100d`, briefs through 0.62.20; source review does not equal live model validation.

The main path now prioritizes trustworthy evidence, reproducible comparisons, and explanatory profiling. The former assignments of 0.6.0 to updates, 0.7.0 to menu bar/onboarding, and 1.0.0 to a release candidate are superseded. Those capabilities remain backlog items; choose actual versions when a verified slice ships under [the release gate](RELEASE.md). No dates or binary version changes are implied by this planning pass.

## Phase A — Evidence foundation and baseline validation

**Question:** Which observations are trustworthy, attributable, and comparable today?

**Lab deliverables:** inventory each current metric's source, scope, units, interval, reset behavior, model-family coverage, and unknowns; design the measured/derived/predicted/hypothetical language and missing/stale/partial states; inventory persistence and privacy constraints. Keep whole-Mac/whole-drive telemetry separate from runtime metrics and requested settings separate from reported active settings. Complete existing live validation when machine resources permit, without competing with another inference workload.

**Runtime dependency:** documented identity/capabilities, active settings, counter lifetimes, and telemetry parity; proposals in [runtime requests](RUNTIME_REQUESTS.md) and [observability requirements](../runtime-contract/observability-proposal.md).

**Exit evidence:** audited metric inventory and compatibility fixtures; scoped unknowns; controlled current-family readiness/stream/cancel/stop evidence or an explicit unavailable-family limitation; saved-key restart evidence; privacy and artifact schema design; agreed overhead measurement procedure. This phase can deliver useful labeling and validation before every runtime request is fulfilled.

## Phase B — Reproducible run records and baseline comparison

**Question:** What changed between equivalent runs, and what tradeoff did it create?

**Lab deliverables:** a versioned durable run manifest and bounded local evidence store; explicit capture/import/export and run outcome; baseline/A/B comparison for supported metrics; configuration differences, repetitions, warm/cold state, workload identity, and raw-evidence links. Begin with trustworthy existing aggregates and disclose their windows rather than waiting for a complete profiler.

**Runtime dependency:** request boundaries and defined TTFT, prefill/decode timing, counts, active configuration, and stable identities for request-specific metrics. Unsupported fields remain unavailable; partial imported records cannot claim full reproducibility.

**Exit evidence:** export/import round trip with provenance and units; cancellation/failure and incomplete metadata remain visible; counter resets do not manufacture deltas; controlled equivalent runs compare correctly; storage is bounded and sensitive content/credentials are handled explicitly. No automatic winner or silent policy tuning. Update privacy documentation before shipping evidence capture.

## Phase C — Anatomy of a token

**Question:** Why did this token take this long, and which work overlapped or blocked progress?

**Lab deliverables:** opt-in token timeline, runtime-defined lanes, operation detail, overlap, exposed wait versus activity, and dependency-backed critical-path inspection. Keep incomplete traces clearly marked. Add low-overhead versus detailed collection choices when supported, with bounded rendering and raw trace export.

**Runtime dependency:** authoritative token/request-correlated events, monotonic clock semantics, CPU/GPU completion timing, dependencies, waits, and loss/backpressure metadata. Sampled stats cannot meet this gate. Cachalot implements instrumentation.

**Exit evidence:** known sequential/parallel/wait traces render and account correctly; timestamps and request/token attribution are verified; concurrent durations are not added as sequential costs; dropped events prevent unqualified conclusions; raw trace reproduces the explanation. Matched instrumentation-off/low/detail runs quantify inference, serialization, transport, storage, and UI overhead against an agreed workload budget.

## Phase D — Memory, storage, and expert explanations

**Question:** What was resident, what moved, why, and what did it cost?

**Lab deliverables:** memory hierarchy with capacity/occupancy/movement; runtime-scoped bytes and requests/token, read-size/latency distributions, queue depth, demand/prefetch usefulness and exposed I/O; expert selection/residency/hit/miss/eviction/reuse views. Preserve physical-drive monitoring as host context. Select heat maps and timelines only when they answer an investigation question.

**Runtime dependency:** non-overlapping allocation semantics or explicit shared backing; runtime I/O populations, request timing and transfer causes; model/layer/expert identity and lifecycle; prefetch use/unused horizon. Independent verified aggregate views may ship before full lifecycle tracing.

**Exit evidence:** memory categories do not double-count; quantiles name their sample population; expert identity is stable within the run; resets/evictions/prefetch outcomes are tested; attribution is honest; each visualization has a stated decision/hypothesis and measured collection cost.

## Phase E — Sweeps, revision history, and bottleneck migration

**Question:** Where does improvement saturate, did a regression hide behind throughput, and where did the bottleneck move?

**Lab deliverables:** controlled parameter-sweep records and curves; revision comparisons across latency/throughput, memory, cache, traffic and available energy; knees, thresholds, nonlinearities, variability, and before/after bottleneck evidence. Experiment orchestration uses explicit supported settings, controlled run order, and existing managed-process ownership. Never change inference policy silently.

**Dependencies:** Phase B records; Phase C/D evidence for overlap, expert, and critical-path interpretations. Aggregate sweeps need not wait for every detailed metric. Control context, workload, seeds where supported, warm/cold state, and output-changing settings; disclose incomparable records.

**Exit evidence:** repeats and configuration differences are inspectable; raw artifacts support trend/regression findings; sparse points are not presented as validated predictions; bottleneck conclusions retain measured evidence and heuristic labels. Show tradeoffs, including available quality evidence, without declaring a universal best configuration.

## Phase F — Energy and efficiency

**Question:** What energy/performance tradeoff does this configuration make?

**Lab deliverables:** current/average power, integrated energy, joules/token and tokens/joule, comparisons, and source/attribution labels.

**Dependency:** reliable platform/runtime power telemetry with sampling, measurement versus estimation, integration interval, and idle treatment. Phase B provides run alignment. This phase can proceed independently of complete expert tracing when its evidence is reliable.

**Exit evidence:** energy integration and token denominator use the same interval; host/process scope is explicit; measured and estimated power are distinct; overhead is measured; exports preserve method and units. Unsupported energy remains unavailable.

## Phase G — Validated models and optional economics

**Question:** Does a performance model predict the measured change, and what assumptions determine its economic tradeoff?

**Lab deliverables:** counterfactual inputs for supported memory/bandwidth/prefetch scenarios, predicted outcomes and validation-domain/uncertainty display, followed by prediction-versus-measurement comparison. Provide a separate optional economic layer with explicit hardware cost, useful lifetime, electricity price, utilization, and maintenance assumptions.

**Dependencies:** Cachalot-owned validated performance models and validation artifacts; Phase B/E measured comparisons; reliable Phase F energy for measured-energy-based economics. Economic scenarios using estimated energy must disclose that input. No fabricated model or measured label for economic results.

**Exit evidence:** model/version and assumptions accompany every prediction; outside-domain scenarios are hypothetical; measured results can validate/reject predictions; economic assumptions are editable/exportable and modeled output is visually separate from telemetry. No automatic configuration winner.

## Cross-cutting work and remaining backlog

All phases retain layered Runtime/Performance/Profiler/Research disclosure, accessible text labels, keyboard access, reduced motion, Silent running, Abyss/Surface coherence, bounded buffers and storage, honest missing fields, and existing loopback/credential/process safeguards. Accessibility is a continuous acceptance condition, not postponed until a numbered release.

Signed Lab/runtime updates with rollback, menu-bar integration, onboarding, chat edit/retry/search, and media attachments remain worthwhile secondary work. Media requires explicit runtime capability and bounded storage/transport; image totals cannot advertise capability. Prioritize these when they support safe ordinary use or evidence workflows, without displacing the governing research objective by default. A 1.0 milestone requires explicit reviewed product and compatibility criteria, not completion of every speculative research feature.

## Next implementation slice

Start with Phase A's metric/provenance inventory and Phase B's run-manifest design. Resolve counter lifetimes, request identity and active configuration with Cachalot before promising request-level comparisons. Track remaining GLM/DeepSeek and saved-key validation alongside this work. Token tracing, energy sources, and validated models remain separate dependencies; this mission adoption does not implement them.

Each slice must state its engineering question, evidence contract, fallback, preservation/migration needs, raw export/retention plan, verification, and overhead budget where relevant. Follow runtime brief review before development, fresh local build/install before native UI testing, and exact-source signed/notarized publication for every pushed implementation. Documentation-only direction changes do not require a binary release.
