#!/usr/bin/env python3
"""Registra de forma inmutable una predicción publicada antes de su sorteo."""
import hashlib
import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DRAWS_PATH = ROOT / "data/draws.json"
REPORT_PATH = ROOT / "public/data/ai-analysis-7.json"
ISSUED_PATH = ROOT / "data/forecast-issued.json"


def _valid_numbers(value):
    return (
        isinstance(value, list)
        and len(value) == 6
        and all(type(n) is int and 1 <= n <= 49 for n in value)
        and len(set(value)) == 6
    )


def record_forecast(draws_path=DRAWS_PATH, report_path=REPORT_PATH,
                    issued_path=ISSUED_PATH, issued_at=None):
    if not draws_path.exists() or not report_path.exists():
        print("Sin histórico o informe publicado; no se registra ninguna predicción.")
        return False

    draws_doc = json.loads(draws_path.read_text(encoding="utf-8"))
    report = json.loads(report_path.read_text(encoding="utf-8"))
    if report.get("status") != "ready" or not isinstance(report.get("forecast"), dict):
        print("No hay predicción lista para registrar.")
        return False

    forecast = report["forecast"]
    target = forecast.get("targetDate")
    trained_through = report.get("sourceLastDate")
    numbers = forecast.get("numbers")
    second_numbers = forecast.get("secondNumbers")
    if not isinstance(target, str) or not isinstance(trained_through, str) or target <= trained_through:
        print("Predicción omitida: la fecha objetivo no es posterior al último dato usado.")
        return False
    if not _valid_numbers(numbers) or not _valid_numbers(second_numbers):
        raise ValueError("Predicción inválida: se esperaban dos combinaciones de seis números únicos entre 1 y 49.")
    if sorted(numbers) == sorted(second_numbers):
        raise ValueError("Las dos combinaciones deben ser distintas.")

    draws = draws_doc.get("draws", [])
    if any(d.get("date") == target for d in draws):
        print(f"Predicción omitida: el resultado de {target} ya existe; se evita cualquier fuga de información.")
        return False

    issued = json.loads(issued_path.read_text(encoding="utf-8")) if issued_path.exists() else []
    if not isinstance(issued, list):
        raise ValueError("El registro de predicciones debe ser una lista JSON.")
    if any(item.get("targetDate") == target for item in issued):
        print(f"La predicción de {target} ya estaba registrada; se conserva sin cambios.")
        return False

    payload = {
        "targetDate": target,
        "trainedThrough": trained_through,
        "version": report.get("version"),
        "window": report.get("window"),
        "numbers": sorted(numbers),
        "secondNumbers": sorted(second_numbers),
        "combinations": [sorted(numbers), sorted(second_numbers)],
    }
    fingerprint = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    timestamp = issued_at or datetime.now(ZoneInfo("Europe/Madrid")).isoformat(timespec="seconds")
    record = {
        **payload,
        "issuedAt": timestamp,
        "forecastHash": fingerprint,
        "status": "pending",
    }
    issued.append(record)
    issued.sort(key=lambda item: item["targetDate"])
    issued_path.parent.mkdir(parents=True, exist_ok=True)
    issued_path.write_text(json.dumps(issued, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Predicción prospectiva registrada: {target}; datos hasta {trained_through}; hash {fingerprint[:12]}.")
    return True


if __name__ == "__main__":
    record_forecast()
