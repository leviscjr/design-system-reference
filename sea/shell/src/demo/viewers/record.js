/* Viewer: registro estruturado (texto/JSON). Conteúdo textual: seleção e rolagem nativas, sem pan/zoom. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, esc } = SEA.u;

  function snapshot(store, e) {
    const o = { id: e.id, kind: e.kind, label: e.label, parent: e.parent || null, state: e.state || 'none' };
    if (e.meta) o.meta = e.meta;
    if (e.data) o.data = e.data;
    if (e.src) o.source = e.src;
    if (e.review && e.review.length) o.review = e.review;
    o._fixture = ['state', 'review'];
    return o;
  }
  function color(json) {
    return esc(json).replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, (m, s, colon, kw, n) => {
      if (s) return colon ? `<span class="j-k">${s}</span>${colon}` : `<span class="j-s">${s}</span>`;
      if (kw) return `<span class="j-b">${kw}</span>`; return `<span class="j-n">${n}</span>`;
    });
  }

  SEA.viewerRecord = {
    id: 'record', label: 'Registro', icon: 'code', interaction: 'text',
    supports: () => true,
    create(host) {
      const { store } = host; let wrap = false, text = '';
      const pre = h('pre', { class: 'rec', tabindex: '0', 'aria-label': 'Registro da entidade selecionada' });
      const el = h('div', { class: 'rec-wrap' }, pre);
      return {
        el,
        update(ctx) { text = JSON.stringify(snapshot(store, ctx.entity), null, 2); pre.innerHTML = color(text); },
        toolbar() { return [
          { id: 'cp', icon: 'copy', label: 'Copiar JSON', group: 'a', run: () => { navigator.clipboard && navigator.clipboard.writeText(text).then(() => SEA.toast('JSON copiado'), () => SEA.toast('Cópia indisponível')); } },
          { id: 'wr', icon: 'wrap', label: 'Quebra de linha', pressed: wrap, group: 'a', run: () => { wrap = !wrap; pre.classList.toggle('wrap', wrap); host.requestToolbar(); } },
        ]; },
      };
    },
  };
})();
