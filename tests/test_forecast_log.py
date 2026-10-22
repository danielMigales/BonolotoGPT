import json
import tempfile
import unittest
from pathlib import Path

from scripts.archive_forecast import archive_forecasts
from scripts.record_forecast import record_forecast


class ProspectiveForecastLogTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.draws = self.root / "draws.json"
        self.report = self.root / "report.json"
        self.issued = self.root / "forecast-issued.json"
        self.history = self.root / "forecast-history.json"
        self.write(self.draws, {"draws": [
            {"date": "2026-10-20", "numbers": [1, 2, 3, 4, 5, 6], "source": "test"}
        ]})
        self.write(self.report, {
            "status": "ready", "version": "2.4.1", "window": 7,
            "sourceLastDate": "2026-10-19",
            "forecast": {"targetDate": "2026-10-21", "numbers": [7, 8, 9, 10, 11, 12], "secondNumbers": [13, 14, 15, 16, 17, 18]}
        })

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, path, value):
        path.write_text(json.dumps(value), encoding="utf-8")

    def read(self, path, default=None):
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default

    def test_records_future_forecast_once_and_keeps_original_numbers(self):
        self.assertTrue(record_forecast(self.draws, self.report, self.issued, "2026-10-20T23:00:00+02:00"))
        original = self.read(self.issued)[0]
        self.assertEqual(original["numbers"], [7, 8, 9, 10, 11, 12])
        self.assertEqual(original["secondNumbers"], [13, 14, 15, 16, 17, 18])
        self.assertEqual(original["combinations"], [[7, 8, 9, 10, 11, 12], [13, 14, 15, 16, 17, 18]])
        self.assertEqual(original["trainedThrough"], "2026-10-19")
        self.assertEqual(original["status"], "pending")
        self.assertFalse(record_forecast(self.draws, self.report, self.issued, "2026-10-20T23:05:00+02:00"))
        self.assertEqual(self.read(self.issued), [original])

    def test_refuses_to_record_a_forecast_after_its_target_result_exists(self):
        report = self.read(self.report)
        report["forecast"]["targetDate"] = "2026-10-20"
        self.write(self.report, report)
        self.assertFalse(record_forecast(self.draws, self.report, self.issued))
        self.assertEqual(self.read(self.issued, []), [])

    def test_archive_waits_for_result_then_evaluates_immutable_forecast_once(self):
        record_forecast(self.draws, self.report, self.issued, "2026-10-20T23:00:00+02:00")
        self.assertEqual(archive_forecasts(self.draws, self.issued, self.history), 0)
        draws = self.read(self.draws)
        draws["draws"].append({"date": "2026-10-21", "numbers": [7, 8, 20, 21, 22, 23], "source": "official"})
        self.write(self.draws, draws)
        self.assertEqual(archive_forecasts(self.draws, self.issued, self.history), 1)
        evaluated = self.read(self.history)[0]
        self.assertEqual(evaluated["numbers"], [7, 8, 9, 10, 11, 12])
        self.assertEqual(evaluated["actual"], [7, 8, 20, 21, 22, 23])
        self.assertEqual(evaluated["hits"], 2)
        self.assertEqual(evaluated["combinationHits"], [2, 0])
        self.assertEqual(evaluated["secondNumbers"], [13, 14, 15, 16, 17, 18])
        self.assertEqual(evaluated["evaluationType"], "prospective")
        self.assertEqual(archive_forecasts(self.draws, self.issued, self.history), 0)
        self.assertEqual(len(self.read(self.history)), 1)

    def test_rejects_duplicate_or_invalid_numbers(self):
        report = self.read(self.report)
        report["forecast"]["numbers"] = [1, 1, 2, 3, 4, 5]
        self.write(self.report, report)
        with self.assertRaisesRegex(ValueError, "seis números únicos"):
            record_forecast(self.draws, self.report, self.issued)

    def test_archives_legacy_single_combination_record_without_breaking_history(self):
        self.write(self.issued, [{
            "targetDate": "2026-10-20", "numbers": [7, 8, 9, 10, 11, 12],
            "issuedAt": "2026-10-20T23:00:00+02:00", "trainedThrough": "2026-10-19",
            "version": "2.4.2", "window": 7, "status": "pending"
        }])
        self.assertEqual(archive_forecasts(self.draws, self.issued, self.history), 1)
        evaluated = self.read(self.history)[0]
        self.assertEqual(evaluated["hits"], 0)
        self.assertEqual(evaluated["combinationHits"], [0])
        self.assertIsNone(evaluated["secondNumbers"])

if __name__ == "__main__":
    unittest.main()
