#!/usr/bin/env python3
"""Gera dados e páginas de dois PDFs oficiais, falhando se os hashes ou valores divergirem.

Uso: python prepare_pv_fixture.py <h3.pdf> <cq16.pdf>
Requer pdfplumber e pdftoppm. O código seleciona sempre o valor mais à direita
na linha H3, correspondente à coluna H3-125-Plus, conforme o cabeçalho.
"""
import hashlib
import json
import pathlib
import subprocess
import sys
import pdfplumber

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'assets' / 'pv-pages'
JSON = ROOT / 'src' / 'demo' / 'pv.generated.json'
DOCS = [
    dict(key='h3', file=pathlib.Path(sys.argv[1]), sha256='26b171ed52d2d0ea6f0b694f7eed769482ff3587062d90ff555e5a259aced600',
         title='EN-H3-Plus-Datasheet-V2.7-20251204', revision='2.7 · 2025-12-04', manufacturer='Fox ESS',
         url='https://www.fox-ess.com/Public/Uploads/uploadfile/files/20251204/ENH3PlusDatasheetV2.720251204-904.pdf',
         label='H3 Plus · datasheet', models=['H3-125-Plus'], params=[
             ('ac','AC OUTPUT (GRID)','Nominal AC Power','125','kW','Nominal','H3-125-Plus'),
             ('array','PV INPUT','Max. Array Power','250','kW','Máximo','H3-125-Plus'),
             ('current','AC OUTPUT (GRID)','Rated AC Output Current (Per Phase)','190','A','Por fase','H3-125-Plus'),
             ('trackers','PV INPUT','No. of MPP Trackers','8','','','H3-125-Plus'),
         ]),
    dict(key='cq', file=pathlib.Path(sys.argv[2]), sha256='d3098bfc10d4f1271a7f57346f6546d2a556ffe7b07f8016a8d7f0af762e688e',
         title='EN-CQ16-CQBOX-Datasheet-V1.3-20251024', revision='1.3 · 2025-10-24', manufacturer='Fox ESS',
         url='https://www.fox-ess.com/Public/Uploads/uploadfile/files/20251203/ENCQ16CQBOXDatasheetV1.320251024.pdf',
         label='CQ16 / CQ BOX · datasheet', models=['CQ16','CQ BOX'], params=[
             ('box.voltage','CQ BOX','Voltage Range [Vdc]','101 ~ 1000','Vdc','Faixa operacional','CQ BOX'),
             ('voltage','CQ16','Nominal Voltage','51.2','Vdc','Nominal','CQ16'),
             ('capacity','CQ16','Nominal Capacity [Ah]','314','Ah','Nominal','CQ16'),
             ('energy','CQ16','Nominal Capacity [kWh]','16.07','kWh','Nominal','CQ16'),
             ('peak','CQ16','Peak Discharge Current','470 @60S','A','Por 60 s','CQ16'),
         ]),
]

def extract(doc):
    f = doc['file']
    if hashlib.sha256(f.read_bytes()).hexdigest() != doc['sha256']:
        raise SystemExit(f'Hash divergente: {f}')
    with pdfplumber.open(f) as pdf:
        if len(pdf.pages) != 2: raise SystemExit(f'Número inesperado de páginas: {f}')
        page = pdf.pages[1]; lines = page.extract_text_lines(); words = page.extract_words()
        if doc['key'] == 'h3' and not any('H3-125-Plus' in line['text'] for line in lines):
            raise SystemExit('Coluna H3-125-Plus ausente')
        params = []
        for ident, section, label, value, unit, condition, model in doc['params']:
            hits = [line for line in lines if label in line['text'] and value in line['text']]
            if len(hits) != 1: raise SystemExit(f'Linha ambígua/ausente: {label} {value}: {len(hits)}')
            line = hits[0]; row = [w for w in words if abs(w['top'] - line['top']) < 4]; selected = []
            for token in value.split():
                matches = [w for w in row if w['text'] == token and w not in selected]
                if not matches: raise SystemExit(f'Token ausente: {label} {token}')
                selected.append(max(matches, key=lambda w: w['x0']))
            if doc['key'] == 'h3' and min(w['x0'] for w in selected) < page.width * .85:
                raise SystemExit(f'Valor não está na coluna H3-125-Plus: {label}')
            box = [min(w['x0'] for w in selected)/page.width, min(w['top'] for w in selected)/page.height,
                   max(w['x1'] for w in selected)/page.width, max(w['bottom'] for w in selected)/page.height]
            params.append(dict(id=doc['key']+'.'+ident, section=section, name=label, symbol='', applies=[model],
                               condition=condition, min='', typ=value, max='', unit=unit, document=doc['key'],
                               evidence=dict(page=2, box=[round(v,6) for v in box], excerpt=line['text'])))
        pages=[]
        for n, pg in enumerate(pdf.pages,1):
            name=f"{doc['key']}-{n:02d}"
            subprocess.run(['pdftoppm','-jpeg','-jpegopt','quality=80','-r','120','-f',str(n),'-l',str(n),'-singlefile',str(f),str(OUT/name)],check=True)
            pages.append(dict(n=n,w=pg.width,h=pg.height,img=f'pv-pages/{name}.jpg'))
    return dict(key=doc['key'],label=doc['label'],models=doc['models'],params=params,pages=pages,
                source=dict(title=doc['title'],docId=doc['key'].upper(),revision=doc['revision'],pages=2,
                            sha256=doc['sha256'],bytes=f.stat().st_size,url=doc['url'],manufacturer=doc['manufacturer'],renderedPages=[1,2]))

OUT.mkdir(parents=True,exist_ok=True)
result={'documents':[extract(doc) for doc in DOCS]}
JSON.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print('PDFs verificados:', ', '.join(f"{d['key']}: {len(d['params'])} parâmetros" for d in result['documents']))
