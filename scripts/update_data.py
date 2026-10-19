"""Actualiza el histórico SELAE solo cuando ya debería existir un sorteo nuevo."""
import calendar
import datetime as dt
import json
import pathlib
import re
import subprocess
import time
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
START = dt.date(2026, 1, 1)
BASE = 'https://www.loteriasyapuestas.es/servicios/buscadorSorteos'
MADRID = ZoneInfo('Europe/Madrid')
DRAW_WEEKDAYS = {0, 3, 5}  # lunes, jueves y sábado
RESULTS_AVAILABLE_AFTER = dt.time(23, 0)


def normalize(row):
    match = re.fullmatch(
        r'\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s+C\((\d+)\)\s+R\((\d+)\)\s*',
        row.get('combinacion', ''),
    )
    if not match or row.get('game_id') != 'LAPR':
        raise ValueError('Registro SELAE no reconocido')
    values = list(map(int, match.groups()))
    nums, c, r = values[:6], values[6], values[7]
    if len(set(nums)) != 6 or not all(1 <= n <= 49 for n in nums) or not 1 <= c <= 49 or c in nums or not 0 <= r <= 9:
        raise ValueError('Combinación inválida')
    date = str(dt.date.fromisoformat(row['fecha_sorteo'][:10]))
    if date < START.isoformat():
        raise ValueError('Fecha anterior al inicio del histórico')
    return dict(
        id=str(row['id_sorteo']),
        date=date,
        numbers=sorted(nums),
        complementary=c,
        refund=r,
        source='https://www.loteriasyapuestas.es/f/loterias/resultados/primitiva.html?game_id=LAPR&fecha_sorteo=' + date.replace('-', ''),
    )


def expected_dates(end):
    day = START
    while day <= end:
        if day.weekday() in DRAW_WEEKDAYS:
            yield day.isoformat()
        day += dt.timedelta(days=1)


def latest_scheduled_date(today):
    """Última fecha de sorteo prevista en o antes de today."""
    day = today
    while day.weekday() not in DRAW_WEEKDAYS:
        day -= dt.timedelta(days=1)
    return day


def should_wait_for_results(now, latest_date):
    """Evita consultas antes de hora y cuando el archivo ya está al día."""
    local_now = now.astimezone(MADRID)
    expected = latest_scheduled_date(local_now.date())
    if latest_date and dt.date.fromisoformat(latest_date) >= expected:
        return True, f'El histórico ya llega al último sorteo previsto ({expected})'
    if local_now.date() == expected and local_now.time().replace(tzinfo=None) < RESULTS_AVAILABLE_AFTER:
        return True, f'Esperando a que se publiquen los resultados del sorteo del {expected}'
    return False, ''


def month_ranges(start, today):
    """Genera intervalos mensuales sin volver a pedir fechas ya archivadas."""
    cursor = start
    while cursor <= today:
        month_end = dt.date(cursor.year, cursor.month, calendar.monthrange(cursor.year, cursor.month)[1])
        end = min(today, month_end)
        yield cursor, end
        cursor = end + dt.timedelta(days=1)


def sorted_draws(merged):
    """Devuelve el histórico ordenado o falla de forma explícita si SELAE no dio datos."""
    if not merged:
        raise ValueError('SELAE no ha devuelto ningún sorteo válido; se conserva el histórico')
    return sorted(merged.values(), key=lambda r: r['date'], reverse=True)


def main():
    now = dt.datetime.now(MADRID)
    today = now.date()
    path = ROOT / 'data/draws.json'
    previous = json.loads(path.read_text()) if path.exists() else {'draws': []}
    merged = {r['date']: r for r in previous.get('draws', [])}
    latest_date = max(merged, default=None)

    # Si ya hay histórico, no consultamos antes de la hora prudente ni si ya
    # contiene el último sorteo previsto. Para un archivo vacío, se hace carga inicial.
    if latest_date:
        wait, reason = should_wait_for_results(now, latest_date)
        if wait:
            print(f'Sin consulta a SELAE: {reason}. Se conserva el histórico.')
            return
        start = dt.date.fromisoformat(latest_date) + dt.timedelta(days=1)
    else:
        start = START

    if start > today:
        print('No hay fechas nuevas que consultar; se conserva el histórico.')
        return

    raw_files = []
    for begin, end in month_ranges(start, today):
        url = BASE + f'?game_id=LAPR&celebrados=true&fechaInicioInclusiva={begin:%Y%m%d}&fechaFinInclusiva={end:%Y%m%d}'
        for attempt in range(3):
            try:
                response = subprocess.run(
                    ['curl', '--fail', '--silent', '--show-error', '--location', '--max-time', '45', url],
                    check=True, capture_output=True, text=True,
                )
                rows = json.loads(response.stdout)
                if not isinstance(rows, list):
                    raise ValueError('SELAE no ha devuelto una lista')
                for row in rows:
                    record = normalize(row)
                    if not begin.isoformat() <= record['date'] <= end.isoformat():
                        raise ValueError('SELAE devuelve una fecha fuera del intervalo solicitado')
                    merged[record['date']] = record
                raw_files.append((begin, end, rows))
                print(f'{begin}–{end}: {len(rows)} registros recibidos', flush=True)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(2)

    # Una respuesta vacía o sin sorteos posteriores no cuenta como actualización:
    # no se toca ni draws.json ni los ficheros brutos.
    if latest_date and max(merged, default='') <= latest_date:
        print('SELAE todavía no publica un sorteo nuevo. Histórico sin cambios.')
        return

    draws = sorted_draws(merged)
    latest = dt.date.fromisoformat(draws[0]['date'])
    missing = sorted(set(expected_dates(latest)) - merged.keys())
    if missing:
        raise ValueError('Faltan sorteos en el calendario habitual: ' + ', '.join(missing))
    if len({r['id'] for r in draws}) != len(draws):
        raise ValueError('Identificadores duplicados')

    doc = dict(
        schemaVersion=1,
        startDate=str(START),
        source='SELAE',
        checkedAt=dt.datetime.now(dt.timezone.utc).isoformat(),
        latestDate=draws[0]['date'],
        draws=draws,
    )

    # Escribe primero los datos validados en temporales y reemplaza el archivo
    # principal solo al final, para no publicar respuestas incompletas.
    for begin, end, rows in raw_files:
        raw_dir = ROOT / 'data/raw'
        raw_dir.mkdir(parents=True, exist_ok=True)
        suffix = f'{begin:%Y-%m}.json' if begin.day == 1 and end.day == calendar.monthrange(end.year, end.month)[1] else f'{begin:%Y%m%d}-{end:%Y%m%d}.json'
        (raw_dir / suffix).write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n')

    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n')
    tmp.replace(path)
    print(f'Histórico validado: {len(draws)} sorteos; último {draws[0]["date"]}')


if __name__ == '__main__':
    main()
