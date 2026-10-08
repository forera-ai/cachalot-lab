"""Small local Cachalot stand-in for Lab development and tests."""

from __future__ import annotations

import argparse
import json
import os
import socketserver
import threading
import time
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


@dataclass(frozen=True)
class Scenario:
    startup_delay: float = 0.0
    prefill_delay: float = 0.0
    token_delay: float = 0.0
    api_key: str = ""
    missing_stats: bool = False
    crash_on_chat: bool = False
    prefetch_stats: bool = False
    image_stats: bool = False
    read_stats: bool = False


class MockRuntime(ThreadingHTTPServer):
    daemon_threads = True

    def server_bind(self) -> None:
        # HTTPServer normally resolves the host name here; local DNS may stall tests.
        socketserver.TCPServer.server_bind(self)
        self.server_name, self.server_port = self.server_address

    def __init__(self, address: tuple[str, int], scenario: Scenario):
        super().__init__(address, Handler)
        self.scenario = scenario
        self.started_at = time.monotonic()
        self.generation_lock = threading.Lock()
        self.counter_lock = threading.Lock()
        self.active_requests = 0
        self.queued_requests = 0
        self.requests_served = 0
        self.tokens_generated = 0

    @property
    def ready(self) -> bool:
        return time.monotonic() - self.started_at >= self.scenario.startup_delay


class Handler(BaseHTTPRequestHandler):
    server: MockRuntime
    protocol_version = "HTTP/1.1"

    def log_message(self, format: str, *args: object) -> None:
        print(f"[mock] {self.address_string()} {format % args}", flush=True)

    def json_response(self, status: int, payload: dict[str, object]) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(data)
        self.close_connection = True

    def authorized(self) -> bool:
        key = self.server.scenario.api_key
        if not key or self.headers.get("Authorization") == f"Bearer {key}":
            return True
        self.json_response(401, {"error": {"message": "Invalid API key", "type": "authentication_error"}})
        return False

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        if self.path == "/health":
            if self.server.ready:
                self.json_response(200, {"status": "ok"})
            else:
                self.json_response(503, {"status": "starting"})
            return
        if not self.authorized():
            return
        if self.path == "/v1/models":
            self.json_response(200, {"object": "list", "data": [{"id": "cachalot-mock", "object": "model", "owned_by": "local"}]})
            return
        if self.path == "/v1/stats":
            with self.server.counter_lock:
                stats: dict[str, object] = {
                    "state": "busy" if self.server.active_requests else "idle",
                    "requests_served": self.server.requests_served,
                    "tokens_generated": self.server.tokens_generated,
                    "queued_requests": self.server.queued_requests,
                    "uptime_seconds": round(time.monotonic() - self.server.started_at, 2),
                }
            if not self.server.scenario.missing_stats:
                stats.update({"decode_tps": 0.0, "expert_hit_rate": 0.0, "ssd_gbps": 0.0})
                if self.server.scenario.prefetch_stats:
                    stats.update({"predicted_loads": 120, "predicted_used": 80})
                if self.server.scenario.image_stats:
                    stats["images_served"] = 7
                if self.server.scenario.read_stats:
                    stats.update({"expert_hits": 240, "expert_misses": 60,
                                  "ssd_bytes_read": 1000000000, "expert_reads": 80,
                                  "expert_fast_reads": 20, "expert_read_seconds": 12.5,
                                  "expert_read_busy_seconds": 4.25,
                                  "decode_wait_seconds": 2.125, "decode_waited_misses": 30, "skipped_experts": 42})
            self.json_response(200, stats)
            return
        self.json_response(404, {"error": {"message": "Not found"}})

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        if self.path != "/v1/chat/completions":
            self.json_response(404, {"error": {"message": "Not found"}})
            return
        if not self.server.ready:
            self.json_response(503, {"error": {"message": "Runtime is starting"}})
            return
        if not self.authorized():
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            request = json.loads(self.rfile.read(length))
            if not isinstance(request, dict):
                raise ValueError("Body must be an object")
        except (ValueError, json.JSONDecodeError):
            self.json_response(400, {"error": {"message": "Invalid JSON request"}})
            return

        if self.server.scenario.crash_on_chat and not request.get("stream"):
            print("[mock] scripted crash mid-request", flush=True)
            os._exit(42)

        acquired = self.server.generation_lock.acquire(blocking=False)
        if not acquired:
            with self.server.counter_lock:
                self.server.queued_requests += 1
            self.server.generation_lock.acquire()
            with self.server.counter_lock:
                self.server.queued_requests -= 1
        with self.server.counter_lock:
            self.server.active_requests += 1
        started = time.monotonic()

        try:
            answer = "Cachalot mock is ready."
            tokens = answer.split(" ")
            if request.get("stream"):
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Cache-Control", "no-cache")
                self.send_header("Connection", "close")
                self.end_headers()
                self.close_connection = True
                try:
                    remaining = self.server.scenario.prefill_delay
                    while remaining > 0:
                        pause = min(0.5, remaining)
                        time.sleep(pause)
                        remaining -= pause
                        self.wfile.write(b": prefill keep-alive\n\n")
                        self.wfile.flush()
                    for index, token in enumerate(tokens):
                        if self.server.scenario.token_delay:
                            time.sleep(self.server.scenario.token_delay)
                        chunk = {"id": "chatcmpl-mock", "object": "chat.completion.chunk", "model": "cachalot-mock", "choices": [{"index": 0, "delta": {"content": token + (" " if index < len(tokens) - 1 else "")}, "finish_reason": None}]}
                        self.wfile.write(f"data: {json.dumps(chunk)}\n\n".encode())
                        self.wfile.flush()
                        if index == 0 and self.server.scenario.crash_on_chat:
                            print("[mock] scripted crash mid-stream", flush=True)
                            os._exit(42)
                    self.wfile.write(b"data: [DONE]\n\n")
                    self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError):
                    pass
            else:
                time.sleep(self.server.scenario.prefill_delay)
                self.json_response(200, {"id": "chatcmpl-mock", "object": "chat.completion", "model": "cachalot-mock", "choices": [{"index": 0, "message": {"role": "assistant", "content": answer}, "finish_reason": "stop"}], "usage": {"prompt_tokens": 1, "completion_tokens": len(tokens), "total_tokens": len(tokens) + 1}})
            with self.server.counter_lock:
                self.server.requests_served += 1
                self.server.tokens_generated += len(tokens)
            print(f"[request] model=cachalot-mock prefill_s={self.server.scenario.prefill_delay:.2f} decode_tps={len(tokens) / max(time.monotonic() - started - self.server.scenario.prefill_delay, 0.001):.2f} tokens={len(tokens)}", flush=True)
        finally:
            with self.server.counter_lock:
                self.server.active_requests -= 1
            self.server.generation_lock.release()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8011)
    parser.add_argument("--startup-delay", type=float, default=0)
    parser.add_argument("--prefill-delay", type=float, default=0)
    parser.add_argument("--token-delay", type=float, default=0)
    parser.add_argument("--api-key", default="")
    parser.add_argument("--missing-stats", action="store_true")
    parser.add_argument("--crash-on-chat", action="store_true")
    parser.add_argument("--prefetch-stats", action="store_true", help="Expose fixed synthetic prefetch totals (120 reads, 80 used)")
    parser.add_argument("--image-stats", action="store_true", help="Expose a fixed synthetic image input total (7)")
    parser.add_argument("--read-stats", action="store_true", help="Expose fixed synthetic runtime read/wait counters")
    args = parser.parse_args()
    scenario = Scenario(args.startup_delay, args.prefill_delay, args.token_delay, args.api_key, args.missing_stats, args.crash_on_chat, args.prefetch_stats, args.image_stats, args.read_stats)
    server = MockRuntime(("127.0.0.1", args.port), scenario)
    print("[startup] process up", flush=True)
    print(f"[startup] server listening on 127.0.0.1:{server.server_port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
