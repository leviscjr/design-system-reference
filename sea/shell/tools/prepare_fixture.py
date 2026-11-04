#!/usr/bin/env python3
"""Gera o fixture do caso de uso a partir de um datasheet oficial (PDF).

Uso:  python3 tools/prepare_fixture.py <ne555.pdf>
Fonte: https://www.ti.com/lit/ds/symlink/ne555.pdf  (SLFS022K, Rev. K)

Para cada parâmetro declarado abaixo o script LOCALIZA a linha no PDF; se a
linha ou algum valor não for encontrado, falha. Nada é inferido: os valores
são copiados da tabela e a caixa de evidência vem das coordenadas do texto.
"""
import hashlib, json, re, subprocess, sys, pathlib
from xml.etree import ElementTree as ET

FAIL = []
PDF = pathlib.Path(sys.argv[1])
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_IMG = ROOT / "src/assets/pages"
OUT_JSON = ROOT / "src/demo/fixture.generated.json"
PAGES = [1, 4, 5, 7]
DPI = 120

# (id, seção, nome, símbolo, aplica-se a, condição, min, typ, max, unidade, página, tokens-da-linha, nth)
P = [
 ("abs.vcc",  "5.1 Absolute Maximum Ratings", "Supply voltage", "VCC", "NA555 NE555 SA555 SE555", "", "", "", "18", "V", 4, ["Supply","voltage","18","V"], 0),
 ("abs.io",   "5.1 Absolute Maximum Ratings", "Output current", "IO", "NA555 NE555 SA555 SE555", "", "", "", "±225", "mA", 4, ["Output","current","±225","mA"], 0),
 ("abs.tj",   "5.1 Absolute Maximum Ratings", "Operating virtual junction temperature", "TJ", "NA555 NE555 SA555 SE555", "", "", "", "150", "°C", 4, ["Operating","virtual","150","°C"], 0),
 ("abs.tstg", "5.1 Absolute Maximum Ratings", "Storage temperature", "Tstg", "NA555 NE555 SA555 SE555", "", "–65", "", "150", "°C", 4, ["Storage","temperature","–65","150"], 0),
 ("esd.hbm",  "5.2 ESD Ratings", "Electrostatic discharge", "V(ESD)", "NA555 NE555 SA555 SE555", "Human-body model (HBM), per ANSI/ESDA/JEDEC JS-001", "", "", "±500", "V", 4, ["Human-body","model","(HBM),","±500"], 0),
 ("esd.cdm",  "5.2 ESD Ratings", "Electrostatic discharge", "V(ESD)", "NA555 NE555 SA555 SE555", "Charged device model (CDM), per ANSI/ESDA/JEDEC JS-002", "", "", "±1500", "V", 4, ["Charged","device","model","±1500"], 0),
 ("rec.vcc",  "5.3 Recommended Operating Conditions", "Supply voltage", "VCC", "NA555 NE555 SA555", "", "4.5", "", "16", "V", 4, ["NA555,","NE555,","SA555","4.5","16"], 0),
 ("rec.vcc.se","5.3 Recommended Operating Conditions", "Supply voltage", "VCC", "SE555", "", "4.5", "", "18", "V", 4, ["SE555","4.5","18"], 0),
 ("rec.io",   "5.3 Recommended Operating Conditions", "Output current", "IO", "NA555 NE555 SA555 SE555", "", "", "", "±200", "mA", 4, ["Output","current","±200","mA"], 0),
 ("rec.ta.na","5.3 Recommended Operating Conditions", "Operating free-air temperature", "TA", "NA555", "", "–40", "", "105", "°C", 4, ["NA555","–40","105"], 0),
 ("rec.ta.ne","5.3 Recommended Operating Conditions", "Operating free-air temperature", "TA", "NE555", "", "0", "", "70", "°C", 4, ["NE555","0","70"], 0),
 ("rec.ta.sa","5.3 Recommended Operating Conditions", "Operating free-air temperature", "TA", "SA555", "", "–40", "", "85", "°C", 4, ["SA555","–40","85"], 0),
 ("rec.ta.se","5.3 Recommended Operating Conditions", "Operating free-air temperature", "TA", "SE555", "", "–55", "", "125", "°C", 4, ["SE555","–55","125"], 0),
 ("th.rja.d", "5.4 Thermal Information", "Junction-to-ambient thermal resistance", "RθJA", "D (SOIC) · 8 pins", "", "", "125.4", "", "°C/W", 5, ["125.4","92.2"], 0),
 ("th.rja.p", "5.4 Thermal Information", "Junction-to-ambient thermal resistance", "RθJA", "P (PDIP) · 8 pins", "", "", "98.5", "", "°C/W", 5, ["125.4","98.5"], 0),
 ("el.thres15","5.5 Electrical Characteristics", "THRES voltage level", "", "NA555 NE555 SA555", "VCC = 15V", "8.8", "10", "11.2", "V", 5, ["8.8","10","11.2"], 0),
 ("el.thres5","5.5 Electrical Characteristics", "THRES voltage level", "", "NA555 NE555 SA555", "VCC = 5V", "2.4", "3.3", "4.2", "V", 5, ["2.4","3.3","4.2"], 0),
 ("el.thresi","5.5 Electrical Characteristics", "THRES current", "", "NA555 NE555 SA555 SE555", "", "", "30", "250", "nA", 5, ["THRES","30","250","nA"], 0),
 ("el.trig15","5.5 Electrical Characteristics", "TRIG voltage level", "", "NA555 NE555 SA555", "VCC = 15V", "4.5", "5", "5.6", "V", 5, ["4.5","5","5.6"], 0),
 ("el.trig5", "5.5 Electrical Characteristics", "TRIG voltage level", "", "NA555 NE555 SA555", "VCC = 5V", "1.1", "1.67", "2.2", "V", 5, ["1.1","1.67","2.2"], 0),
 ("el.trigi", "5.5 Electrical Characteristics", "TRIG current", "", "NA555 NE555 SA555", "TRIG at 0V", "", "0.5", "2", "μA", 5, ["NA555,","0.5","2","μA"], 0),
 ("el.reset", "5.5 Electrical Characteristics", "RESET voltage level", "", "NA555 NE555 SA555", "", "0.3", "0.7", "1", "V", 5, ["0.3","0.7","1"], 0),
 ("sw.tr",    "5.6 Switching Characteristics", "Output-pulse rise time", "tr", "NA555 NE555 SA555", "CL = 15pF, TA = 25°C, 20% to 80%", "", "100", "300", "ns", 7, ["100","300"], 0),
 ("sw.tf",    "5.6 Switching Characteristics", "Output-pulse fall time", "tf", "NA555 NE555 SA555", "CL = 15pF, TA = 25°C, 80% to 20%", "", "100", "300", "ns", 7, ["100","300"], 1),
]

# Observações de página 1/4 (texto literal do documento)
OBS = [
 ("obs.family", "family-title", 1, ["xx555","Precision","Timers"], "xx555 Precision Timers"),
 ("obs.models", "part-numbers", 1, ["NA555,","NE555,","SA555,","SE555"], "NA555, NE555, SA555, SE555"),
 ("obs.docid",  "document-id",  1, ["SLFS022K"], "SLFS022K"),
 ("obs.maker",  "manufacturer", 4, ["Texas","Instruments","Incorporated"], "Texas Instruments Incorporated"),
]

HL = {"th.rja.d": ["125.4"], "th.rja.p": ["98.5"]}

def sh(*a):
    return subprocess.run(a, check=True, capture_output=True, text=True).stdout

def page_words(n):
    xml = sh("pdftotext", "-bbox", "-f", str(n), "-l", str(n), str(PDF), "-")
    xml = re.sub(r'<!DOCTYPE[^>]*>', '', xml); xml = xml.replace(' xmlns="http://www.w3.org/1999/xhtml"', '')
    pg = ET.fromstring(xml).find(".//page")
    W, H = float(pg.get("width")), float(pg.get("height"))
    ws = [(float(w.get("xMin")), float(w.get("yMin")), float(w.get("xMax")), float(w.get("yMax")), w.text or "") for w in pg.iter("word")]
    return W, H, ws

def rows(ws, tol=2.6):
    out = []
    for w in sorted(ws, key=lambda w: ((w[1]+w[3])/2, w[0])):
        cy = (w[1]+w[3])/2
        if out and abs(out[-1]["cy"]-cy) <= tol:
            out[-1]["w"].append(w); out[-1]["cy"] = (out[-1]["cy"]*(len(out[-1]["w"])-1)+cy)/len(out[-1]["w"])
        else: out.append({"cy": cy, "w": [w]})
    return out

def locate(rws, tokens, nth):
    hits = []
    for r in rws:
        texts = [w[4] for w in r["w"]]
        if all(t in texts for t in tokens): hits.append(r)
    if len(hits) <= nth: FAIL.append(f"NÃO ENCONTRADO: {tokens} (nth={nth})"); return None
    return hits[nth]

def pick(rowwords, toks):
    """uma palavra por token (a mais à direita entre repetidas): evita capturar subscritos do símbolo"""
    used, out = set(), []
    for t in toks:
        c = sorted([i for i, w in enumerate(rowwords) if w[4] == t and i not in used], key=lambda i: rowwords[i][0])
        if c: used.add(c[-1]); out.append(rowwords[c[-1]])
    return out

def box(ws, W, H, pad=1.5):
    x0=min(w[0] for w in ws)-pad; y0=min(w[1] for w in ws)-pad; x1=max(w[2] for w in ws)+pad; y1=max(w[3] for w in ws)+pad
    return [round(x0/W,4), round(y0/H,4), round(x1/W,4), round(y1/H,4)]

def main():
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    data = {"pages": [], "params": [], "observations": [], "source": {}}
    cache = {}
    for n in PAGES:
        W, H, ws = page_words(n); cache[n] = (W, H, ws, rows(ws))
        base = str(OUT_IMG / f"p{n:02d}")
        sh("pdftoppm", "-jpeg", "-jpegopt", "quality=74", "-r", str(DPI), "-f", str(n), "-l", str(n), "-singlefile", str(PDF), base)
        data["pages"].append({"n": n, "w": W, "h": H, "img": f"pages/p{n:02d}.jpg"})
    for (pid, sec, name, sym, app, cond, mn, ty, mx, unit, pg, toks, nth) in P:
        W, H, ws, rws = cache[pg]
        r = locate(rws, toks, nth)
        if r is None: continue
        sel = pick(r["w"], HL.get(pid, toks))
        # valida que cada valor declarado existe na linha encontrada
        line = [w[4] for w in r["w"]]
        for v in (mn, ty, mx):
            if v and v not in line: FAIL.append(f"valor {v!r} ausente na linha de {pid}: {line}")
        band = box(r["w"], W, H, pad=1.0)
        data["params"].append({"id": pid, "section": sec, "name": name, "symbol": sym, "applies": app.split(" ") if app[:1] in "NS" and "·" not in app else [app],
            "condition": cond, "min": mn, "typ": ty, "max": mx, "unit": unit,
            "evidence": {"page": pg, "box": box(sel, W, H), "excerpt": " ".join(w[4] for w in sorted(sel, key=lambda w: w[0]))}})
    for (oid, role, pg, toks, text) in OBS:
        W, H, ws, rws = cache[pg]
        r = locate(rws, toks, 0)
        if r is None: continue
        sel = pick(r["w"], toks)
        data["observations"].append({"id": oid, "role": role, "text": text, "evidence": {"page": pg, "box": box(sel, W, H), "excerpt": " ".join(w[4] for w in sorted(sel, key=lambda w: w[0]))}})
    if FAIL: raise SystemExit("\n".join(FAIL))
    info = sh("pdfinfo", str(PDF))
    meta = dict(l.split(":", 1) for l in info.splitlines() if ":" in l)
    data["source"] = {
        "title": meta["Title"].strip(), "docId": meta["Keywords"].strip(), "pages": int(meta["Pages"]),
        "sha256": hashlib.sha256(PDF.read_bytes()).hexdigest(), "bytes": PDF.stat().st_size,
        "url": "https://www.ti.com/lit/ds/symlink/ne555.pdf", "manufacturer": "Texas Instruments",
        "renderedPages": PAGES, "dpi": DPI}
    OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=1))
    print(f"ok: {len(data['params'])} parâmetros, {len(data['observations'])} observações, {len(PAGES)} páginas")

main()
