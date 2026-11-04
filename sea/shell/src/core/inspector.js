/* ContextInspector — responde à seleção (Explorer ou Canvas). Não conhece o domínio:
 * recebe de provide(store, entity) → { summary, hero, sections:[{id,title,icon,count,open,body}] }
 * e de actions(entity) → ações contextuais. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc, clamp } = SEA.u;

  SEA.ContextInspector = function (store, o) {
    const prefs = SEA.prefs;
    let kind = null, lastId = null;
    const ic = h('span', { class: 'in-ic' });
    const title = h('span', { class: 'in-title', 'data-morph': 'title' });
    const sub = h('span', { class: 'in-sub' });
    const chipSlot = h('span', { class: 'in-chip' });
    const btnWide = SEA.btn({ icon: 'fit-width', label: 'Alargar Inspector', pressed: false, on: () => { const on = !o.layout.info().wide; o.layout.toggleWide(on); SEA.setBtn(btnWide, { pressed: on, label: on ? 'Reduzir Inspector' : 'Alargar Inspector' }); } });
    const btnCol = SEA.btn({ icon: 'panel-right', label: 'Recolher Inspector', kbd: 'Mod+I', on: () => o.layout.toggleIn(false, true) });
    const head = h('header', { class: 'in-h' }, ic, h('div', { class: 'in-tt' }, title, sub), chipSlot, h('span', { class: 'px-sp' }), btnWide, btnCol);
    head.addEventListener('click', (e) => { if (o.layout.info().mode === 'narrow' && !e.target.closest('button')) o.layout.toggleIn(); });
    const bar = SEA.ContextActionbar({ variant: 'inline', label: 'Ações do item' });
    const barWrap = h('div', { class: 'in-actions' }, bar.el);
    const body = h('div', { class: 'in-body' });
    const full = h('div', { class: 'in-full' }, head, barWrap, body);

    const railIc = h('span', { class: 'rail-ic' });
    const rail = h('div', { class: 'in-rail' },
      SEA.btn({ icon: 'panel-right', label: 'Expandir Inspector', kbd: 'Mod+I', side: 'left', on: () => o.layout.toggleIn(true, true) }),
      h('span', { class: 'rail-sp' }), railIc);
    const el = h('aside', { class: 'in panel', 'aria-label': 'Inspector' }, rail, full);
    new ResizeObserver(() => bar.setMaxWidth(barWrap.clientWidth)).observe(barWrap);

    function sectionEl(s, i, animate) {
      const open = (prefs.get('sections') || {})[s.id] ?? s.open !== false;
      const hb = h('button', { type: 'button', class: 'sx-h', 'aria-expanded': String(open), 'aria-controls': 'sx-' + s.id });
      hb.innerHTML = `<span class="sx-c">${SEA.icon('chevron-right', 13)}</span><span class="sx-t">${esc(s.title)}</span>${s.count != null ? `<span class="sx-n">${esc(s.count)}</span>` : ''}`;
      const bd = h('div', { class: 'sx-b', id: 'sx-' + s.id }, s.body);
      const sx = h('section', { class: 'sx' + (open ? ' open' : ''), 'data-id': s.id, style: { '--i': i } }, hb, h('div', { class: 'sx-w' }, bd));
      if (animate) sx.classList.add('enter');
      hb.addEventListener('click', () => {
        const on = !sx.classList.contains('open');
        sx.classList.toggle('open', on); hb.setAttribute('aria-expanded', String(on));
        prefs.set('sections', Object.assign({}, prefs.get('sections'), { [s.id]: on }));
      });
      return sx;
    }

    function renderEmpty() {
      kind = null;
      ic.innerHTML = ''; title.textContent = 'Inspector'; sub.textContent = ''; chipSlot.replaceChildren(); bar.set([]); barWrap.hidden = true;
      const rec = store.recent().slice(0, 5);
      body.replaceChildren(h('div', { class: 'in-empty' },
        h('span', { class: 'em-i', html: SEA.icon('info', 26) }), h('p', null, 'Sem seleção'),
        rec.length ? h('ul', { class: 'in-recent', 'aria-label': 'Recentes' }, rec.map((id) => { const e = store.get(id); return h('li', null, h('button', { type: 'button', class: 'rc', on: { click: () => store.select(id, { source: 'inspector' }) } }, h('span', { class: 'k-' + e.kind, html: SEA.icon((store.kinds[e.kind] || {}).icon, 14) }), h('span', null, e.label))); })) : null));
      railIc.innerHTML = '';
    }

    function render(id, opt = {}) {
      const e = id && store.get(id);
      if (!e) return renderEmpty();
      const info = o.provide(store, e);
      const k = store.kinds[e.kind] || {};
      const sameKind = kind === e.kind; kind = e.kind;
      const keep = sameKind ? body.scrollTop : 0;
      ic.className = 'in-ic k-' + e.kind; ic.innerHTML = SEA.icon(k.icon || 'dot', 18);
      title.textContent = e.label; title.title = '';
      sub.textContent = info.summary || k.label || '';
      chipSlot.replaceChildren(e.state && e.state !== 'none' ? SEA.stateChip(store, e.state) : '');
      barWrap.hidden = false; bar.set(o.actions(e));
      const animate = !opt.silent;
      const frag = document.createDocumentFragment();
      if (info.hero) frag.appendChild(info.hero);
      info.sections.forEach((s, i) => frag.appendChild(sectionEl(s, i, animate)));
      body.replaceChildren(frag); body.scrollTop = keep;
      railIc.className = 'rail-ic k-' + e.kind; railIc.innerHTML = SEA.icon(k.icon || 'dot', 16); railIc.dataset.tip = e.label; railIc.setAttribute('data-tip-side', 'left');
      el.dataset.kind = e.kind;
      lastId = id;
    }

    store.on('select', (id, prev, opt) => {
      const wasCollapsed = o.layout.info().mode !== 'narrow' && prefs.get('inCollapsed');
      render(id, opt);
      const L = o.layout.info();
      if (L.mode === 'narrow') { if (opt.source !== 'history') o.layout.peek(); }
      else if (wasCollapsed && !prefs.get('inUserCollapsed') && !L.focus) o.layout.toggleIn(true, false); // contexto exige: expande (não forçado se o usuário recolheu)
      else if (wasCollapsed) { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      if (opt.fromEl && opt.morph) requestAnimationFrame(() => {
        const t = opt.morph === 'value' && body.querySelector('[data-morph="value"]') || title;
        if (t && t.offsetParent !== null) SEA.morph(opt.fromEl, t);
      });
    });
    store.on('state', (id) => { if (id === store.selection) render(id, { silent: true }); });
    store.on('reselect', () => { /* mantém */ });
    render(store.selection);
    return { el, render: (silent) => render(store.selection, { silent: silent !== false }), bar };
  };
})();
