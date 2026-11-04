/* Explorer — TreeView genérico (hierarquia = pertencimento; não é grafo). Independe do modelo de produto. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc, norm, clamp, Spring } = SEA.u;

  SEA.Explorer = function (store, o) {
    const prefs = SEA.prefs;
    const expanded = new Set(prefs.get('expanded') || []);
    const filters = new Set(prefs.get('filters') || []);
    let q = '', focusId = null, follow = prefs.get('follow') !== false, ta = '', taT = 0;
    const rows = new Map();
    let vis = [];

    /* ---------- DOM ---------- */
    const btnCollapse = SEA.btn({ icon: 'panel-left', label: 'Recolher Explorer', kbd: 'Mod+B', on: () => o.layout.toggleEx(false) });
    const btnFollow = SEA.btn({ icon: 'crosshair', label: 'Acompanhar seleção', pressed: follow, on: () => { follow = !follow; prefs.set('follow', follow); SEA.setBtn(btnFollow, { pressed: follow }); if (follow) reveal(store.selection, true); } });
    const btnExpAll = SEA.btn({ icon: 'chevrons-up-down', label: 'Expandir tudo', on: () => { store.all().forEach((e) => { if (e.tree !== false && store.children(e.id).length) expanded.add(e.id); }); persist(); render(); } });
    const btnColAll = SEA.btn({ icon: 'chevrons-down-up', label: 'Recolher tudo', on: () => { expanded.clear(); const a = store.treeAnchor(store.selection); if (a) store.ancestors(a).forEach((x) => expanded.add(x)); persist(); render(); } });
    const input = h('input', { type: 'search', class: 'ex-in', placeholder: 'Filtrar', 'aria-label': 'Filtrar Explorer', autocomplete: 'off', spellcheck: 'false', on: { input: () => { q = norm(input.value.trim()); render(); } } });
    const clr = SEA.btn({ icon: 'x', label: 'Limpar filtro', class: 'ex-clr', on: () => { input.value = ''; q = ''; render(); input.focus(); } });
    clr.hidden = true;
    const chips = h('div', { class: 'ex-chips', role: 'group', 'aria-label': 'Filtrar por estado' });
    Object.keys(store.states).forEach((k) => {
      const s = store.states[k]; if (s.filter === false) return;
      const b = SEA.btn({ icon: s.icon, label: `Estado: ${s.label}`, pressed: filters.has(k), class: 'ex-f tone-' + s.tone, on: () => { filters.has(k) ? filters.delete(k) : filters.add(k); b.setAttribute('aria-pressed', String(filters.has(k))); prefs.set('filters', [...filters]); render(); } });
      chips.appendChild(b);
    });
    const glide1 = h('div', { class: 'gl g1' }), glide2 = h('div', { class: 'gl g2' });
    const glide = h('div', { class: 'glide', 'aria-hidden': 'true' }, glide2, glide1);
    const list = h('div', { class: 'ex-list' });
    const treeIn = h('div', { class: 'ex-tree-in' }, glide, list);
    const tree = h('div', { class: 'ex-tree', role: 'tree', 'aria-label': 'Explorer', 'aria-multiselectable': 'false' }, treeIn);
    const count = h('span', { class: 'ex-count' });
    const empty = h('div', { class: 'ex-empty', hidden: true }, h('span', null, 'Nada encontrado'), h('button', { type: 'button', class: 'lnk', on: { click: () => { input.value = ''; q = ''; filters.clear(); prefs.set('filters', []); $$f(); render(); } } }, 'Limpar filtros'));
    function $$f() { chips.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false')); }

    const full = h('div', { class: 'ex-full' },
      h('div', { class: 'px-h' }, h('span', { class: 'px-t', html: SEA.icon('tree', 14) + '<span>Explorer</span>' }), h('span', { class: 'px-sp' }), btnFollow, btnExpAll, btnColAll, btnCollapse),
      h('div', { class: 'ex-q' }, h('span', { class: 'ex-qi', html: SEA.icon('search', 14) }), input, clr),
      chips, tree, empty, h('div', { class: 'ex-f-bar' }, count));

    /* trilho: mantém a seleção visível quando o painel está recolhido */
    const railSel = h('button', { type: 'button', class: 'ib rail-sel', 'data-tip': 'Seleção', 'data-tip-side': 'right', 'aria-label': 'Mostrar seleção no Explorer', on: { click: () => { o.layout.toggleEx(true); setTimeout(() => reveal(store.selection, true), 60); } } });
    const rail = h('div', { class: 'ex-rail' },
      SEA.btn({ icon: 'panel-left', label: 'Expandir Explorer', kbd: 'Mod+B', side: 'right', on: () => o.layout.toggleEx(true) }),
      SEA.btn({ icon: 'search', label: 'Filtrar', kbd: '/', side: 'right', on: () => { o.layout.toggleEx(true); setTimeout(() => input.focus(), 120); } }),
      h('span', { class: 'rail-sp' }), railSel);

    const el = h('aside', { class: 'ex panel', 'aria-label': 'Explorer' }, rail, full);

    /* ---------- árvore plana ---------- */
    function matches(e) {
      if (filters.size && !filters.has(e.state || 'none')) return false;
      if (q && !norm(e.label + ' ' + (e.search || '')).includes(q)) return false;
      return true;
    }
    function visible() {
      const out = [];
      const filtering = !!q || filters.size > 0;
      const walk = (id, lv) => {
        const e = store.get(id), kids = store.children(id);
        let sub = [];
        if (kids.length) { const save = out.length; kids.forEach((k) => walk(k, lv + 1)); sub = out.splice(save); }
        const self = matches(e);
        if (filtering) {
          if (!self && !sub.length) return;
          out.push({ id, lv, hit: self && (q || filters.size), open: true, kids: kids.length }); out.push(...sub);
        } else {
          const open = expanded.has(id);
          out.push({ id, lv, open, kids: kids.length }); if (open) out.push(...sub);
        }
      };
      store.roots.forEach((r) => walk(r, 0));
      return out;
    }

    function mkRow(id) {
      const e = store.get(id);
      const r = h('div', { class: 'row', role: 'treeitem', 'data-id': id, tabindex: '-1' });
      r.innerHTML = `<span class="tw"></span><span class="ti k-${esc(e.kind)}">${SEA.icon((store.kinds[e.kind] || {}).icon || 'dot', 15)}</span><span class="lb"></span><span class="mt"></span><span class="st"></span>`;
      return r;
    }
    function fillRow(r, v) {
      const e = store.get(v.id), sel = v.id === store.selection;
      r.style.setProperty('--lv', v.lv);
      r.setAttribute('aria-level', v.lv + 1);
      if (v.kids) r.setAttribute('aria-expanded', String(!!v.open)); else r.removeAttribute('aria-expanded');
      r.setAttribute('aria-selected', String(sel));
      r.classList.toggle('sel', sel); r.classList.toggle('leaf', !v.kids);
      r.tabIndex = v.id === focusId ? 0 : -1;
      r.querySelector('.tw').innerHTML = v.kids ? SEA.icon('chevron-right', 13) : '';
      r.querySelector('.tw').classList.toggle('open', !!v.open);
      const lb = r.querySelector('.lb');
      const text = e.label;
      if (q) { const i = norm(text).indexOf(q); lb.innerHTML = i < 0 ? esc(text) : `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + q.length))}</mark>${esc(text.slice(i + q.length))}`; } else lb.textContent = text;
      r.querySelector('.mt').textContent = e.meta || '';
      const st = r.querySelector('.st'); st.innerHTML = '';
      if (e.state && e.state !== 'none') st.appendChild(SEA.stateChip(store, e.state, { dot: true }));
      r.dataset.tip = ''; r.removeAttribute('data-tip'); r.title = '';
    }

    function render() {
      vis = visible();
      clr.hidden = !input.value;
      const frag = document.createDocumentFragment();
      const keep = new Set();
      vis.forEach((v) => {
        let r = rows.get(v.id);
        if (!r) { r = mkRow(v.id); rows.set(v.id, r); r.classList.add('new'); requestAnimationFrame(() => r.classList.remove('new')); }
        fillRow(r, v); keep.add(v.id); frag.appendChild(r);
      });
      rows.forEach((r, id) => { if (!keep.has(id)) { rows.delete(id); } });
      list.replaceChildren(frag);
      if (!focusId || !keep.has(focusId)) { focusId = keep.has(store.selection) ? store.selection : (vis[0] && vis[0].id); const fr = rows.get(focusId); if (fr) fr.tabIndex = 0; }
      empty.hidden = vis.length > 0; tree.hidden = vis.length === 0;
      count.textContent = `${vis.length}/${store.all().filter((e) => e.tree !== false).length}`;
      const a = store.treeAnchor(store.selection);
      rows.forEach((r, id) => r.classList.toggle('ctx', id === a && a !== store.selection));
      requestAnimationFrame(placeGlide);
      railIcon();
    }
    function persist() { prefs.set('expanded', [...expanded]); }

    /* ---------- glide (seleção gooey, interrompível) ---------- */
    const gy1 = new Spring(0, { k: 420, c: 32, on: (v) => { glide1.style.transform = `translateY(${v}px)`; } });
    const gy2 = new Spring(0, { k: 170, c: 22, on: (v) => { glide2.style.transform = `translateY(${v}px)`; } });
    let glideShown = false;
    function placeGlide(snap) {
      const id = store.selection, a = store.treeAnchor(id), r = a && rows.get(a);
      if (!r || !r.isConnected || !r.offsetHeight) { glide.classList.add('hide'); glideShown = false; return; }
      const y = r.offsetTop, hh = r.offsetHeight;
      glide1.style.height = glide2.style.height = hh + 'px';
      glide.classList.toggle('dim', a !== id);
      if (!glideShown || snap === true) { gy1.set(y); gy2.set(y); glideShown = true; } else { gy1.to(y); gy2.to(y); }
      glide.classList.remove('hide');
    }
    new ResizeObserver(() => placeGlide(true)).observe(treeIn);

    const sScroll = new Spring(0, { k: 200, c: 26, on: (v) => { tree.scrollTop = v; } });
    function scrollToRow(r) {
      const top = r.offsetTop, bot = top + r.offsetHeight, vt = tree.scrollTop, vb = vt + tree.clientHeight, m = 28;
      if (top >= vt + m && bot <= vb - m) return;
      sScroll.set(tree.scrollTop);
      sScroll.to(clamp(top - tree.clientHeight / 2 + r.offsetHeight / 2, 0, tree.scrollHeight - tree.clientHeight));
    }
    tree.addEventListener('wheel', () => sScroll.stop(), { passive: true });
    tree.addEventListener('pointerdown', () => sScroll.stop());

    function reveal(id, force) {
      const a = id && store.treeAnchor(id); if (!a) return;
      if (!force && !follow) return;
      store.ancestors(a).forEach((x) => expanded.add(x)); persist();
      render();
      const r = rows.get(a); if (r) scrollToRow(r);
    }

    /* ---------- interação ---------- */
    function rowOf(t) { return t.closest('.row'); }
    tree.addEventListener('click', (e) => {
      const r = rowOf(e.target); if (!r) return;
      const id = r.dataset.id;
      if (e.target.closest('.tw') && store.children(id).length) return toggle(id);
      focusId = id;
      store.select(id, { source: 'explorer', fromEl: r.querySelector('.lb'), morph: 'title' });
      if (o.layout.info().mode === 'narrow') o.layout.closeDrawers();
      if (!store.children(id).length) o.onActivateLeaf && o.onActivateLeaf(id);
    });
    tree.addEventListener('dblclick', (e) => { const r = rowOf(e.target); if (r && store.children(r.dataset.id).length) toggle(r.dataset.id); });
    function toggle(id, force) {
      const open = force != null ? force : !expanded.has(id);
      open ? expanded.add(id) : expanded.delete(id); persist();
      // se a seleção ficou oculta, o glide aponta para o ancestral (contexto)
      render();
    }
    function focusRow(id) { focusId = id; rows.forEach((r, k) => { r.tabIndex = k === id ? 0 : -1; }); const r = rows.get(id); if (r) { r.focus({ preventScroll: true }); scrollToRow(r); } }
    tree.addEventListener('keydown', (e) => {
      const r = rowOf(e.target); if (!r || e.altKey || e.ctrlKey || e.metaKey) return;
      const id = r.dataset.id, i = vis.findIndex((v) => v.id === id), v = vis[i];
      const go = (j) => { if (vis[j]) focusRow(vis[j].id); };
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); go(i + 1); break;
        case 'ArrowUp': e.preventDefault(); go(i - 1); break;
        case 'Home': e.preventDefault(); go(0); break;
        case 'End': e.preventDefault(); go(vis.length - 1); break;
        case 'ArrowRight': e.preventDefault(); if (v.kids && !v.open) toggle(id, true); else if (v.kids) go(i + 1); if (v.kids && !v.open) requestAnimationFrame(() => focusRow(id)); break;
        case 'ArrowLeft': e.preventDefault(); if (v.kids && v.open && !q && !filters.size) { toggle(id, false); requestAnimationFrame(() => focusRow(id)); } else { const p = store.get(id).parent; if (p != null && rows.has(p)) focusRow(p); } break;
        case 'Enter': case ' ': e.preventDefault(); store.select(id, { source: 'explorer', fromEl: r.querySelector('.lb'), morph: 'title' }); if (o.layout.info().mode === 'narrow') o.layout.closeDrawers(); break;
        case '*': e.preventDefault(); store.children(id).forEach((k) => store.children(k).length && expanded.add(k)); toggle(id, true); break;
        case 'Escape': if (input.value) { input.value = ''; q = ''; render(); } break;
        default:
          if (e.key.length === 1 && /\S/.test(e.key)) { // busca por digitação
            clearTimeout(taT); ta += norm(e.key); taT = setTimeout(() => { ta = ''; }, 650);
            const order = vis.slice(i + 1).concat(vis.slice(0, i + 1)).find((x) => norm(store.get(x.id).label).startsWith(ta));
            if (order) focusRow(order.id);
          }
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && vis[0]) { e.preventDefault(); focusRow(vis[0].id); }
      else if (e.key === 'Escape' && input.value) { e.stopPropagation(); input.value = ''; q = ''; render(); }
    });

    /* ---------- seleção do exterior ---------- */
    store.on('select', (id, prev, opt) => {
      if (opt.source === 'explorer') { rows.forEach((r, k) => { r.classList.toggle('sel', k === id); r.setAttribute('aria-selected', String(k === id)); }); const a = store.treeAnchor(id); rows.forEach((r, k) => r.classList.toggle('ctx', k === a && a !== id)); placeGlide(); railIcon(); return; }
      if (follow) reveal(id, true); else { render(); }
    });
    store.on('state', () => render());

    function railIcon() {
      const a = store.treeAnchor(store.selection), e = a && store.get(a);
      if (!e) { railSel.innerHTML = SEA.icon('dot', 16); return; }
      railSel.innerHTML = SEA.icon((store.kinds[e.kind] || {}).icon || 'dot', 16);
      railSel.dataset.tip = e.label; railSel.setAttribute('aria-label', `Seleção: ${e.label}. Mostrar no Explorer`);
      railSel.className = 'ib rail-sel k-' + e.kind;
    }

    // estado inicial
    if (prefs.get('expanded') == null) store.roots.forEach((r) => expanded.add(r));
    if (store.selection) store.ancestors(store.treeAnchor(store.selection)).forEach((x) => expanded.add(x));
    render();

    return {
      el, input, render, reveal,
      focusFilter() { o.layout.toggleEx(true); setTimeout(() => { input.focus(); input.select(); }, 80); },
      focusTree() { const r = rows.get(focusId); r && r.focus(); },
      get following() { return follow; },
    };
  };
})();
