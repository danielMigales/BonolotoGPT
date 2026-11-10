#!/usr/bin/env python3
"""Auditor reproducible de predicciones prospectivas frente al azar uniforme."""
import hashlib
import json
import math
from collections import Counter
from datetime import date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
HISTORY = ROOT / "data/forecast-history.json"
DRAWS = ROOT / "data/draws.json"
OUTPUT = ROOT / "public/data/prospective-audit.json"
MADRID = ZoneInfo("Europe/Madrid")


def hit_distribution():
    denominator = math.comb(49, 6)
    return [math.comb(6, k) * math.comb(43, 6-k) / denominator for k in range(7)]


def exact_upper_tail(total_observed, n_predictions):
    if n_predictions == 0:
        return 1.0
    pmf = hit_distribution()
    total = [1.0]
    for _ in range(n_predictions):
        nxt = [0.0] * (len(total) + 6)
        for i, probability in enumerate(total):
            for k, pk in enumerate(pmf):
                nxt[i+k] += probability * pk
        total = nxt
    return min(1.0, sum(total[total_observed:]))


def _valid_numbers(value):
    return (isinstance(value, list) and len(value) == 6
            and all(type(n) is int and 1 <= n <= 49 for n in value)
            and len(set(value)) == 6)


def _verify_hash(item):
    # Las tres primeras entradas son registros heredados sin las dos combinaciones
    # completas: no se les atribuye una integridad criptográfica que no se puede probar.
    if not item.get("combinations") and not item.get("secondNumbers"):
        return False
    payload = {
        "targetDate": item.get("targetDate"),
        "trainedThrough": item.get("trainedThrough"),
        "version": item.get("version"),
        "window": item.get("window"),
        "numbers": sorted(item["numbers"]) if isinstance(item.get("numbers"), list) else item.get("numbers"),
        "secondNumbers": sorted(item["secondNumbers"]) if isinstance(item.get("secondNumbers"), list) else item.get("secondNumbers"),
        "combinations": [sorted(ticket) if isinstance(ticket, list) else ticket
                         for ticket in item.get("combinations", [])],
    }
    version = item.get("hashVersion", 1)
    if version == 2:
        payload["issuedAt"] = item.get("issuedAt")
    elif version != 1:
        return False
    expected = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    return bool(item.get("forecastHash")) and item["forecastHash"] == expected


def audit(history, draws):
    records = sorted((x for x in history if x.get("evaluationType") == "prospective"),
                     key=lambda x: x.get("targetDate", ""))
    issues, warnings, seen, verified = [], [], set(), []
    draws_by_date = {x.get("date"): x for x in draws}
    for item in records:
        target = item.get("targetDate")
        problems = []
        if target in seen:
            problems.append("fecha objetivo duplicada")
        seen.add(target)
        draw = draws_by_date.get(target)
        if not draw:
            problems.append("resultado no localizado en draws.json")
        actual, predicted = item.get("actual"), item.get("numbers")
        if not _valid_numbers(actual):
            problems.append("resultado guardado inválido")
        if not _valid_numbers(predicted):
            problems.append("combinación principal inválida")
        if draw and _valid_numbers(actual) and _valid_numbers(draw.get("numbers")):
            if sorted(actual) != sorted(draw["numbers"]):
                problems.append("resultado guardado no coincide con draws.json")
        if draw and _valid_numbers(actual) and _valid_numbers(predicted):
            recalculated = len(set(actual) & set(predicted))
            if item.get("hits") != recalculated:
                problems.append("aciertos guardados no coinciden con el recálculo")
        trained = item.get("trainedThrough")
        if not isinstance(trained, str) or not isinstance(target, str) or trained >= target:
            problems.append("posible fuga temporal (trainedThrough >= targetDate)")
        timestamp = item.get("issuedAt")
        try:
            issued = datetime.fromisoformat(timestamp)
            target_day = date.fromisoformat(target)
            if issued.tzinfo is None or issued.utcoffset() is None:
                raise ValueError("sin zona horaria")
            cutoff = datetime.combine(target_day, time(21, 30), MADRID)
            if issued.astimezone(MADRID) >= cutoff:
                problems.append("emisión posterior al corte conservador de 21:30 Madrid")
            if issued.astimezone(MADRID).date() > target_day:
                problems.append("emisión posterior a la fecha del sorteo")
        except (TypeError, ValueError):
            problems.append("timestamp de emisión inválido o sin zona horaria")
        hash_ok = _verify_hash(item)
        if not hash_ok:
            combinations = item.get("combinations")
            legacy_single = (item.get("hashVersion", 1) == 1
                             and isinstance(combinations, list)
                             and len(combinations) == 1
                             and item.get("secondNumbers") is None)
            if ((not combinations and not item.get("secondNumbers")) or legacy_single):
                warnings.append(f"{target}: registro heredado; hash de combinación no verificable")
            else:
                problems.append("hash SHA-256 inválido o versión desconocida")
        if problems:
            issues.extend(f"{target}: {problem}" for problem in problems)
        elif hash_ok:
            verified.append({"date": target, "hits": len(set(actual) & set(predicted))})
    n_all = len(records)
    all_hits = [len(set(x.get("actual", [])) & set(x.get("numbers", [])))
                for x in records if _valid_numbers(x.get("actual")) and _valid_numbers(x.get("numbers"))]
    n_verified = len(verified)
    verified_total = sum(x["hits"] for x in verified)
    all_total = sum(all_hits)
    draw_dates = sorted(d for d in draws_by_date if isinstance(d, str))
    missing = []
    if records and draw_dates:
        start = date.fromisoformat(records[0]["targetDate"])
        end = date.fromisoformat(max(draw_dates))
        cursor = start
        while cursor <= end:
            day = cursor.isoformat()
            if day in draws_by_date and day not in seen:
                missing.append(day)
            cursor += timedelta(days=1)
    def summary(hits, n):
        counts = Counter(hits)
        total = sum(hits)
        return {
            "n": n, "totalHits": total, "meanHits": total/n if n else None,
            "expectedTotalHitsAtRandom": n * 36/49,
            "exactOneSidedPValue": exact_upper_tail(total, n) if n else None,
            "hitCounts": {str(k): counts.get(k, 0) for k in range(7)},
        }
    return {
        "schemaVersion": 2,
        "generatedFrom": ["data/forecast-history.json", "data/draws.json"],
        "scope": "Solo predicciones prospectivas guardadas antes del sorteo; no se reconstruyen combinaciones retrospectivas.",
        "allRecorded": summary(all_hits, len(all_hits)),
        "cryptographicallyVerified": summary([x["hits"] for x in verified], n_verified),
        "verification": {
            "verifiedCount": n_verified,
            "legacyUnverifiableCount": len(warnings),
            "issueCount": len(issues),
            "issues": issues,
            "warnings": warnings,
        },
        "coverage": {
            "issuedCount": n_all,
            "drawDatesWithoutPrediction": missing,
            "missingCount": len(missing),
        },
        "randomModel": {
            "expectedHitsPerCombination": 36/49,
            "hitDistribution": {str(k): p for k, p in enumerate(hit_distribution())},
            "method": "Distribución hipergeométrica exacta (49 números, 6 elegidos, 6 sorteados), convolución independiente y cola superior del total.",
        },
        "interpretation": "El contraste de la muestra verificada es exploratorio. Hay pocos registros, se consulta repetidamente y el sistema no tenía un protocolo de análisis prerregistrado; por tanto el p-valor no confirma una ventaja predictiva. Mantener registro prospectivo continuo y validar en una muestra independiente mucho mayor.",
    }


def main():
    history = json.loads(HISTORY.read_text(encoding="utf-8"))
    draws_doc = json.loads(DRAWS.read_text(encoding="utf-8"))
    report = audit(history, draws_doc.get("draws", []))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    v = report["cryptographicallyVerified"]
    print(f"Auditoría prospectiva: verificadas={v['n']}, aciertos={v['totalHits']}, "
          f"esperados={v['expectedTotalHitsAtRandom']:.2f}, "
          f"p={v['exactOneSidedPValue']:.4g}, "
          f"incidencias={report['verification']['issueCount']}, "
          f"heredadas_no_verificables={report['verification']['legacyUnverifiableCount']}, "
          f"huecos={report['coverage']['missingCount']}")


if __name__ == "__main__":
    main()
