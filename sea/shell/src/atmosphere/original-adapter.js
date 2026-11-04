/* Adaptador experimental: shader SEA original e contrato do Workspace Shell.
 * O Canvas 2D preexistente continua sendo o fallback em falha de WebGL. */
(function () {
  const SEA = window.SEA, Fallback = SEA.SeaAtmosphere, source = window.__SEA_ORIGINAL__;
  SEA.SeaAtmosphere = function (opts) {
    let canvas, gl, program, buffer, parent, fallback, raf = 0, previous = 0, lastDraw = 0, time = 18, speed = SEA.motion.ambient;
    let theme = 'dark', width = 0, height = 0, pulse = null, disposed = false, unsubscribe, vertex, fragment;
    let pointer = { x: .5, y: .5, active: false }, samples = [];
    const locations = {}, trail = new Float32Array(48);
    for (let i = 0; i < 16; i++) trail[i * 3 + 2] = -1;
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    function start() { if (!raf && !disposed && !document.hidden && !SEA.motion.reduced && (speed > 0 || pulse)) { previous = performance.now(); raf = requestAnimationFrame(loop); } }
    function shader(type, code) {
      const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const reason = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error(reason); }
      return s;
    }
    function setup() {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
      if (!gl) throw new Error('WebGL indisponível');
      const derivatives = gl.getExtension('OES_standard_derivatives');
      vertex = shader(gl.VERTEX_SHADER, source.vert); fragment = shader(gl.FRAGMENT_SHADER, (derivatives ? '#define SEA_DERIVATIVES\n' : '') + source.frag);
      program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program); buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
      const pos = gl.getAttribLocation(program, 'aPos'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      ['uRes','uTime','uTheme','uIntensity','uDepth','uPointer','uPointerOn','uTrail','uPulse','uPulseColor','uPulseKind','uActivity','uReady','uTop','uMid','uDeep','uRayCol','uCauCol','uPartCol','uBioCol','uRays','uCaustics','uParticles','uBio','uContours','uFog','uLife','uCurrent'].forEach(n => { locations[n] = gl.getUniformLocation(program,n); });
      resize();
    }
    function resize() { if (!canvas || fallback) return; width = Math.max(2, Math.round(innerWidth * .4)); height = Math.max(2, Math.round(innerHeight * .4)); canvas.width = width; canvas.height = height; draw(); }
    function draw() {
      if (!gl || !program || disposed || gl.isContextLost()) return;
      const p = source.tokens[theme], u = locations;
      gl.viewport(0,0,width,height); gl.useProgram(program);
      gl.uniform2f(u.uRes,width,height); gl.uniform1f(u.uTime,time+40); gl.uniform1f(u.uTheme,theme === 'dark' ? 1 : 0);
      gl.uniform1f(u.uIntensity,1); gl.uniform1f(u.uDepth,0); gl.uniform2f(u.uPointer,pointer.x,pointer.y); gl.uniform1f(u.uPointerOn,pointer.active && !SEA.motion.reduced ? 1 : 0);
      for (let i=0;i<16;i++) { const s=samples[i]; trail[i*3]=s?s.x:0; trail[i*3+1]=s?s.y:0; trail[i*3+2]=s?s.age:-1; }
      gl.uniform3fv(u.uTrail,trail); gl.uniform4f(u.uPulse,pulse ? pulse.x : 0,pulse ? pulse.y : 0,pulse ? pulse.age : 0,pulse ? 1 : 0);
      gl.uniform3fv(u.uPulseColor,source.tokens.readiness.ready); gl.uniform1f(u.uPulseKind,0); gl.uniform1f(u.uActivity,0); gl.uniform1f(u.uReady,1);
      [['uTop','top'],['uMid','mid'],['uDeep','deep'],['uRayCol','rayColor'],['uCauCol','causticColor'],['uPartCol','particleColor'],['uBioCol','bioColor']].forEach(([a,b]) => gl.uniform3fv(u[a],p[b]));
      [['uRays','rays'],['uCaustics','caustics'],['uParticles','particles'],['uBio','bio'],['uContours','contours'],['uFog','fog'],['uLife','life'],['uCurrent','current']].forEach(([a,b]) => gl.uniform1f(u[a],p[b]));
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    function loop(now) { raf = 0; const dt = Math.min(.1,(now-previous)/1000); previous = now; time += dt*speed; samples.forEach(s=>{s.age+=dt}); samples=samples.filter(s=>s.age<3); if (pulse) { pulse.age += dt; if (pulse.age > 2) pulse = null; } if (now-lastDraw >= 33) { lastDraw = now; draw(); } start(); }
    function pointerMove(e) { if (SEA.motion.reduced || e.pointerType === 'touch') return; pointer = {x:e.clientX/innerWidth,y:1-e.clientY/innerHeight,active:true}; if (!samples.length || samples[0].age > .07) samples.unshift({x:pointer.x,y:pointer.y,age:0}); if (samples.length>16) samples.pop(); }
    function visibility() { document.hidden ? stop() : start(); }
    function reduced(r) { if (r) { stop(); pulse = null; draw(); } else start(); }
    function release() { if (!gl) return; if (buffer) gl.deleteBuffer(buffer); if (program) gl.deleteProgram(program); if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment); gl = program = buffer = vertex = fragment = null; }
    function switchToFallback() {
      stop(); removeEventListener('resize',resize); removeEventListener('pointermove',pointerMove); document.removeEventListener('visibilitychange',visibility); if (unsubscribe) unsubscribe(); release(); if (canvas) canvas.remove();
      fallback = Fallback(opts); fallback.mount(parent); fallback.setTheme(theme); fallback.setSpeed(speed);
    }
    return {
      mount(el) { parent = el; canvas = document.createElement('canvas'); canvas.className = 'atmo-cv'; canvas.setAttribute('aria-hidden','true'); parent.appendChild(canvas);
        try { setup(); canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); switchToFallback(); }, {once:true}); addEventListener('resize',resize); addEventListener('pointermove',pointerMove,{passive:true}); document.addEventListener('visibilitychange',visibility); unsubscribe = SEA.motion.bus.on('reduced',reduced); start(); }
        catch (_) { switchToFallback(); }
      },
      setTheme(value) { theme = value === 'light' ? 'light' : 'dark'; if (fallback) fallback.setTheme(theme); else draw(); },
      setSpeed(value) { speed = Math.max(0,value); if (fallback) fallback.setSpeed(speed); else { stop(); draw(); start(); } },
      get speed() { return fallback ? fallback.speed : speed; }, get time() { return fallback ? fallback.time : time; }, get running() { return fallback ? fallback.running : !!raf; },
      ping(x,y) { if (fallback) return fallback.ping(x,y); if (!SEA.motion.reduced) { pulse = { x:x/innerWidth, y:1-y/innerHeight, age:0 }; draw(); start(); } },
      destroy() { disposed = true; if (fallback) return fallback.destroy(); stop(); removeEventListener('resize',resize); removeEventListener('pointermove',pointerMove); document.removeEventListener('visibilitychange',visibility); if (unsubscribe) unsubscribe(); release(); if (canvas) canvas.remove(); },
    };
  };
})();
