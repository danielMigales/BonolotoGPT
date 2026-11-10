import hashlib
import json
import unittest

from scripts.audit_prospective import audit, exact_upper_tail, hit_distribution


class ProspectiveAuditTests(unittest.TestCase):
    def test_hypergeometric_distribution_sums_to_one_and_has_expected_mean(self):
        probabilities = hit_distribution()
        self.assertAlmostEqual(sum(probabilities), 1.0, places=12)
        self.assertAlmostEqual(sum(k*p for k, p in enumerate(probabilities)), 36/49, places=12)

    def test_exact_tail_is_monotone_and_bounded(self):
        self.assertGreaterEqual(exact_upper_tail(0, 10), exact_upper_tail(3, 10))
        self.assertGreaterEqual(exact_upper_tail(3, 10), exact_upper_tail(6, 10))
        self.assertGreaterEqual(exact_upper_tail(6, 10), 0)
        self.assertLessEqual(exact_upper_tail(0, 10), 1)

    def test_zero_predictions_has_unit_tail_probability(self):
        self.assertEqual(exact_upper_tail(0, 0), 1.0)

    def make_record(self):
        item = {
            "targetDate": "2026-10-21",
            "trainedThrough": "2026-10-20",
            "issuedAt": "2026-10-20T23:00:00+02:00",
            "version": "2.4.2",
            "window": 7,
            "numbers": [1, 2, 3, 7, 8, 9],
            "secondNumbers": [10, 11, 12, 13, 14, 15],
            "combinations": [[1, 2, 3, 7, 8, 9], [10, 11, 12, 13, 14, 15]],
            "actual": [1, 2, 3, 4, 5, 6],
            "hits": 3,
            "evaluationType": "prospective",
            "hashVersion": 2,
        }
        payload = {key: item[key] for key in (
            "targetDate", "trainedThrough", "version", "window",
            "numbers", "secondNumbers", "combinations", "issuedAt"
        )}
        item["forecastHash"] = hashlib.sha256(
            json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        return item

    def test_verified_record_is_counted_only_after_hash_and_result_validation(self):
        item = self.make_record()
        report = audit([item], [{"date": "2026-10-21", "numbers": [1, 2, 3, 4, 5, 6]}])
        self.assertEqual(report["cryptographicallyVerified"]["n"], 1)
        self.assertEqual(report["cryptographicallyVerified"]["totalHits"], 3)
        self.assertEqual(report["verification"]["issueCount"], 0)

    def test_tampered_prediction_is_excluded_from_verified_sample(self):
        item = self.make_record()
        item["numbers"] = [1, 2, 3, 4, 8, 9]
        report = audit([item], [{"date": "2026-10-21", "numbers": [1, 2, 3, 4, 5, 6]}])
        self.assertEqual(report["cryptographicallyVerified"]["n"], 0)
        self.assertGreater(report["verification"]["issueCount"], 0)

    def test_legacy_record_is_disclosed_but_not_called_verified(self):
        item = self.make_record()
        item.pop("combinations")
        item.pop("secondNumbers")
        item.pop("hashVersion")
        report = audit([item], [{"date": "2026-10-21", "numbers": [1, 2, 3, 4, 5, 6]}])
        self.assertEqual(report["cryptographicallyVerified"]["n"], 0)
        self.assertEqual(report["verification"]["legacyUnverifiableCount"], 1)


if __name__ == "__main__":
    unittest.main()
