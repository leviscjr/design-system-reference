/* Viewer: classificação estruturada em três faixas — OBSERVAÇÃO ≠ CANDIDATO ≠ ACEITO (invariante do Remora).
 * Arestas são relações de evidência (NÃO hierarquia). Pan/zoom próprios (conteúdo espacial).
 * Mudar o estado de um nó move-o de faixa com transição CSS (interrompível). */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc, clamp, Spring } = SEA.u;
  const F = () => SEA.fixture;
  const NW = 252, NH = 58, LX = [24, 372, 720], RY = 76, TOP = 46;

  SEA.viewerStructure = {
    id: 'class', label: 'Classificação', icon: 'graph', interaction: 'pan-zoom',
    supports(ctx) {
      if (!ctx.scope || ctx.scope.id !== F().DOC) return { icon: 'graph', title: 'Sem classificação neste contexto', action: { label: 'Abrir datasheet', run: () => ctx.store.select(F().DOC, { source: 'canvas' }) } };
      return true;
    },
    create(host) {
      const { store } = host, FX = F();
      const order = ['obs:docid', 'obs:subject', 'obs:family', 'obs:models', 'obs:maker', 'cand:type', 'sup:ti', 'fam:xx555', FX.DOC, 'mod:NA555', 'mod:SA555', 'mod:SE555', 'mod:NE555'];
      const lane = (e) => (e.state === 'obs' ? 0 : e.state === 'acc' ? 2 : 1);
      const view = { x: 0, y: 0, k: 1 };
      let selId = null, fitted = false, W = 1000, H = 600, drag = null;
      const world = h('div', { class: 'st-world' });
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'st-edges'); svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = '<defs><marker id="stA" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 8 4 0 8z" fill="currentColor"/></marker></defs>';
      const heads = ['Observação', 'Candidato', 'Aceito'].map((t, i) => h('div', { class: 'st-lane', style: { transform: `translate(${LX[i]}px,12px)`, width: NW + 'px' } }, h('span', null, t)));
      const bands = [0, 1, 2].map((i) => h('div', { class: 'st-band', style: { transform: `translate(${LX[i] - 14}px,0)`, width: NW + 28 + 'px' } }));
      world.append(...bands, svg, ...heads);
      const nodes = new Map();
      const stage = h('div', { class: 'st-stage', tabindex: '0', role: 'application', 'aria-label': 'Classificação: observação, candidato, aceito. Setas movem o foco entre nós; Enter seleciona; + e − ajustam o zoom; 0 ajusta à tela.' }, world);
      const el = h('div', { class: 'stv' }, stage);

      const sx = new Spring(0, { k: 200, c: 27, on: (v) => { view.x = v; apply(); } }), sy = new Spring(0, { k: 200, c: 27, on: (v) => { view.y = v; apply(); } }), sk = new Spring(1, { k: 200, c: 27, on: (v) => { view.k = v; apply(); } });
      const stopAll = () => { sx.stop(); sy.stop(); sk.stop(); };
      function apply() { world.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.k})`; host.selectionChanged(); }
      function to(x, y, k, snap) { sx.to(x, { snap }); sy.to(y, { snap }); sk.to(k, { snap }); }
      function fit(snap) {
        const r = stage.getBoundingClientRect(); if (!r.width) return;
        const k = clamp(Math.min((r.width - 40) / W, (r.height - 40) / H, 1.25), 0.3, 1.25);
        to((r.width - W * k) / 2, Math.max(14, (r.height - H * k) / 2), k, snap);
      }
      function zoomAt(f, cx, cy) {
        stopAll(); const r = stage.getBoundingClientRect(), px = (cx ?? r.left + r.width / 2) - r.left, py = (cy ?? r.top + r.height / 2) - r.top;
        const nk = clamp(view.k * f, 0.3, 2.5), wx = (px - view.x) / view.k, wy = (py - view.y) / view.k;
        sk.set(nk); sx.set(px - wx * nk); sy.set(py - wy * nk);
      }
      stage.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX, e.clientY); }, { passive: false });
      stage.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.st-n') || e.button !== 0) return; stopAll();
        drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; stage.setPointerCapture(e.pointerId); stage.classList.add('grab');
      });
      stage.addEventListener('pointermove', (e) => { if (drag) { sx.set(drag.vx + e.clientX - drag.x); sy.set(drag.vy + e.clientY - drag.y); } });
      const end = () => { drag = null; stage.classList.remove('grab'); };
      stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
      stage.addEventListener('dblclick', (e) => { if (!e.target.closest('.st-n')) fit(); });
      stage.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const n = e.target.closest && e.target.closest('.st-n');
        if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAt(1.2); } else if (e.key === '-') { e.preventDefault(); zoomAt(1 / 1.2); } else if (e.key === '0') { e.preventDefault(); fit(); }
        else if (e.key.startsWith('Arrow')) {
          e.preventDefault();
          if (!n) { stopAll(); const d = e.shiftKey ? 80 : 32; if (e.key === 'ArrowLeft') sx.set(view.x + d); if (e.key === 'ArrowRight') sx.set(view.x - d); if (e.key === 'ArrowUp') sy.set(view.y + d); if (e.key === 'ArrowDown') sy.set(view.y - d); return; }
          const cur = pos.get(n.dataset.id); let best = null, bd = 1e9;
          pos.forEach((p, id) => { if (id === n.dataset.id) return; const dx = p.x - cur.x, dy = p.y - cur.y; const ok = e.key === 'ArrowRight' ? dx > 10 : e.key === 'ArrowLeft' ? dx < -10 : e.key === 'ArrowDown' ? dy > 10 && Math.abs(dx) < 10 : dy < -10 && Math.abs(dx) < 10; if (!ok) return; const d = Math.abs(dx) * (e.key.match(/Up|Down/) ? 4 : 1) + Math.abs(dy) * (e.key.match(/Left|Right/) ? 1 : 1); if (d < bd) { bd = d; best = id; } });
          if (best) nodes.get(best).focus();
        }
      });
      new ResizeObserver(() => { if (!fitted && stage.clientWidth) { fitted = true; fit(true); } }).observe(stage);

      const pos = new Map();
      function layout() {
        const members = order.filter((id) => store.has(id)), counts = [0, 0, 0]; pos.clear();
        members.forEach((id) => { const e = store.get(id), l = lane(e); pos.set(id, { x: LX[l], y: TOP + counts[l]++ * RY, l }); });
        const rowsMax = Math.max(...counts); H = TOP + rowsMax * RY + 12; W = LX[2] + NW + 24;
        world.style.width = W + 'px'; world.style.height = H + 'px'; svg.setAttribute('width', W); svg.setAttribute('height', H); bands.forEach((b) => { b.style.height = H + 'px'; });
        members.forEach((id) => {
          const e = store.get(id), p = pos.get(id);
          let n = nodes.get(id);
          if (!n) {
            n = h('button', { type: 'button', class: 'st-n', 'data-id': id }); nodes.set(id, n); world.appendChild(n);
            n.style.transform = `translate(${p.x}px,${p.y}px)`;
            n.addEventListener('click', () => host.select(id, { source: 'canvas', viewer: 'class', fromEl: n, morph: 'title' }));
          }
          n.style.transform = `translate(${p.x}px,${p.y}px)`; n.style.width = NW + 'px'; n.style.height = NH + 'px';
          const k = store.kinds[e.kind] || {}, sub = e.kind === 'observation' ? (e.data.evidence ? `${e.data.evidence.excerpt} · p. ${e.data.evidence.page}` : e.data.text) : e.kind === 'candidate' ? e.data.text : (e.meta || k.label);
          n.innerHTML = `<span class="st-i k-${esc(e.kind)}">${SEA.icon(k.icon, 15)}</span><span class="st-t"><b>${esc(e.label)}</b><i>${esc(sub || '')}</i></span>`;
          n.dataset.lane = p.l; n.setAttribute('aria-label', `${e.label}. ${k.label}. ${(store.states[e.state] || {}).label || ''}. Faixa ${['observação', 'candidato', 'aceito'][p.l]}`);
          if (e.state && e.state !== 'none') n.appendChild(SEA.stateChip(store, e.state, { dot: true }));
        });
        edges(); mark();
      }
      function edges() {
        svg.querySelectorAll('path.e, text').forEach((n) => n.remove());
        FX.REL.forEach(([a, b, kind]) => {
          const pa = pos.get(a), pb = pos.get(b); if (!pa || !pb) return;
          let d;
          if (pa.l === pb.l) { const x = pa.x + NW, y1 = pa.y + NH / 2, y2 = pb.y + NH / 2; d = `M${x},${y1} C${x + 54},${y1} ${x + 54},${y2} ${x},${y2}`; }
          else { const x1 = pa.x + NW, y1 = pa.y + NH / 2, x2 = pb.x, y2 = pb.y + NH / 2, m = (x2 - x1) * 0.5; d = `M${x1},${y1} C${x1 + m},${y1} ${x2 - m},${y2} ${x2},${y2}`; }
          const p = document.createElementNS(svg.namespaceURI, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'e ' + (kind === 'evidência' ? 'ev' : 'cl')); p.setAttribute('marker-end', 'url(#stA)'); p.dataset.a = a; p.dataset.b = b; svg.appendChild(p);
        });
      }
      function nodeFor(e) { if (nodes.has(e.id)) return e.id; const sc = store.get(e.id) && e.kind !== 'document' ? store.ancestors(e.id).find((a) => store.get(a).kind === 'document') : null; return sc || null; }
      function mark() {
        const e = store.selection && store.get(store.selection), nid = e && nodeFor(e); selId = nid;
        nodes.forEach((n, id) => { n.classList.toggle('sel', id === nid && nid === e.id); n.classList.toggle('ctx', id === nid && nid !== e.id); n.setAttribute('aria-pressed', String(id === nid && nid === e.id)); });
        svg.querySelectorAll('path.e').forEach((p) => p.classList.toggle('hi', !!nid && (p.dataset.a === nid || p.dataset.b === nid)));
      }
      function reveal(id) {
        const p = pos.get(id); if (!p) return; const r = stage.getBoundingClientRect();
        const x = view.x + p.x * view.k, y = view.y + p.y * view.k;
        if (x < 10 || y < 10 || x + NW * view.k > r.width - 10 || y + NH * view.k > r.height - 10) to(view.x + (r.width / 2 - (x + NW * view.k / 2)), view.y + (r.height / 2 - (y + NH * view.k / 2)), view.k);
      }

      return {
        el,
        update(ctx) {
          if (ctx.reason === 'state' || !nodes.size) layout(); else mark();
          if (ctx.reason === 'select' && selId && (store.lastOpt || {}).viewer !== 'class') reveal(selId);
        },
        onShow() { if (!fitted && stage.clientWidth) { fitted = true; fit(true); } layout(); },
        selectionRect() { const n = selId && nodes.get(selId); return n ? n.getBoundingClientRect() : null; },
        toolbar() { return [
          { id: 'zo', icon: 'zoom-out', label: 'Reduzir', kbd: '-', group: 'z', run: () => zoomAt(1 / 1.25) },
          { id: 'zi', icon: 'zoom-in', label: 'Ampliar', kbd: '+', group: 'z', run: () => zoomAt(1.25) },
          { id: 'fit', icon: 'fit', label: 'Ajustar à tela', kbd: '0', group: 'z', run: () => fit() },
        ]; },
      };
    },
  };
})();
