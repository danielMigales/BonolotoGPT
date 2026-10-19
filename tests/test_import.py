import unittest, sys, pathlib, json
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from update_data import normalize, expected_dates
import datetime as dt
class ImportTests(unittest.TestCase):
 def test_parse(self):
  d=normalize(dict(game_id='LAPR',id_sorteo='a',fecha_sorteo='2026-01-01',combinacion='06 - 02 - 03 - 04 - 05 - 01 C(7) R(0)'))
  self.assertEqual(d['numbers'],[1,2,3,4,5,6]); self.assertEqual(d['refund'],0)
 def test_bad_data(self):
  with self.assertRaises(ValueError):normalize(dict(game_id='LAPR',combinacion='sin resultado'))
 def test_calendar(self):
  self.assertEqual(list(expected_dates(dt.date(2026,1,5))),['2026-01-01','2026-01-03','2026-01-05'])
 def test_versioned_archive_has_complete_calendar_and_unique_ids(self):
  root=pathlib.Path(__file__).resolve().parents[1]
  doc=json.loads((root/'data/draws.json').read_text())
  draws=doc['draws']
  dates=[row['date'] for row in draws]
  self.assertEqual(doc['latestDate'],max(dates))
  self.assertEqual(dates,sorted(dates,reverse=True))
  self.assertEqual(set(dates),set(expected_dates(dt.date.fromisoformat(doc['latestDate']))))
  self.assertEqual(len({row['id'] for row in draws}),len(draws))
  for row in draws:
   self.assertEqual(len(row['numbers']),6)
   self.assertEqual(len(set(row['numbers'])),6)
   self.assertTrue(all(1<=n<=49 for n in row['numbers']))
   self.assertTrue(1<=row['complementary']<=49)
   self.assertNotIn(row['complementary'],row['numbers'])
   self.assertTrue(0<=row['refund']<=9)
