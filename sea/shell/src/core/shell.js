/* WorkspaceShell — composição: Topbar + Explorer + ContentHost + Inspector + Actionbar + Atmosfera.
 * Recebe conteúdo e seleção por contratos explícitos (store, viewers, inspect, actions, commands).
 * Não conhece regras de negócio; a identidade atmosférica é plugável (cfg.atmosphere). */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc } = SEA.u;

  /* ---------- comandos / atalhos ---------- */
  function createCommands() {
    const list = [];
    function match(e, kbd) {
      const parts = kbd.split('+'), key = parts[parts.length - 1], mods = parts.slice(0, -1);
      const wMod = mods.includes('Mod'), wAlt = mods.includes('Alt'), wShift = mods.includes('Shift');
      if ((e.ctrlKey || e.metaKey) !== wMod || e.altKey !== wAlt) return false;
      if (wShift !== e.shiftKey && (wShift || key.length > 1)) return false;
      if (/^\d$/.test(key)) return e.code === 'Digit' + key;
      if (/^(Left|Right|Up|Down)$/.test(key)) return e.key === 'Arrow' + key;
      return e.key.toLowerCase() === key.toLowerCase();
    }
    return {
      list: () => list,
      register(c) { list.push(c); return c; },
      run(id) { const c = list.find((x) => x.id === id); if (c && (!c.when || c.when())) c.run(); },
      handle(e) {
        const t = e.target, typing = t.matches && t.matches('input,textarea,select,[contenteditable=""],[contenteditable="true"]');
        for (const c of list) {
          if (!c.kbd || !match(e, c.kbd)) continue;
          const plain = !/Mod|Alt/.test(c.kbd);
          if (plain && (typing || (t.closest && t.closest('[role="tree"]') && /^[a-z]$/i.test(c.kbd)) || document.querySelector('.pal-wrap, .pop'))) continue;
          if (c.when && !c.when()) continue;
          e.preventDefault(); c.run(); return true;
        }
        return false;
      },
    };
  }

  function segmented(label, opts, cur, on) {
    const g = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': label });
    opts.forEach((o) => {
      const b = h('button', { type: 'button', class: 'seg-b', role: 'radio', 'aria-checked': String(o.v === cur), on: { click: () => { g.querySelectorAll('.seg-b').forEach((x) => x.setAttribute('aria-checked', 'false')); b.setAttribute('aria-checked', 'true'); on(o.v); } } }, o.l);
      g.appendChild(b);
    });
    return g;
  }

  SEA.WorkspaceShell = function (rootEl, cfg) {
    const prefs = SEA.prefs, root = document.documentElement;
    const AMB = { calm: 0.4, ref: 1, off: 0 };

    /* tema */
    let theme = prefs.get('theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    root.dataset.theme = theme; root.dataset.density = prefs.get('density');

    /* gooey */
    document.body.appendChild(h('div', { class: 'svg-defs', 'aria-hidden': 'true', html:
      '<svg width="0" height="0" focusable="false"><defs><filter id="sea-goo" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter></defs></svg>' }));

    const store = SEA.createStore(cfg.model);
    const commands = createCommands();
    const L = {};                       // proxy até o PanelLayout existir
    const atmosphere = cfg.atmosphere;
    let fab = null;

    const explorer = SEA.Explorer(store, { layout: L, onActivateLeaf: cfg.onActivateLeaf });
    const host = SEA.ContentHost(store, { viewers: cfg.viewers, layout: L, scopeOf: cfg.model.scopeOf, onSelectionRect: () => fab && fab.layout() });
    const inspector = SEA.ContextInspector(store, { layout: L, provide: (s, e) => cfg.inspect(s, e, app), actions: (e) => cfg.actions(s2(), e, app) });
    function s2() { return store; }

    const rzEx = h('div', { class: 'rz rz-ex', role: 'separator', 'aria-orientation': 'vertical', 'aria-label': 'Largura do Explorer', 'aria-valuemin': SEA.PanelLayout.limits.MIN_EX, 'aria-valuemax': SEA.PanelLayout.limits.MAX_EX, 'aria-valuenow': 0, tabindex: '0', 'data-tip': 'Arrastar para redimensionar. Duplo clique restaura', 'data-tip-side': 'right' });
    const rzIn = h('div', { class: 'rz rz-in', role: 'separator', 'aria-orientation': 'vertical', 'aria-label': 'Largura do Inspector', 'aria-valuemin': SEA.PanelLayout.limits.MIN_IN, 'aria-valuemax': SEA.PanelLayout.limits.MAX_IN, 'aria-valuenow': 0, tabindex: '0', 'data-tip': 'Arrastar para redimensionar. Duplo clique restaura', 'data-tip-side': 'left' });
    const scrim = h('div', { class: 'scrim', 'aria-hidden': 'true' });
    const main = h('main', { class: 'main' }, explorer.el, rzEx, host.el, rzIn, inspector.el, scrim);
    const ws = h('div', { class: 'ws', 'data-mode': 'wide' });
    const atmoEl = h('div', { class: 'atmo', 'aria-hidden': 'true' });

    const palette = SEA.Palette(store, commands);
    const topbar = SEA.CompactTopbar(store, {
      layout: L, brandName: cfg.brand.name, brandTip: cfg.brand.tip,
      openPalette: () => palette.open(), toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'), openSettings: (a) => openSettings(a),
    });
    ws.append(topbar.el, main);
    rootEl.append(atmoEl, ws);

    Object.assign(L, SEA.PanelLayout({ ws, main, ex: explorer.el, inn: inspector.el, cv: host.el, rzEx, rzIn, scrim }));
    L.on((info) => { topbar.sync(); host.setFocusPressed(info.focus); fab && requestAnimationFrame(fab.layout); });

    /* barra de ações flutuante (contextual) */
    fab = SEA.FloatingActionbar(host, () => { const e = store.selection && store.get(store.selection); return e ? cfg.actions(store, e, app).filter((a) => a.float !== false) : []; });
    const refreshBars = () => { fab.update(); };
    store.on('select', () => { refreshBars(); requestAnimationFrame(() => requestAnimationFrame(() => fab.layout())); });
    store.on('state', refreshBars);

    /* tema / atmosfera */
    function setTheme(t) {
      theme = t; prefs.set('theme', t);
      root.classList.add('theme-fx'); root.dataset.theme = t; setTimeout(() => root.classList.remove('theme-fx'), 450);
      atmosphere.setTheme(t); topbar.setTheme(t);
    }
    function setAmbient(k) { prefs.set('ambient', k); SEA.motion.ambient = AMB[k]; atmosphere.setSpeed(AMB[k]); }
    function setDensity(d) { prefs.set('density', d); root.dataset.density = d; }

    function openSettings(anchor) {
      const dens = segmented('Densidade', [{ v: 'compact', l: 'Compacta' }, { v: 'comfortable', l: 'Confortável' }], prefs.get('density'), setDensity);
      const amb = segmented('Atmosfera', [{ v: 'calm', l: 'Calma 0,4×' }, { v: 'ref', l: 'Anterior 1×' }, { v: 'off', l: 'Estática' }], prefs.get('ambient'), setAmbient);
      const th = segmented('Tema', [{ v: 'dark', l: 'Escuro' }, { v: 'light', l: 'Claro' }], theme, setTheme);
      const reset = h('button', { type: 'button', class: 'btn', on: { click: () => { L.reset(); SEA.closePopover(); } } }, 'Restaurar layout');
      const c = h('div', { class: 'set' },
        h('div', { class: 'set-r' }, h('span', { class: 'set-l' }, 'Tema'), th),
        h('div', { class: 'set-r' }, h('span', { class: 'set-l' }, 'Densidade'), dens),
        h('div', { class: 'set-r' }, h('span', { class: 'set-l' }, 'Atmosfera'), amb),
        SEA.motion.reduced ? h('p', { class: 'set-n' }, 'Movimento reduzido ativo no sistema') : null,
        h('div', { class: 'set-r end' }, reset));
      SEA.popover(anchor, c, { label: 'Configurações' });
    }

    /* seleção → persistência, ping atmosférico, histórico */
    store.on('select', (id, prev, opt) => {
      prefs.set('selection', id);
      const src = opt.fromEl && opt.fromEl.getBoundingClientRect ? opt.fromEl.getBoundingClientRect() : null;
      if (src) atmosphere.ping(src.left + src.width / 2, src.top + src.height / 2);
    });

    /* comandos */
    const C = (c) => commands.register(c);
    C({ id: 'palette', label: 'Buscar e comandos', icon: 'command', kbd: 'Mod+K', run: () => palette.open() });
    C({ id: 'ex', label: 'Alternar Explorer', icon: 'panel-left', kbd: 'Mod+B', group: 'Painéis', run: () => { L.toggleEx(); topbar.sync(); } });
    C({ id: 'in', label: 'Alternar Inspector', icon: 'panel-right', kbd: 'Mod+I', group: 'Painéis', run: () => L.toggleIn(undefined, true) });
    C({ id: 'focus', label: 'Modo foco do Canvas', icon: 'maximize', kbd: 'F', group: 'Painéis', run: () => L.toggleFocus() });
    C({ id: 'filter', label: 'Filtrar Explorer', icon: 'filter', kbd: '/', group: 'Painéis', run: () => explorer.focusFilter() });
    C({ id: 'theme', label: 'Alternar tema', icon: 'sun', kbd: 'Mod+Shift+L', group: 'Aparência', run: () => setTheme(theme === 'dark' ? 'light' : 'dark') });
    C({ id: 'density', label: 'Alternar densidade', icon: 'rows-dense', group: 'Aparência', run: () => setDensity(prefs.get('density') === 'compact' ? 'comfortable' : 'compact') });
    C({ id: 'ambient', label: 'Atmosfera: alternar velocidade', icon: 'wave', group: 'Aparência', run: () => setAmbient({ calm: 'ref', ref: 'off', off: 'calm' }[prefs.get('ambient')]) });
    C({ id: 'reset', label: 'Restaurar layout', icon: 'undo', group: 'Painéis', run: () => L.reset() });
    C({ id: 'back', label: 'Voltar', icon: 'arrow-left', kbd: 'Alt+Left', group: 'Navegação', when: () => store.canBack(), run: () => store.back() });
    C({ id: 'fwd', label: 'Avançar', icon: 'arrow-right', kbd: 'Alt+Right', group: 'Navegação', when: () => store.canForward(), run: () => store.forward() });
    cfg.viewers.forEach((v, i) => C({ id: 'view-' + v.id, label: 'Visualizar: ' + v.label, icon: v.icon, kbd: 'Alt+' + (i + 1), group: 'Canvas', run: () => host.setViewer(v.id, true) }));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !document.querySelector('.pal-wrap, .pop')) { const i = L.info(); if (i.focus) { L.toggleFocus(false); e.preventDefault(); } else if (i.mode === 'narrow') L.closeDrawers(); }
      commands.handle(e);
    });

    const app = { store, commands, layout: L, host, explorer, inspector, topbar, atmosphere, palette, setTheme, setAmbient, setDensity, fab, get theme() { return theme; } };
    (cfg.commands ? cfg.commands(app) : []).forEach(C);

    /* boot */
    atmosphere.mount(atmoEl); atmosphere.setTheme(theme); setAmbient(prefs.get('ambient')); topbar.setTheme(theme);
    L.apply(true);
    const restored = prefs.get('selection');
    store.select(store.has(restored) ? restored : cfg.initialSelection, { source: 'boot' });
    host.ready(); refreshBars(); topbar.sync();
    requestAnimationFrame(() => { explorer.reveal(store.selection, true); fab.layout(); });
    return app;
  };
})();
