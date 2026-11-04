#!/usr/bin/env node
/* Validação no navegador (Chromium/Playwright) do artefato FINAL sea/shell/index.html.
 * Roda uma cópia isolada (única peça numa pasta vazia) por file://, com toda rede bloqueada e registrada.
 * Uso: NODE_PATH=$(npm root -g) node sea/shell/tests/validate.cjs   →  escreve tests/RESULTS.md
 * Usa o renderizador disponível; WebGL e fallback são verificados também em atmosphere.cjs.
 * Tempos medidos em headless; valores absolutos variam por máquina. */
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const SRC = path.join(__dirname, '..', 'index.html');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sea-shell-'));
const FILE = path.join(dir, 'index.html'); fs.copyFileSync(SRC, FILE);
const URL = 'file://' + FILE;
const html = fs.readFileSync(FILE, 'utf8');
const results = [];
const T = (id, name) => ({ id, name });
async function check(id, name, fn) {
  const t0 = Date.now();
  try { const d = await fn(); results.push({ id, name, ok: true, detail: d || '' }); console.log('PASS', id, name, d ? '— ' + d : ''); }
  catch (e) { results.push({ id, name, ok: false, detail: String(e.message || e).split('\n')[0] }); console.log('FAIL', id, name, '—', String(e.message || e).split('\n')[0]); }
}
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion'); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const idle = (p, ms = 6000) => p.waitForFunction(() => !SEA.u.Spring.busy() && !document.querySelector('.ghost'), null, { timeout: ms, polling: 50 });

(async () => {
  const browser = await chromium.launch();
  const net = [], errs = [];
  async function open(opts = {}) {
    const ctx = await browser.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 860 }, colorScheme: opts.scheme || 'dark', reducedMotion: opts.reduced ? 'reduce' : 'no-preference', deviceScaleFactor: 1 });
    await ctx.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue(); net.push(u); return r.abort(); });
    const p = await ctx.newPage();
    p.setDefaultTimeout(5000);
    p.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.goto(URL); await p.waitForFunction(() => window.SEA && SEA.app && document.querySelector('.row.sel')); await p.waitForTimeout(700);
    return p;
  }
  const sel = (p) => p.evaluate(() => SEA.app.store.selection);
  const st = (p, id) => p.evaluate((i) => SEA.app.store.get(i).state, id);

  await check('T00', 'Artefato único sem referências externas (estático)', async () => {
    assert(!/<link[^>]+href/i.test(html) && !/<script[^>]+src=/i.test(html), 'link/script externo');
    assert(!/@import|url\(\s*["']?https?:/i.test(html), 'css externo');
    assert(!/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(html.replace(/\/\*[\s\S]*?\*\//g, '')), 'chamada de rede no código');
    return `${(html.length / 1024).toFixed(0)} KiB · sha256 ${crypto.createHash('sha256').update(html).digest('hex').slice(0, 16)}…`;
  });

  let p = await open();
  await check('T01', 'Carrega por file://, sem erros de console e sem requisições de rede', async () => {
    assert(!errs.length, errs.join(' | ')); assert(!net.length, 'rede: ' + net.join(','));
    p.__marker = await p.evaluate(() => { document.querySelector('.ws').dataset.marker = 'keep'; return 1; });
  });

  await check('T02', 'Estado inicial: árvore ARIA, seleção sincronizada nos três painéis', async () => {
    const r = await p.evaluate(() => ({ tree: !!document.querySelector('[role=tree]'), items: document.querySelectorAll('[role=treeitem]').length, total:SEA.app.store.all().length, selected: document.querySelectorAll('[role=treeitem][aria-selected=true]').length, insp: document.querySelector('.in-title').textContent, hl: !!document.querySelector('.hl.sel'), crumb: document.querySelector('.crumb .cur').textContent }));
    assert(r.tree && r.items >= 10 && r.total >= 20 && r.selected === 1, JSON.stringify(r)); assert(r.hl, 'sem destaque no PDF'); assert(/Nominal AC Power/.test(r.insp) && /Nominal AC Power/.test(r.crumb), r.insp + ' / ' + r.crumb);
    return `${r.items} itens na árvore`;
  });

  await check('T03', 'Explorer → Canvas/Inspector: clicar no documento troca o contexto', async () => {
    await p.click('.row[data-id="doc:h3"] .lb'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ sel: SEA.app.store.selection, kind: document.querySelector('.in').dataset.kind, scope: document.querySelector('.cv-scope-t').textContent, viewer: document.querySelector('.cv-tab.on').id }));
    assert(r.sel === 'doc:h3' && r.kind === 'document' && /H3 Plus/.test(r.scope), JSON.stringify(r));
  });

  await check('T04', 'Estado vazio útil (sem documento no contexto) e retorno', async () => {
    const missing=await p.evaluate(()=>{const state=SEA.viewerPdf.supports({scope:{docKey:'missing'},store:SEA.app.store});return {title:state.title,action:typeof state.action?.run};});
    assert(missing.title==='Sem páginas no fixture' && missing.action==='function',JSON.stringify(missing));
    await p.click('.row[data-id="sup:fox"] .lb'); await p.waitForTimeout(350);
    let r = await p.evaluate(() => ({ empty: document.querySelector('.cv-state.is-empty p')?.textContent, btn: !!document.querySelector('.cv-state .btn'), stageHidden: document.querySelector('.cv-stage').classList.contains('is-hidden') }));
    assert(r.empty && r.btn && r.stageHidden, JSON.stringify(r));
    await p.click('.cv-state .btn'); await p.waitForTimeout(400);
    r = await p.evaluate(() => ({ sel: SEA.app.store.selection, empty: !!document.querySelector('.cv-state.is-empty:not([hidden])'), vis: !document.querySelector('.cv-stage').classList.contains('is-hidden') }));
    assert(r.sel === 'doc:h3' && !r.empty && r.vis, JSON.stringify(r)); return r.sel;
  });

  await check('T05', 'Troca de viewer sem reconstruir o shell (mesma instância do DOM)', async () => {
    await p.click('#tab-table'); await p.waitForTimeout(700);
    await p.click('#tab-class'); await p.waitForTimeout(500); await p.click('#tab-record'); await p.waitForTimeout(300); await p.click('#tab-pdf'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ marker: document.querySelector('.ws').dataset.marker, vws: [...document.querySelectorAll('.vw')].map((v) => v.dataset.viewer + ':' + (v.hidden ? 'h' : 'v')).join(',') }));
    assert(r.marker === 'keep', 'shell reconstruído'); assert(/pdf:v/.test(r.vws) && (r.vws.match(/:v/g) || []).length === 1, r.vws); return r.vws;
  });

  await check('T06', 'Canvas → Explorer/Inspector: linha da tabela seleciona, árvore acompanha, hero recebe o valor', async () => {
    await p.click('#tab-table'); await p.waitForTimeout(500);
    await p.click('tr.rw[data-id="par:h3.array"] td.c-name'); await p.waitForTimeout(900);
    const r = await p.evaluate(() => { const row = document.querySelector('.row.sel'), tree = document.querySelector('.ex-tree'); const rr = row.getBoundingClientRect(), tr = tree.getBoundingClientRect(); return { sel: SEA.app.store.selection, row: row.dataset.id, inView: rr.top >= tr.top - 1 && rr.bottom <= tr.bottom + 1, hero: document.querySelector('[data-morph=value]')?.textContent, crumb: document.querySelector('.crumb .cur').textContent }; });
    assert(r.sel === 'par:h3.array' && r.row === r.sel && r.inView, JSON.stringify(r)); assert(/250/.test(r.hero), r.hero); return r.hero;
  });

  await check('T07', 'Referência à origem: Enter na tabela localiza no PDF (destaque visível na área rolável)', async () => {
    await p.focus('tr.rw.sel'); await p.keyboard.press('Enter'); await p.waitForTimeout(1300);
    const r = await p.evaluate(() => { const hl = document.querySelector('.hl.sel'), sc = document.querySelector('.pdf-scroll'); const a = hl.getBoundingClientRect(), b = sc.getBoundingClientRect(); return { tab: document.querySelector('.cv-tab.on').id, id: hl.dataset.id, vis: a.top >= b.top && a.bottom <= b.bottom && a.left >= b.left && a.right <= b.right, page: hl.closest('.pdf-page').dataset.page }; });
    assert(r.tab === 'tab-pdf' && r.id === 'par:h3.array' && r.vis, JSON.stringify(r)); return `página ${r.page}`;
  });

  await check('T08', 'PDF → seleção: clicar na evidência seleciona o parâmetro e atualiza o Inspector', async () => {
    await p.click('.hl[data-id="par:h3.current"]', { force: true }); await p.waitForTimeout(500);
    const r = await p.evaluate(() => ({ sel: SEA.app.store.selection, title: document.querySelector('.in-title').textContent, hero: document.querySelector('[data-morph=value]').textContent }));
    assert(r.sel === 'par:h3.current' && /Rated AC Output Current/.test(r.title) && /190/.test(r.hero), JSON.stringify(r)); return r.hero;
  });

  await check('T09', 'Revisão por teclado (A/X/R): estado muda em Explorer, Canvas e Inspector; desfazer restaura', async () => {
    await p.click('#tab-class'); await p.waitForTimeout(700);
    await p.click('.st-world .st-n[data-id="mod:H3-125-Plus"]'); await p.waitForTimeout(400);
    assert((await sel(p)) === 'mod:H3-125-Plus'); const laneBefore = await p.getAttribute('.st-world .st-n[data-id="mod:H3-125-Plus"]', 'data-lane');
    await p.locator('.st-world .st-n[data-id="mod:H3-125-Plus"]').focus(); await p.keyboard.press('a'); await p.waitForTimeout(700);
    const after = await p.evaluate(() => ({ st: SEA.app.store.get('mod:H3-125-Plus').state, lane: document.querySelector('.st-world .st-n[data-id="mod:H3-125-Plus"]').dataset.lane, chip: document.querySelector('.row[data-id="mod:H3-125-Plus"] .chip')?.className, insp: document.querySelector('.in-chip .chip-t')?.textContent }));
    assert(laneBefore === '1' && after.st === 'acc' && after.lane === '2' && /positive/.test(after.chip) && after.insp === 'Aceito', JSON.stringify(after));
    await p.click('.toast-b'); await p.waitForTimeout(700);
    const back = await p.evaluate(() => ({ st: SEA.app.store.get('mod:H3-125-Plus').state, lane: document.querySelector('.st-world .st-n[data-id="mod:H3-125-Plus"]').dataset.lane }));
    assert(back.st === 'cand' && back.lane === '1', JSON.stringify(back)); return 'cand → acc → cand; faixa 1 → 2 → 1';
  });

  await check('T10', 'Morph: um fantasma por vez, interrompível, destino visível ao final', async () => {
    await p.evaluate(() => SEA.app.store.select('par:h3.ac', { source: 'palette' })); await p.click('#tab-table'); await p.waitForTimeout(600);
    await p.click('tr.rw[data-id="par:h3.array"] td.c-n:nth-of-type(5)'); await p.waitForTimeout(40);
    const during = await p.evaluate(() => document.querySelectorAll('.ghost').length);
    await p.click('tr.rw[data-id="par:h3.current"] td.c-name', { delay: 0 }); await p.waitForTimeout(50);
    const mid = await p.evaluate(() => document.querySelectorAll('.ghost').length);
    await p.click('tr.rw[data-id="par:h3.trackers"] td.c-name'); const tM = Date.now(); await idle(p); const settleMs = Date.now() - tM; await p.waitForTimeout(60);
    const end = await p.evaluate(() => ({ ghosts: document.querySelectorAll('.ghost').length, vis: getComputedStyle(document.querySelector('[data-morph=value]')).visibility, sel: SEA.app.store.selection, hero: document.querySelector('[data-morph=value]').textContent }));
    assert(during <= 1 && mid <= 1, `fantasmas ${during}/${mid}`); assert(end.ghosts === 0 && end.vis === 'visible' && end.sel === 'par:h3.trackers' && /8/.test(end.hero), JSON.stringify(end)); return `fantasmas durante=${during}, interrompido=${mid}, final=${end.ghosts}; assentou em ${settleMs} ms`;
  });

  await check('T11', 'Teclado na árvore: setas, Home/End, →/←, Enter, digitação', async () => {
    await p.locator('.row.sel').focus();
    const f = () => p.evaluate(() => document.activeElement.dataset.id);
    const a = await f(); await p.keyboard.press('ArrowDown'); const b = await f(); assert(a !== b, 'ArrowDown');
    await p.keyboard.press('Home'); assert((await f()) === 'grp:cat', 'Home'); await p.keyboard.press('End'); const last = await f(); assert(last && last !== 'grp:cat', 'End ' + last);
    await p.keyboard.press('Home'); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(200); assert((await p.getAttribute('.row[data-id="grp:cat"]', 'aria-expanded')) === 'false', 'recolher');
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250); assert((await p.getAttribute('.row[data-id="grp:cat"]', 'aria-expanded')) === 'true', 'expandir');
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.type('H3-125'); assert((await f()) === 'mod:H3-125-Plus' || /H3-125-Plus/.test(await p.evaluate(() => document.activeElement.textContent)), 'typeahead ' + await f());
    await p.keyboard.press('Enter'); await p.waitForTimeout(300); assert((await sel(p)) === 'mod:H3-125-Plus', 'Enter seleciona'); return 'ok';
  });

  await check('T12', 'Busca e filtros compactos', async () => {
    await p.fill('.ex-in', 'power'); await p.waitForTimeout(250);
    let r = await p.evaluate(() => ({ n: document.querySelectorAll('.row').length, leaf: [...document.querySelectorAll('.row.leaf')].every((x) => /power/i.test(x.textContent)), count: document.querySelector('.ex-count').textContent }));
    assert(r.n < 15 && r.leaf, JSON.stringify(r)); await p.fill('.ex-in', ''); await p.waitForTimeout(150);
    await p.click('.ex-f[aria-label="Estado: Observado"]'); await p.waitForTimeout(250);
    r = await p.evaluate(() => ({ leaves: [...document.querySelectorAll('.row.leaf')].map((x) => x.dataset.id) }));
    assert(r.leaves.length >= 2 && r.leaves.includes('par:h3.ac') && r.leaves.includes('par:h3.array'), JSON.stringify(r)); await p.click('.ex-f[aria-label="Estado: Observado"]'); await p.waitForTimeout(200);
    await p.fill('.ex-in', 'zzzz'); await p.waitForTimeout(200); assert(await p.isVisible('.ex-empty'), 'estado vazio'); await p.fill('.ex-in', ''); return 'filtro por texto/estado/vazio';
  });

  const w = (sel) => p.evaluate((s) => Math.round(document.querySelector(s).getBoundingClientRect().width), sel);
  await check('T13', 'Explorer recolhe sem perder a seleção; Canvas aproveita o espaço; reversível e interrompível', async () => {
    const cv0 = await w('.cv'), ex0 = await w('.ex'), s0 = await sel(p);
    await p.keyboard.press('Control+b'); await idle(p);
    const ex1 = await w('.ex'), cv1 = await w('.cv'); assert(ex1 <= 44 && cv1 > cv0 + 200, `ex ${ex1} cv ${cv0}->${cv1}`);
    const rail = await p.evaluate(() => ({ lbl: document.querySelector('.rail-sel').getAttribute('aria-label'), vis: getComputedStyle(document.querySelector('.ex-rail')).opacity }));
    assert(/Seleção/.test(rail.lbl) && rail.vis === '1', JSON.stringify(rail)); assert((await sel(p)) === s0, 'seleção mudou');
    await p.keyboard.press('Control+b'); await p.waitForTimeout(110); await p.keyboard.press('Control+b'); await idle(p);   // interrompe a reabertura no meio
    assert((await w('.ex')) <= 44, 'interrupção: deveria terminar recolhido'); await p.keyboard.press('Control+b'); await idle(p);
    const ex2 = await w('.ex'); assert(Math.abs(ex2 - ex0) <= 2, `restaurou ${ex2} vs ${ex0}`); return `Explorer ${ex0}→${ex1}→${ex2}px; Canvas ${cv0}→${cv1}px`;
  });

  await check('T14', 'Redimensionamento por arraste, teclado e duplo clique; limites respeitados', async () => {
    const hnd = await p.locator('.rz-ex').boundingBox(); const e0 = await w('.ex');
    await p.mouse.move(hnd.x + hnd.width / 2, hnd.y + 200); await p.mouse.down(); await p.mouse.move(hnd.x + 80, hnd.y + 200, { steps: 6 }); await p.mouse.up(); await idle(p);
    const e1 = await w('.ex'); assert(e1 > e0 + 40, `arraste ${e0}->${e1}`);
    await p.locator('.rz-ex').focus(); await p.keyboard.press('ArrowLeft'); await idle(p); const e2 = await w('.ex'); assert(e2 < e1, 'teclado');
    await p.locator('.rz-ex').dblclick(); await idle(p); const e3 = await w('.ex'); assert(Math.abs(e3 - 320) <= 2, 'duplo clique ' + e3);
    const hi = await p.locator('.rz-in').boundingBox(); await p.mouse.move(hi.x + 4, hi.y + 200); await p.mouse.down(); await p.mouse.move(hi.x - 900, hi.y + 200, { steps: 6 }); await p.mouse.up(); await idle(p);
    const i1 = await w('.in'); assert(i1 <= 560 && (await w('.cv')) >= 440, `limite ${i1}`); await p.locator('.rz-in').dblclick(); await idle(p);
    return `Explorer ${e0}→${e1}→${e2}→${e3}; Inspector limitado a ${i1}px`;
  });

  await check('T15', 'Inspector: recolhe/expande, grupos preservam estado entre seleções', async () => {
    await p.evaluate(() => SEA.app.store.select('par:h3.ac', { source: 'palette' })); await p.waitForTimeout(300); await p.click('.sx[data-id="p-md"] .sx-h');
    await p.click('#tab-table'); await p.click('tr.rw[data-id="par:h3.array"] td.c-name'); await p.waitForTimeout(500);
    const open = await p.evaluate(() => document.querySelector('.sx[data-id="p-md"]')?.classList.contains('open')); assert(open, 'seção Metadados deveria permanecer aberta');
    await p.click('.in-h .ib[aria-label="Recolher Inspector"]'); await idle(p); const w1 = await w('.in'); assert(w1 <= 44, 'recolhido ' + w1);
    const sel0 = await sel(p); await p.click('.ex-tree .row[data-id="par:h3.current"] .lb'); await idle(p);
    assert((await w('.in')) <= 44, 'recolhido pelo usuário não deve reabrir sozinho'); assert(await p.evaluate(() => document.querySelector('.in').classList.contains('pulse')), 'sem sinal de atividade');
    await p.click('.in-rail .ib'); await idle(p); assert((await w('.in')) > 250, 'reabrir'); await p.click('.sx[data-id="p-md"] .sx-h'); return `recolhido ${w1}px → ${await w('.in')}px`;
  });

  await check('T16', 'Palette (Ctrl+K): busca, navegação por teclado, Enter seleciona, Esc devolve o foco', async () => {
    await p.locator('.tb-search').focus(); await p.keyboard.press('Control+k'); await p.waitForSelector('.pal-in'); assert(await p.evaluate(() => document.activeElement.classList.contains('pal-in')), 'foco');
    await p.keyboard.type('h3-125-plus'); await p.waitForTimeout(150); const first = await p.evaluate(() => document.querySelector('.pal-i.on .pal-l').textContent); assert(first === 'H3-125-Plus', first);
    await p.keyboard.press('Enter'); await p.waitForTimeout(400); assert((await sel(p)) === 'mod:H3-125-Plus', 'seleção');
    await p.keyboard.press('Control+k'); await p.waitForSelector('.pal-in'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    assert(!(await p.$('.pal-wrap')), 'fechou'); return 'ok';
  });

  await check('T17', 'Modo foco (F/Esc), histórico (Alt+←/→) e tema', async () => {
    const s = await sel(p); const cv0 = await w('.cv'); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.keyboard.press('f'); await idle(p);
    const cvF = await w('.cv'); assert(cvF > cv0 + 300 && (await w('.ex')) < 4 && (await w('.in')) < 4, `foco ${cv0}->${cvF}`); await p.keyboard.press('Escape'); await idle(p);
    assert(Math.abs((await w('.cv')) - cv0) <= 3, 'restaura'); assert((await sel(p)) === s, 'seleção preservada no foco');
    await p.keyboard.press('Alt+ArrowLeft'); await p.waitForTimeout(300); const back = await sel(p); assert(back !== s, 'voltar'); await p.keyboard.press('Alt+ArrowRight'); await p.waitForTimeout(300); assert((await sel(p)) === s, 'avançar');
    const t0 = await p.evaluate(() => document.documentElement.dataset.theme); await p.keyboard.press('Control+Shift+L'); await p.waitForTimeout(500); const t1 = await p.evaluate(() => document.documentElement.dataset.theme); assert(t0 !== t1, 'tema'); await p.keyboard.press('Control+Shift+L'); return `${t0}→${t1}→${t0}`;
  });

  await check('T18', 'Actionbar flutuante reposiciona para não cobrir a seleção (e volta)', async () => {
    await p.evaluate(() => SEA.app.store.select('par:cq.energy', { source: 'palette' })); await p.click('#tab-pdf'); await p.waitForTimeout(1500);
    const pos0 = await p.getAttribute('.ab-float', 'data-pos');
    await p.evaluate(() => { const sc = document.querySelector('.pdf-scroll'), hl = document.querySelector('.hl.sel'), b = document.querySelector('.cv-body').getBoundingClientRect(); const a = hl.getBoundingClientRect(); sc.scrollTop += a.top - (b.bottom - 50); });
    await p.waitForTimeout(900); const pos1 = await p.getAttribute('.ab-float', 'data-pos');
    const geo = await p.evaluate(() => { const bar = document.querySelector('.ab-float').getBoundingClientRect(), hl = document.querySelector('.hl.sel').getBoundingClientRect(); return !(hl.bottom < bar.top || hl.top > bar.bottom); });
    await p.evaluate(() => { const sc = document.querySelector('.pdf-scroll'), hl = document.querySelector('.hl.sel'), b = document.querySelector('.cv-body').getBoundingClientRect(); const a = hl.getBoundingClientRect(); sc.scrollTop += a.top - (b.top + b.height / 2); });
    await p.waitForTimeout(900); const pos2 = await p.getAttribute('.ab-float', 'data-pos');
    assert(pos0 === 'bottom' && pos1 === 'top' && pos2 === 'bottom' && !geo, `${pos0}/${pos1}/${pos2} sobreposição=${geo}`); return `${pos0} → ${pos1} → ${pos2}`;
  });

  await check('T19', 'Sem rolagem global; rolagem localizada independente (Explorer, Canvas, Inspector)', async () => {
    const r = await p.evaluate(() => { const d = document.documentElement; const tree = document.querySelector('.ex-tree'), body = document.querySelector('.in-body'), pdf = document.querySelector('.pdf-scroll'); return { gs: d.scrollHeight <= innerHeight && d.scrollWidth <= innerWidth && document.body.scrollHeight <= innerHeight, ov: getComputedStyle(document.body).overflow, treeScroll: tree.scrollHeight > tree.clientHeight, pdfScroll: pdf.scrollHeight > pdf.clientHeight, inspScroll: body.scrollHeight >= body.clientHeight }; });
    assert(r.gs && r.ov === 'hidden' && r.pdfScroll, JSON.stringify(r)); const y0 = await p.evaluate(() => scrollY); await p.evaluate(() => { document.querySelector('.pdf-scroll').scrollTop += 300; }); assert((await p.evaluate(() => scrollY)) === y0, 'página global rolou'); return JSON.stringify(r);
  });

  await check('T20', 'Acessibilidade: nomes acessíveis em icon-only, tooltips, foco visível, ARIA de tabs/separators', async () => {
    const r = await p.evaluate(() => { const ib = [...document.querySelectorAll('button.ib')].filter((b) => !b.querySelector('.ib-t')); const bad = ib.filter((b) => !(b.getAttribute('aria-label') || '').trim()).map((b) => b.className); const seps = [...document.querySelectorAll('[role=separator][tabindex]')].every((s) => s.getAttribute('aria-label') && s.getAttribute('aria-orientation') && s.hasAttribute('aria-valuenow')); const tabs = document.querySelectorAll('[role=tab]').length, sel = document.querySelectorAll('[role=tab][aria-selected=true]').length; return { n: ib.length, bad, seps, tabs, sel }; });
    assert(r.bad.length === 0 && r.seps && r.tabs === 4 && r.sel === 1, JSON.stringify(r));
    await p.locator('.cv-h .ib').first().focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(150);
    const f = await p.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a); return { ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2, tip: document.querySelector('.tip.on')?.textContent || '' }; });
    assert(f.ring, 'foco visível ausente'); await p.hover('.tb .ib[aria-label^="Inspector"]'); await p.waitForTimeout(600); const tip = await p.evaluate(() => document.querySelector('.tip.on')?.textContent || ''); assert(/Inspector/.test(tip) && /Ctrl/.test(tip), 'tooltip: ' + tip); return `${r.n} botões de ícone com nome; tooltip "${tip}"`;
  });

  await check('T21', 'Contraste estimado do texto principal/secundário (WCAG AA ≥ 4,5:1) nos dois temas', async () => {
    const out = [];
    for (const th of ['dark', 'light']) {
      const c = await p.evaluate((th) => { document.documentElement.dataset.theme = th; const cs = getComputedStyle(document.documentElement); const px = (v) => { const e = document.createElement('i'); e.style.color = v; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; }; return { text: px(cs.getPropertyValue('--sa-text')), t2: px(cs.getPropertyValue('--text-2')), t3: px(cs.getPropertyValue('--text-3')), bg: th === 'dark' ? '#071c2e' : '#d3e9f1', glass: px(cs.getPropertyValue('--canvas-bg')), accent: px(cs.getPropertyValue('--accent')) }; }, th);
      const pr = (s) => s.match(/[\d.]+/g).map(Number); const over = (fg, bg, a = 1) => fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a)); const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      const lum = (c) => { const f = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
      const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const g = pr(c.glass); const base = over(g, hex(c.bg), g[3] ?? 1);
      const r1 = cr(pr(c.text), base), r2 = cr(pr(c.t2), base), r3 = cr(pr(c.accent), base);
      out.push(`${th}: texto ${r1.toFixed(1)} · secundário ${r2.toFixed(1)} · acento ${r3.toFixed(1)}`); if (r1 < 4.5 || r2 < 4.5) throw new Error(`contraste baixo ${out.join(' | ')}`);
      if (r3 < 3) throw new Error('acento < 3:1 ' + out.join(' | '));
    }
    await p.evaluate(() => { document.documentElement.dataset.theme = SEA.app.theme; }); return out.join(' · ');
  });

  await check('T22', 'Persistência local: layout, tema, viewer e seleção sobrevivem ao recarregamento', async () => {
    await p.evaluate(() => SEA.app.store.select('par:h3.ac', { source: 'palette' })); await p.click('#tab-table'); await p.waitForTimeout(500); await p.click('tr.rw[data-id="par:h3.ac"] td.c-name'); await p.waitForTimeout(300);
    await p.locator('.rz-ex').focus(); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await idle(p); const exW = await w('.ex');
    await p.keyboard.press('Control+Shift+L'); await p.waitForTimeout(500); const th = await p.evaluate(() => document.documentElement.dataset.theme); await p.waitForTimeout(400);
    await p.reload(); await p.waitForFunction(() => window.SEA && SEA.app && document.querySelector('.row.sel')); await p.waitForTimeout(900);
    const r = await p.evaluate(() => ({ th: document.documentElement.dataset.theme, tab: document.querySelector('.cv-tab.on').id, sel: SEA.app.store.selection, ex: Math.round(document.querySelector('.ex').getBoundingClientRect().width) }));
    assert(r.th === th && r.tab === 'tab-table' && r.sel === 'par:h3.ac' && Math.abs(r.ex - exW) <= 2, JSON.stringify(r) + ' esperado ' + th + '/' + exW); return `tema ${r.th}, aba ${r.tab}, Explorer ${r.ex}px`;
  });
  await p.context().close();

  /* ----- viewports e movimento ----- */
  p = await open({ w: 1000, h: 700 });
  await check('T23', 'Viewport médio (1000×700): negocia espaço, Canvas ≥ 440 px, sem overflow', async () => {
    const r = await p.evaluate(() => ({ mode: document.querySelector('.ws').dataset.mode, cv: Math.round(document.querySelector('.cv').getBoundingClientRect().width), ex: Math.round(document.querySelector('.ex').getBoundingClientRect().width), inn: Math.round(document.querySelector('.in').getBoundingClientRect().width), ov: document.querySelector('.in').classList.contains('ov'), sx: document.documentElement.scrollWidth <= innerWidth }));
    assert(r.cv >= 440 && r.sx, JSON.stringify(r)); const sel0 = await sel(p); await p.setViewportSize({ width: 1440, height: 860 }); await idle(p); const r2 = await p.evaluate(() => Math.round(document.querySelector('.ex').getBoundingClientRect().width));
    assert(r2 >= 300 && (await sel(p)) === sel0, 'restaura ao alargar ' + r2); return `modo ${r.mode}: Explorer ${r.ex}, Canvas ${r.cv}, Inspector ${r.inn}${r.ov ? ' (sobreposto)' : ''}; ao alargar Explorer volta a ${r2}px`;
  });
  await p.context().close();

  p = await open({ w: 390, h: 800 });
  await check('T24', 'Mobile (390×800): Explorer em drawer, Inspector em sheet, ações acessíveis, sem overflow', async () => {
    const r0 = await p.evaluate(() => ({ mode: document.querySelector('.ws').dataset.mode, peek: document.querySelector('.in').dataset.sheet, h: Math.round(document.querySelector('.in').getBoundingClientRect().height), ox: document.documentElement.scrollWidth <= innerWidth }));
    assert(r0.mode === 'narrow' && r0.peek === 'peek' && r0.h === 64 && r0.ox, JSON.stringify(r0));
    await p.click('.tb .ib[aria-label="Explorer"]'); await p.waitForTimeout(800); const d = await p.evaluate(() => { const r = document.querySelector('.ex').getBoundingClientRect(); return { l: Math.round(r.left), w: Math.round(r.width), inert: document.querySelector('.ex').hasAttribute('inert') }; }); assert(d.l >= 0 && d.w > 250 && !d.inert, JSON.stringify(d));
    await p.click('.row[data-id="mod:H3-125-Plus"] .lb'); await p.waitForTimeout(800);
    const r1 = await p.evaluate(() => ({ sel: SEA.app.store.selection, drawerClosed: document.querySelector('.ex').getBoundingClientRect().right <= 0 || document.querySelector('.ex').hasAttribute('inert'), title: document.querySelector('.in-title').textContent })); assert(r1.sel === 'mod:H3-125-Plus' && r1.drawerClosed && r1.title === 'H3-125-Plus', JSON.stringify(r1));
    await p.click('.in-h'); await p.waitForTimeout(900); const h1 = await p.evaluate(() => Math.round(document.querySelector('.in').getBoundingClientRect().height)); assert(h1 > 300, 'sheet aberto ' + h1);
    const act = await p.evaluate(() => !!document.querySelector('.in .ab button')); assert(act, 'ações no sheet'); await p.click('.in-h'); await p.waitForTimeout(800);
    const bar = await p.evaluate(() => { const b = document.querySelector('.ab-float').getBoundingClientRect(), t = document.querySelector('.cv-h').getBoundingClientRect(); return { ok: b.top >= t.bottom - 1 && b.right <= innerWidth && b.left >= 0 }; }); assert(bar.ok, 'barra flutuante fora da área'); return `peek 64px → sheet ${h1}px; drawer ${d.w}px`;
  });
  await p.context().close();

  p = await open({ reduced: true });
  await check('T25', 'Reduced motion: sem voo de morph, painéis sem animação, atmosfera estática', async () => {
    const r0 = await p.evaluate(() => ({ red: SEA.motion.reduced, run: SEA.app.atmosphere.running }));
    const px = () => p.evaluate(() => { const c = document.querySelector('.atmo-cv'); const gl = c.getContext('webgl'); let d; if (gl) { d = new Uint8Array(c.width * c.height * 4); gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, d); } else d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0; return h; });
    const h0 = await px(); await p.waitForTimeout(900); const h1 = await px();
    await p.keyboard.press('Control+b'); await p.waitForTimeout(80); const ex = await w('.ex');
    await p.click('.row[data-id="par:h3.ac"] .lb').catch(() => {}); await p.waitForTimeout(30); const gh = await p.evaluate(() => document.querySelectorAll('.ghost').length);
    assert(r0.red && !r0.run && h0 === h1, JSON.stringify({ r0, h0, h1 })); assert(ex <= 44, 'painel deveria estar no destino imediatamente: ' + ex); assert(gh === 0, 'morph não deve voar'); return 'atmosfera idêntica após 900 ms; painel no destino em ≤ 80 ms';
  });
  await p.context().close();

  p = await open();
  await check('T26', 'Velocidade ambiental ≈ 40% da referência e independente da interativa', async () => {
    const rate = async (ms) => { const t0 = await p.evaluate(() => SEA.app.atmosphere.time); await p.waitForTimeout(ms); const t1 = await p.evaluate(() => SEA.app.atmosphere.time); return (t1 - t0) / (ms / 1000); };
    const calm = await rate(1500); await p.evaluate(() => SEA.app.setAmbient('ref')); await p.waitForTimeout(200); const ref = await rate(1500); await p.evaluate(() => SEA.app.setAmbient('calm')); await p.waitForTimeout(200);
    const ratio = calm / ref; assert(ratio > 0.3 && ratio < 0.5, `razão ${ratio.toFixed(2)} (calma ${calm.toFixed(2)} / ref ${ref.toFixed(2)})`);
    const settle = async () => { await p.evaluate(() => { SEA.app.layout.toggleEx(false); }); const t0 = Date.now(); await p.waitForFunction(() => document.querySelector('.ex').getBoundingClientRect().width <= 44.5, null, { timeout: 3000 }); const dt = Date.now() - t0; await p.evaluate(() => SEA.app.layout.toggleEx(true)); await p.waitForTimeout(900); return dt; };
    const a = await settle(); await p.evaluate(() => SEA.app.setAmbient('ref')); const b = await settle(); await p.evaluate(() => SEA.app.setAmbient('calm'));
    assert(Math.abs(a - b) < 250 && a < 900, `controles ${a} ms vs ${b} ms`); return `ambiente ${calm.toFixed(2)}× vs referência ${ref.toFixed(2)}× (razão ${ratio.toFixed(2)}); recolher painel ${a} ms / ${b} ms`;
  });

  await check('T27', 'Interrupção de abas: alternância rápida deixa exatamente um viewer visível e a aba correta', async () => {
    for (const t of ['table', 'class', 'record', 'pdf', 'class', 'table', 'record']) { await p.click('#tab-' + t, { delay: 0 }); await wait(25); }
    await p.waitForTimeout(900); const r = await p.evaluate(() => ({ vis: [...document.querySelectorAll('.vw')].filter((v) => !v.hidden).map((v) => v.dataset.viewer), tab: document.querySelector('[role=tab][aria-selected=true]').id, empty: !!document.querySelector('.cv-state:not([hidden])') }));
    assert(r.vis.length === 1 && r.vis[0] === 'record' && r.tab === 'tab-record' && !r.empty, JSON.stringify(r)); return JSON.stringify(r);
  });

  await check('T28', 'Pan/zoom somente onde cabe: Classificação sim (roda/arraste/ajustar); PDF/Tabela/Registro rolam', async () => {
    await p.click('#tab-class'); await p.waitForTimeout(700);
    const tf = () => p.evaluate(() => document.querySelector('.st-world').style.transform);
    const t0 = await tf(); const bb = await p.locator('.st-stage').boundingBox(); await p.mouse.move(bb.x + 200, bb.y + 200); await p.mouse.wheel(0, -300); await p.waitForTimeout(150); const t1 = await tf(); assert(t0 !== t1, 'zoom');
    await p.mouse.move(bb.x + 150, bb.y + 60); await p.mouse.down(); await p.mouse.move(bb.x + 260, bb.y + 110, { steps: 5 }); await p.mouse.up(); const t2 = await tf(); assert(t2 !== t1, 'pan');
    await p.click('.cv-tools .ib[aria-label="Ajustar à tela"]'); await p.waitForTimeout(900); const t3 = await tf(); assert(t3 !== t2, 'fit');
    await p.click('#tab-pdf'); await p.waitForTimeout(500); const bp = await p.locator('.pdf-scroll').boundingBox(); await p.mouse.move(bp.x + 300, bp.y + 300); const s0 = await p.evaluate(() => document.querySelector('.pdf-scroll').scrollTop); await p.mouse.wheel(0, 400); await p.waitForTimeout(250); const s1 = await p.evaluate(() => document.querySelector('.pdf-scroll').scrollTop); assert(s1 > s0, 'PDF deve rolar com a roda (sem zoom forçado)');
    const z0 = await p.evaluate(() => document.querySelector('.tb-lbl:last-of-type, .cv-tools .tb-lbl + .tb-lbl')?.textContent); return `classificação transform muda (zoom/pan/fit); PDF rolou ${s1 - s0}px`;
  });

  await check('T29', 'Estado de carregamento visível na 1ª abertura do viewer e preservação de estado ao voltar', async () => {
    const fresh = await open(); await fresh.evaluate(() => SEA.app.host.setViewer('table', true)); await fresh.waitForTimeout(90);
    const loading = await fresh.evaluate(() => !!document.querySelector('.cv-state.is-loading .sk')); await fresh.waitForTimeout(700);
    await fresh.click('.th-b >> text=Mín'); await fresh.waitForTimeout(100); const ar = await fresh.getAttribute('th[data-k=min]', 'aria-sort');
    await fresh.click('#tab-record'); await fresh.waitForTimeout(300); await fresh.click('#tab-table'); await fresh.waitForTimeout(500); const ar2 = await fresh.getAttribute('th[data-k=min]', 'aria-sort');
    await fresh.context().close(); assert(loading, 'sem skeleton de carregamento'); assert(ar === 'ascending' && ar2 === 'ascending', `ordenação perdida ${ar}/${ar2}`); return 'skeleton exibido; ordenação preservada';
  });

  p = await open();
  await check('T30', 'Inspector alarga/reduz sob demanda (reversível) e respeita o espaço do Canvas', async () => {
    const i0 = await w('.in'), c0 = await w('.cv'); await p.click('.in-h .ib[aria-label="Alargar Inspector"]'); await idle(p); const i1 = await w('.in'), c1 = await w('.cv');
    assert(i1 >= 440 && c1 >= 440, `alargado ${i0}->${i1} canvas ${c1}`); await p.click('.in-h .ib[aria-label="Reduzir Inspector"]'); await idle(p); const i2 = await w('.in'); assert(Math.abs(i2 - i0) <= 2, `restaurou ${i2} vs ${i0}`); return `Inspector ${i0}→${i1}→${i2}px; Canvas ${c0}→${c1}px`;
  });
  await check('T31', 'Acompanhar seleção: ligado revela na árvore; desligado não move a árvore', async () => {
    await p.click('.row[data-id="fam:cq"] .tw'); await p.waitForTimeout(150); await p.click('.row[data-id="fam:cq"] .tw'); await p.waitForTimeout(150);   // garante recolhido
    await p.evaluate(() => SEA.app.store.select('par:h3.ac', { source: 'palette' })); await p.waitForTimeout(500);
    const on = await p.evaluate(() => document.querySelector('.row[data-id="par:h3.ac"]') && document.querySelector('.row.sel')?.dataset.id);
    assert(on === 'par:h3.ac', 'deveria revelar com follow ligado: ' + on);
    await p.click('.px-h .ib[aria-label="Acompanhar seleção"]'); await p.evaluate(() => { SEA.app.explorer.input.value = ''; });
    await p.click('.row[data-id="sec:h3:AC OUTPUT (GRID)"] .tw'); await p.waitForTimeout(150);   // recolhe a seção da seleção
    await p.evaluate(() => SEA.app.store.select('par:h3.current', { source: 'palette' })); await p.waitForTimeout(500);
    const off = await p.evaluate(() => ({ hasRow: !!document.querySelector('.row[data-id="par:h3.current"]'), ctx: !!document.querySelector('.row.ctx') || !!document.querySelector('.glide.hide') || true, sel: SEA.app.store.selection }));
    assert(!off.hasRow && off.sel === 'par:h3.current', 'follow desligado não deve expandir: ' + JSON.stringify(off));
    await p.click('.px-h .ib[aria-label="Acompanhar seleção"]'); await p.waitForTimeout(600); assert(await p.evaluate(() => !!document.querySelector('.row[data-id="par:h3.current"]')), 'religar revela'); return 'ok';
  });
  await check('T32', 'Robustez: toda entidade × todo viewer renderiza sem erro; Inspector e breadcrumb coerentes', async () => {
    const before = errs.length; const ids = await p.evaluate(() => SEA.app.store.all().map((e) => e.id)); let n = 0;
    for (const v of ['pdf', 'table', 'class', 'record']) {
      await p.evaluate((v) => SEA.app.host.setViewer(v, true), v); await p.waitForTimeout(250);
      for (const id of ids) { await p.evaluate((i) => SEA.app.store.select(i, { source: 'palette' }), id); await p.waitForTimeout(25); n++; }
      await p.waitForTimeout(300);
      const r = await p.evaluate(() => ({ title: document.querySelector('.in-title').textContent, label: SEA.app.store.get(SEA.app.store.selection).label, crumb: document.querySelector('.crumb .cur')?.textContent, busy: !!document.querySelector('.cv-state.is-loading') }));
      assert(r.title === r.label && r.crumb === r.label, `${v}: ${JSON.stringify(r)}`);
    }
    assert(errs.length === before, errs.slice(before).join(' | ')); return `${n} seleções (${ids.length} entidades × 4 viewers)`;
  });
  await p.context().close();

  p = await open();
  await check('T33', 'H3 ↔ CQ16: tabela → origem e evidência → Explorer/Inspector sem cruzamento', async () => {
    for (const test of [
      {doc:'h3', first:'par:h3.array', next:'par:h3.current', value:'190', label:'Rated AC Output Current', revision:'2.7'},
      {doc:'cq', first:'par:cq.energy', next:'par:cq.voltage', value:'51.2', label:'Nominal Voltage', revision:'1.3'},
      {doc:'cq', first:'par:cq.box.voltage', next:'par:cq.capacity', value:'314', label:'Nominal Capacity', revision:'1.3'},
      {doc:'h3', first:'par:h3.ac', next:'par:h3.trackers', value:'8', label:'No. of MPP Trackers', revision:'2.7'},
    ]) {
      await p.evaluate(id => SEA.app.store.select(id,{source:'palette'}),test.first);
      await p.evaluate(() => SEA.app.host.setViewer('table',true)); await p.waitForTimeout(600);
      const ids = await p.locator('tr.rw').evaluateAll(rows=>rows.map(r=>r.dataset.id));
      assert(ids.includes(test.first) && ids.every(id=>id.startsWith('par:'+test.doc+'.')), JSON.stringify({test,ids}));
      await p.click(`tr.rw[data-id="${test.first}"] td.c-name`); await p.focus(`tr.rw[data-id="${test.first}"]`); await p.keyboard.press('Enter'); await p.waitForTimeout(1000);
      const first = await p.evaluate(() => ({id:document.querySelector('.hl.sel')?.dataset.id,page:document.querySelector('.hl.sel')?.closest('.pdf-page')?.dataset.page,images:[...document.querySelectorAll('.pdf-page img')].map(i=>i.alt),ids:[...document.querySelectorAll('.hl')].map(i=>i.dataset.id)}));
      assert(first.id===test.first && first.page==='2' && first.ids.every(id=>id.startsWith('par:'+test.doc+'.')) && first.images.every(i=>i.includes(test.doc.toUpperCase())),JSON.stringify(first));
      const nextHighlight=p.locator(`.hl[data-id="${test.next}"]`); await p.locator('.pdf-scroll').dispatchEvent('pointerdown',{pointerType:'mouse'}); await nextHighlight.evaluate(e=>e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'})); await p.waitForTimeout(500); await nextHighlight.click(); await p.waitForTimeout(700);
      const r = await p.evaluate(()=>({selection:SEA.app.store.selection,tree:document.querySelector('.row.sel')?.dataset.id,title:document.querySelector('.in-title')?.textContent,hero:document.querySelector('[data-morph=value]')?.textContent,origin:document.querySelector('.in-body')?.textContent,crop:!!document.querySelector('.in-body .crop img')}));
      assert(r.selection===test.next && r.tree===test.next && r.title.includes(test.label) && r.hero.includes(test.value) && r.origin.includes(test.revision) && r.crop,JSON.stringify(r));
      await p.click('#tab-table'); await p.waitForTimeout(500);
      assert(await p.evaluate(id=>document.querySelector('tr.rw.sel')?.dataset.id===id,test.next),'seleção não preservada na tabela');
    }
    return 'H3 → CQ16 → H3; páginas, evidências e seleção isoladas';
  });
  await p.context().close();

  p = await open({w:390,h:800,reduced:true});
  await check('T34', 'Proveniência nos dois documentos em viewport estreito, por teclado e com movimento reduzido', async () => {
    for (const id of ['par:cq.energy','par:h3.ac']) {
      await p.evaluate(i=>{SEA.app.store.select(i,{source:'palette'}); SEA.app.host.setViewer('table',true);},id);
      await p.waitForTimeout(700); await p.focus(`tr.rw[data-id="${id}"]`); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
      const r=await p.evaluate(()=>({selection:SEA.app.store.selection,tab:document.querySelector('.cv-tab.on')?.id,hl:document.querySelector('.hl.sel')?.dataset.id,viewport:document.documentElement.scrollWidth<=innerWidth,reduced:SEA.motion.reduced,ghosts:document.querySelectorAll('.ghost').length}));
      assert(r.selection===id && r.tab==='tab-pdf' && r.hl===id && r.viewport && r.reduced && !r.ghosts,JSON.stringify(r));
    }
    return 'CQ16 e H3: Enter localiza evidência; sem overflow ou voo';
  });
  await p.context().close();

  p = await open();
  await check('T35', 'Fontes, variantes, valores e coordenadas dos dois documentos', async () => {
    const data=await p.evaluate(()=>Object.values(SEA.fixture.documents).map(d=>({key:d.key,hash:d.source.sha256,revision:d.source.revision,pages:d.pages.map(p=>p.n),params:d.params.map(p=>({id:p.id,value:p.typ,excerpt:p.evidence.excerpt,box:p.evidence.box,page:p.evidence.page,applies:p.applies,document:p.document}))})));
    const expected={h3:'26b171ed52d2d0ea6f0b694f7eed769482ff3587062d90ff555e5a259aced600',cq:'d3098bfc10d4f1271a7f57346f6546d2a556ffe7b07f8016a8d7f0af762e688e'};
    assert(data.length===2,JSON.stringify(data));
    for(const d of data){assert(d.hash===expected[d.key] && d.pages.join(',')==='1,2' && d.params.length>0,JSON.stringify(d));for(const p of d.params){assert(p.document===d.key && p.page===2 && p.excerpt.includes(p.value) && p.box.length===4 && p.box.every(x=>x>=0&&x<=1) && p.box[0]<p.box[2] && p.box[1]<p.box[3],JSON.stringify(p));assert(d.key==='h3'?p.applies[0]==='H3-125-Plus':['CQ16','CQ BOX'].includes(p.applies[0]),JSON.stringify(p));}}
    return data.map(d=>`${d.key}: ${d.params.length} parâmetros`).join('; ');
  });
  await p.context().close();

  assert(!net.length, 'requisições de rede: ' + net.join(','));
  await browser.close();
  const pass = results.filter((r) => r.ok).length;
  const md = [`# SEA Workspace Shell — evidências de validação`, '', `Gerado por \`node sea/shell/tests/validate.cjs\` em ${new Date().toISOString()}.`, '',
    `Artefato: cópia isolada de \`sea/shell/index.html\` (única peça em pasta temporária), aberta por \`file://\` com rede bloqueada e registrada (${net.length} requisições externas).`, '',
    `sha256 \`${crypto.createHash('sha256').update(html).digest('hex')}\` · ${(html.length / 1024).toFixed(1)} KiB · Chromium ${browser.version()} · Node ${process.version}`, '',
    `Resultado: **${pass}/${results.length} aprovados**.`, '', 'Headless/SwiftShader: tempos absolutos variam por máquina; as verificações usam limites relativos.', '',
    '| ID | Verificação | Resultado | Detalhe |', '|---|---|---|---|', ...results.map((r) => `| ${r.id} | ${r.name} | ${r.ok ? 'PASSOU' : '**FALHOU**'} | ${String(r.detail).replace(/\|/g, '\\|')} |`), ''].join('\n');
  fs.writeFileSync(path.join(__dirname, 'RESULTS.md'), md);
  console.log(`\n${pass}/${results.length} aprovados`); process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
