/* Provedores do Inspector e ações contextuais para o caso de uso (documentos técnicos). O shell só vê contratos. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc } = SEA.u;
  const F = () => SEA.fixture;
  const evOf = (e) => (e && e.data && e.data.evidence) || null;

  const kv = (rows) => h('dl', { class: 'kv' }, rows.filter(Boolean).flatMap(([k, v, mono]) => [h('dt', null, k), h('dd', { class: mono ? 'mono' : '' }, v)]));
  const link = (store, id, o = {}) => { const e = store.get(id), k = store.kinds[e.kind] || {}; return h('button', { type: 'button', class: 'li', on: { click: () => store.select(id, { source: 'inspector' }) } }, h('span', { class: 'k-' + e.kind, html: SEA.icon(k.icon, 13) }), h('span', { class: 'li-t' }, o.label || e.label), o.meta ? h('span', { class: 'li-m' }, o.meta) : null, e.state && e.state !== 'none' && !o.nostate ? SEA.stateChip(store, e.state, { dot: true }) : null); };
  const list = (nodes) => h('div', { class: 'li-l' }, nodes);

  function crop(ev, id) {
    const { documents, PAGES, byId } = F(), docKey = byId[id]?.docKey, FX = documents[docKey], pg = FX?.pages.find((p) => p.n === ev.page); if (!pg || !ev.box) return null;
    const [x0, y0, x1, y1] = ev.box;
    let c0 = Math.max(0, x0 - 0.08), c1 = Math.min(1, x1 + 0.08); if (c1 - c0 < 0.42) { const m = (x0 + x1) / 2; c0 = Math.max(0, Math.min(m - 0.21, 0.58)); c1 = c0 + 0.42; }
    const r0 = Math.max(0, y0 - 0.02), r1 = Math.min(1, y1 + 0.02), rw = c1 - c0, rh = r1 - r0;
    const go = () => SEA.app.host.locate(id);
    const box = h('div', { class: 'crop', role: 'button', tabindex: '0', 'aria-label': `Trecho da página ${ev.page}. Localizar na origem`, 'data-tip': 'Localizar na origem', style: { aspectRatio: `${rw * pg.w} / ${rh * pg.h}` }, on: { click: go, keydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } } } });
    box.appendChild(h('img', { src: PAGES[docKey][ev.page], alt: '', draggable: 'false', style: { width: 100 / rw + '%', transform: `translate(${-c0 * 100}%, ${-r0 * 100}%)` } }));
    box.appendChild(h('i', { class: 'crop-hl', style: { left: ((x0 - c0) / rw) * 100 + '%', top: ((y0 - r0) / rh) * 100 + '%', width: ((x1 - x0) / rw) * 100 + '%', height: ((y1 - y0) / rh) * 100 + '%' } }));
    return box;
  }

  function review(store, e) {
    const st = e.state || 'none', btns = h('div', { class: 'rv-b' });
    [['acc', 'Aceitar', 'check', 'A'], ['rej', 'Rejeitar', 'x', 'X'], ['rev', 'Revisar', 'flag', 'R']].forEach(([s, l, ic, k]) => {
      const b = h('button', { type: 'button', class: 'rv tone-' + store.states[s].tone, 'aria-pressed': String(st === s), 'data-tip': l, 'data-kbd': k, on: { click: () => setState(store, e, s) } });
      b.innerHTML = `${SEA.icon(ic, 14)}<span>${l}</span>`; btns.appendChild(b);
    });
    const hist = (e.review || []).map((r) => h('li', null, SEA.stateChip(store, r.from || 'none', { dot: true }), h('span', { html: SEA.icon('arrow-right', 12) }), SEA.stateChip(store, r.to), r.note ? h('span', { class: 'rv-n' }, r.note) : null));
    return h('div', { class: 'rv-w' }, h('div', { class: 'rv-s' }, SEA.stateChip(store, st), h('span', { class: 'fxtag', 'data-tip': 'Estado simulado (fixture)' }, 'fixture')), btns, hist.length ? h('ol', { class: 'rv-h', 'aria-label': 'Histórico' }, hist) : null);
  }
  function setState(store, e, s) {
    const prev = e.state || 'none'; if (prev === s) return;
    store.setState(e.id, s, 'fixture');
    SEA.toast(`${e.label}: ${store.states[s].label}`, { undo: () => store.setState(e.id, prev, 'desfeito') });
  }
  const reviewable = (e) => ['parameter', 'model', 'family', 'supplier', 'document', 'candidate'].includes(e.kind) && e.state !== undefined && !(e.kind === 'document' && e.state === 'none');

  function valueStr(p) { return [p.min && 'mín ' + p.min, p.typ && 'típ ' + p.typ, p.max && 'máx ' + p.max].filter(Boolean).join(' · ') + ' ' + p.unit; }
  function heroParam(p) {
    const primary = p.typ ? { v: p.typ, t: 'declarado' } : p.min && p.max ? { v: `${p.min} … ${p.max}`, t: 'faixa' } : p.max ? { v: p.max, t: 'máx' } : { v: p.min, t: 'mín' };
    const cell = (l, v) => h('div', { class: 'mm' + (v ? '' : ' nil') }, h('span', null, l), h('b', null, v || '·'));
    return h('div', { class: 'hero' },
      h('div', { class: 'hero-v', 'data-morph': 'value' }, h('span', { class: 'hero-n' }, primary.v), h('span', { class: 'hero-u' }, p.unit), h('span', { class: 'hero-t' }, primary.t)),
      h('div', { class: 'mmt' }, cell('mín', p.min), cell('valor', p.typ), cell('máx', p.max)),
      p.condition ? h('div', { class: 'hero-c' }, p.condition) : null);
  }
  function paramsOf(m) { return F().entities.filter((x) => x.kind === 'parameter' && (x.data.applies.includes(m) || x.data.applies[0].includes('·'))); }

  function inspect(store, e, app) {
    const FXs = F(); const k = store.kinds[e.kind] || {};
    const parent = e.parent ? store.get(e.parent) : null;
    const sections = []; let hero = null, summary = parent ? parent.label : k.label;
    const refs = (id) => FXs.REL.filter((r) => r[1] === id).map((r) => r[0]);
    const outs = (id) => FXs.REL.filter((r) => r[0] === id).map((r) => r[1]);
    const evidenceList = () => { const r = refs(e.id); return r.length ? { id: 'ev', title: 'Evidências', icon: 'eye', count: r.length, body: list(r.map((id) => link(store, id, { meta: store.get(id).meta }))) } : null; };

    if (e.kind === 'parameter') {
      const p = e.data; hero = heroParam(p); summary = p.section;
      sections.push({ id: 'p-id', title: 'Identidade', body: kv([['Parâmetro', p.name], p.symbol ? ['Símbolo', p.symbol] : null, ['Seção', p.section], ['Aplica-se a', list(p.applies.map((a) => (store.has('mod:' + a) ? link(store, 'mod:' + a, { nostate: true }) : h('span', { class: 'plain' }, a))))], p.condition ? ['Condição', p.condition] : null]) });
      sections.push({ id: 'p-src', title: 'Origem', body: h('div', { class: 'src' }, kv([['Documento', link(store, 'doc:'+e.docKey, { nostate: true })], ['Revisão', FXs.documents[e.docKey].source.revision], ['Página', String(p.evidence.page)], ['Trecho', p.evidence.excerpt, true]]), crop(p.evidence, e.id), h('p', { class: 'src-n' }, 'Valor copiado da tabela do PDF; posição obtida das coordenadas do texto.')) });
      sections.push({ id: 'p-rv', title: 'Revisão', body: review(store, e) });
      sections.push({ id: 'p-md', title: 'Metadados', open: false, body: kv([['ID', e.id, true], ['Tipo', 'parâmetro (observação extraída)'], ['Unidade', p.unit]]) });
    } else if (e.kind === 'model') {
      const ps = paramsOf(e.label);
      sections.push({ id: 'm-id', title: 'Identidade', body: kv([['Código', e.label], ['Família', link(store, e.parent, { nostate: true })], ['Fabricante', link(store, 'sup:fox', { nostate: true })], ['Documento', link(store, 'doc:'+e.docKey, { nostate: true })], ['Associação WEG', 'Não verificada']]) });
      const ev = evidenceList(); ev && sections.push(ev);
      sections.push({ id: 'm-ps', title: 'Parâmetros aplicáveis', count: ps.length, body: list(ps.slice(0, 12).map((x) => link(store, x.id, { meta: x.meta }))) });
      sections.push({ id: 'm-rv', title: 'Revisão', body: review(store, e) });
    } else if (e.kind === 'family') {
      const ms = store.children(e.id).filter((id) => store.get(id).kind === 'model'), ds = store.children(e.id).filter((id) => store.get(id).kind === 'document');
      hero = h('div', { class: 'hero' }, h('div', { class: 'hero-v', 'data-morph': 'value' }, h('span', { class: 'hero-n' }, String(ms.length)), h('span', { class: 'hero-u' }, 'modelos')));
      sections.push({ id: 'f-id', title: 'Identidade', body: kv([['Fabricante', 'Fox ESS'], ['Associação WEG', 'Não verificada']]) });
      sections.push({ id: 'f-ms', title: 'Modelos', count: ms.length, body: list(ms.map((id) => link(store, id))) });
      sections.push({ id: 'f-ds', title: 'Documentos', count: ds.length, body: list(ds.map((id) => link(store, id, { meta: store.get(id).meta }))) });
      const ev = evidenceList(); ev && sections.push(ev);
      sections.push({ id: 'f-rv', title: 'Revisão', body: review(store, e) });
    } else if (e.kind === 'document') {
      const s = e.src, ps = FXs.entities.filter((x) => x.kind === 'parameter' && x.docKey === e.docKey);
      if (FXs.documents[e.docKey]) {
        const by = {}; ps.forEach((x) => { by[x.state] = (by[x.state] || 0) + 1; });
        hero = h('div', { class: 'hero' }, h('div', { class: 'hero-v', 'data-morph': 'value' }, h('span', { class: 'hero-n' }, String(ps.length)), h('span', { class: 'hero-u' }, 'parâmetros')),
          h('div', { class: 'cov', role: 'img', 'aria-label': Object.keys(by).map((k2) => `${by[k2]} ${store.states[k2].label}`).join(', ') }, Object.keys(by).map((k2) => h('i', { class: 'tone-' + store.states[k2].tone, style: { flex: by[k2] } })) ),
          h('div', { class: 'cov-l' }, Object.keys(by).map((k2) => h('span', { class: 'tone-' + store.states[k2].tone }, `${by[k2]} ${store.states[k2].label.toLowerCase()}`))));
      }
      sections.push({ id: 'd-id', title: 'Identidade', body: kv([['Título', s.title], ['ID', s.docId, true], ['Revisão', s.revision], ['Fabricante', s.manufacturer], ['Páginas', String(s.pages) + (s.renderedPages.length ? ` · fixture: ${s.renderedPages.join(', ')}` : ' · fora do fixture')]]) });
      sections.push({ id: 'd-src', title: 'Fonte', body: kv([['URL', h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', class: 'lnk' }, s.url.replace('https://', ''))], ['SHA-256', s.sha256, true], ['Tamanho', (s.bytes / 1048576).toFixed(2).replace('.', ',') + ' MB']]) });
      const obs = store.all().filter((x) => x.parent === e.id && x.tree === false);
      if (obs.length) sections.push({ id: 'd-ev', title: 'Observações', count: obs.length, body: list(obs.map((x) => link(store, x.id, { meta: x.meta }))) });
      if (e.state !== 'none') sections.push({ id: 'd-rv', title: 'Revisão', body: review(store, e) });
    } else if (e.kind === 'observation' || e.kind === 'candidate') {
      const d = e.data, ev = d.evidence;
      sections.push({ id: 'o-id', title: 'Identidade', body: kv([['Papel', d.role || '—'], ['Texto', d.text || (ev && ev.excerpt) || '', true], ev ? ['Página', String(ev.page)] : ['Origem', 'metadados do PDF']]) });
      if (ev) sections.push({ id: 'o-src', title: 'Origem', body: h('div', { class: 'src' }, crop(ev, e.id)) });
      const o = outs(e.id); if (o.length) sections.push({ id: 'o-out', title: 'Sustenta', count: o.length, body: list(o.map((id) => link(store, id))) });
      const ev2 = evidenceList(); ev2 && sections.push(ev2);
      if (e.kind === 'candidate') sections.push({ id: 'o-rv', title: 'Revisão', body: review(store, e) });
    } else if (e.kind === 'section') {
      const ps = store.children(e.id);
      hero = h('div', { class: 'hero' }, h('div', { class: 'hero-v', 'data-morph': 'value' }, h('span', { class: 'hero-n' }, String(ps.length)), h('span', { class: 'hero-u' }, 'parâmetros')));
      sections.push({ id: 's-ps', title: 'Parâmetros', count: ps.length, body: list(ps.map((id) => link(store, id, { meta: store.get(id).meta }))) });
    } else { // supplier / group
      const ch = store.children(e.id);
      sections.push({ id: 'g-id', title: 'Identidade', body: kv([['Nome', e.label], ['Tipo', k.label], ['Itens', String(ch.length)]]) });
      sections.push({ id: 'g-ch', title: 'Contém', count: ch.length, body: list(ch.map((id) => link(store, id, { meta: store.get(id).meta }))) });
      const ev = evidenceList(); ev && sections.push(ev);
      if (e.kind === 'supplier') sections.push({ id: 'g-rv', title: 'Revisão', body: review(store, e) });
    }
    return { summary, hero, sections };
  }

  function actions(store, e, app) {
    const out = [];
    if (evOf(e)) out.push({ id: 'locate', icon: 'crosshair', label: 'Localizar na origem', text: 'Origem', kbd: 'L', group: 'a', run: () => app.host.locate(e.id) });
    if (e.kind === 'parameter') out.push({ id: 'copy', icon: 'copy', label: 'Copiar valor', group: 'a', run: () => navigator.clipboard && navigator.clipboard.writeText(`${e.data.name}${e.data.symbol ? ' (' + e.data.symbol + ')' : ''}: ${valueStr(e.data)}`).then(() => SEA.toast('Valor copiado'), () => SEA.toast('Cópia indisponível')) });
    if (reviewable(e)) [['acc', 'Aceitar', 'check', 'A'], ['rej', 'Rejeitar', 'x', 'X'], ['rev', 'Revisar', 'flag', 'R']].forEach(([s, l, ic, k]) => out.push({ id: 'rv-' + s, icon: ic, label: l, kbd: k, tone: store.states[s].tone === 'positive' ? 'positive' : store.states[s].tone === 'negative' ? 'negative' : 'warning', group: 'r', pressed: e.state === s, run: () => setState(store, e, s) }));
    out.push({ id: 'rec', icon: 'code', label: 'Abrir no Registro', group: 'z', secondary: true, run: () => app.host.setViewer('record', true) });
    out.push({ id: 'cid', icon: 'hash', label: 'Copiar ID', group: 'z', secondary: true, run: () => navigator.clipboard && navigator.clipboard.writeText(e.id).then(() => SEA.toast('ID copiado'), () => SEA.toast('Cópia indisponível')) });
    return out;
  }

  function commands(app) {
    const cur = () => app.store.selection && app.store.get(app.store.selection);
    const rv = (s, label, kbd, icon) => ({ id: 'act-' + s, label, icon, kbd, group: 'Revisão', when: () => { const e = cur(); return !!e && reviewable(e) && e.state !== s; }, run: () => setState(app.store, cur(), s) });
    return [
      { id: 'act-locate', label: 'Localizar na origem', icon: 'crosshair', kbd: 'L', group: 'Canvas', when: () => !!evOf(cur()), run: () => app.host.locate(app.store.selection) },
      rv('acc', 'Aceitar (fixture)', 'A', 'check'), rv('rej', 'Rejeitar (fixture)', 'X', 'x'), rv('rev', 'Marcar para revisão (fixture)', 'R', 'flag'),
    ];
  }

  SEA.demoInspect = { inspect, actions, commands };
})();
