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
```

Routes: `GET /health`, `GET /v1/models`, `GET /v1/stats`, and `POST /v1/chat/completions`. The streaming route sends SSE prefill keep-alives and OpenAI-style chunks. Concurrent generations queue behind one another and appear in `queued_requests`. `--crash-on-chat` exits the process to exercise crash handling. This is a test double; its telemetry is synthetic and must not be presented as measurements of Cachalot.
