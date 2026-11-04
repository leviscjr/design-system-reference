/* SeaAtmosphere — iluminação subaquática, feixes de luz, cáusticas, ondulações e partículas discretas.
 * Contrato (permite trocar a identidade): { mount(parent), setTheme('light'|'dark'), setSpeed(x), ping(x,y), destroy() }
 * Velocidade AMBIENTAL (setSpeed, referência 1.0 = entrega anterior; padrão 0.4) é independente
 * da velocidade INTERATIVA: ping() e todos os controles usam tempo real. */
(function () {
  const SEA = (window.SEA = window.SEA || {});

  const PAL = {
    dark: { top: '#0b2a40', mid: '#071c2e', bot: '#030c17', shaft: [110, 220, 235], shaftA: 0.075, caus: [70, 200, 220], causA: 0.07, part: [190, 240, 255], partA: 0.5, ring: [120, 230, 240], mode: 'lighter' },
    light: { top: '#eaf6fa', mid: '#d3e9f1', bot: '#b9d6e3', shaft: [255, 255, 255], shaftA: 0.42, caus: [255, 255, 255], causA: 0.32, part: [20, 95, 125], partA: 0.28, ring: [20, 120, 150], mode: 'source-over' },
  };

  SEA.SeaAtmosphere = function (opts) {
    opts = opts || {};
    const scale = 0.5;
    let cv, g, W = 0, H = 0, theme = 'dark', speed = SEA.motion.ambient, t = 18, raf = 0, last = 0, acc = 0, unsubscribe;
    const rings = [];
    const rnd = mulberry(7);
    const parts = Array.from({ length: 38 }, () => ({ x: rnd(), y: rnd(), s: 0.5 + rnd() * 1.4, v: 0.004 + rnd() * 0.01, ph: rnd() * 6.28, sw: 0.01 + rnd() * 0.03 }));
    const blobs = Array.from({ length: 11 }, (_, i) => ({ fx: 0.05 + rnd() * 0.08, fy: 0.04 + rnd() * 0.07, px: rnd() * 6.28, py: rnd() * 6.28, cx: rnd(), cy: 0.15 + rnd() * 0.75, r: 0.12 + rnd() * 0.16, a: 0.5 + rnd() * 0.5 }));

    function mulberry(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    function size() { W = Math.max(2, Math.round(innerWidth * scale)); H = Math.max(2, Math.round(innerHeight * scale)); cv.width = W; cv.height = H; draw(); }

    function draw() {
      if (!g) return;
      const P = PAL[theme], U = Math.min(W, H);
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, P.top); gr.addColorStop(0.5, P.mid); gr.addColorStop(1, P.bot);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = P.mode;
      // feixes de luz
      for (let i = 0; i < 4; i++) {
        const x0 = W * (0.1 + 0.24 * i) + Math.sin(t * 0.11 + i * 1.7) * W * 0.05, w = W * (0.07 + 0.03 * Math.sin(t * 0.07 + i)), sk = H * 0.45;
        const lg = g.createLinearGradient(x0, 0, x0 + sk, H);
        lg.addColorStop(0, rgba(P.shaft, P.shaftA * (0.7 + 0.3 * Math.sin(t * 0.2 + i * 2)))); lg.addColorStop(0.7, rgba(P.shaft, 0)); lg.addColorStop(1, rgba(P.shaft, 0));
        g.fillStyle = lg; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + w, 0); g.lineTo(x0 + w + sk, H); g.lineTo(x0 + sk - w * 0.3, H); g.closePath(); g.fill();
      }
      // cáusticas (manchas de luz em deriva lenta)
      blobs.forEach((b) => {
        const x = (b.cx + Math.sin(t * b.fx + b.px) * 0.18) * W, y = (b.cy + Math.cos(t * b.fy + b.py) * 0.12) * H, r = b.r * U * 1.6;
        const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgba(P.caus, P.causA * b.a)); rg.addColorStop(1, rgba(P.caus, 0));
        g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
      });
      // ondulações na superfície
      g.globalCompositeOperation = 'source-over'; g.lineWidth = 1.2;
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = rgba(P.shaft, theme === 'dark' ? 0.05 - k * 0.012 : 0.35 - k * 0.09); g.beginPath();
        for (let x = 0; x <= W; x += 6) { const y = H * (0.06 + k * 0.035) + Math.sin(x * 0.012 + t * (0.5 + k * 0.17) + k) * (3 + k * 1.5) + Math.sin(x * 0.027 - t * 0.33) * 1.5; x ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      }
      // partículas discretas
      g.globalCompositeOperation = P.mode === 'lighter' ? 'lighter' : 'source-over';
      parts.forEach((p) => {
        const y = (((p.y - t * p.v) % 1) + 1) % 1, x = p.x + Math.sin(t * p.sw * 6 + p.ph) * 0.012;
        const a = P.partA * (0.45 + 0.55 * Math.sin(t * 0.6 + p.ph)) * (0.4 + 0.6 * (1 - y));
        g.fillStyle = rgba(P.part, Math.max(0, a)); g.beginPath(); g.arc(x * W, y * H, p.s, 0, 6.283); g.fill();
      });
      // anéis interativos (tempo real, não escalados pela velocidade ambiental)
      const now = performance.now();
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i], k = (now - r.t0) / 900;
        if (k >= 1) { rings.splice(i, 1); continue; }
        const e = 1 - Math.pow(1 - k, 3);
        g.strokeStyle = rgba(P.ring, 0.28 * (1 - k)); g.lineWidth = 1.5; g.beginPath(); g.arc(r.x * scale, r.y * scale, 8 + e * 130, 0, 6.283); g.stroke();
      }
    }

    function loop(ts) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (ts - last) / 1000 || 0); last = ts; acc += dt;
      if (acc < 1 / 30) return; // 30 fps
      t += acc * speed; acc = 0; draw();
    }
    function start() { if (raf || document.hidden || SEA.motion.reduced || (speed <= 0 && !rings.length)) return; last = performance.now(); raf = requestAnimationFrame(loop); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    function visibility() { document.hidden ? stop() : start(); }

    return {
      mount(parent) {
        cv = document.createElement('canvas'); cv.className = 'atmo-cv'; cv.setAttribute('aria-hidden', 'true');
        parent.appendChild(cv); g = cv.getContext('2d');
        size(); addEventListener('resize', size);
        document.addEventListener('visibilitychange', visibility);
        unsubscribe = SEA.motion.bus.on('reduced', (r) => { r ? (stop(), draw()) : start(); });
        start();
      },
      setTheme(th) { theme = th === 'light' ? 'light' : 'dark'; draw(); },
      setSpeed(s) { speed = Math.max(0, s); speed > 0 ? start() : (stop(), draw()); },
      get speed() { return speed; },
      get time() { return t; },
      get running() { return !!raf; },
      ping(x, y) { if (SEA.motion.reduced || !g) return; rings.push({ x, y, t0: performance.now() }); if (!raf) { const f = () => { draw(); if (rings.length) requestAnimationFrame(f); }; requestAnimationFrame(f); } },
      destroy() { stop(); removeEventListener('resize', size); document.removeEventListener('visibilitychange', visibility); if (unsubscribe) unsubscribe(); rings.length = 0; cv && cv.remove(); g = null; },
    };
  };
})();
