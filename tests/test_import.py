import unittest, sys, pathlib, json
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from update_data import normalize, expected_dates
import datetime as dt

class ImportTests(unittest.TestCase):
    def test_parse_bonoloto_keeps_only_six_main_numbers(self):
        d=normalize(dict(game_id='BONO',id_sorteo='a',fecha_sorteo='2026-01-02',combinacion='06 - 02 - 03 - 04 - 05 - 01 C(7) R(0)'))
        self.assertEqual(d['numbers'],[1,2,3,4,5,6])
        self.assertEqual(set(d),{'id','date','numbers','source'})
        self.assertIn('game_id=BONO',d['source'])
    def test_rejects_other_game_data(self):
        with self.assertRaises(ValueError):
            normalize(dict(game_id='OTRO',id_sorteo='a',fecha_sorteo='2026-01-02',combinacion='06 - 02 - 03 - 04 - 05 - 01 C(7) R(0)'))
    def test_bad_data(self):
        with self.assertRaises(ValueError):
            normalize(dict(game_id='BONO',combinacion='sin resultado'))
    def test_calendar_skips_sunday(self):
        self.assertEqual(list(expected_dates(dt.date(2026,1,4))),['2026-01-01','2026-01-02','2026-01-03'])
    def test_empty_archive_is_clean_bonoloto_schema(self):
        root=pathlib.Path(__file__).resolve().parents[1]
        doc=json.loads((root/'data/draws.json').read_text())
        self.assertEqual(doc['draws'],[])
        self.assertIsNone(doc['latestDate'])
        self.assertIsNone(doc['checkedAt'])
    def test_archive_rows_never_store_auxiliary_fields(self):
        root=pathlib.Path(__file__).resolve().parents[1]
        doc=json.loads((root/'data/draws.json').read_text())
        for row in doc['draws']:
            self.assertEqual(set(row),{'id','date','numbers','source'})
            self.assertEqual(len(row['numbers']),6)
            self.assertEqual(len(set(row['numbers'])),6)
            self.assertTrue(all(1<=n<=49 for n in row['numbers']))

if __name__=='__main__':
    unittest.main()
