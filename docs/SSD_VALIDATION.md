# SSD telemetry and model integration validation

This describes the SSD capability shipping in Studio 0.5.0 and its outstanding model-validation work. The initial scope excluded discovery and Keychain; the owner subsequently requested both, tracked in [Discovery and Keychain](DISCOVERY_KEYCHAIN.md). SSD speed benchmarking remains excluded.

## SSD measurements

Cockpit's Drives view samples macOS physical-drive byte counters every two seconds while visible, or five seconds while the document is hidden. It derives read/write throughput from successive counter values and monotonic elapsed time, in decimal MB/s. The rolling history covers two minutes. Silent running pauses the charts while counters continue. The drive selector shows the model name and BSD name, including internal and external drives when their drivers publish counters. Missing counters, first observations, resets, errors, and long sample gaps show —; zero is a valid idle sample. Disconnection does not silently switch an explicitly selected drive. Counter values remain local and are not saved or uploaded.

These are whole-drive counters for all applications. They do not identify Cachalot traffic or measure maximum throughput, latency, queue pressure, or SSD utilization. Runtime SSD READ remains independently sourced from `/v1/stats`. Physical unplug/replug is covered with fixtures rather than disconnecting X10Pro, which hosts the working repository and model data.

## Local evidence

38 Vitest tests and 28 Rust tests passed, including large counter precision, decimal rates, idle zero, resets, malformed counters, long gaps, drive identity changes, offline display, selector changes, disconnected devices, and sampling-error display. TypeScript, lint, clippy, formatting, and the signed native build passed. The fresh app was installed with the published 0.4.0 app preserved under `.release/local-ssd-2026-10-05/previous-Cachalot Studio.app`. Native inspection found APPLE SSD AP1024Z (`disk0`) and Micron CT4000X10PROSSD9 (`disk6`), confirmed changing the selected drive changes its readings, and observed live read/write activity while Cachalot was offline. These observations reflect an unrelated running benchmark and are not speed-test results. The final native Drives and Runtime layouts fit the standard 1380 × 860 window without scrolling or overlapping chart labels. Silent running paused both disk traces while read/write numbers continued changing; the initial Off setting was restored. The installed executable SHA-256 is `16aef4026c0804f6ff9457d3f7253062223fe21e02cc6d49c1e74820a0315988` and every installed bundle file matches the final signed build. The app still reports 0.4.0 as a local development build; no new release is published.

## Model validation gate

Runtime reviewed: Cachalot 0.60.1, `9d11bc061dcb434c40494be3d507521194d376dc`. No new brief after 0.60.0 and no runtime-contract change in the 0.60.1 diff. The Python environment, DeepSeek checkpoint/internal q2g128 bank, GLM external checkpoint, and partial GLM bank (layers 3–5) exist.

Live validation is pending. A separate runtime-project session is running `benchmarks/quality_blind_ab.py run --budget 0 --n 48` (observed PID 33189, about 56 GiB resident memory). It must finish before a second model starts. No test server has been started, no existing runtime stopped, and no user profile changed. The initial memory level was 18 with about 5.7 GiB swap, so an idle/pressure check is also required. A narrow process-name check initially missed this Python executable; all Python command lines must be checked before testing, not only the virtualenv spelling.

Once the other job finishes, verify normal memory pressure, stable swap, available memory, no runtime/GPU workload, and no screensaver. Run each row sequentially through the installed Studio-owned runtime with a temporary profile, isolated loopback port and snapshot directory, and a short synthetic streaming prompt capped at 16 output tokens. Record launch preview, actual startup knobs, readiness/model ID, streaming completion, optional telemetry availability, owned stop, PID exit, and free port. Preserve and restore original profile and conversation files.

| Model    | Launch choices                                                          | Required observations                                                                                                                     |
| -------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| GLM      | Existing partial bank enabled; prefetch count 5, limit 3, scheduling -1 | Manifest accepted, bank used by runtime, Ready/model ID, bounded streaming reply, correct optional-counter availability, clean owned stop |
| GLM      | Bank Off; prefetch count 0                                              | Checkpoint path used; explicit Off/zero preserved; Ready, reply, clean stop                                                               |
| DeepSeek | Decode drops On (budget 0), date reuse On                               | Startup matches preview, budget telemetry when reported, Ready, reply, clean stop                                                         |
| DeepSeek | Decode drops Off (budget -1), date reuse Off                            | Exact decode selected, no date rewrite, Ready, reply, clean stop                                                                          |

A short streaming smoke validates integration and lifecycle only. It does not validate general output quality, long-context behavior, speed gains, or seven-day reuse across real calendar days. The runtime's quality benchmark is separate evidence. Date normalization can receive a bounded two-request test with a synthetic system date once its persisted mapping is isolated.

Release note: the development-build hashes and version descriptions above are historical pre-release evidence. Studio 0.5.0 ships the combined changes; its exact source, signed/notarized artifacts, and final verification are recorded in the GitHub Release verification report. Outstanding validation limits above still apply.
