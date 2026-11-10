import unittest
from scripts.audit_prospective import exact_upper_tail, hit_distribution


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

    def test_zero_predictions_has_no_tail_probability(self):
        self.assertEqual(exact_upper_tail(0, 0), 1.0)


if __name__ == "__main__":
    unittest.main()
