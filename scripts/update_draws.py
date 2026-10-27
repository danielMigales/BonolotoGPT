#!/usr/bin/env python3
"""Actualiza los diez últimos sorteos usando el RSS oficial de SELAE."""
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

RSS = "https://www.loteriasyapuestas.es/es/bonoloto/resultados/.formatoRSS"
BASE = "https://www.loteriasyapuestas.es/es/bonoloto/resultados"
OUT = Path("public/data/draws.json")
MONTHS = {"enero":"01","febrero":"02","marzo":"03","abril":"04","mayo":"05","junio":"06",
          "julio":"07","agosto":"08","septiembre":"09","octubre":"10","noviembre":"11","diciembre":"12"}

def get(url):
    req = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Referer": "https://www.loteriasyapuestas.es/"
    })
    with urlopen(req, timeout=25) as response:
        if response.status != 200:
            raise RuntimeError(f"SELAE respondió HTTP {response.status} para {url}")
        return response.read().decode("utf-8", errors="replace")

def local_name(tag):
    return tag.rsplit("}", 1)[-1].lower()

def child_text(item, name):
    for child in item:
        if local_name(child.tag) == name:
            return child.text or ""
    return ""

def parse_date(text):
    m = re.search(r"(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})", text.lower())
    if not m:
        m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", text)
        if not m:
            raise ValueError("No se pudo identificar la fecha del sorteo: " + text[:100])
        return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    month = MONTHS.get(m.group(2))
    if not month:
        raise ValueError("Mes no reconocido: " + m.group(2))
    return f"{m.group(3)}-{month}-{int(m.group(1)):02d}"

def parse_result(text):
    text = html.unescape(re.sub(r"<[^>]+>", " ", text))
    text = re.sub(r"\s+", " ", text)
    match = re.search(
        r"(\d{2})\s*[-–]\s*(\d{2})\s*[-–]\s*(\d{2})\s*[-–]\s*(\d{2})\s*[-–]\s*(\d{2})\s*[-–]\s*(\d{2}).{0,220}?Complementario\s*:?\s*C?\s*\(?\s*(\d{1,2})\s*\)?.{0,100}?Reintegro\s*:?\s*R?\s*\(?\s*(\d)\s*\)?",
        text, re.I
    )
    if not match:
        return None
    nums = [int(match.group(i)) for i in range(1, 7)]
    if len(set(nums)) != 6 or any(n < 1 or n > 49 for n in nums):
        return None
    return {"numbers": nums, "complementario": int(match.group(7)), "reintegro": int(match.group(8))}

def main():
    xml_text = get(RSS)
    root = ET.fromstring(xml_text)
    items = [node for node in root.iter() if local_name(node.tag) == "item"]
    draws, seen = [], set()
    for item in items:
        title = child_text(item, "title")
        link = urljoin(BASE, child_text(item, "link").strip())
        description = child_text(item, "description")
        if "bonoloto" not in (title + " " + link).lower():
            continue
        try:
            draw_date = parse_date(title)
        except ValueError:
            continue
        result = parse_result(title + " " + description)
        if result is None:
            # Some RSS formats only contain a headline; fetch the linked official detail page.
            detail = get(link)
            result = parse_result(detail)
        if result is None:
            raise RuntimeError("No se pudo leer la combinación del RSS oficial: " + link)
        if draw_date in seen:
            continue
        seen.add(draw_date)
        draws.append({"date": draw_date, **result, "source": link})
        if len(draws) == 10:
            break
    draws.sort(key=lambda d: d["date"], reverse=True)
    if len(draws) != 10:
        raise RuntimeError(f"El RSS oficial solo permitió validar {len(draws)} sorteos; se necesitan 10.")
    payload = {"updatedAt": date.today().isoformat(), "source": RSS, "draws": draws}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    new_text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    if OUT.exists() and OUT.read_text(encoding="utf-8") == new_text:
        print("Los diez sorteos ya están actualizados; no hay cambios.")
        return
    OUT.write_text(new_text, encoding="utf-8")
    print("Guardados diez sorteos oficiales, desde", draws[-1]["date"], "hasta", draws[0]["date"])

if __name__ == "__main__":
    try:
        main()
    except (URLError, TimeoutError, ValueError, RuntimeError, ET.ParseError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
