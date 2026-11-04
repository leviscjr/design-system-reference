/* ContextActionbar — ações próximas do contexto. Ícone primeiro, rótulo onde o ícone não basta,
 * agrupamento semântico, overflow automático e (variante flutuante) reposicionamento por sobreposição. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, Spring } = SEA.u;

  /* ação: { id, icon, label, kbd?, run, text?, tone?, group?, pressed?, disabled?, secondary? } */
  SEA.ContextActionbar = function (o) {
    o = o || {};
    const el = h('div', { class: 'ab ab-' + (o.variant || 'inline'), role: 'toolbar', 'aria-label': o.label || 'Ações' });
    const bg = h('div', { class: 'ab-bg', 'aria-hidden': 'true' });
    const row = h('div', { class: 'ab-row' });
    el.append(bg, row);
    let actions = [], maxW = 9999;

    function btnFor(a) {
      const b = SEA.btn({ icon: a.icon, label: a.label, kbd: a.kbd, text: a.text, disabled: a.disabled, pressed: a.pressed, on: () => a.run() });
      if (a.tone) b.classList.add('tone-' + a.tone);
      b.dataset.act = a.id; return b;
    }
    function render() {
      const prim = actions.filter((a) => !a.secondary), sec = actions.filter((a) => a.secondary);
      // largura estimada: ícone 32px, com texto ~ 32 + 7*chars, separador 10px
      const w = (a) => (a.text ? 40 + a.text.length * 6.6 : 32);
      let avail = maxW - 16 - (sec.length || true ? 34 : 0), used = 0; const shown = [], over = [];
      let lastG;
      prim.forEach((a) => { const need = w(a) + (lastG != null && a.group !== lastG ? 10 : 0); if (used + need <= avail) { shown.push(a); used += need; lastG = a.group; } else over.push(a); });
      const more = over.concat(sec);
      row.replaceChildren();
      const groups = []; let cur = null;
      shown.forEach((a) => { if (!cur || cur.g !== a.group) { cur = { g: a.group, el: h('div', { class: 'ab-g', role: 'group' }) }; groups.push(cur); row.appendChild(cur.el); } cur.el.appendChild(btnFor(a)); });
      if (more.length) {
        const g = h('div', { class: 'ab-g', role: 'group' });
        const mb = SEA.btn({ icon: 'more', label: 'Mais ações', expanded: false, on: () => SEA.menu(mb, more.map((a) => (a.sep ? { sep: true } : { label: a.label, icon: a.icon, kbd: a.kbd, disabled: a.disabled, run: a.run })), { align: 'end' }) });
        mb.setAttribute('aria-haspopup', 'menu'); g.appendChild(mb); row.appendChild(g); groups.push({ el: g });
      }
      el.hidden = !groups.length;
      requestAnimationFrame(() => paintBg(groups));
    }
    /* fundo em cápsulas por grupo — passa pelo filtro "gooey" e funde quando os grupos se aproximam */
    function paintBg(groups) {
      while (bg.children.length > groups.length) bg.lastChild.remove();
      while (bg.children.length < groups.length) bg.appendChild(h('i'));
      groups.forEach((g, i) => { const p = bg.children[i]; p.style.transform = `translateX(${g.el.offsetLeft}px)`; p.style.width = g.el.offsetWidth + 'px'; });
      bg.style.width = row.offsetWidth + 'px';
    }
    return {
      el,
      set(list) { actions = list || []; render(); },
      setMaxWidth(w) { if (Math.abs(w - maxW) > 8) { maxW = w; render(); } },
      refresh: render,
    };
  };

  /* Barra flutuante dentro do Canvas: base inferior; migra para o topo se cobrir a seleção (histerese). */
  SEA.FloatingActionbar = function (host, getActions) {
    const bar = SEA.ContextActionbar({ variant: 'float', label: 'Ações da seleção' });
    host.floatEl.appendChild(bar.el);
    let pos = 'bottom';
    const sy = new Spring(0, { k: 320, c: 30, on: (v) => { bar.el.style.setProperty('--ab-y', v + 'px'); } });
    function layout() {
      const body = host.body.getBoundingClientRect();
      bar.setMaxWidth(body.width - 32);
      if (bar.el.hidden || !body.width) return;
      const b = bar.el.getBoundingClientRect();
      const sel = host.selectionRect();
      const margin = 14, hh = b.height, ww = b.width;
      const left = body.left + (body.width - ww) / 2;
      const yBottom = b.top - sy.v, yTop = body.top + margin;   // posição natural = atual menos o deslocamento da mola
      const hit = (y) => sel && !(sel.right < left - 8 || sel.left > left + ww + 8 || sel.bottom < y - 8 || sel.top > y + hh + 8);
      // regra: rodapé sempre que não cobrir a seleção; senão topo; se ambos cobrem, mantém a posição atual
      let next = pos;
      if (!hit(yBottom)) next = 'bottom'; else if (!hit(yTop)) next = 'top';
      if (next !== pos) { pos = next; bar.el.dataset.pos = pos; }
      sy.to(pos === 'bottom' ? 0 : yTop - yBottom);
    }
    bar.el.dataset.pos = pos;
    return {
      bar, update() { bar.set(getActions()); requestAnimationFrame(layout); }, layout,
      get pos() { return pos; },
    };
  };
})();
