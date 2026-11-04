/* Command palette — busca de entidades + comandos. Teclado completo (setas, Enter, Esc), combobox/listbox. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc, norm, Spring } = SEA.u;

  SEA.Palette = function (store, commands) {
    let host = null, opener = null;
    function score(text, q) {
      const t = norm(text); if (!q) return 1;
      const i = t.indexOf(q); if (i >= 0) return 100 - i + (i === 0 ? 40 : 0);
      let j = 0, s = 0; for (const c of q) { const k = t.indexOf(c, j); if (k < 0) return 0; s += 1 / (1 + k - j); j = k + 1; } return s;
    }
    function items(q) {
      q = norm(q.trim());
      const cmds = commands.list().filter((c) => !c.when || c.when()).map((c) => ({ type: 'cmd', c, s: score(c.label + ' ' + (c.group || ''), q), label: c.label, icon: c.icon, kbd: c.kbd, group: 'Comandos' }));
      const ents = store.all().map((e) => ({ type: 'ent', e, s: score(e.label + ' ' + (e.search || '') + ' ' + ((store.kinds[e.kind] || {}).label || ''), q), label: e.label, icon: (store.kinds[e.kind] || {}).icon, sub: store.path(e.id).slice(0, -1).map((x) => store.get(x).label).join(' › '), group: 'Ir para', kind: e.kind }));
      const pick = (arr, n) => arr.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n);
      const E = pick(ents, q ? 9 : 5), C = pick(cmds, q ? 6 : 8);
      return q ? E.concat(C) : (store.recent().length ? E : E).concat(C);
    }
    function open() {
      if (host) return;
      opener = document.activeElement;
      const input = h('input', { type: 'text', class: 'pal-in', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'pal-list', 'aria-autocomplete': 'list', placeholder: 'Buscar itens e comandos', 'aria-label': 'Buscar itens e comandos', autocomplete: 'off', spellcheck: 'false' });
      const list = h('div', { class: 'pal-list', id: 'pal-list', role: 'listbox', 'aria-label': 'Resultados' });
      const box = h('div', { class: 'pal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Buscar e comandos' }, h('div', { class: 'pal-q', html: SEA.icon('search', 16) }, input), list);
      host = h('div', { class: 'pal-wrap' }, h('div', { class: 'pal-scrim', on: { click: close } }), box);
      document.body.appendChild(host);
      let res = [], idx = 0;
      const sp = new Spring(0, { k: 330, c: 28, on: (v) => { box.style.opacity = String(Math.min(1, v * 1.4)); box.style.transform = `translateY(${(1 - v) * -10}px) scale(${0.97 + 0.03 * v})`; } });
      sp.to(1);
      const paint = () => {
        res = items(input.value); idx = Math.min(idx, Math.max(0, res.length - 1));
        list.replaceChildren(); let g = null;
        res.forEach((r, i) => {
          if (r.group !== g) { g = r.group; list.appendChild(h('div', { class: 'pal-g', role: 'presentation' }, g === 'Ir para' && !input.value ? 'Itens' : g)); }
          const row = h('div', { class: 'pal-i' + (i === idx ? ' on' : ''), role: 'option', id: 'pal-' + i, 'aria-selected': String(i === idx) });
          row.innerHTML = `<span class="pal-ic ${r.kind ? 'k-' + esc(r.kind) : ''}">${SEA.icon(r.icon || 'dot', 15)}</span><span class="pal-l">${esc(r.label)}</span>${r.sub ? `<span class="pal-s">${esc(r.sub)}</span>` : ''}${r.kbd ? `<kbd>${esc(SEA.kbd(r.kbd))}</kbd>` : ''}`;
          row.addEventListener('pointermove', () => { if (idx !== i) { idx = i; mark(); } });
          row.addEventListener('click', () => choose(i));
          list.appendChild(row);
        });
        if (!res.length) list.appendChild(h('div', { class: 'pal-none' }, 'Nada encontrado'));
        input.setAttribute('aria-activedescendant', res.length ? 'pal-' + idx : '');
      };
      const mark = () => { list.querySelectorAll('.pal-i').forEach((n, i) => { n.classList.toggle('on', i === idx); n.setAttribute('aria-selected', String(i === idx)); }); const n = list.querySelector('.pal-i.on'); n && n.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', 'pal-' + idx); };
      const choose = (i) => { const r = res[i]; if (!r) return; close(true); if (r.type === 'ent') store.select(r.e.id, { source: 'palette' }); else commands.run(r.c.id); };
      input.addEventListener('input', () => { idx = 0; paint(); });
      host.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); idx = (idx + 1) % Math.max(1, res.length); mark(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); idx = (idx - 1 + res.length) % Math.max(1, res.length); mark(); }
        else if (e.key === 'Enter') { e.preventDefault(); choose(idx); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
        else if (e.key === 'Tab') { e.preventDefault(); }
      });
      paint(); input.focus();
      function close(skipFocus) {
        if (!host) return; const hh = host; host = null; hh.remove(); if (!skipFocus && opener && opener.focus) opener.focus();
      }
      api.close = close;
    }
    function close() {}
    const api = { open, close: () => api.close && api.close(), get isOpen() { return !!host; } };
    return api;
  };
})();
