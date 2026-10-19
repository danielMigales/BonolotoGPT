import datetime as dt
import unittest
from zoneinfo import ZoneInfo

from scripts.update_data import (
    expected_dates,
    latest_scheduled_date,
    normalize_widget,
    should_wait_for_results,
    sorted_draws,
)

MADRID = ZoneInfo('Europe/Madrid')


class UpdateDataScheduleTests(unittest.TestCase):
    def test_empty_archive_fails_clearly_instead_of_index_error(self):
        with self.assertRaisesRegex(ValueError, 'ningún sorteo válido'):
            sorted_draws({})

    def test_bonoloto_is_scheduled_every_day_including_sunday(self):
        self.assertEqual(
            latest_scheduled_date(dt.date(2026, 10, 18)),
            dt.date(2026, 10, 18),
        )
        dates = list(expected_dates(dt.date(2026, 1, 3)))
        self.assertEqual(dates, ['2026-01-01', '2026-01-02', '2026-01-03'])

    def test_parses_official_selae_widget_and_keeps_only_six_numbers(self):
        body = '''
        <div>08 - 11 - 21 - 41 - 47 - 48
        Complementario: C(34) Reintegro: R(4)</div>
        '''
        record = normalize_widget('2026-10-14', body)
        self.assertEqual(record['date'], '2026-10-14')
        self.assertEqual(record['numbers'], [8, 11, 21, 41, 47, 48])
        self.assertEqual(set(record), {'id', 'date', 'numbers', 'source'})
        self.assertEqual(record['id'], 'BONO-20261014')
        self.assertEqual(record['source'], 'https://www.loteriasyapuestas.es/es/bonoloto/resultados/bonoloto-resultados-del-14-de-octubre-de-2026')

    def test_parses_official_html_when_numbers_are_separated_by_whitespace(self):
        # SELAE puede devolver los números en spans separados, sin guiones.
        record = normalize_widget(
            '2026-01-01',
            '<div>07</div><div>08</div><div>10</div><div>13</div><div>41</div><div>43</div> Complementario C(30) Reintegro R(5)',
        )
        self.assertEqual(record['numbers'], [7, 8, 10, 13, 41, 43])

    def test_parses_widget_without_optional_labels(self):
        record = normalize_widget(
            '2026-10-17',
            '<p>18 - 32 - 37 - 38 - 42 - 49 C(20) R(7)</p>',
        )
        self.assertEqual(record['numbers'], [18, 32, 37, 38, 42, 49])

    def test_rejects_unrecognized_or_invalid_official_result(self):
        with self.assertRaisesRegex(ValueError, 'combinación reconocible'):
            normalize_widget('2026-10-14', '<p>Resultados pendientes</p>')
        with self.assertRaisesRegex(ValueError, 'Combinación oficial inválida'):
            normalize_widget(
                '2026-10-14',
                '<p>08 - 08 - 21 - 41 - 47 - 48 C(34) R(4)</p>',
            )

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
        now = dt.datetime(2026, 10, 20, 23, 1, tzinfo=MADRID)
        wait, _ = should_wait_for_results(now, '2026-10-19')
        self.assertFalse(wait)


if __name__ == '__main__':
    unittest.main()
