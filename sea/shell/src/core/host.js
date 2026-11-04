/* ContentHost — Universal Canvas. Não presume conteúdo: hospeda "viewers" registrados.
 *
 * Contrato de um viewer:
 *   { id, label, icon, interaction: 'scroll'|'pan-zoom'|'text',
 *     supports(ctx) -> true | { icon, title, action?:{label,run} }       // vazio útil
 *     create(host) -> instância {
 *        el, update(ctx) -> void|Promise, toolbar() -> item[], selectionRect() -> DOMRect|null,
 *        onShow?(ctx), destroy?() } }
 *   item de toolbar: { id, icon, label, kbd?, run, pressed?, disabled?, group?, el? }
 *   ctx = { store, id, entity, scope, reason }  (scope é decidido por store.model.scopeOf — o shell não o conhece) */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc, sleep } = SEA.u;

  SEA.ContentHost = function (store, o) {
    const prefs = SEA.prefs, viewers = o.viewers, byId = Object.fromEntries(viewers.map((v) => [v.id, v]));
    const inst = new Map(), dirty = new Set();
    let active = prefs.get('viewer'); if (!byId[active]) active = viewers[0].id;
    let token = 0, loadT = 0, loading = false, ready = false;

    /* ---- DOM ---- */
    const tabs = h('div', { class: 'cv-tabs', role: 'tablist', 'aria-label': 'Visualização' });
    const tabEls = {};
    viewers.forEach((v, i) => {
      const b = h('button', { type: 'button', class: 'cv-tab', role: 'tab', id: 'tab-' + v.id, 'aria-selected': 'false', tabindex: '-1', 'data-tip': v.label, 'data-kbd': 'Alt+' + (i + 1), 'aria-keyshortcuts': 'Alt+' + (i + 1), on: { click: () => setViewer(v.id, true) } });
      b.innerHTML = `${SEA.icon(v.icon, 15)}<span class="cv-tab-t">${esc(v.label)}</span>`;
      tabs.appendChild(b); tabEls[v.id] = b;
    });
    tabs.addEventListener('keydown', (e) => {
      const i = viewers.findIndex((v) => v.id === active);
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % viewers.length; else if (e.key === 'ArrowLeft') j = (i - 1 + viewers.length) % viewers.length;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = viewers.length - 1;
      if (j != null) { e.preventDefault(); setViewer(viewers[j].id, true); tabEls[viewers[j].id].focus(); }
    });
    const scopeEl = h('div', { class: 'cv-scope' });
    const tools = h('div', { class: 'cv-tools', role: 'toolbar', 'aria-label': 'Ferramentas da visualização' });
    const btnMax = SEA.btn({ icon: 'maximize', label: 'Modo foco', kbd: 'F', pressed: false, on: () => o.layout.toggleFocus() });
    const head = h('header', { class: 'cv-h' }, tabs, scopeEl, h('span', { class: 'px-sp' }), tools, btnMax);
    const stage = h('div', { class: 'cv-stage' });
    const stateEl = h('div', { class: 'cv-state', hidden: true });
    const floatEl = h('div', { class: 'cv-float' });
    const body = h('div', { class: 'cv-body' }, stage, stateEl, floatEl);
    const el = h('section', { class: 'cv panel', 'aria-label': 'Canvas' }, head, body);

    /* ---- estados ---- */
    function showLoading() {
      loading = true; body.setAttribute('aria-busy', 'true');
      stateEl.hidden = false; stateEl.className = 'cv-state is-loading';
      stateEl.innerHTML = '<div class="sk"><i></i><i></i><i></i><i></i></div>';
    }
    function showEmpty(e) {
      body.removeAttribute('aria-busy'); stateEl.hidden = false; stateEl.className = 'cv-state is-empty';
      stateEl.innerHTML = `<div class="em"><span class="em-i">${SEA.icon(e.icon || 'info', 28)}</span><p>${esc(e.title)}</p></div>`;
      if (e.action) stateEl.querySelector('.em').appendChild(h('button', { type: 'button', class: 'btn', on: { click: e.action.run } }, e.action.label));
      stage.classList.add('is-hidden');
    }
    function clearState() { loading = false; body.removeAttribute('aria-busy'); stateEl.hidden = true; stateEl.innerHTML = ''; stage.classList.remove('is-hidden'); }

    function ctxOf(reason) {
      const id = store.selection, entity = id && store.get(id);
      return { store, id, entity, scope: entity ? o.scopeOf(store, id) : null, reason: reason || 'select', host: api };
    }
    function hostFor(v) {
      return {
        store, viewer: v, layout: o.layout,
        select: (id, opt) => store.select(id, Object.assign({ source: 'canvas' }, opt)),
        setViewer: (id, opt) => setViewer(id, true, opt),
        requestToolbar: () => paintTools(),
        selectionChanged: () => o.onSelectionRect && o.onSelectionRect(),
        isActive: () => active === v.id,
      };
    }

    /* ---- ciclo de vida ---- */
    async function refresh(reason) {
      const my = ++token, v = byId[active], ctx = ctxOf(reason);
      if (!ctx.entity) { stage.classList.add('is-hidden'); showEmpty({ icon: 'tree', title: 'Selecione um item' }); paintTools(); return; }
      const sup = v.supports ? v.supports(ctx) : true;
      if (sup !== true) { showEmpty(sup); paintTools(); inst.forEach((i, k) => { i.el.hidden = true; }); return; }
      let i = inst.get(v.id);
      if (!i) { i = v.create(hostFor(v)); inst.set(v.id, i); i.el.classList.add('vw'); i.el.dataset.viewer = v.id; stage.appendChild(i.el); }
      inst.forEach((x, k) => { x.el.hidden = k !== v.id; x.el.toggleAttribute('inert', k !== v.id); });
      stage.dataset.interaction = v.interaction || 'scroll';
      let res; try { res = i.update(ctx); } catch (err) { console.error(err); }
      if (res && typeof res.then === 'function') {
        const t0 = performance.now();
        clearTimeout(loadT); loadT = setTimeout(() => { if (my === token) { stage.classList.add('is-hidden'); showLoading(); } }, 70);
        try { await res; } catch (err) { console.error(err); }
        clearTimeout(loadT);
        if (loading) { const dt = performance.now() - t0; if (dt < 220) await sleep(220 - dt); }
        if (my !== token) return; // interrompido por nova seleção/aba
      }
      clearState(); paintTools(); dirty.delete(v.id);
      if (reason === 'show' && i.onShow) i.onShow(ctxOf('show'));
      o.onSelectionRect && o.onSelectionRect();
    }

    function paintTools() {
      tools.replaceChildren();
      const i = inst.get(active), items = i && !stage.classList.contains('is-hidden') && i.toolbar ? i.toolbar() : [];
      let lastG = null;
      items.forEach((it) => {
        if (lastG != null && it.group !== lastG) tools.appendChild(h('span', { class: 'tb-sep', role: 'separator' }));
        lastG = it.group;
        if (it.el) { tools.appendChild(it.el); return; }
        const b = SEA.btn({ icon: it.icon, label: it.label, kbd: it.kbd, pressed: it.pressed, disabled: it.disabled, text: it.text, on: () => { it.run(); } });
        tools.appendChild(b);
      });
    }

    function setViewer(id, user, opt) {
      if (!byId[id]) return;
      const changed = id !== active;
      active = id; prefs.set('viewer', id);
      viewers.forEach((v) => { const on = v.id === id; tabEls[v.id].setAttribute('aria-selected', String(on)); tabEls[v.id].tabIndex = on ? 0 : -1; tabEls[v.id].classList.toggle('on', on); });
      tabPill();
      if (changed || (opt && opt.force)) { refresh('show'); o.onViewer && o.onViewer(id); }
    }
    function tabPill() { /* indicador segue a aba ativa (CSS transition) */
      const b = tabEls[active]; if (!b) return;
      tabs.style.setProperty('--px', b.offsetLeft + 'px'); tabs.style.setProperty('--pw', b.offsetWidth + 'px');
    }
    new ResizeObserver(tabPill).observe(tabs);

    function paintScope() {
      const c = ctxOf(), s = c.scope;
      scopeEl.innerHTML = s ? `<span class="k-${esc(s.kind)}">${SEA.icon((store.kinds[s.kind] || {}).icon || 'dot', 14)}</span><span class="cv-scope-t">${esc(s.label)}</span>` : '';
      scopeEl.dataset.tip = s ? `${(store.kinds[s.kind] || {}).label || ''}: ${s.label}` : ''; if (!s) scopeEl.removeAttribute('data-tip');
    }

    store.on('select', (id, prev, opt) => { paintScope(); refresh('select'); });
    store.on('reselect', () => { const i = inst.get(active); i && i.update && i.update(ctxOf('reselect')); });
    store.on('state', (id) => { const i = inst.get(active); inst.forEach((x, k) => { if (k !== active) dirty.add(k); }); if (i && i.update) { const r = i.update(ctxOf('state')); paintTools(); } });

    const api = {
      el, floatEl, body, stage,
      get active() { return active; }, viewers,
      setViewer, refresh, paintScope,
      instance: (id) => inst.get(id || active),
      selectionRect() { const i = inst.get(active); return i && i.selectionRect && !stage.classList.contains('is-hidden') ? i.selectionRect() : null; },
      setFocusPressed(on) { SEA.setBtn(btnMax, { pressed: on, icon: on ? 'minimize' : 'maximize', label: on ? 'Sair do modo foco' : 'Modo foco' }); },
      /* localizar a origem de uma entidade (troca de viewer sem reconstruir o shell) */
      locate(id) { const e = store.get(id); if (!e) return; if (store.selection !== id) store.select(id, { source: 'canvas' }); const v = viewers.find((x) => x.locates && x.locates(ctxOf())); if (!v) return; if (active === v.id) { const i = inst.get(v.id); i && i.locate && i.locate(id); } else setViewer(v.id, true); },
      ready() { ready = true; setViewer(active, false, { force: true }); paintScope(); },
    };
    return api;
  };
})();
