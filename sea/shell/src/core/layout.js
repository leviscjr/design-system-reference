/* PanelLayout — geometria do workspace: painéis retráteis/redimensionáveis, negociação de espaço,
 * modo foco, drawers/sheet no estreito. Todas as transições são springs retargetáveis (interrompíveis/reversíveis). */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const { h, clamp, Spring } = SEA.u;
  const RAIL = 40, MIN_EX = 200, MAX_EX = 440, MIN_IN = 260, MAX_IN = 560, CANVAS_MIN = 440, WIDE_IN = 460, GAP = 16 + 16, NARROW = 760;

  /* Função pura: decide a geometria a partir de sinais observáveis (largura, preferências, foco). Testável. */
  function resolve(W, p) {
    if (W < NARROW) return { mode: 'narrow' };
    let ex = p.focus ? 0 : p.exCollapsed ? RAIL : p.exW;
    let inn = p.focus ? 0 : p.inCollapsed ? RAIL : p.inWide ? Math.max(p.inW, WIDE_IN) : p.inW;
    const out = { mode: W < 1180 ? 'medium' : 'wide', autoEx: false, overlay: false };
    if (!p.focus) {
      const room = W - GAP - CANVAS_MIN;
      let over = ex + inn - room;
      if (over > 0 && inn > RAIL) { const d = Math.min(over, inn - MIN_IN); inn -= d; over -= d; }
      if (over > 0 && ex > RAIL) { const d = Math.min(over, ex - MIN_EX); ex -= d; over -= d; }
      if (over > 0 && ex > RAIL) { ex = RAIL; out.autoEx = true; over = ex + inn - room; }
      if (over > 0 && inn > RAIL) { out.overlay = true; out.inWidth = inn; inn = RAIL; }
    }
    out.ex = ex; out.in = inn;
    return out;
  }

  SEA.PanelLayout = function (o) {
    const { ws, main, ex, inn, cv, rzEx, rzIn, scrim } = o;
    const prefs = SEA.prefs, bus = SEA.u.emitter();
    const run = { focus: false, drawer: false, sheet: 'closed', wide: false, W: innerWidth, H: innerHeight };
    let res = null;
    const sEx = new Spring(0, { k: 260, c: 28, on: (v) => paintEx(v) });
    const sIn = new Spring(0, { k: 260, c: 28, on: (v) => paintIn(v) });
    const sDrawer = new Spring(0, { k: 300, c: 30, on: (v) => { ex.style.setProperty('--dx', `${(1 - v) * -108}%`); scrim.style.opacity = String(v * 0.55); scrim.style.visibility = v > 0.01 ? 'visible' : 'hidden'; } });
    const sSheet = new Spring(0, { k: 280, c: 30, on: (v) => { inn.style.setProperty('--sheet', `${v}px`); } });

    function paintEx(v) {
      if (res && res.mode === 'narrow') return;
      v = Math.max(0, v);   // overshoot da mola nunca vira largura negativa (CSS inválido derrubaria o grid)
      main.style.setProperty('--ex-col', `${v}px`); main.style.setProperty('--rz-ex', `${clamp(v, 0, 8)}px`);
      ex.classList.toggle('is-rail', v < 92); ex.classList.toggle('is-off', v < 4);
      if (res && res.mode !== 'narrow') ex.toggleAttribute('inert', v < 4);
    }
    function paintIn(v) {
      if (res && res.mode === 'narrow') return;
      v = Math.max(0, v);
      main.style.setProperty('--in-col', `${v}px`); main.style.setProperty('--rz-in', `${clamp(v, 0, 8)}px`);
      inn.classList.toggle('is-rail', (res && res.overlay ? res.inWidthShown : v) < 92); inn.classList.toggle('is-off', v < 4 && !(res && res.overlay));
      if (res && res.mode !== 'narrow') inn.toggleAttribute('inert', v < 4 && !(res && res.overlay));
    }

    function state() { return { focus: run.focus, exCollapsed: prefs.get('exCollapsed'), inCollapsed: prefs.get('inCollapsed'), exW: prefs.get('exW'), inW: prefs.get('inW'), inWide: run.wide }; }

    function apply(snap) {
      const W = run.W = ws.clientWidth || innerWidth;
      res = resolve(W, state());
      ws.dataset.mode = res.mode;
      ws.classList.toggle('is-focus', run.focus);
      if (res.mode === 'narrow') {
        main.style.setProperty('--ex-col', '0px'); main.style.setProperty('--in-col', '0px'); main.style.setProperty('--rz-ex', '0px'); main.style.setProperty('--rz-in', '0px');
        ex.classList.remove('is-rail', 'is-off'); inn.classList.remove('is-rail', 'is-off', 'ov');
        ex.toggleAttribute('inert', !run.drawer); inn.toggleAttribute('inert', run.sheet === 'closed');
        sDrawer.to(run.drawer ? 1 : 0, { snap }); sEx.set(0); sIn.set(0);
        const mh = main.clientHeight || innerHeight - 60;
        sSheet.to(run.sheet === 'open' ? Math.round(mh * 0.66) : run.sheet === 'peek' ? 64 : 0, { snap });
        inn.dataset.sheet = run.sheet;
      } else {
        sDrawer.set(0); sSheet.set(0); inn.removeAttribute('data-sheet');
        inn.classList.toggle('ov', res.overlay);
        res.inWidthShown = res.overlay ? res.inWidth : res.in;
        main.style.setProperty('--in-w', `${res.overlay ? res.inWidth : Math.max(res.in, RAIL)}px`);
        sEx.to(res.ex, { snap }); sIn.to(res.in, { snap });
        // overlay: o card cobre o canvas; a coluna só reserva o trilho
        if (res.overlay) inn.classList.remove('is-rail');
      }
      rzEx.hidden = rzIn.hidden = res.mode === 'narrow';
      rzEx.setAttribute('aria-valuenow', Math.round(res.ex || 0)); rzIn.setAttribute('aria-valuenow', Math.round(res.in || 0));
      bus.emit('change', api.info());
    }

    /* ---- redimensionamento por ponteiro e teclado (separator) ---- */
    function drag(handle, side) {
      let startX = 0, startW = 0, dragging = false;
      handle.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        dragging = true; startX = e.clientX; startW = side === 'ex' ? (res.ex > RAIL ? res.ex : prefs.get('exW')) : (res.overlay ? res.inWidth : res.in > RAIL ? res.in : prefs.get('inW'));
        handle.setPointerCapture(e.pointerId); ws.classList.add('is-resizing'); handle.classList.add('on');
        if (side === 'ex' && prefs.get('exCollapsed')) { prefs.set('exCollapsed', false); }
        if (side === 'in' && prefs.get('inCollapsed')) { prefs.set('inCollapsed', false); }
        if (run.focus) run.focus = false;
      });
      handle.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        if (side === 'ex') setW('ex', startW + dx); else setW('in', startW - dx);
      });
      const end = (e) => { if (!dragging) return; dragging = false; ws.classList.remove('is-resizing'); handle.classList.remove('on'); try { handle.releasePointerCapture(e.pointerId); } catch (_) { /* já liberado */ } };
      handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
      handle.addEventListener('dblclick', () => { setW(side, side === 'ex' ? SEA.prefs.defaults.exW : SEA.prefs.defaults.inW, true); });
      handle.addEventListener('keydown', (e) => {
        const cur = side === 'ex' ? prefs.get('exW') : prefs.get('inW');
        const step = e.shiftKey ? 48 : 16, sgn = side === 'ex' ? 1 : -1;
        let v = null;
        if (e.key === 'ArrowRight') v = cur + step * sgn; else if (e.key === 'ArrowLeft') v = cur - step * sgn;
        else if (e.key === 'Home') v = side === 'ex' ? MIN_EX : MIN_IN; else if (e.key === 'End') v = side === 'ex' ? MAX_EX : MAX_IN;
        else if (e.key === 'Enter') { side === 'ex' ? api.toggleEx() : api.toggleIn(); e.preventDefault(); return; }
        if (v != null) { e.preventDefault(); setW(side, v, true); }
      });
    }
    function setW(side, v, animate) {
      v = clamp(Math.round(v), side === 'ex' ? MIN_EX : MIN_IN, side === 'ex' ? MAX_EX : MAX_IN);
      if (side === 'in') run.wide = false;
      prefs.set(side === 'ex' ? 'exW' : 'inW', v);
      if (animate) apply(); else { apply(true); }
    }
    drag(rzEx, 'ex'); drag(rzIn, 'in');
    scrim.addEventListener('click', () => { api.closeDrawers(); });

    const ro = new ResizeObserver(() => { const w = ws.clientWidth; if (Math.abs(w - run.W) > 0.5 || run.H !== ws.clientHeight) { run.H = ws.clientHeight; apply(res && res.mode === 'narrow'); } });
    ro.observe(ws);

    const api = {
      apply, resolve,
      info: () => ({ mode: res ? res.mode : 'wide', ex: res && res.ex, in: res && res.in, overlay: !!(res && res.overlay), autoEx: !!(res && res.autoEx), focus: run.focus, exOpen: exOpen(), inOpen: inOpen(), sheet: run.sheet, drawer: run.drawer, wide: run.wide }),
      toggleEx(force) {
        if (res && res.mode === 'narrow') { run.drawer = force != null ? force : !run.drawer; if (run.drawer && run.sheet === 'open') run.sheet = 'peek'; return apply(); }
        const open = force != null ? force : !exOpen();
        if (run.focus) run.focus = false;
        prefs.set('exCollapsed', !open); apply();
      },
      toggleIn(force, user) {
        if (res && res.mode === 'narrow') { const open = force != null ? force : run.sheet !== 'open'; run.sheet = open ? 'open' : (user ? 'closed' : 'peek'); if (open) run.drawer = false; return apply(); }
        const open = force != null ? force : !inOpen();
        if (run.focus) run.focus = false;
        prefs.set('inCollapsed', !open); if (user !== false) prefs.set('inUserCollapsed', !open); apply();
      },
      toggleFocus(force) { run.focus = force != null ? force : !run.focus; if (run.focus) { run.drawer = false; if (run.sheet === 'open') run.sheet = 'peek'; } apply(); },
      toggleWide(force) { run.wide = force != null ? force : !run.wide; if (prefs.get('inCollapsed')) prefs.set('inCollapsed', false); apply(); },
      peek() { if (res && res.mode === 'narrow' && run.sheet === 'closed') { run.sheet = 'peek'; apply(); } },
      closeDrawers() { if (run.drawer || run.sheet === 'open') { run.drawer = false; if (run.sheet === 'open') run.sheet = 'peek'; apply(); } },
      reset() { prefs.reset(['exW', 'inW', 'exCollapsed', 'inCollapsed', 'inUserCollapsed']); run.focus = false; run.wide = false; run.drawer = false; apply(); },
      on: bus.on,
    };
    function exOpen() { return res && res.mode === 'narrow' ? run.drawer : !prefs.get('exCollapsed') && !run.focus; }
    function inOpen() { return res && res.mode === 'narrow' ? run.sheet === 'open' : !prefs.get('inCollapsed') && !run.focus; }
    return api;
  };
  SEA.PanelLayout.resolve = resolve;
  SEA.PanelLayout.limits = { RAIL, MIN_EX, MAX_EX, MIN_IN, MAX_IN, CANVAS_MIN, NARROW };
})();
