# Mock runtime

Local HTTP stand-in for UI and end-to-end development. It needs only Python's standard library and never loads a model.

```sh
python3 mock-runtime/server.py --port 8011
```

Useful scenarios:

```sh
python3 mock-runtime/server.py --startup-delay 15 --prefill-delay 180 --token-delay 0.5
python3 mock-runtime/server.py --api-key test-only --missing-stats
python3 mock-runtime/server.py --crash-on-chat
python3 mock-runtime/server.py --prefetch-stats
python3 mock-runtime/server.py --prefetch-stats --read-stats
```

Routes: `GET /health`, `GET /v1/models`, `GET /v1/stats`, and `POST /v1/chat/completions`. The streaming route sends SSE prefill keep-alives and OpenAI-style chunks. Concurrent generations queue behind one another and appear in `queued_requests`. `--crash-on-chat` exits the process to exercise crash handling. This is a test double; its telemetry is synthetic and must not be presented as measurements of Cachalot.

`--prefetch-stats` exposes fixed synthetic totals of 120 prefetch reads and 80 used for native Cockpit inspection. Without it, prefetch fields are omitted. `--missing-stats` omits them even when the fixture is selected.

`--image-stats` exposes a fixed synthetic `images_served: 7` total for Cockpit inspection. It does not enable image generation or input transport. The field is omitted by default and with `--missing-stats`.

`--read-stats` exposes nine fixed synthetic read/wait counters for the Cockpit
Runtime evidence table: hits 240, misses 60, accounted bytes 1,000,000,000,
reads 80, fast reads 20, summed time 12.500 s, busy time 4.250 s, decode wait
2.125 s, and waited misses 30. They are omitted by default and with
`--missing-stats`. This fixture exercises display and compatibility, not
runtime performance or physical-drive measurements.
