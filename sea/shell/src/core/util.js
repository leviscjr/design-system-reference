/* SEA Workspace Shell — util: DOM, emitter, motion flags, springs, prefs.
 * Sem dependências. Cada arquivo registra-se em window.SEA (concatenados pelo build). */
(function () {
  const SEA = (window.SEA = window.SEA || {});

  /* ---------- DOM ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'on') for (const ev in v) el.addEventListener(ev, v[ev]);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    const add = (c) => {
      if (c == null || c === false) return;
      if (Array.isArray(c)) c.forEach(add);
      else el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    };
    kids.forEach(add);
    return el;
  }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const raf2 = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

  function emitter() {
    const m = {};
    return {
      on(ev, fn) { (m[ev] = m[ev] || new Set()).add(fn); return () => m[ev].delete(fn); },
      emit(ev, ...a) { (m[ev] ? [...m[ev]] : []).forEach((f) => f(...a)); },
    };
  }

  /* ---------- Motion: ambiente e interação são independentes ---------- */
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const motion = (SEA.motion = {
    reduced: mq.matches,
    /* velocidade do ambiente relativa à referência anterior (1.0). Experimento: 0.4 */
    ambient: 0.4,
    bus: emitter(),
  });
  if (mq.addEventListener) mq.addEventListener('change', (e) => { motion.reduced = e.matches; motion.bus.emit('reduced', e.matches); });

  /* ---------- Springs: retargetáveis (preservam velocidade) e interrompíveis ---------- */
  const active = new Set();
  let rafId = 0, last = 0;
  function tick(t) {
    const dt = Math.min(0.066, (t - last) / 1000 || 0.016);   // em quadros lentos o tempo de parede segue próximo do real
    last = t;
    active.forEach((s) => { try { s.step(dt); } catch (e) { active.delete(s); console.error(e); } });
    rafId = active.size ? requestAnimationFrame(tick) : 0;
  }
  class Spring {
    constructor(v = 0, o = {}) { this.v = v; this.t = v; this.vel = 0; this.k = o.k || 230; this.c = o.c || 27; this.eps = o.eps || 0.04; this.on = o.on || null; this._res = null; }
    get running() { return active.has(this); }
    set(v) { this.v = this.t = v; this.vel = 0; active.delete(this); this._finish(); this.on && this.on(v); }
    to(t, o) {
      this.t = t;
      if (motion.reduced || (o && o.snap)) { this.set(t); return Promise.resolve(); }
      this._finish();
      active.add(this);
      if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(tick); }
      return new Promise((r) => { this._res = r; });
    }
    stop() { active.delete(this); this.vel = 0; this.t = this.v; this._finish(); }
    _finish() { if (this._res) { const r = this._res; this._res = null; r(); } }
    step(dt) {
      const n = Math.max(1, Math.ceil(dt / 0.008)), hh = dt / n;
      for (let i = 0; i < n; i++) { const a = -this.k * (this.v - this.t) - this.c * this.vel; this.vel += a * hh; this.v += this.vel * hh; }
      if (Math.abs(this.v - this.t) < this.eps && Math.abs(this.vel) < this.eps * 4) { this.v = this.t; this.vel = 0; active.delete(this); this.on && this.on(this.v); this._finish(); return; }
      this.on && this.on(this.v);
    }
  }

  /* ---------- Prefs persistentes (layout etc.) ---------- */
  const KEY = 't2u.sea.shell.v1';
  const defaults = {
    theme: null, density: 'compact', ambient: 'calm',
    exW: 320, inW: 340, exCollapsed: false, inCollapsed: false, inUserCollapsed: false,
    viewer: 'pdf', expanded: null, selection: null, sections: {}, pdfZoom: 0, follow: true, filters: [],
  };
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { stored = {}; }
  const data = Object.assign({}, defaults, stored);
  const bus = emitter();
  let saveT = 0;
  const prefs = (SEA.prefs = {
    get: (k) => data[k],
    set(k, v) {
      data[k] = v; bus.emit('change', k, v);
      clearTimeout(saveT);
      saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage indisponível */ } }, 120);
    },
    reset(keys) { keys.forEach((k) => prefs.set(k, defaults[k])); },
    on: bus.on,
    defaults,
  });

  Spring.busy = () => active.size;
  SEA.u = { $, $$, h, clamp, esc, norm, sleep, raf2, emitter, Spring };
})();
