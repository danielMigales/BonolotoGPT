#!/usr/bin/env python3
"""Guarda la predicción publicada cuando ya existe el resultado de ese día."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DRAWS_PATH = ROOT / "data/draws.json"
REPORT_PATH = ROOT / "public/data/ai-analysis-15.json"
HISTORY_PATH = ROOT / "data/forecast-history.json"


def main():
    if not DRAWS_PATH.exists() or not REPORT_PATH.exists():
        print("Sin datos/reportes previos; no hay predicción que archivar.")
        return
    draws_doc = json.loads(DRAWS_PATH.read_text(encoding="utf-8"))
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    history = json.loads(HISTORY_PATH.read_text(encoding="utf-8")) if HISTORY_PATH.exists() else []
    if report.get("status") != "ready" or not report.get("forecast"):
        print("No hay predicción lista para contrastar.")
        return
    forecast = report["forecast"]
    target = forecast.get("targetDate")
    actual = next((d for d in draws_doc.get("draws", []) if d.get("date") == target), None)
    if not actual:
        print(f"El resultado de {target} aún no está en el histórico; se conserva la predicción pendiente.")
        return
    if any(item.get("targetDate") == target for item in history):
        print(f"La predicción de {target} ya estaba archivada; no se duplica.")
        return
    numbers = sorted(set(forecast.get("numbers", [])))
    actual_numbers = sorted(set(actual.get("numbers", [])))
    if len(numbers) != 6 or len(actual_numbers) != 6:
        raise ValueError("Predicción o resultado inválido: se esperaban seis números.")
    scores = forecast.get("numberScores", [])
    rank = {item["number"]: i + 1 for i, item in enumerate(scores)}
    score_map = {item["number"]: item["score"] for item in scores}
    prior = [d for d in draws_doc.get("draws", []) if d.get("date", "") <= report.get("sourceLastDate", "")]
    recent = sorted(prior, key=lambda d: d["date"], reverse=True)[:15]
    frequency = {n: sum(n in d["numbers"] for d in prior) for n in range(1, 50)}
    recent_frequency = {n: sum(n in d["numbers"] for d in recent) for n in range(1, 50)}
    record = {
        "targetDate": target,
        "trainedThrough": report.get("sourceLastDate"),
        "version": report.get("version"),
        "window": report.get("window"),
        "numbers": numbers,
        "actual": actual_numbers,
        "hits": len(set(numbers) & set(actual_numbers)),
        "source": actual.get("source"),
        "selectionReasons": [
            {
                "number": n,
                "rank": rank.get(n, 49),
                "score": score_map.get(n, 0),
                "totalFrequency": frequency[n],
                "recentFrequency": recent_frequency[n],
            }
            for n in numbers
        ],
    }
    history.append(record)
    history.sort(key=lambda item: item["targetDate"])
    HISTORY_PATH.write_text(json.dumps(history, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Predicción archivada: {target}; aciertos {record['hits']}/6.")


if __name__ == "__main__":
    main()
