"""Actualiza el histórico oficial de BonoLoto desde el widget publicado por SELAE."""
import datetime as dt
import html
import json
import pathlib
import re
import subprocess
import time
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
START = dt.date(2026, 1, 1)
BASE = 'https://www.loteriasyapuestas.es/es/bonoloto/resultados/bonoloto-resultados-del-'
MADRID = ZoneInfo('Europe/Madrid')
DRAW_WEEKDAYS = set(range(7))  # SELAE publica sorteos de BonoLoto todos los días
RESULTS_AVAILABLE_AFTER = dt.time(23, 0)
SPANISH_MONTHS = ('enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre')


def official_url(day):
    date = dt.date.fromisoformat(day)
    return BASE + f'{date.day:02d}-de-{SPANISH_MONTHS[date.month - 1]}-de-{date.year}'


def normalize_widget(day, body):
    """Extrae y valida los seis números de la página oficial de resultados de SELAE."""
    text = html.unescape(body)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()

    n = r'(\d{1,2})'
    sep = r'\s*[-–]\s*'
    pattern = (
        n + sep + n + sep + n + sep + n + sep + n + sep + n
        + r'\s*(?:Complementario\s*:\s*)?C\s*\(\s*(\d{1,2})\s*\)'
        + r'\s*(?:Reintegro\s*:\s*)?R\s*\(\s*(\d)\s*\)'
    )
    match = re.search(pattern, text, flags=re.IGNORECASE)
    if not match:
        raise ValueError(f'SELAE no ha devuelto una combinación reconocible para {day}')

    values = list(map(int, match.groups()))
    nums, complementario, reintegro = values[:6], values[6], values[7]
    if (len(set(nums)) != 6 or not all(1 <= value <= 49 for value in nums)
            or not 1 <= complementario <= 49 or complementario in nums
            or not 0 <= reintegro <= 9):
        raise ValueError(f'Combinación oficial inválida para {day}')

    date = dt.date.fromisoformat(day)
    if date < START:
        raise ValueError('Fecha anterior al inicio del histórico')
    return {
        'id': 'BONO-' + date.strftime('%Y%m%d'),
        'date': date.isoformat(),
        'numbers': sorted(nums),
        'source': official_url(day),
    }


def expected_dates(end):
    day = START
    while day <= end:
        if day.weekday() in DRAW_WEEKDAYS:
            yield day.isoformat()
        day += dt.timedelta(days=1)


def latest_scheduled_date(today):
    """Última fecha de sorteo prevista en o antes de today."""
    return today


def should_wait_for_results(now, latest_date):
    """Evita consultar antes de hora y cuando el archivo ya está al día."""
    local_now = now.astimezone(MADRID)
    expected = latest_scheduled_date(local_now.date())
    if latest_date and dt.date.fromisoformat(latest_date) >= expected:
        return True, f'El histórico ya llega al último sorteo previsto ({expected})'
    if local_now.date() == expected and local_now.time().replace(tzinfo=None) < RESULTS_AVAILABLE_AFTER:
        return True, f'Esperando a que se publiquen los resultados del sorteo del {expected}'
    return False, ''


def sorted_draws(merged):
    """Devuelve el histórico ordenado o falla explícitamente si no hay datos."""
    if not merged:
        raise ValueError('SELAE no ha devuelto ningún sorteo válido; se conserva el histórico')
    return sorted(merged.values(), key=lambda row: row['date'], reverse=True)


def fetch_day(day):
    """Lee el resultado de la página oficial de SELAE mediante un proxy de texto porque SELAE bloquea las IP de GitHub Actions."""
    url = 'https://r.jina.ai/' + official_url(day)
    last_error = None
    for attempt in range(3):
        try:
            response = subprocess.run(
                [
                    'curl', '--fail', '--silent', '--show-error', '--location',
                    '--connect-timeout', '15', '--max-time', '45',
                    '--user-agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    '--header', 'Referer: https://www.loteriasyapuestas.es/es/bonoloto/resultados',
                    url,
                ],
                check=True, capture_output=True, text=True, encoding='utf-8',
            )
            return normalize_widget(day, response.stdout)
        except Exception as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(2)
    detail = getattr(last_error, 'stderr', '') or str(last_error)
    raise RuntimeError(f'No se pudo obtener el resultado oficial de SELAE para {day}: {detail}') from last_error


def main():
    now = dt.datetime.now(MADRID)
    today = now.date()
    path = ROOT / 'data/draws.json'
    previous = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'draws': []}
    old_draws = previous.get('draws', [])
    is_bonoloto = bool(old_draws) and all(
        'game_id=BONO' in str(row.get('source', '')) for row in old_draws
    )
    merged = {row['date']: row for row in old_draws} if is_bonoloto else {}
    latest_date = max(merged, default=None)

    if latest_date:
        wait, reason = should_wait_for_results(now, latest_date)
        if wait:
            print(f'Sin consulta a SELAE: {reason}. Se conserva el histórico.')
            return
        start = dt.date.fromisoformat(latest_date) + dt.timedelta(days=1)
    else:
        start = START

    end = today
    if now.time().replace(tzinfo=None) < RESULTS_AVAILABLE_AFTER:
        end -= dt.timedelta(days=1)
    if start > end:
        print('No hay fechas nuevas que consultar; se conserva el histórico.')
        return

    for day in expected_dates(end):
        if day < start.isoformat():
            continue
        merged[day] = fetch_day(day)
        print(f'{day}: resultado oficial validado', flush=True)

    draws = sorted_draws(merged)
    latest = dt.date.fromisoformat(draws[0]['date'])
    missing = sorted(set(expected_dates(latest)) - merged.keys())
    if missing:
        raise ValueError('Faltan sorteos en el calendario diario: ' + ', '.join(missing))
    if len({row['id'] for row in draws}) != len(draws):
        raise ValueError('Identificadores duplicados')

    doc = {
        'schemaVersion': 1,
        'startDate': str(START),
        'source': 'SELAE',
        'checkedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'latestDate': draws[0]['date'],
        'draws': draws,
    }
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tmp.replace(path)
    print(f'Histórico oficial validado: {len(draws)} sorteos; último {draws[0]["date"]}')


if __name__ == '__main__':
    main()
