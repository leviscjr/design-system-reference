/* Viewer: tabela de parâmetros técnicos (valores e unidades exatamente como no datasheet). */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc, norm, sleep } = SEA.u;
  const F = () => SEA.fixture;

  SEA.viewerTable = {
    id: 'table', label: 'Parâmetros', icon: 'table', interaction: 'scroll',
    supports(ctx) {
      if (!ctx.scope) return { icon: 'table', title: 'Sem parâmetros neste contexto', action: { label: 'Abrir datasheet', run: () => ctx.store.select(F().DOC, { source: 'canvas' }) } };
      if (!F().documents[ctx.scope.docKey]) return { icon: 'table', title: 'Sem parâmetros extraídos', action: { label: 'Abrir datasheet', run: () => ctx.store.select(F().DOC, { source: 'canvas' }) } };
      return true;
    },
    create(host) {
      const { store } = host;
      let sort = { key: null, dir: 1 }, q = '', grouped = true, bypassModel = false, loaded = false, selId = null, curModel = null, docKey = null;
      const input = h('input', { type: 'search', class: 'tb-in', placeholder: 'Filtrar', 'aria-label': 'Filtrar parâmetros', autocomplete: 'off', on: { input: () => { q = norm(input.value.trim()); paint(); } } });
      const inWrap = h('span', { class: 'tb-inw', html: SEA.icon('search', 13) }, input);
      const chip = h('button', { type: 'button', class: 'tb-chip', 'data-tip': 'Remover filtro de modelo', on: { click: () => { bypassModel = true; paint(); host.requestToolbar(); } } });
      const cols = [
        { k: 'name', l: 'Parâmetro', cls: 'c-name' }, { k: 'applies', l: 'Aplica-se a', cls: 'c-app' }, { k: 'cond', l: 'Condição', cls: 'c-cond' },
        { k: 'min', l: 'Mín', cls: 'c-n', num: true }, { k: 'typ', l: 'Valor', cls: 'c-n', num: true }, { k: 'max', l: 'Máx', cls: 'c-n', num: true }, { k: 'unit', l: 'Un.', cls: 'c-u' }, { k: 'pg', l: 'Pág.', cls: 'c-p', num: true },
      ];
      const thead = h('thead', null, h('tr', null, h('th', { class: 'c-s', scope: 'col', 'aria-label': 'Estado' }), cols.map((c) => {
        const b = h('button', { type: 'button', class: 'th-b', on: { click: () => { sort = sort.key === c.k ? (sort.dir === 1 ? { key: c.k, dir: -1 } : { key: null, dir: 1 }) : { key: c.k, dir: 1 }; paint(); } } }, h('span', null, c.l), h('i', { class: 'th-s', html: SEA.icon('chevron-up', 11) }));
        return h('th', { class: c.cls, scope: 'col', 'data-k': c.k, 'aria-sort': 'none' }, b);
      })));
      const tbody = h('tbody');
      const table = h('table', { class: 'tbl', role: 'grid', 'aria-label': 'Parâmetros técnicos' }, thead, tbody);
      const scroll = h('div', { class: 'tbl-scroll' }, table);
      const el = h('div', { class: 'tbl-wrap' }, scroll);
      const rowEls = new Map();

      const num = (v) => parseFloat(String(v).replace('–', '-').replace('±', ''));
      function rows() {
        let list = F().entities.filter((e) => e.kind === 'parameter' && e.docKey === docKey);
        if (curModel && !bypassModel) list = list.filter((e) => e.data.applies.includes(curModel) || e.data.applies[0].includes('·'));
        if (q) list = list.filter((e) => norm([e.data.name, e.data.symbol, e.data.condition, e.data.applies.join(' '), e.data.section, e.data.unit, e.data.min, e.data.typ, e.data.max].join(' ')).includes(q));
        if (sort.key) {
          const val = (e) => { const p = e.data; return { name: p.name, applies: p.applies.join(' '), cond: p.condition, min: num(p.min), typ: num(p.typ), max: num(p.max), unit: p.unit, pg: p.evidence.page }[sort.key]; };
          list = list.slice().sort((a, b) => { const x = val(a), y = val(b); const nx = typeof x === 'number' && isNaN(x), ny = typeof y === 'number' && isNaN(y); if (nx || ny) return nx - ny; return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
        }
        return list;
      }
      function cell(v, cls) { return `<td class="${cls}">${v ? `<span class="val">${esc(v)}</span>` : '<span class="nil">·</span>'}</td>`; }
      function rowEl(e) {
        const p = e.data, tr = h('tr', { class: 'rw', 'data-id': e.id, tabindex: '-1', 'aria-selected': 'false' });
        tr.innerHTML = `<td class="c-s"></td><td class="c-name" title="${esc(p.name)}"><span class="nm">${esc(p.name)}</span>${p.symbol ? `<span class="sy">${esc(p.symbol)}</span>` : ''}</td><td class="c-app" title="${esc(p.applies.join(' '))}">${esc(p.applies.join(' '))}</td><td class="c-cond" title="${esc(p.condition)}">${esc(p.condition)}</td>${cell(p.min, 'c-n')}${cell(p.typ, 'c-n')}${cell(p.max, 'c-n')}<td class="c-u">${esc(p.unit)}</td><td class="c-p"><button type="button" class="pg" data-tip="Localizar na página ${p.evidence.page}" aria-label="Localizar na origem, página ${p.evidence.page}">${p.evidence.page}</button></td>`;
        return tr;
      }
      function paint() {
        const list = rows(), frag = document.createDocumentFragment();
        rowEls.clear(); let last = null;
        list.forEach((e) => {
          if (grouped && !sort.key && e.data.section !== last) { last = e.data.section; const n = list.filter((x) => x.data.section === last).length; frag.appendChild(h('tr', { class: 'gr', 'data-sec': e.parent }, h('th', { colspan: String(cols.length + 1), scope: 'colgroup' }, last, h('span', { class: 'gr-n' }, String(n))))); }
          const tr = rowEl(e); rowEls.set(e.id, tr);
          const st = tr.querySelector('.c-s'); if (e.state && e.state !== 'none') st.appendChild(SEA.stateChip(store, e.state, { dot: true }));
          frag.appendChild(tr);
        });
        if (!list.length) frag.appendChild(h('tr', { class: 'none' }, h('td', { colspan: String(cols.length + 1) }, 'Nada encontrado')));
        tbody.replaceChildren(frag);
        thead.querySelectorAll('th[data-k]').forEach((th) => th.setAttribute('aria-sort', sort.key === th.dataset.k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'));
        mark(); host.selectionChanged();
      }
      function mark() {
        const e = selId && store.get(selId);
        rowEls.forEach((tr, id) => { const on = id === selId; tr.classList.toggle('sel', on); tr.setAttribute('aria-selected', String(on)); tr.tabIndex = on ? 0 : -1; });
        tbody.querySelectorAll('.grp').forEach((n) => n.classList.remove('grp'));
        if (e && e.kind === 'section') store.children(e.id).forEach((id) => { const r = rowEls.get(id); r && r.classList.add('grp'); });
        if (!selId || !rowEls.has(selId)) { const f = tbody.querySelector('.rw'); if (f) f.tabIndex = 0; }
      }
      function pick(id, fromCell) {
        const tr = rowEls.get(id);
        host.select(id, { source: 'canvas', viewer: 'table', fromEl: fromCell || (tr && (tr.querySelector('.val') || tr.querySelector('.nm'))), morph: 'value' });
      }
      tbody.addEventListener('click', (e) => {
        const tr = e.target.closest('tr.rw'); if (!tr) return;
        if (e.target.closest('.pg')) { pick(tr.dataset.id); host.store && requestAnimationFrame(() => SEA.app && SEA.app.host.locate(tr.dataset.id)); return; }
        pick(tr.dataset.id, e.target.closest('.val'));
      });
      tbody.addEventListener('dblclick', (e) => { const tr = e.target.closest('tr.rw'); if (tr) SEA.app.host.locate(tr.dataset.id); });
      tbody.addEventListener('click', (e) => { const g = e.target.closest('tr.gr'); if (g) host.select(g.dataset.sec, { source: 'canvas', viewer: 'table' }); });
      scroll.addEventListener('keydown', (e) => {
        if (e.target.closest('input')) return;
        const ids = [...rowEls.keys()], i = ids.indexOf(selId);
        let j = null;
        if (e.key === 'ArrowDown') j = i < 0 ? 0 : Math.min(ids.length - 1, i + 1); else if (e.key === 'ArrowUp') j = i < 0 ? 0 : Math.max(0, i - 1);
        else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = ids.length - 1;
        else if (e.key === 'Enter' && selId) { e.preventDefault(); SEA.app.host.locate(selId); return; }
        if (j != null && ids[j]) { e.preventDefault(); pick(ids[j]); const tr = rowEls.get(ids[j]); tr && tr.focus({ preventScroll: true }); tr && tr.scrollIntoView({ block: 'nearest' }); }
      });

      return {
        el,
        update(ctx) {
          const e = ctx.entity;
          const changedDoc = docKey !== ctx.scope.docKey; docKey = ctx.scope.docKey;
          const nm = e.kind === 'model' ? e.label : null;
          const changedModel = nm !== curModel; curModel = nm; if (changedModel) bypassModel = false;
          selId = e.kind === 'parameter' ? e.id : null;
          if (e.kind === 'section') selId = e.id;
          const needs = !loaded || ctx.reason === 'state' || changedModel || changedDoc || !tbody.children.length;
          const run = () => { if (needs || ctx.reason === 'show') paint(); else mark(); const tr = rowEls.get(selId); if (tr && ctx.reason === 'select' && (store.lastOpt || {}).viewer !== 'table') tr.scrollIntoView({ block: 'nearest', behavior: SEA.motion.reduced ? 'auto' : 'smooth' }); host.requestToolbar(); };
          if (!loaded) { loaded = true; return sleep(200).then(run); }   // latência simulada: primeira abertura do fixture
          run();
        },
        onShow() { paint(); },
        selectionRect() { const tr = selId && rowEls.get(selId); if (!tr) return null; const r = tr.getBoundingClientRect(), s = scroll.getBoundingClientRect(); return r.bottom < s.top || r.top > s.bottom ? null : r; },
        toolbar() {
          const items = [{ id: 'f', el: inWrap, group: 'a' }];
          if (curModel && !bypassModel) { chip.innerHTML = `<span>${esc(curModel)}</span>${SEA.icon('x', 12)}`; chip.setAttribute('aria-label', `Filtro de modelo ${curModel}. Remover`); items.push({ id: 'm', el: chip, group: 'a' }); }
          items.push({ id: 'g', icon: 'layers', label: 'Agrupar por seção', pressed: grouped, group: 'b', run: () => { grouped = !grouped; paint(); host.requestToolbar(); } });
          return items;
        },
      };
    },
  };
})();
