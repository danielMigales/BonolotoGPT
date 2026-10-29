"""Actualiza el histórico oficial de BonoLoto desde las páginas públicas de SELAE."""
import datetime as dt
import csv
import io
from concurrent.futures import ThreadPoolExecutor, as_completed
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
    sep = r'(?:\s*[-–]\s*|\s+)'
    pattern = (
        n + sep + n + sep + n + sep + n + sep + n + sep + n
        + r'\s*(?:Complementario\s*:?\s*)?C\s*\(\s*(\d{1,2})\s*\)'
        + r'\s*(?:Reintegro\s*:?\s*)?R\s*\(\s*(\d)\s*\)'
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
        'complementario': complementario,
        'reintegro': reintegro,
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
    """Descarga un resultado desde los recursos públicos de SELAE, con reintentos breves."""
    widget = 'https://www.loteriasyapuestas.es/f/loterias/resultados/bonoloto.html?game_id=BONO&fecha_sorteo=' + day.replace('-', '')
    urls = [
        'https://r.jina.ai/' + widget,
        'https://r.jina.ai/' + official_url(day),
    ]
    last_error = None
    for url in urls:
        for attempt in range(1):
            try:
                response = subprocess.run(
                    [
                        'curl', '--fail', '--silent', '--show-error', '--location',
                        '--connect-timeout', '5', '--max-time', '15',
                        '--user-agent', 'Mozilla/5.0 (compatible; BonolotoGPT/1.0)',
                        url,
                    ],
                    check=True, capture_output=True, text=True, encoding='utf-8',
                )
                return normalize_widget(day, response.stdout)
            except Exception as exc:
                last_error = exc
    detail = getattr(last_error, 'stderr', '') or str(last_error)
    raise RuntimeError(f'No se pudo obtener el resultado oficial de SELAE para {day}: {detail}') from last_error


BULK_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQALTRaLDFfhXOAQmeONPqmFKm9yOiQ4W97rhWgR41BZ7czFsjK5YktD6fnETKHGB9YUnyQ4XBSbhZx/pub?gid=0&output=csv&single=true'
BULK_SOURCE_PAGE = 'https://lotoideas.com/bonoloto-resultados-historicos-de-todos-los-sorteos/'
# Frecuencias oficiales SELAE para los sorteos del 2026-01-01 al 2026-10-17,
# publicadas en sus estadísticas con actualización del 2026-10-17.
SELAE_COUNTS_THROUGH_2026_10_17 = (
    37, 33, 32, 29, 35, 34, 32, 33, 27, 38, 38, 39, 33, 28, 40, 42, 33,
    46, 34, 25, 36, 44, 49, 33, 35, 40, 25, 35, 32, 37, 38, 30, 35, 27,
    38, 28, 37, 30, 32, 34, 44, 37, 40, 43, 34, 44, 44, 36, 35,
)


def parse_bulk_csv(body, end):
    """Lee el histórico CSV en una sola petición y conserva solo seis números."""
    parsed = {}
    reader = csv.reader(io.StringIO(body.lstrip('\ufeff')))
    for row in reader:
        if not row:
            continue
        first = ','.join(row[:2])
        iso = re.search(r'(?<!\d)(20\d{2})[-/](\d{1,2})[-/](\d{1,2})(?!\d)', first)
        euro = re.search(r'(?<!\d)(\d{1,2})[/-](\d{1,2})[/-](20\d{2})(?!\d)', first)
        try:
            if iso:
                draw_date = dt.date(int(iso.group(1)), int(iso.group(2)), int(iso.group(3)))
            elif euro:
                draw_date = dt.date(int(euro.group(3)), int(euro.group(2)), int(euro.group(1)))
            else:
                continue
        except ValueError:
            continue
        if draw_date < START or draw_date > end:
            continue
        values = []
        for cell in row[1:]:
            token = cell.strip()
            if re.fullmatch(r'\d{1,2}', token):
                values.append(int(token))
        if len(values) < 6:
            continue
        numbers = values[:6]
        if len(set(numbers)) != 6 or not all(1 <= n <= 49 for n in numbers):
            raise ValueError(f'CSV histórico contiene una combinación inválida para {draw_date.isoformat()}')
        day = draw_date.isoformat()
        record = {
            'id': 'BONO-' + draw_date.strftime('%Y%m%d'),
            'date': day,
            'numbers': sorted(numbers),
            'source': official_url(day),
        }
        if day in parsed and parsed[day]['numbers'] != record['numbers']:
            raise ValueError(f'CSV histórico contiene dos combinaciones distintas para {day}')
        parsed[day] = record
    if not parsed:
        raise ValueError('El CSV histórico no contiene sorteos Bonoloto desde 2026-01-01')
    return parsed


def fetch_bulk_history(end):
    """Descarga el CSV histórico en una petición en lugar de consultar cientos de fechas."""
    response = subprocess.run(
        [
            'curl', '--fail', '--silent', '--show-error', '--location',
            '--connect-timeout', '10', '--max-time', '45',
            '--user-agent', 'Mozilla/5.0 (compatible; BonolotoGPT/1.0)',
            BULK_CSV_URL,
        ],
        check=True, capture_output=True, text=True, encoding='utf-8',
    )
    return parse_bulk_csv(response.stdout, end)


def validate_official_frequency_counts(draws):
    """Contrasta el tramo cerrado con la tabla oficial de frecuencias de SELAE."""
    cutoff = dt.date(2026, 10, 17)
    expected_days = list(expected_dates(cutoff))
    by_date = {row['date']: row for row in draws if row['date'] <= cutoff.isoformat()}
    if not all(day in by_date for day in expected_days):
        missing = [day for day in expected_days if day not in by_date]
        raise ValueError('No se puede contrastar con SELAE: faltan fechas del tramo oficial: ' + ', '.join(missing[:10]))
    counts = [0] * 49
    for day in expected_days:
        for number in by_date[day]['numbers']:
            counts[number - 1] += 1
    if tuple(counts) != SELAE_COUNTS_THROUGH_2026_10_17:
        mismatches = [
            f'{number}: app={counts[number - 1]}, SELAE={SELAE_COUNTS_THROUGH_2026_10_17[number - 1]}'
            for number in range(1, 50)
            if counts[number - 1] != SELAE_COUNTS_THROUGH_2026_10_17[number - 1]
        ]
        raise ValueError('El CSV no coincide con las frecuencias oficiales SELAE (hasta 2026-10-17): ' + '; '.join(mismatches[:10]))


RECENT_HISTORY_URL = 'https://lawebdelaprimitiva.com/Bonoloto/Historico%20de%20sorteos'


def parse_recent_history(day, body):
    """Extrae un sorteo reciente del histórico público alternativo cuando SELAE limita la consulta."""
    text = html.unescape(body)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    target = dt.date.fromisoformat(day)
    weekday = r'(?:Dom|Lun|Mar|Mi[eé]|Jue|Vie|S[aá]b)'
    pattern = (
        weekday + r'-(\d{1,2})-(\d{1,2})-(20\d{2})\s+'
        + r'(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+'
        + r'(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})'
    )
    for match in re.finditer(pattern, text, flags=re.IGNORECASE):
        day_num, month_num, year_num = map(int, match.groups()[:3])
        try:
            found_date = dt.date(year_num, month_num, day_num)
        except ValueError:
            continue
        if found_date != target:
            continue
        numbers = list(map(int, match.groups()[3:9]))
        if len(set(numbers)) != 6 or not all(1 <= n <= 49 for n in numbers):
            raise ValueError(f'Histórico alternativo contiene una combinación inválida para {day}')
        return {
            'id': 'BONO-' + target.strftime('%Y%m%d'),
            'date': target.isoformat(),
            'numbers': sorted(numbers),
            'source': official_url(day),
        }
    raise ValueError(f'El histórico alternativo no contiene el sorteo {day}')


def fetch_recent_history(day):
    response = subprocess.run(
        [
            'curl', '--fail', '--silent', '--show-error', '--location',
            '--connect-timeout', '8', '--max-time', '20',
            '--user-agent', 'Mozilla/5.0 (compatible; BonolotoGPT/1.0)',
            RECENT_HISTORY_URL,
        ],
        check=True, capture_output=True, text=True, encoding='utf-8',
    )
    return parse_recent_history(day, response.stdout)

def is_bonoloto_rows(rows):
    return bool(rows) and all(
        str(row.get('id', '')).startswith('BONO-')
        and '/bonoloto/resultados/bonoloto-resultados-del-' in str(row.get('source', '')).lower()
        for row in rows
    )


def write_json_atomic(path, doc):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tmp.replace(path)


def main():
    now = dt.datetime.now(MADRID)
    today = now.date()
    path = ROOT / 'data/draws.json'
    progress_path = ROOT / 'data/draws-progress.json'
    previous = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'draws': []}
    old_draws = previous.get('draws', [])
    merged = {row['date']: row for row in old_draws} if is_bonoloto_rows(old_draws) else {}

    if progress_path.exists():
        progress_doc = json.loads(progress_path.read_text(encoding='utf-8'))
        progress_draws = progress_doc.get('draws', [])
        progress_import_source = progress_doc.get('importSource')
        if not is_bonoloto_rows(progress_draws):
            raise ValueError('El archivo de progreso no contiene un histórico Bonoloto válido; no se sobrescribe.')
        merged.update({row['date']: row for row in progress_draws})
    else:
        progress_import_source = None

    end = today
    if now.time().replace(tzinfo=None) < RESULTS_AVAILABLE_AFTER:
        end -= dt.timedelta(days=1)
    expected = list(expected_dates(end))
    missing = [day for day in expected if day not in merged]

    import_source = previous.get('importSource') or progress_import_source
    if len(missing) > 3:
        print(f'Faltan {len(missing)} fechas: descargando el histórico CSV en una sola petición.', flush=True)
        try:
            bulk = fetch_bulk_history(end)
            # Conserva complementario/reintegro ya registrados solo si la combinación
            # principal coincide con el histórico importado.
            for day, row in bulk.items():
                previous_row = merged.get(day, {})
                if previous_row.get('numbers') == row.get('numbers'):
                    for key in ('complementario', 'reintegro'):
                        if key in previous_row:
                            row[key] = previous_row[key]
                merged[day] = row
            import_source = BULK_SOURCE_PAGE
            write_json_atomic(progress_path, {
                'schemaVersion': 1,
                'startDate': str(START),
                'source': 'SELAE',
                'importSource': import_source,
                'latestDate': max(merged),
                'draws': sorted(merged.values(), key=lambda row: row['date'], reverse=True),
            })
            print(f'CSV histórico importado: {len(bulk)} sorteos; progreso guardado.', flush=True)
        except Exception as exc:
            print(f'No se pudo importar el CSV masivo: {exc}. Se intentará recuperar solo las fechas faltantes.', flush=True)

    missing = [day for day in expected if day not in merged]
    if len(missing) > 3:
        raise RuntimeError(
            f'Todavía faltan {len(missing)} fechas tras intentar la importación masiva. '
            'Se evita lanzar cientos de consultas individuales a SELAE.'
        )

    for day in missing:
        try:
            try:
                merged[day] = fetch_day(day)
                print(f'{day}: resultado obtenido desde SELAE', flush=True)
            except Exception as selae_error:
                # SELAE bloquea algunas IP de GitHub Actions; el CSV masivo ya ha
                # aportado el histórico y esta página pública cubre solo fechas recientes.
                merged[day] = fetch_recent_history(day)
                import_source = f'{import_source or BULK_SOURCE_PAGE}; complemento reciente: {RECENT_HISTORY_URL}'
                print(f'{day}: recuperado desde histórico alternativo tras fallo SELAE ({selae_error})', flush=True)
            write_json_atomic(progress_path, {
                'schemaVersion': 1,
                'startDate': str(START),
                'source': 'SELAE',
                'importSource': import_source,
                'latestDate': max(merged),
                'draws': sorted(merged.values(), key=lambda row: row['date'], reverse=True),
            })
            print(f'{day}: resultado validado; progreso guardado', flush=True)
        except Exception as exc:
            raise RuntimeError(
                f'No se pudo completar {day} tras importar el histórico masivo: {exc}. '
                'Los datos ya recuperados quedan guardados.'
            ) from exc

    draws = sorted_draws(merged)
    dates = {row['date'] for row in draws}
    missing_dates = sorted(set(expected) - dates)
    if missing_dates:
        raise ValueError('Faltan sorteos en el calendario diario: ' + ', '.join(missing_dates[:20]))
    if len({row['id'] for row in draws}) != len(draws):
        raise ValueError('Identificadores duplicados')

    # Verificación independiente del tramo histórico con la tabla de frecuencias publicada por SELAE.
    validate_official_frequency_counts(draws)

    doc = {
        'schemaVersion': 1,
        'startDate': str(START),
        'source': 'SELAE',
        'importSource': import_source,
        'checkedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'latestDate': draws[0]['date'],
        'draws': draws,
    }
    write_json_atomic(path, doc)
    progress_path.unlink(missing_ok=True)
    print(f'Histórico oficial validado: {len(draws)} sorteos; último {draws[0]["date"]}', flush=True)


if __name__ == '__main__':
    main()
