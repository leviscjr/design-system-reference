/* Viewer: datasheet PDF (páginas renderizadas do documento real + caixas de evidência).
 * Conteúdo naturalmente rolável: SEM pan forçado. Zoom por botões/Ctrl+roda, rolagem nativa, localização animada. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc, clamp, Spring } = SEA.u;
  const F = () => SEA.fixture;
  const evOf = (e) => (e && e.data && e.data.evidence) || null;

  function related(store, e) {
    if (e.kind === 'section') return store.children(e.id);
    if (e.kind === 'model') return F().entities.filter((x) => x.kind === 'parameter' && x.data.applies.includes(e.label)).map((x) => x.id);
    return [];
  }

  SEA.viewerPdf = {
    id: 'pdf', label: 'Datasheet', icon: 'file-text', interaction: 'scroll',
    locates: (ctx) => !!(ctx.entity && evOf(ctx.entity) && ctx.scope && ctx.scope.id === F().DOC),
    supports(ctx) {
      if (!ctx.scope) return { icon: 'file-text', title: 'Sem documento neste contexto', action: { label: 'Abrir datasheet', run: () => ctx.store.select(F().DOC, { source: 'canvas' }) } };
      if (ctx.scope.id !== F().DOC) return { icon: 'file-text', title: 'Sem páginas no fixture', action: { label: 'Abrir datasheet', run: () => ctx.store.select(F().DOC, { source: 'canvas' }) } };
      return true;
    },
    create(host) {
      const { store } = host, prefs = SEA.prefs, FX = F().FX;
      let zoom = prefs.get('pdfZoom') || 1, showHl = true, built = false, curPage = FX.pages[0].n, selId = null, lastCtx = null;
      const hlMap = new Map(), pageEls = new Map();
      const scroll = h('div', { class: 'pdf-scroll', tabindex: '0', role: 'document', 'aria-label': 'Páginas do datasheet' });
      const pagesEl = h('div', { class: 'pdf-pages' });
      scroll.appendChild(pagesEl);
      const el = h('div', { class: 'pdf' }, scroll);
      const pgLbl = h('span', { class: 'tb-lbl', 'aria-live': 'polite' }), zmLbl = h('span', { class: 'tb-lbl' });
      const sy = new Spring(0, { k: 190, c: 25, on: (v) => { scroll.scrollTop = v; } });
      const sx = new Spring(0, { k: 190, c: 25, on: (v) => { scroll.scrollLeft = v; } });
      ['wheel', 'pointerdown', 'touchstart'].forEach((ev) => scroll.addEventListener(ev, () => { sy.stop(); sx.stop(); }, { passive: true }));

      const fitW = () => Math.max(300, scroll.clientWidth - 40);
      function layout() { pagesEl.style.setProperty('--pw', Math.round(fitW() * zoom) + 'px'); zmLbl.textContent = Math.round(zoom * 100) + '%'; }
      function setZoom(z, anchorY) {
        z = clamp(z, 0.4, 3.2); if (Math.abs(z - zoom) < 0.001) return;
        const vy = anchorY != null ? anchorY : scroll.clientHeight / 2, ratio = (scroll.scrollTop + vy) / Math.max(1, scroll.scrollHeight);
        zoom = z; prefs.set('pdfZoom', z); layout();
        scroll.scrollTop = ratio * scroll.scrollHeight - vy; host.requestToolbar(); host.selectionChanged();
      }
      function fitPage() { const pg = FX.pages[0], ratio = pg.h / pg.w; setZoom((scroll.clientHeight - 40) / (fitW() * ratio)); }
      function gotoPage(n, smooth) {
        const p = pageEls.get(n); if (!p) return;
        const t = p.offsetTop - 14; smooth ? (sy.set(scroll.scrollTop), sy.to(t)) : (scroll.scrollTop = t);
      }
      function neighbor(dir) { const ns = FX.pages.map((p) => p.n), i = ns.indexOf(curPage); return ns[clamp(i + dir, 0, ns.length - 1)]; }

      function build() {
        built = true; let prev = null;
        FX.pages.forEach((pg) => {
          if (prev != null && pg.n - prev > 1) pagesEl.appendChild(h('div', { class: 'pdf-gap' }, pg.n - prev === 2 ? `p. ${prev + 1} fora do fixture` : `pp. ${prev + 1}–${pg.n - 1} fora do fixture`));
          const wrap = h('div', { class: 'pdf-page', 'data-page': pg.n, style: { aspectRatio: `${pg.w} / ${pg.h}` } });
          wrap.appendChild(h('img', { src: F().PAGES[pg.n], alt: `Datasheet ${FX.source.docId}, página ${pg.n}`, draggable: 'false' }));
          wrap.appendChild(h('span', { class: 'pdf-pn' }, 'p. ' + pg.n));
          F().entities.forEach((e) => {
            const ev = evOf(e); if (!ev || ev.page !== pg.n) return;
            const [x0, y0, x1, y1] = ev.box;
            const b = h('button', { type: 'button', class: 'hl k-' + e.kind, 'data-id': e.id, style: { left: x0 * 100 + '%', top: y0 * 100 + '%', width: (x1 - x0) * 100 + '%', height: (y1 - y0) * 100 + '%' }, 'aria-label': e.label + (e.meta ? ', ' + e.meta : '') + ', página ' + pg.n, 'data-tip': e.label, 'data-tip-side': 'top' });
            b.addEventListener('click', () => host.select(e.id, { source: 'canvas', viewer: 'pdf', fromEl: b, morph: e.kind === 'parameter' ? 'value' : 'title' }));
            wrap.appendChild(b); hlMap.set(e.id, b);
          });
          pagesEl.appendChild(wrap); pageEls.set(pg.n, wrap); prev = pg.n;
        });
        pagesEl.classList.toggle('no-hl', !showHl);
      }

      let tick = 0;
      scroll.addEventListener('scroll', () => {
        if (tick) return; tick = requestAnimationFrame(() => {
          tick = 0; const mid = scroll.scrollTop + scroll.clientHeight / 2; let best = curPage, bd = 1e9;
          pageEls.forEach((p, n) => { const d = Math.abs(p.offsetTop + p.offsetHeight / 2 - mid); if (d < bd) { bd = d; best = n; } });
          if (best !== curPage) { curPage = best; pgLbl.textContent = `p. ${curPage}`; host.requestToolbar(); }
          host.selectionChanged();
        });
      }, { passive: true });
      scroll.addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientY - scroll.getBoundingClientRect().top); } }, { passive: false });
      scroll.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(zoom * 1.15); } else if (e.key === '-') { e.preventDefault(); setZoom(zoom / 1.15); } else if (e.key === '0') { e.preventDefault(); setZoom(1); }
      });
      new ResizeObserver(() => { layout(); host.selectionChanged(); }).observe(scroll);

      function visibleEnough(r) { const s = scroll.getBoundingClientRect(); return r.top >= s.top + 24 && r.bottom <= s.bottom - 24 && r.left >= s.left && r.right <= s.right; }
      function reveal(node, force) {
        if (!node) return;
        const r = node.getBoundingClientRect(), s = scroll.getBoundingClientRect();
        if (!force && visibleEnough(r)) return;
        sy.set(scroll.scrollTop); sx.set(scroll.scrollLeft);
        sy.to(clamp(scroll.scrollTop + (r.top + r.height / 2) - (s.top + s.height / 2), 0, scroll.scrollHeight - scroll.clientHeight));
        if (r.left < s.left || r.right > s.right) sx.to(clamp(scroll.scrollLeft + (r.left + r.width / 2) - (s.left + s.width / 2), 0, scroll.scrollWidth - scroll.clientWidth));
      }
      function mark(ctx) {
        hlMap.forEach((n) => n.classList.remove('sel', 'grp'));
        const e = ctx.entity; selId = e.id;
        const t = hlMap.get(e.id); if (t) t.classList.add('sel');
        related(ctx.store, e).forEach((id) => { const n = hlMap.get(id); n && n.classList.add('grp'); });
        return t || (related(ctx.store, e).map((id) => hlMap.get(id)).filter(Boolean)[0]);
      }

      return {
        el,
        update(ctx) {
          lastCtx = ctx;
          const go = () => {
            layout(); const target = mark(ctx);
            const src = (store.lastOpt || {});
            if (ctx.reason === 'select' && src.viewer !== 'pdf' && target) requestAnimationFrame(() => reveal(target, false));
            pgLbl.textContent = `p. ${curPage}`; host.selectionChanged();
          };
          if (!built) {
            build(); layout();
            return Promise.all([...el.querySelectorAll('img')].map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()))).then(() => { go(); const t = hlMap.get(ctx.entity.id); if (t) requestAnimationFrame(() => reveal(t, true)); });
          }
          go();
        },
        onShow(ctx) { layout(); const t = mark(ctx); if (t) requestAnimationFrame(() => reveal(t, true)); pgLbl.textContent = `p. ${curPage}`; host.selectionChanged(); },
        locate(id) { const n = hlMap.get(id); if (n) { reveal(n, true); n.classList.remove('ping'); void n.offsetWidth; n.classList.add('ping'); } },
        selectionRect() { const n = selId && hlMap.get(selId); if (!n) return null; const r = n.getBoundingClientRect(), s = scroll.getBoundingClientRect(); return r.bottom < s.top || r.top > s.bottom ? null : r; },
        toolbar() {
          const ns = FX.pages.map((p) => p.n);
          return [
            { id: 'prev', icon: 'chevron-up', label: 'Página anterior', group: 'nav', disabled: curPage === ns[0], run: () => gotoPage(neighbor(-1), true) },
            { id: 'pg', el: pgLbl, group: 'nav' },
            { id: 'next', icon: 'chevron-down', label: 'Próxima página', group: 'nav', disabled: curPage === ns[ns.length - 1], run: () => gotoPage(neighbor(1), true) },
            { id: 'zo', icon: 'zoom-out', label: 'Reduzir', kbd: '-', group: 'zoom', run: () => setZoom(zoom / 1.2) },
            { id: 'zl', el: zmLbl, group: 'zoom' },
            { id: 'zi', icon: 'zoom-in', label: 'Ampliar', kbd: '+', group: 'zoom', run: () => setZoom(zoom * 1.2) },
            { id: 'fw', icon: 'fit-width', label: 'Ajustar à largura', kbd: '0', group: 'zoom', run: () => setZoom(1) },
            { id: 'fp', icon: 'fit', label: 'Ajustar à página', group: 'zoom', run: fitPage },
            { id: 'hl', icon: 'eye', label: 'Evidências', pressed: showHl, group: 'view', run: () => { showHl = !showHl; pagesEl.classList.toggle('no-hl', !showHl); host.requestToolbar(); } },
          ];
        },
      };
    },
  };
})();
