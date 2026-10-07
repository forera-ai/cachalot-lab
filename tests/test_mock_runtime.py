import http.client
import importlib.util
import json
import sys
import threading
import unittest
from pathlib import Path


spec = importlib.util.spec_from_file_location(
    "mock_server", Path(__file__).resolve().parents[1] / "mock-runtime" / "server.py"
)
assert spec and spec.loader
mock_server = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = mock_server
spec.loader.exec_module(mock_server)


class MockRuntimeTests(unittest.TestCase):
    def setUp(self):
        self.runtime = mock_server.MockRuntime(
            ("127.0.0.1", 0), mock_server.Scenario(api_key="test", missing_stats=True)
        )
        self.thread = threading.Thread(target=self.runtime.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.runtime.shutdown()
        self.runtime.server_close()
        self.thread.join(timeout=2)

    def request(self, path, body=None, authorized=True):
        connection = http.client.HTTPConnection("127.0.0.1", self.runtime.server_port, timeout=2)
        headers = {"Authorization": "Bearer test"} if authorized else {}
        if body is not None:
            headers["Content-Type"] = "application/json"
        connection.request("POST" if body is not None else "GET", path, json.dumps(body) if body is not None else None, headers)
        response = connection.getresponse()
        status, data = response.status, response.read().decode()
        connection.close()
        return status, data

    def test_health_auth_and_partial_stats(self):
        status, data = self.request("/health")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(data)["status"], "ok")
        status, _ = self.request("/v1/models", authorized=False)
        self.assertEqual(status, 401)
        _, data = self.request("/v1/stats")
        stats = json.loads(data)
        self.assertIn("requests_served", stats)
        self.assertNotIn("decode_tps", stats)
        self.assertNotIn("predicted_loads", stats)
        self.assertNotIn("predicted_used", stats)

    def test_optional_image_fixture_and_partial_response(self):
        _, data = self.request("/v1/stats")
        self.assertNotIn("images_served", json.loads(data))
        self.runtime.scenario = mock_server.Scenario(image_stats=True)
        _, data = self.request("/v1/stats")
        self.assertEqual(json.loads(data)["images_served"], 7)
        self.runtime.scenario = mock_server.Scenario(image_stats=True, missing_stats=True)
        _, data = self.request("/v1/stats")
        self.assertNotIn("images_served", json.loads(data))

    def test_optional_prefetch_fixture_and_partial_response(self):
        self.runtime.scenario = mock_server.Scenario(prefetch_stats=True)
        _, data = self.request("/v1/stats")
        stats = json.loads(data)
        self.assertEqual(stats["predicted_loads"], 120)
        self.assertEqual(stats["predicted_used"], 80)
        self.runtime.scenario = mock_server.Scenario(prefetch_stats=True, missing_stats=True)
        _, data = self.request("/v1/stats")
        stats = json.loads(data)
        self.assertNotIn("predicted_loads", stats)
        self.assertNotIn("predicted_used", stats)

    def test_optional_read_fixture_and_partial_response(self):
        expected = {"expert_hits": 240, "expert_misses": 60,
                    "ssd_bytes_read": 1000000000, "expert_reads": 80,
                    "expert_fast_reads": 20, "expert_read_seconds": 12.5,
                    "expert_read_busy_seconds": 4.25,
                    "decode_wait_seconds": 2.125, "decode_waited_misses": 30}
        for scenario in (mock_server.Scenario(), mock_server.Scenario(read_stats=True),
                         mock_server.Scenario(read_stats=True, missing_stats=True)):
            self.runtime.scenario = scenario
            _, data = self.request("/v1/stats")
            actual = json.loads(data)
            for key, value in expected.items():
                if scenario.read_stats and not scenario.missing_stats:
                    self.assertEqual(actual[key], value)
                else:
                    self.assertNotIn(key, actual)

    def test_stream_and_counters(self):
        status, stream = self.request(
            "/v1/chat/completions", {"model": "cachalot-mock", "messages": [], "stream": True}
        )
        self.assertEqual(status, 200)
        self.assertIn("data: [DONE]", stream)
        self.assertIn("Cachalot", stream)
        _, data = self.request("/v1/stats")
        stats = json.loads(data)
        self.assertEqual(stats["requests_served"], 1)
        self.assertGreater(stats["tokens_generated"], 0)

    def test_startup_delay(self):
        self.runtime.scenario = mock_server.Scenario(startup_delay=10)
        status, _ = self.request("/health")
        self.assertEqual(status, 503)


if __name__ == "__main__":
    unittest.main()
