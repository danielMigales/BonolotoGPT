#!/usr/bin/env python3
"""Auditoría reproducible de predicciones prospectivas frente al azar uniforme."""
import json
import math
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HISTORY = ROOT / "data/forecast-history.json"
DRAWS = ROOT / "data/draws.json"
OUTPUT = ROOT / "public/data/prospective-audit.json"


def hit_distribution():
    # Intersección entre dos subconjuntos de 6 números del universo 1..49.
    denominator = math.comb(49, 6)
    return [math.comb(6, k) * math.comb(43, 6-k) / denominator for k in range(7)]


def exact_upper_tail(total_observed, n_predictions):
    pmf = hit_distribution()
    total = [1.0]
    for _ in range(n_predictions):
        nxt = [0.0] * (len(total) + 6)
        for i, probability in enumerate(total):
            for k, pk in enumerate(pmf):
                nxt[i+k] += probability * pk
        total = nxt
    return min(1.0, sum(total[total_observed:]))


def audit(history, draws):
    records = [x for x in history if x.get("evaluationType") == "prospective"]
    records.sort(key=lambda x: x.get("targetDate", ""))
    issues = []
    seen = set()
    valid = []
    draw_dates = {x.get("date") for x in draws}
    for item in records:
        target = item.get("targetDate")
        if target in seen:
            issues.append(f"Fecha objetivo duplicada: {target}")
        seen.add(target)
        actual, predicted = item.get("actual"), item.get("numbers")
        if not isinstance(target, str) or target not in draw_dates:
            issues.append(f"Resultado no localizado en draws.json: {target}")
            continue
        if not (isinstance(actual, list) and len(actual) == 6 and len(set(actual)) == 6
                and all(type(n) is int and 1 <= n <= 49 for n in actual)):
            issues.append(f"Resultado inválido: {target}")
            continue
        if not (isinstance(predicted, list) and len(predicted) == 6 and len(set(predicted)) == 6
                and all(type(n) is int and 1 <= n <= 49 for n in predicted)):
            issues.append(f"Combinación principal inválida: {target}")
            continue
        hits = len(set(actual) & set(predicted))
        if item.get("hits") != hits:
            issues.append(f"Aciertos guardados no coinciden con el recálculo: {target}")
        trained = item.get("trainedThrough")
        if not isinstance(trained, str) or trained >= target:
            issues.append(f"Posible fuga temporal (trainedThrough >= target): {target}")
        if not item.get("issuedAt"):
            issues.append(f"Sin timestamp de emisión verificable: {target}")
        valid.append({"date": target, "hits": hits, "numbers": sorted(predicted)})
    n = len(valid)
    observed = sum(x["hits"] for x in valid)
    expected_per_draw = 36 / 49
    expected_total = n * expected_per_draw
    distribution = Counter(x["hits"] for x in valid)
    first = records[0]["targetDate"] if records else None
    latest = max(draw_dates) if draw_dates else None
    missing = []
    if first and latest:
        cursor, end = date.fromisoformat(first), date.fromisoformat(latest)
        while cursor <= end:
            d = cursor.isoformat()
            if d in draw_dates and d not in seen:
                missing.append(d)
            cursor += timedelta(days=1)
    return {
        "schemaVersion": 1,
        "generatedFrom": ["data/forecast-history.json", "data/draws.json"],
        "scope": "Solo registros evaluationType=prospective; una combinación principal por sorteo; no se reconstruyen predicciones retrospectivas.",
        "sample": {"n": n, "from": first, "through": valid[-1]["date"] if valid else None},
        "observed": {"totalHits": observed, "meanHits": observed/n if n else None,
                     "hitCounts": {str(k): distribution.get(k, 0) for k in range(7)},
                     "drawsWith3Plus": sum(x["hits"] >= 3 for x in valid),
                     "drawsWith4Plus": sum(x["hits"] >= 4 for x in valid)},
        "uniformRandomNull": {"expectedHitsPerDraw": expected_per_draw,
                              "expectedTotalHits": expected_total,
                              "exactOneSidedPValue": exact_upper_tail(observed, n) if n else None,
                              "method": "Convolución exacta de la distribución hipergeométrica (49,6,6), cola superior para el total de aciertos."},
        "coverage": {"issuedTargetDates": n, "missingDrawDatesInProspectiveSpan": missing,
                     "missingCount": len(missing)},
        "integrity": {"issueCount": len(issues), "issues": issues},
        "interpretation": "Exploratorio. Un p-valor no demuestra capacidad predictiva ni sustituye una muestra prospectiva amplia; los resultados de lotería son independientes y el modelo no garantiza premios."
    }


def main():
    history = json.loads(HISTORY.read_text(encoding="utf-8"))
    draws_doc = json.loads(DRAWS.read_text(encoding="utf-8"))
    report = audit(history, draws_doc.get("draws", []))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Auditoría prospectiva: n={report['sample']['n']}, aciertos={report['observed']['totalHits']}, "
          f"esperados={report['uniformRandomNull']['expectedTotalHits']:.2f}, "
          f"p={report['uniformRandomNull']['exactOneSidedPValue']:.4g}, "
          f"incidencias={report['integrity']['issueCount']}, huecos={report['coverage']['missingCount']}")


if __name__ == "__main__":
    main()
