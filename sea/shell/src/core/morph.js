/* Morph — transição de elemento compartilhado entre origem (linha, célula, nó) e destino (Inspector).
 * Um único "fantasma" por vez; uma nova chamada parte da geometria ATUAL do fantasma (interrompível).
 * O dado relevante (texto) permanece legível: origem e destino são clones empilhados com crossfade.
 * Em reduced-motion não há voo; o destino aparece direto. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, Spring, clamp } = SEA.u;
  const COPY = ['font', 'color', 'background', 'border', 'borderRadius', 'padding', 'letterSpacing', 'textTransform', 'lineHeight', 'fontVariantNumeric', 'boxShadow'];
  let ghost = null;

  function clone(el) {
    const c = el.cloneNode(true), cs = getComputedStyle(el);
    COPY.forEach((p) => { c.style[p] = cs[p]; });
    c.style.margin = '0'; c.style.position = 'absolute'; c.style.left = '0'; c.style.top = '0'; c.style.visibility = 'visible';
    c.style.whiteSpace = 'nowrap'; c.style.transformOrigin = '0 0'; c.style.pointerEvents = 'none'; c.style.width = 'auto'; c.removeAttribute('id'); c.removeAttribute('data-id'); c.removeAttribute('tabindex'); c.removeAttribute('data-tip'); c.querySelectorAll('[id],[data-id],[tabindex],[data-tip]').forEach((n) => { ['id', 'data-id', 'tabindex', 'data-tip'].forEach((a) => n.removeAttribute(a)); });
    return c;
  }
  function kill() {
    if (!ghost) return;
    ghost.sp.stop(); ghost.root.remove(); if (ghost.to) ghost.to.style.visibility = ''; ghost = null;
  }
  function rectNow() {
    if (!ghost) return null;
    const p = ghost.sp.v, a = ghost.from, b = ghost.to.getBoundingClientRect();
    return { x: a.x + (b.left - a.x) * p, y: a.y + (b.top - a.y) * p, w: a.w + (b.width - a.w) * p, h: a.h + (b.height - a.h) * p };
  }

  /* fromEl: elemento de origem (ou DOMRect); toEl: destino já atualizado no DOM */
  SEA.morph = function (fromEl, toEl) {
    if (!toEl || !fromEl || SEA.motion.reduced) { kill(); return Promise.resolve(); }
    const fr = fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : fromEl;
    if (!fr || (!fr.width && !fr.height) || !toEl.getBoundingClientRect().width) { kill(); return Promise.resolve(); }
    const prev = rectNow();
    const from = prev ? prev : { x: fr.left, y: fr.top, w: fr.width, h: fr.height };
    const srcClone = prev && ghost ? ghost.a.cloneNode(true) : fromEl.nodeType ? clone(fromEl) : null;
    kill();
    if (!srcClone) return Promise.resolve();
    const a = srcClone, b = clone(toEl);
    const root = h('div', { class: 'ghost', 'aria-hidden': 'true' }, a, b);
    document.body.appendChild(root);
    const aw = Math.max(1, a.offsetWidth), bw = Math.max(1, b.offsetWidth);
    toEl.style.visibility = 'hidden';
    const sp = new Spring(0, { k: 250, c: 25, eps: 0.002, on: (p) => paint(p) });
    ghost = { root, a, b, from, to: toEl, sp };
    function paint(p) {
      if (!ghost || ghost.root !== root) return;
      const t = toEl.getBoundingClientRect();
      const x = from.x + (t.left - from.x) * p, y = from.y + (t.top - from.y) * p, w = from.w + (t.width - from.w) * p;
      const sa = clamp(w / aw, 0.4, 3), sb = clamp(w / bw, 0.4, 3);
      root.style.transform = `translate(${x}px,${y}px)`;
      a.style.transform = `scale(${sa})`; b.style.transform = `scale(${sb})`;
      const k = clamp((p - 0.15) / 0.55, 0, 1);
      a.style.opacity = String(1 - k); b.style.opacity = String(k);
    }
    paint(0);
    return sp.to(1).then(() => { if (ghost && ghost.root === root) { toEl.style.visibility = ''; root.remove(); ghost = null; } });
  };
  SEA.morph.cancel = kill;
})();
