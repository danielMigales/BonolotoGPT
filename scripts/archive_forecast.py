#!/usr/bin/env python3
"""Evalúa predicciones guardadas antes del sorteo y sincroniza su estado."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DRAWS_PATH = ROOT / "data/draws.json"
ISSUED_PATH = ROOT / "data/forecast-issued.json"
HISTORY_PATH = ROOT / "data/forecast-history.json"


def _valid_numbers(value):
    return (
        isinstance(value, list)
        and len(value) == 6
        and all(type(n) is int and 1 <= n <= 49 for n in value)
        and len(set(value)) == 6
    )


def _verify_forecast_hash(forecast):
    """Rechaza alteraciones en registros nuevos antes de evaluarlos."""
    # Los registros antiguos no firmaban ambas combinaciones; se conservan.
    if not forecast.get("combinations") and not forecast.get("secondNumbers"):
        return
    numbers = forecast.get("numbers")
    second_numbers = forecast.get("secondNumbers")
    payload = {
        "targetDate": forecast.get("targetDate"),
        "trainedThrough": forecast.get("trainedThrough"),
        "version": forecast.get("version"),
        "window": forecast.get("window"),
        "numbers": sorted(numbers) if isinstance(numbers, list) else numbers,
        "secondNumbers": sorted(second_numbers) if isinstance(second_numbers, list) else second_numbers,
        "combinations": [sorted(ticket) if isinstance(ticket, list) else ticket for ticket in forecast.get("combinations", [])],
    }
    expected = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    if not forecast.get("forecastHash") or forecast["forecastHash"] != expected:
        raise ValueError(
            "Huella SHA-256 inválida para la predicción " + str(forecast.get("targetDate")) +
            "; el registro pudo alterarse después de emitirse."
        )

def _sync_issued_status(forecast, history_item):
    """Sincroniza un registro emitido con su evaluación histórica ya guardada."""
    if not history_item or history_item.get("evaluationType") != "prospective":
        return False
    updated = dict(forecast)
    updated.update({
        "status": "evaluated",
        "evaluatedAt": history_item.get("evaluatedAt") or history_item.get("targetDate"),
        "actual": sorted(history_item.get("actual", [])),
        "hits": history_item.get("hits"),
        "combinationHits": history_item.get("combinationHits", [history_item.get("hits")]),
    })
    changed = updated != forecast
    if changed:
        forecast.clear()
        forecast.update(updated)
    return changed


def archive_forecasts(draws_path=DRAWS_PATH, issued_path=ISSUED_PATH,
                      history_path=HISTORY_PATH):
    if not draws_path.exists() or not issued_path.exists():
        print("Sin histórico o registro prospectivo; no hay predicciones que evaluar.")
        return 0

    draws_doc = json.loads(draws_path.read_text(encoding="utf-8"))
    issued = json.loads(issued_path.read_text(encoding="utf-8"))
    history = json.loads(history_path.read_text(encoding="utf-8")) if history_path.exists() else []
    if not isinstance(issued, list) or not isinstance(history, list):
        raise ValueError("Los registros de predicciones deben ser listas JSON.")
    draws_by_date = {d.get("date"): d for d in draws_doc.get("draws", [])}
    history_by_date = {item.get("targetDate"): item for item in history}
    added = 0
    issued_changed = False

    for forecast in sorted(issued, key=lambda item: item.get("targetDate", "")):
        target = forecast.get("targetDate")
        if target in history_by_date:
            issued_changed = _sync_issued_status(forecast, history_by_date[target]) or issued_changed
            continue
        actual_draw = draws_by_date.get(target)
        if not actual_draw:
            continue

        _verify_forecast_hash(forecast)
        numbers = forecast.get("numbers")
        combinations = forecast.get("combinations") or (
            [numbers, forecast.get("secondNumbers")]
            if forecast.get("secondNumbers") else [numbers]
        )
        actual = actual_draw.get("numbers")
        if (
            not _valid_numbers(numbers)
            or not _valid_numbers(actual)
            or not isinstance(combinations, list)
            or len(combinations) not in (1, 2)
            or any(not _valid_numbers(ticket) for ticket in combinations)
        ):
            raise ValueError(
                f"Predicción o resultado inválido para {target}: "
                "se esperaban combinaciones válidas y un resultado de seis números."
            )
        if len(combinations) == 2 and sorted(combinations[0]) == sorted(combinations[1]):
            raise ValueError(f"Las dos combinaciones registradas para {target} deben ser distintas.")

        combination_hits = [len(set(ticket) & set(actual)) for ticket in combinations]
        item = {
            "targetDate": target,
            "issuedAt": forecast.get("issuedAt"),
            "trainedThrough": forecast.get("trainedThrough"),
            "version": forecast.get("version"),
            "window": forecast.get("window"),
            "numbers": sorted(numbers),
            "secondNumbers": sorted(combinations[1]) if len(combinations) == 2 else None,
            "combinations": [sorted(ticket) for ticket in combinations],
            "combinationHits": combination_hits,
            "actual": sorted(actual),
            "hits": combination_hits[0],
            "source": actual_draw.get("source"),
            "forecastHash": forecast.get("forecastHash"),
            "evaluationType": "prospective",
        }
        history.append(item)
        history_by_date[target] = item
        issued_changed = _sync_issued_status(forecast, item) or issued_changed
        added += 1
        print(f"Predicción prospectiva evaluada: {target}; aciertos {combination_hits[0]}/6.")

    if added:
        history.sort(key=lambda item: item.get("targetDate", ""))
        history_path.parent.mkdir(parents=True, exist_ok=True)
        history_path.write_text(json.dumps(history, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if added or issued_changed:
        issued_path.write_text(json.dumps(issued, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if not added:
        print("No hay predicciones prospectivas nuevas con resultado disponible.")
    return added


if __name__ == "__main__":
    archive_forecasts()
