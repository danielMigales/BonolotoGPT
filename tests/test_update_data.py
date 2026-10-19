import datetime as dt
import unittest
from zoneinfo import ZoneInfo

from scripts.update_data import (
    expected_dates,
    latest_scheduled_date,
    normalize,
    should_wait_for_results,
    sorted_draws,
)

MADRID = ZoneInfo('Europe/Madrid')


class UpdateDataScheduleTests(unittest.TestCase):
    def test_empty_archive_fails_clearly_instead_of_index_error(self):
        with self.assertRaisesRegex(ValueError, 'ningún sorteo válido'):
            sorted_draws({})

    def test_bonoloto_is_scheduled_monday_to_saturday(self):
        self.assertEqual(
            latest_scheduled_date(dt.date(2026, 10, 18)),
            dt.date(2026, 10, 17),
        )
        dates = list(expected_dates(dt.date(2026, 1, 3)))
        self.assertEqual(dates, ['2026-01-01', '2026-01-02', '2026-01-03'])

    def test_normalizes_official_bonoloto_record(self):
        record = normalize({
            'game_id': 'BONO',
            'id_sorteo': 'official-20260101',
            'fecha_sorteo': '2026-01-01 21:42:00',
            'combinacion': '07 - 08 - 10 - 13 - 41 - 43 C(30) R(5)',
        })
        self.assertEqual(record['date'], '2026-01-01')
        self.assertEqual(record['numbers'], [7, 8, 10, 13, 41, 43])
        self.assertEqual(set(record), {'id', 'date', 'numbers', 'source'})
        self.assertIn('bonoloto.html?game_id=BONO', record['source'])

    def test_rejects_primitiva_record(self):
        with self.assertRaisesRegex(ValueError, 'Registro SELAE no reconocido'):
            normalize({
                'game_id': 'LAPR',
                'id_sorteo': 'wrong-game',
                'fecha_sorteo': '2026-01-01 21:42:00',
                'combinacion': '07 - 08 - 10 - 13 - 41 - 43 C(30) R(5)',
            })

    def test_waits_until_2300_on_expected_draw_day(self):
        now = dt.datetime(2026, 10, 19, 22, 59, tzinfo=MADRID)
        wait, reason = should_wait_for_results(now, '2026-10-18')
        self.assertTrue(wait)
        self.assertIn('Esperando', reason)

    def test_allows_check_after_2300_on_draw_day(self):
        now = dt.datetime(2026, 10, 19, 23, 1, tzinfo=MADRID)
        wait, _ = should_wait_for_results(now, '2026-10-18')
        self.assertFalse(wait)

    def test_skips_when_archive_already_has_latest_scheduled_draw(self):
        now = dt.datetime(2026, 10, 20, 10, 0, tzinfo=MADRID)
        wait, reason = should_wait_for_results(now, '2026-10-20')
        self.assertTrue(wait)
        self.assertIn('ya llega', reason)

    def test_checks_if_expected_draw_is_missing_from_archive(self):
        now = dt.datetime(2026, 10, 20, 10, 0, tzinfo=MADRID)
        wait, _ = should_wait_for_results(now, '2026-10-19')
        self.assertFalse(wait)


if __name__ == '__main__':
    unittest.main()
