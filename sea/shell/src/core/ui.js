/* Store de seleção (agnóstico de produto) + primitivos de UI: botão de ícone, tooltip, popover, menu, toast. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc, clamp, emitter } = SEA.u;

  /* ============ Store ============
   * Contrato do modelo (o shell nunca conhece regras de negócio):
   *   model = { entities:[{id,kind,label,parent?,state?,tree?,...}], kinds:{kind:{icon,label}}, states:{id:{label,tone,icon}},
   *             scopeOf(store,id) }
   * Hierarquia (parent) = localização/pertencimento. Relações entre entidades são outro dado (viewers). */
  SEA.createStore = function (model) {
    const ents = new Map();
    model.entities.forEach((e, i) => { e._i = i; ents.set(e.id, e); });
    const kids = new Map();
    const roots = [];
    model.entities.forEach((e) => {
      if (e.tree === false) return;
      if (e.parent == null) roots.push(e.id);
      else { if (!kids.has(e.parent)) kids.set(e.parent, []); kids.get(e.parent).push(e.id); }
    });
    const bus = emitter();
    let sel = null; const hist = []; let hi = -1; const recent = [];
    const store = {
      model, kinds: model.kinds, states: model.states, roots,
      get: (id) => ents.get(id), has: (id) => ents.has(id), all: () => model.entities,
      children: (id) => kids.get(id) || [],
      ancestors(id) { const out = []; let e = ents.get(id); while (e && e.parent != null) { e = ents.get(e.parent); if (e) out.unshift(e.id); } return out; },
      path(id) { return store.ancestors(id).concat(id); },
      treeAnchor(id) { let e = ents.get(id); while (e && e.tree === false) e = ents.get(e.parent); return e ? e.id : null; },
      get selection() { return sel; },
      select(id, o = {}) {
        if (!ents.has(id)) return;
        store.lastOpt = o;
        if (id === sel && !o.force) { bus.emit('reselect', id, o); return; }
        const prev = sel; sel = id;
        const ri = recent.indexOf(id); if (ri >= 0) recent.splice(ri, 1); recent.unshift(id); recent.length = Math.min(recent.length, 8);
        if (o.history !== false) { hist.splice(hi + 1); hist.push(id); hi = hist.length - 1; }
        bus.emit('select', id, prev, o);
      },
      recent: () => recent.slice(),
      canBack: () => hi > 0, canForward: () => hi < hist.length - 1,
      back() { if (hi > 0) { hi--; const p = sel; sel = hist[hi]; bus.emit('select', sel, p, { source: 'history', history: false }); } },
      forward() { if (hi < hist.length - 1) { hi++; const p = sel; sel = hist[hi]; bus.emit('select', sel, p, { source: 'history', history: false }); } },
      setState(id, state, note) {
        const e = ents.get(id); if (!e || e.state === state) return;
        const prev = e.state; e.state = state;
        (e.review = e.review || []).unshift({ from: prev, to: state, note: note || '' });
        bus.emit('state', id, prev, state);
      },
      on: bus.on, emit: bus.emit,
    };
    return store;
  };

  /* ============ Teclado ============ */
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  SEA.kbd = (s) => s.split('+').map((k) => ({ Mod: isMac ? '⌘' : 'Ctrl', Alt: isMac ? '⌥' : 'Alt', Shift: '⇧', Left: '←', Right: '→', Up: '↑', Down: '↓', Esc: 'Esc' }[k] || k)).join(isMac ? '' : '+');

  /* ============ Botão de ícone (nome acessível + tooltip + foco) ============ */
  SEA.btn = function (o) {
    const b = h('button', { type: 'button', class: 'ib' + (o.class ? ' ' + o.class : ''), 'aria-label': o.label, 'data-tip': o.label, 'data-tip-side': o.side || '' });
    if (o.kbd) { b.dataset.kbd = o.kbd; b.setAttribute('aria-keyshortcuts', o.kbd.replace('Mod', 'Control')); }
    b.innerHTML = SEA.icon(o.icon, o.size || 16) + (o.text ? `<span class="ib-t">${esc(o.text)}</span>` : '');
    if (o.text) b.classList.add('has-t');
    if (o.pressed != null) b.setAttribute('aria-pressed', String(!!o.pressed));
    if (o.expanded != null) b.setAttribute('aria-expanded', String(!!o.expanded));
    if (o.on) b.addEventListener('click', o.on);
    if (o.disabled) b.disabled = true;
    return b;
  };
  SEA.setBtn = function (b, o) {
    if (o.icon) b.querySelector('.ic').outerHTML = SEA.icon(o.icon, 16);
    if (o.label) { b.setAttribute('aria-label', o.label); b.dataset.tip = o.label; }
    if ('pressed' in o) b.setAttribute('aria-pressed', String(!!o.pressed));
    if ('disabled' in o) b.disabled = !!o.disabled;
  };

  /* ============ Tooltip (delegado) ============ */
  const tip = h('div', { class: 'tip', role: 'tooltip', 'aria-hidden': 'true' });
  let cur = null, tTimer = 0, warm = 0;
  function place(t) {
    const r = t.getBoundingClientRect(), w = tip.offsetWidth, hh = tip.offsetHeight, side = t.dataset.tipSide;
    let x, y;
    if (side === 'right') { x = r.right + 8; y = r.top + (r.height - hh) / 2; }
    else if (side === 'left') { x = r.left - w - 8; y = r.top + (r.height - hh) / 2; }
    else { x = r.left + (r.width - w) / 2; y = r.bottom + 8; if (y + hh > innerHeight - 4 || side === 'top') y = r.top - hh - 8; }
    tip.style.transform = `translate(${clamp(x, 4, innerWidth - w - 4)}px,${clamp(y, 4, innerHeight - hh - 4)}px)`;
  }
  function show(t) {
    cur = t;
    tip.innerHTML = esc(t.dataset.tip) + (t.dataset.kbd ? `<kbd>${esc(SEA.kbd(t.dataset.kbd))}</kbd>` : '');
    tip.classList.add('on'); place(t); warm = Date.now();
  }
  function hide() { clearTimeout(tTimer); cur = null; tip.classList.remove('on'); }
  SEA.tipHide = hide;
  function target(e) { return e.target && e.target.closest ? e.target.closest('[data-tip]') : null; }
  document.addEventListener('pointerover', (e) => {
    const t = target(e); if (!t || t === cur || e.pointerType === 'touch') return;
    clearTimeout(tTimer);
    tTimer = setTimeout(() => show(t), Date.now() - warm < 600 ? 0 : 380);
  });
  document.addEventListener('pointerout', (e) => { const t = target(e); if (t && !t.contains(e.relatedTarget)) hide(); });
  document.addEventListener('focusin', (e) => { const t = target(e); if (t && t.matches(':focus-visible')) show(t); });
  document.addEventListener('focusout', hide);
  document.addEventListener('pointerdown', hide, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); }, true);
  addEventListener('scroll', hide, true);
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(tip));
  if (document.body) document.body.appendChild(tip);

  /* ============ Popover / Menu ============ */
  let openPop = null;
  SEA.closePopover = function () { if (openPop) openPop.close(); };
  SEA.popover = function (anchor, content, o = {}) {
    SEA.closePopover(); hide();
    const el = h('div', { class: 'pop' + (o.class ? ' ' + o.class : ''), role: o.role || 'dialog', 'aria-label': o.label || '' }, content);
    document.body.appendChild(el);
    const r = anchor.getBoundingClientRect(), w = el.offsetWidth, hh = el.offsetHeight;
    let x = o.align === 'start' ? r.left : r.right - w;
    let y = r.bottom + 6; if (y + hh > innerHeight - 8) y = Math.max(8, r.top - hh - 6);
    el.style.transform = `translate(${clamp(x, 8, innerWidth - w - 8)}px,${y}px)`;
    anchor.setAttribute('aria-expanded', 'true');
    const off = (e) => { if (!el.contains(e.target) && !anchor.contains(e.target)) api.close(); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); api.close(true); } };
    setTimeout(() => document.addEventListener('pointerdown', off, true), 0);
    document.addEventListener('keydown', key, true);
    const api = {
      el, close(refocus) {
        if (openPop !== api) return; openPop = null;
        document.removeEventListener('pointerdown', off, true); document.removeEventListener('keydown', key, true);
        anchor.setAttribute('aria-expanded', 'false'); el.remove(); if (refocus) anchor.focus();
        o.onClose && o.onClose();
      },
    };
    openPop = api; requestAnimationFrame(() => el.classList.add('on'));
    return api;
  };
  SEA.menu = function (anchor, items, o = {}) {
    const list = h('div', { class: 'menu', role: 'menu' });
    let pop;
    items.forEach((it) => {
      if (it.sep) return list.appendChild(h('div', { class: 'menu-sep', role: 'separator' }));
      if (it.header) return list.appendChild(h('div', { class: 'menu-h' }, it.header));
      const b = h('button', { type: 'button', class: 'menu-i', role: it.checked != null ? 'menuitemcheckbox' : 'menuitem', 'aria-checked': it.checked != null ? String(!!it.checked) : null, disabled: it.disabled });
      b.innerHTML = `<span class="menu-ic">${it.icon ? SEA.icon(it.icon, 15) : ''}</span><span class="menu-l">${esc(it.label)}</span>${it.checked ? `<span class="menu-ck">${SEA.icon('check', 14)}</span>` : ''}${it.kbd ? `<kbd>${esc(SEA.kbd(it.kbd))}</kbd>` : ''}`;
      b.addEventListener('click', () => { pop.close(true); it.run && it.run(); });
      list.appendChild(b);
    });
    pop = SEA.popover(anchor, list, { role: 'presentation', align: o.align, label: o.label });
    const bs = Array.from(list.querySelectorAll('.menu-i:not([disabled])'));
    list.addEventListener('keydown', (e) => {
      const i = bs.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); bs[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); bs[bs.length - 1].focus(); }
      else if (e.key === 'Tab') pop.close(true);
    });
    if (bs[0]) bs[0].focus();
    return pop;
  };

  /* ============ Toast (feedback curto, com desfazer) ============ */
  let toastHost;
  SEA.toast = function (text, o = {}) {
    if (!toastHost) { toastHost = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(toastHost); }
    const t = h('div', { class: 'toast' }, h('span', null, text));
    if (o.undo) t.appendChild(h('button', { type: 'button', class: 'toast-b', on: { click: () => { o.undo(); close(); } } }, 'Desfazer'));
    toastHost.appendChild(t); requestAnimationFrame(() => t.classList.add('on'));
    const close = () => { t.classList.remove('on'); setTimeout(() => t.remove(), 220); };
    setTimeout(close, o.ms || 4200);
  };

  /* chip de estado (tom + ícone + rótulo) — não depende só de cor */
  SEA.stateChip = function (store, st, o = {}) {
    const s = store.states[st] || store.states.none;
    return h('span', { class: 'chip tone-' + s.tone + (o.dot ? ' dot' : ''), 'data-tip': o.tip === false ? null : s.label, title: null }, h('span', { class: 'chip-i', html: SEA.icon(s.icon, 12) }), o.dot ? null : h('span', { class: 'chip-t' }, s.label));
  };
})();
