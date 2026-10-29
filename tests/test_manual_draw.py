import datetime as dt
import importlib.util
import pathlib
import unittest
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("manual_draw", ROOT / "scripts/import_manual_draw.py")
manual_draw = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(manual_draw)


class ManualDrawTests(unittest.TestCase):
    def setUp(self):
        self.today = dt.datetime.now(ZoneInfo("Europe/Madrid")).date().isoformat()
        self.existing = {"draws": [{"date": self.today, "numbers": [1, 2, 3, 4, 5, 6]}]}

    def body(self, date=None, numbers="7, 8, 9, 10, 11, 12", complementario="13", reintegro="4"):
        return (
            f"Fecha: {date or self.today}\nNúmeros: {numbers}\n"
            f"Complementario: {complementario}\nReintegro: {reintegro}"
        )

    def test_accepts_six_unique_numbers_and_bonus_fields(self):
        row = manual_draw.parse_draw(self.body(), self.existing)
        self.assertEqual(row["numbers"], [7, 8, 9, 10, 11, 12])
        self.assertEqual(row["complementario"], 13)
        self.assertEqual(row["reintegro"], 4)
        self.assertEqual(row["entryMethod"], "manual")

    def test_rejects_repeated_main_numbers(self):
        with self.assertRaisesRegex(ValueError, "seis números distintos"):
            manual_draw.parse_draw(self.body(numbers="7, 8, 8, 10, 11, 12"), self.existing)

    def test_rejects_complementary_number_in_main_combination(self):
        with self.assertRaisesRegex(ValueError, "complementario"):
            manual_draw.parse_draw(self.body(complementario="7"), self.existing)

    def test_rejects_reintegro_outside_range(self):
        with self.assertRaisesRegex(ValueError, "reintegro"):
            manual_draw.parse_draw(self.body(reintegro="10"), self.existing)

    def test_rejects_older_draw(self):
        old = (dt.date.fromisoformat(self.today) - dt.timedelta(days=1)).isoformat()
        with self.assertRaisesRegex(ValueError, "histórico llega"):
            manual_draw.parse_draw(self.body(date=old), self.existing)


if __name__ == "__main__":
    unittest.main()
