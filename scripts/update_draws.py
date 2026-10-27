#!/usr/bin/env python3
"""Obtiene los diez sorteos más recientes desde la web oficial de SELAE."""
import json
import re
import sys
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

BASE = "https://www.loteriasyapuestas.es/es/bonoloto/resultados"
OUT = Path("public/data/draws.json")
MONTHS = {"enero":"01","febrero":"02","marzo":"03","abril":"04","mayo":"05","junio":"06",
          "julio":"07","agosto":"08","septiembre":"09","octubre":"10","noviembre":"11","diciembre":"12"}

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.text = []
        self._href = None
        self._anchor_text = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self._href = dict(attrs).get("href")
            self._anchor_text = []
    def handle_data(self, data):
        self.text.append(data)
        if self._href is not None:
            self._anchor_text.append(data)
    def handle_endtag(self, tag):
        if tag == "a" and self._href is not None:
            self.links.append((self._href, " ".join(self._anchor_text).strip()))
            self._href = None
            self._anchor_text = []

def get(url):
    req = Request(url, headers={"User-Agent":"BonolotoGPT/1.0 (results viewer)"})
    with urlopen(req, timeout=25) as response:
        if response.status != 200:
            raise RuntimeError(f"SELAE respondió HTTP {response.status} para {url}")
        return response.read().decode("utf-8", errors="replace")

def parse_date(text):
    m = re.search(r"(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})", text.lower())
    if not m:
        m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", text)
        if not m:
            raise ValueError("No se pudo identificar la fecha del sorteo")
        return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    month = MONTHS.get(m.group(2))
    if not month:
        raise ValueError("Mes no reconocido: " + m.group(2))
    return f"{m.group(3)}-{month}-{int(m.group(1)):02d}"

def main():
    listing = PageParser()
    listing.feed(get(BASE))
    links = []
    seen = set()
    for href, title in listing.links:
        if "bonoloto-resultados-del-" not in (href or ""):
            continue
        url = urljoin(BASE, href)
        if url in seen:
            continue
        seen.add(url)
        links.append((url, title))
    if len(links) < 10:
        raise RuntimeError(f"SELAE solo ha ofrecido {len(links)} enlaces de sorteos; se necesitan 10.")
    draws = []
    for url, title in links[:10]:
        page = PageParser()
        page.feed(get(url))
        text = re.sub(r"\s+", " ", " ".join(page.text))
        match = re.search(
            r"(\d{2})\s*-\s*(\d{2})\s*-\s*(\d{2})\s*-\s*(\d{2})\s*-\s*(\d{2})\s*-\s*(\d{2}).{0,160}?Complementario:\s*C\((\d{1,2})\)\s*Reintegro:\s*R\((\d)\)",
            text, re.I
        )
        if not match:
            raise RuntimeError("No se pudo validar la combinación oficial: " + url)
        nums = [int(match.group(i)) for i in range(1, 7)]
        if len(set(nums)) != 6 or any(n < 1 or n > 49 for n in nums):
            raise RuntimeError("Combinación inválida recibida desde SELAE: " + url)
        draws.append({
            "date": parse_date(title or text),
            "numbers": nums,
            "complementario": int(match.group(7)),
            "reintegro": int(match.group(8)),
            "source": url
        })
    draws.sort(key=lambda d: d["date"], reverse=True)
    if len({d["date"] for d in draws}) != 10:
        raise RuntimeError("Las fechas de los diez sorteos no son únicas.")
    payload = {"updatedAt": date.today().isoformat(), "source": BASE, "draws": draws}
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
    except (URLError, TimeoutError, ValueError, RuntimeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
