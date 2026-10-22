import json
import tempfile
import unittest
from pathlib import Path

from scripts.archive_forecast import archive_forecasts


class ArchiveForecastTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.draws = self.root / "draws.json"
        self.issued = self.root / "forecast-issued.json"
        self.history = self.root / "forecast-history.json"
        self.prediction = [1, 2, 3, 4, 5, 6]
        self.second = [1, 2, 3, 7, 8, 9]
        self.actual = [1, 2, 3, 10, 11, 12]
        self.draws.write_text(json.dumps({"draws": [{
            "date": "2026-10-20", "numbers": self.actual, "source": "SELAE"
        }]}), encoding="utf-8")
        self.issued.write_text(json.dumps([{
            "targetDate": "2026-10-20", "trainedThrough": "2026-10-19",
            "numbers": self.prediction, "secondNumbers": self.second,
            "combinations": [self.prediction, self.second], "status": "pending",
            "forecastHash": "test-hash"
        }]), encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def read_issued(self):
        return json.loads(self.issued.read_text(encoding="utf-8"))

    def test_evaluation_updates_issued_status_and_hits(self):
        self.assertEqual(archive_forecasts(self.draws, self.issued, self.history), 1)
        record = self.read_issued()[0]
        self.assertEqual(record["status"], "evaluated")
        self.assertEqual(record["hits"], 3)
        self.assertEqual(record["combinationHits"], [3, 0])
        self.assertEqual(record["actual"], self.actual)
        self.assertTrue(record.get("evaluatedAt"))
        self.assertEqual(len(json.loads(self.history.read_text(encoding="utf-8"))), 1)

    def test_repeated_run_is_idempotent_and_repairs_stale_pending_status(self):
        archive_forecasts(self.draws, self.issued, self.history)
        record = self.read_issued()[0]
        record["status"] = "pending"
        self.issued.write_text(json.dumps([record]), encoding="utf-8")
        self.assertEqual(archive_forecasts(self.draws, self.issued, self.history), 0)
        self.assertEqual(self.read_issued()[0]["status"], "evaluated")
        self.assertEqual(len(json.loads(self.history.read_text(encoding="utf-8"))), 1)

    def test_pending_forecast_stays_pending_until_draw_exists(self):
        self.draws.write_text(json.dumps({"draws": []}), encoding="utf-8")
        self.assertEqual(archive_forecasts(self.draws, self.issued, self.history), 0)
        self.assertEqual(self.read_issued()[0]["status"], "pending")
        self.assertFalse(self.history.exists())


if __name__ == "__main__":
    unittest.main()
