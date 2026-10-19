import unittest, sys, pathlib, json
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
from update_data import normalize_widget, expected_dates
import datetime as dt


class ImportTests(unittest.TestCase):
    def test_parse_official_bonoloto_page_keeps_only_six_main_numbers(self):
        row = normalize_widget(
            '2026-01-02',
            '<p>06 - 34 - 33 - 37 - 46 - 08 Complementario: C(47) Reintegro: R(5)</p>',
        )
        self.assertEqual(row['numbers'], [6, 8, 33, 34, 37, 46])
        self.assertEqual(set(row), {'id', 'date', 'numbers', 'source'})
        self.assertIn('bonoloto-resultados-del-02-de-enero-de-2026', row['source'])

    def test_bad_data_is_rejected(self):
        with self.assertRaises(ValueError):
            normalize_widget('2026-01-02', '<p>Resultados pendientes</p>')

    def test_calendar_includes_sunday(self):
        self.assertEqual(
            list(expected_dates(dt.date(2026, 1, 4))),
            ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'],
        )

    def test_empty_archive_is_clean_bonoloto_schema(self):
        root = pathlib.Path(__file__).resolve().parents[1]
        doc = json.loads((root / 'data/draws.json').read_text())
        self.assertEqual(doc['draws'], [])
        self.assertIsNone(doc['latestDate'])
        self.assertIsNone(doc['checkedAt'])

    def test_archive_rows_never_store_auxiliary_fields(self):
        root = pathlib.Path(__file__).resolve().parents[1]
        doc = json.loads((root / 'data/draws.json').read_text())
        for row in doc['draws']:
            self.assertEqual(set(row), {'id', 'date', 'numbers', 'source'})
            self.assertEqual(len(row['numbers']), 6)
            self.assertEqual(len(set(row['numbers'])), 6)
            self.assertTrue(all(1 <= n <= 49 for n in row['numbers']))


if __name__ == '__main__':
    unittest.main()
