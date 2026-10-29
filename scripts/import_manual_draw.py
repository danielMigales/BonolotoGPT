#!/usr/bin/env python3
"""Guarda un sorteo Bonoloto introducido manualmente desde la web."""
import datetime as dt
import json
import os
import pathlib
import re
import sys
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
MADRID = ZoneInfo("Europe/Madrid")


def parse_draw(body, existing):
    fields = {}
    for line in (body or "").splitlines():
        match = re.match(r"^\s*(Fecha|Números|Numeros|Complementario|Reintegro)\s*:\s*(.*?)\s*$", line, re.I)
        if match:
            fields[match.group(1).lower().replace("ú", "u")] = match.group(2)
    required = ("fecha", "numeros", "complementario", "reintegro")
    if any(not fields.get(key) for key in required):
        raise ValueError("Faltan campos. Debe incluir Fecha, Números, Complementario y Reintegro.")
    try:
        date = dt.date.fromisoformat(fields["fecha"])
    except ValueError:
        raise ValueError("La fecha debe tener formato AAAA-MM-DD.") from None
    today = dt.datetime.now(MADRID).date()
    if date < dt.date(2026, 1, 1) or date > today:
        raise ValueError("La fecha debe estar entre 2026-01-01 y hoy.")
    try:
        numbers = [int(x) for x in re.split(r"[,;\s]+", fields["numeros"].strip()) if x]
        complementario = int(fields["complementario"])
        reintegro = int(fields["reintegro"])
    except ValueError:
        raise ValueError("Los números deben ser valores enteros.") from None
    if len(numbers) != 6 or len(set(numbers)) != 6 or any(n < 1 or n > 49 for n in numbers):
        raise ValueError("Introduce exactamente seis números distintos del 1 al 49.")
    if not 1 <= complementario <= 49 or complementario in numbers:
        raise ValueError("El complementario debe estar entre 1 y 49 y no repetir un número principal.")
    if not 0 <= reintegro <= 9:
        raise ValueError("El reintegro debe estar entre 0 y 9.")
    date_text = date.isoformat()
    draws = existing.get("draws", [])
    latest = max((str(row.get("date", "")) for row in draws), default="")
    if latest and date_text < latest:
        raise ValueError(f"Solo se admite el último sorteo o una fecha posterior. El histórico llega a {latest}.")
    official_url = (
        "https://www.loteriasyapuestas.es/es/bonoloto/resultados/bonoloto-resultados-del-"
        f"{date.day:02d}-de-{('enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre')[date.month-1]}-de-{date.year}"
    )
    row = {
        "id": "BONO-" + date.strftime("%Y%m%d"),
        "date": date_text,
        "numbers": sorted(numbers),
        "source": official_url,
        "complementario": complementario,
        "reintegro": reintegro,
        "entryMethod": "manual",
    }
    return row


def main():
    output = os.environ.get("GITHUB_OUTPUT")
    try:
        body = os.environ.get("ISSUE_BODY", "")
        path = ROOT / "data/draws.json"
        doc = json.loads(path.read_text(encoding="utf-8"))
        row = parse_draw(body, doc)
        by_date = {item["date"]: item for item in doc.get("draws", [])}
        previous = by_date.get(row["date"])
        if previous and previous.get("numbers") == row["numbers"] and previous.get("complementario") == row["complementario"] and previous.get("reintegro") == row["reintegro"]:
            raise ValueError("Ese sorteo ya está guardado con los mismos datos; no se ha duplicado.")
        by_date[row["date"]] = row
        draws = sorted(by_date.values(), key=lambda item: item["date"], reverse=True)
        doc["draws"] = draws
        doc["latestDate"] = draws[0]["date"]
        doc["checkedAt"] = dt.datetime.now(dt.timezone.utc).isoformat()
        path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        status, message = "success", f"Sorteo {row['date']} guardado: {', '.join(map(str, row['numbers']))}; complementario {row['complementario']}; reintegro {row['reintegro']}."
    except Exception as exc:
        status, message = "error", str(exc)
    if output:
        with open(output, "a", encoding="utf-8") as stream:
            stream.write("status=" + status + "\n")
            stream.write("message=" + message.replace("%", "%25").replace("\n", "%0A").replace("\r", "%0D") + "\n")
    print(message)
    if status == "error":
        return


if __name__ == "__main__":
    main()
