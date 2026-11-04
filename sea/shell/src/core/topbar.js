/* CompactTopbar — identidade discreta, histórico, breadcrumb (colapsa por contagem, como no DS),
 * busca/command palette, alternância de painéis, tema e configurações. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc } = SEA.u;

  SEA.CompactTopbar = function (store, o) {
    const L = o.layout;
    const btnEx = SEA.btn({ icon: 'panel-left', label: 'Explorer', kbd: 'Mod+B', pressed: true, on: () => L.toggleEx() });
    const brand = h('div', { class: 'tb-brand', 'data-tip': o.brandTip || '', 'aria-label': o.brandName }, h('span', { class: 'tb-logo', html: SEA.icon('wave', 18) }), h('span', { class: 'tb-name' }, o.brandName));
    const back = SEA.btn({ icon: 'arrow-left', label: 'Voltar', kbd: 'Alt+Left', on: () => store.back() });
    const fwd = SEA.btn({ icon: 'arrow-right', label: 'Avançar', kbd: 'Alt+Right', on: () => store.forward() });
    const crumb = h('nav', { class: 'crumb', 'aria-label': 'Localização' });
    const pal = h('button', { type: 'button', class: 'tb-search', 'aria-label': 'Buscar e comandos', 'data-tip': 'Buscar e comandos', 'data-kbd': 'Mod+K', 'aria-haspopup': 'dialog', 'aria-keyshortcuts': 'Control+K', on: { click: () => o.openPalette() } });
    pal.innerHTML = `${SEA.icon('search', 15)}<span class="tb-search-t">Buscar</span><kbd>${esc(SEA.kbd('Mod+K'))}</kbd>`;
    const fx = h('span', { class: 'tb-fx', tabindex: '0', 'data-tip': 'Fixture: estados de revisão e candidatos são simulados. Valores e evidências vêm do PDF.', 'aria-label': 'Fixture: estados de revisão e candidatos são simulados. Valores e evidências vêm do PDF.', html: SEA.icon('flask', 13) + '<span>fixture</span>' });
    const btnIn = SEA.btn({ icon: 'panel-right', label: 'Inspector', kbd: 'Mod+I', pressed: true, on: () => L.toggleIn(undefined, true) });
    const theme = SEA.btn({ icon: 'moon', label: 'Tema', kbd: 'Mod+Shift+L', on: () => o.toggleTheme() });
    const set = SEA.btn({ icon: 'settings', label: 'Configurações', expanded: false, on: () => o.openSettings(set) });
    set.setAttribute('aria-haspopup', 'dialog');
    const el = h('header', { class: 'tb' }, btnEx, brand, h('span', { class: 'tb-sep' }), back, fwd, crumb, h('span', { class: 'px-sp' }), pal, fx, h('span', { class: 'tb-sep' }), btnIn, theme, set);

    function paintCrumb() {
      crumb.replaceChildren();
      const id = store.selection; if (!id) return;
      let path = store.path(id), hidden = [];
      if (path.length > 4) { hidden = path.slice(1, path.length - 2); path = [path[0], '…', ...path.slice(-2)]; }
      const ol = h('ol', { class: 'crumb-l' });
      path.forEach((pid, i) => {
        const last = i === path.length - 1;
        let li;
        if (pid === '…') {
          const b = SEA.btn({ icon: 'more', label: 'Itens ocultos', class: 'crumb-more', on: () => SEA.menu(b, hidden.map((x) => ({ label: store.get(x).label, icon: (store.kinds[store.get(x).kind] || {}).icon, run: () => store.select(x, { source: 'breadcrumb' }) })), { align: 'start' }) });
          b.setAttribute('aria-haspopup', 'menu'); li = h('li', null, b);
        } else {
          const e = store.get(pid);
          li = h('li', { class: last ? 'cur' : '' }, last ? h('span', { class: 'crumb-i', 'aria-current': 'page', html: `<span class="k-${e.kind}">${SEA.icon((store.kinds[e.kind] || {}).icon, 13)}</span><span class="crumb-t">${esc(e.label)}</span>` })
            : h('button', { type: 'button', class: 'crumb-i', html: `<span class="k-${e.kind}">${SEA.icon((store.kinds[e.kind] || {}).icon, 13)}</span><span class="crumb-t">${esc(e.label)}</span>`, on: { click: () => store.select(pid, { source: 'breadcrumb' }) } }));
        }
        if (!last) li.appendChild(h('span', { class: 'crumb-s', html: SEA.icon('chevron-right', 11) }));
        ol.appendChild(li);
      });
      crumb.appendChild(ol);
    }
    function paintNav() { back.disabled = !store.canBack(); fwd.disabled = !store.canForward(); }
    store.on('select', () => { paintCrumb(); paintNav(); });
    paintCrumb(); paintNav();

    return {
      el,
      sync() {
        const i = L.info();
        SEA.setBtn(btnEx, { pressed: !!i.exOpen }); SEA.setBtn(btnIn, { pressed: !!i.inOpen });
      },
      setTheme(t) { SEA.setBtn(theme, { icon: t === 'dark' ? 'sun' : 'moon', label: t === 'dark' ? 'Tema claro' : 'Tema escuro' }); },
    };
  };
})();
