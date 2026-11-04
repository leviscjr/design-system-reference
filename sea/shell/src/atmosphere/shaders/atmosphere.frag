/* SEA — shader único de atmosfera.
 * Todas as camadas (gradiente de profundidade, superfície, raios, caustics,
 * correntes, relevo/batimetria, partículas, vida, esteira do ponteiro e pulso
 * de prontidão) compartilham as mesmas primitivas de ruído e o mesmo campo de
 * deslocamento. Light/Dark não são dois shaders: são dois conjuntos de
 * parâmetros (sea.tokens.json → atmosphere) misturados pela CPU.
 * Implementação original do T2U/SEA (sem código de terceiros). */
#ifdef SEA_DERIVATIVES
#extension GL_OES_standard_derivatives : enable
#endif
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime;
uniform float uTheme;      // 0 light … 1 dark
uniform float uIntensity;  // 0 … 1.5
uniform float uDepth;      // 0 superfície … 1 profundo (navegação)
uniform vec2  uPointer;    // uv suavizado (0..1, y para cima)
uniform float uPointerOn;  // 0..1
uniform vec3  uTrail[16];  // (u, v, idade s) — idade < 0 = vazio
uniform vec4  uPulse;      // (u, v, idade s, força)
uniform vec3  uPulseColor;
uniform float uPulseKind;  // 0 ready/done · 1 erro (anel irregular)
uniform float uActivity;   // 0..1 processamento real em curso
uniform float uReady;      // 0..1 boot concluído

uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uDeep;
uniform vec3 uRayCol;
uniform vec3 uCauCol;
uniform vec3 uPartCol;
uniform vec3 uBioCol;
uniform float uRays;
uniform float uCaustics;
uniform float uParticles;
uniform float uBio;
uniform float uContours;
uniform float uFog;
uniform float uLife;
uniform float uCurrent;

/* ---------------- primitivas ---------------- */
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
  return s;
}
float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * noise(p); p = p * 2.07 + vec2(5.3, 11.7); a *= 0.5; }
  return s;
}

/* caustic: interferência de dois campos de ruído sobre domínio deformado */
float causticAt(vec2 q, float t, vec2 warp) {
  q += warp;
  float n1 = noise(q * 3.1 + vec2(t * 0.11, -t * 0.07));
  float n2 = noise(q * 4.25 + vec2(-t * 0.09, t * 0.06) + 3.7);
  float r = 1.0 - abs(n1 - n2) * 3.4;
  return pow(clamp(r, 0.0, 1.0), 7.0);
}

/* água-viva quase imperceptível (SDF) */
float jelly(vec2 q, float t, float seed) {
  float pulse = 0.5 + 0.5 * sin(t * 1.15 + seed);
  vec2 b = q;
  b.x *= 1.0 + 0.16 * pulse;
  b.y *= 1.0 - 0.08 * pulse;
  float bell = length(b * vec2(1.0, 1.32)) - 0.1;
  float upper = smoothstep(-0.045, 0.015, b.y);
  float body = smoothstep(0.02, -0.03, bell) * upper;
  float rim = exp(-pow(bell * 55.0, 2.0)) * upper;
  float tent = 0.0;
  if (q.y < 0.0 && q.y > -0.42) {
    float sway = 0.022 * sin(q.y * 16.0 - t * 1.6 + seed);
    float k = abs(fract((q.x + sway) * 26.0) - 0.5);
    tent = smoothstep(0.1, 0.0, k) * smoothstep(0.1, 0.0, abs(q.x)) * smoothstep(-0.42, -0.02, q.y);
  }
  return body * 0.32 + rim * 0.75 + tent * 0.35;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  float t = uTime;
  float I = uIntensity;
  float dark = uTheme;
  float boot = 0.35 + 0.65 * uReady;

  /* ---- esteira do ponteiro + pulso: um único campo de deslocamento ---- */
  vec2 disp = vec2(0.0);
  float wake = 0.0;
  for (int i = 0; i < 16; i++) {
    vec3 tr = uTrail[i];
    if (tr.z < 0.0) continue;
    vec2 d = p - vec2((tr.x - 0.5) * aspect, tr.y - 0.5);
    float r = length(d);
    float ring = tr.z * 0.2;
    float w = exp(-pow((r - ring) * 20.0, 2.0)) * exp(-tr.z * 1.7);
    disp += d / (r + 1e-4) * w * 0.011;
    wake += exp(-r * r * 140.0) * exp(-tr.z * 2.4);
  }
  disp *= uPointerOn;
  wake *= uPointerOn;

  float pulseRing = 0.0;
  if (uPulse.w > 0.0) {
    vec2 d = p - vec2((uPulse.x - 0.5) * aspect, uPulse.y - 0.5);
    float r = length(d);
    float ang = atan(d.y, d.x);
    r += uPulseKind * (noise(vec2(ang * 3.0, uPulse.z * 2.0)) - 0.5) * 0.09;
    float rad = uPulse.z * 0.62;
    pulseRing = exp(-pow((r - rad) * 7.5, 2.0)) * exp(-uPulse.z * 1.25) * uPulse.w;
    disp += d / (r + 1e-4) * pulseRing * 0.018;
  }

  vec2 pp = p + disp;

  /* ---- gradiente de profundidade ---- */
  float g = uv.y - uDepth * mix(0.38, 0.72, dark) + 0.04 * (fbm3(vec2(p.x * 1.3, t * 0.02)) - 0.5);
  vec3 col = mix(uDeep, uMid, smoothstep(-0.4, 0.62, g));
  col = mix(col, uTop, smoothstep(0.5, 1.08, g));
  col *= 1.0 - uDepth * mix(0.14, 0.5, dark);

  /* ---- superfície (janela de luz ondulada no topo) ---- */
  float surfY = uv.y + 0.018 * sin(pp.x * 5.5 + t * 0.55) + 0.03 * (fbm3(vec2(pp.x * 2.6, t * 0.12)) - 0.5);
  float surf = smoothstep(0.86, 1.02, surfY) * (1.0 - smoothstep(0.0, 0.35, uDepth));
  float glint = pow(fbm3(vec2(pp.x * 9.0 + t * 0.2, t * 0.35 + uv.y * 3.0)), 3.0) * surf;
  col += uTop * surf * mix(0.22, 0.06, dark) * I + glint * mix(0.5, 0.12, dark) * I;

  /* ---- raios volumétricos ---- */
  vec2 ro = vec2(-0.42 * aspect + (uPointer.x - 0.5) * 0.22 * uPointerOn, 0.95);
  vec2 rd = pp - ro;
  float ang = atan(rd.x, -rd.y);
  float s1 = noise(vec2(ang * 9.5 + t * 0.045, t * 0.06));
  float s2 = noise(vec2(ang * 22.0 - t * 0.03, t * 0.09 + 7.0));
  float shafts = smoothstep(0.42, 1.0, s1) * 0.75 + smoothstep(0.55, 1.0, s2) * 0.45;
  float fall = smoothstep(1.9, 0.05, length(rd)) * smoothstep(-0.65, 0.5, pp.y);
  float rays = shafts * fall * uRays * I * boot * (1.0 - uDepth * 0.92);
  col += uRayCol * rays * 0.42;

  /* ---- caustics (com leve separação cromática = refração) ---- */
  vec2 cq = pp * 1.55 + vec2(0.0, uDepth * 0.8);
  vec2 warp = (vec2(fbm3(cq * 1.25 + vec2(t * 0.06, -t * 0.04)),
                    fbm3(cq * 1.25 + vec2(-t * 0.05, t * 0.07) + 5.2)) - 0.5) * 1.15;
  float cr = causticAt(cq + 0.007, t, warp);
  float cg = causticAt(cq, t, warp);
  float cb = causticAt(cq - 0.007, t, warp);
  float cMask = smoothstep(-0.55, 0.45, pp.y) * (1.0 - uDepth * 0.85);
  col += uCauCol * vec3(cr, cg, cb) * cMask * uCaustics * I * boot * 0.55;

  /* ---- relevo submarino: batimetria em perspectiva ---- */
  float horizon = 0.5 - uDepth * 0.12;
  if (uv.y < horizon) {
    float z = 1.0 / (horizon - uv.y + 0.07);
    vec2 fq = vec2(p.x * z * 0.55, z * 0.42 + uDepth * 3.0 + t * 0.01);
    float h = fbm(fq * 0.9);
    float v = h * 16.0;
#ifdef SEA_DERIVATIVES
    float fw = max(fwidth(v), 1e-3);
#else
    float fw = 0.06 * z;
#endif
    float line = 1.0 - min(abs(fract(v - 0.5) - 0.5) / (fw * 1.25), 1.0);
    float fogZ = exp(-z * 0.22 * uFog);
    float amt = uContours * (0.35 + uDepth * 1.3) * I * fogZ * smoothstep(horizon, horizon - 0.18, uv.y);
    col = mix(col, col + uCauCol * 0.55 + (h - 0.5) * 0.05, line * amt * 0.5);
    col += (h - 0.5) * 0.04 * amt;
  }

  /* ---- correntes: rastros horizontais lentos (aceleram com processamento real) ---- */
  float flow = t * (0.05 + uActivity * 0.22) * (0.6 + uCurrent);
  float st = noise(vec2(pp.x * 1.1 - flow, pp.y * 15.0 + 2.0));
  st *= noise(vec2(pp.x * 0.35 - flow * 0.6, pp.y * 3.0));
  float streak = smoothstep(0.42, 0.62, st) * (uCurrent + uActivity * 0.5) * I;
  col += mix(uCauCol, uBioCol, dark) * streak * mix(0.05, 0.08, dark);

  /* ---- vida: águas-vivas distantes, quase imperceptíveis ---- */
  if (uLife > 0.0) {
    vec2 j1 = vec2(0.55 * aspect * sin(t * 0.021 + 1.3), -0.05 + 0.2 * sin(t * 0.017));
    vec2 j2 = vec2(-0.35 * aspect + 0.25 * sin(t * 0.013), 0.18 + 0.12 * cos(t * 0.019));
    float jl = jelly((pp - j1) / 0.55, t, 1.7) + jelly((pp - j2) / 0.38, t * 1.1, 4.2) * 0.8;
    col += mix(uTop, uBioCol, dark) * jl * uLife * I * 0.3;
  }

  /* ---- partículas suspensas (3 camadas de parallax) ---- */
  vec3 parts = vec3(0.0);
  vec2 ptr = vec2((uPointer.x - 0.5) * aspect, uPointer.y - 0.5);
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float scale = 6.0 + fl * 5.0;
    vec2 q = (pp + vec2(0.0, -uDepth * (0.3 + fl * 0.2))) * scale;
    q.y -= t * (0.06 + 0.035 * fl) * 2.0;
    q.x += sin(q.y * 0.21 + fl * 2.0) * 0.35 + t * 0.03 * (fl + 1.0);
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash(id + fl * 13.7);
    if (h > uParticles * 0.62) continue;
    vec2 off = (vec2(hash(id + 1.3), hash(id + 7.1)) - 0.5) * 0.62;
    off += vec2(sin(t * 0.7 + h * 30.0), cos(t * 0.5 + h * 20.0)) * 0.07;
    float d = length(f - off);
    float size = (0.035 + 0.06 * hash(id + 3.3)) * (1.0 - fl * 0.18);
    float tw = 0.55 + 0.45 * sin(t * (0.8 + h * 2.2) + h * 40.0);
    float core = smoothstep(size, 0.0, d);
    float halo = exp(-d * d / (size * size * 10.0)) * 0.28;
    vec2 wp = (id + 0.5 + off) / scale;
    float exc = exp(-dot(wp - ptr, wp - ptr) * 22.0) * uPointerOn;
    float spark = step(0.985, hash(id + 9.9)) * (0.5 + 0.5 * sin(t * 0.6 + h * 9.0));
    float b = (core + halo) * tw * (1.0 - fl * 0.25) * (1.0 + exc * 2.75 * mix(0.4, 1.0, dark) + spark * 2.0 * dark);
    parts += mix(uPartCol, uBioCol, dark * (0.55 + 0.45 * h)) * b;
  }
  col += parts * uParticles * I * mix(0.2, 0.34, dark) * boot;

  /* ---- bioluminescência: esteira do ponteiro (escuro) ---- */
  col += uBioCol * wake * uBio * I * 0.32;
  col += mix(uRayCol, uBioCol, dark) * wake * (1.0 - dark) * 0.06 * I;

  /* ---- pulso de prontidão ---- */
  col += uPulseColor * pulseRing * mix(0.22, 0.28, dark);
  col += uPulseColor * uPulse.w * exp(-uPulse.z * 1.6) * 0.035;

  /* ---- névoa e vinheta suave ---- */
  float vig = dot(p * vec2(0.75, 1.0), p * vec2(0.75, 1.0));
  col *= 1.0 - vig * mix(0.12, 0.42, dark) * uFog;

  /* ---- dither (anti-banding) ---- */
  col += (hash(gl_FragCoord.xy + fract(t) * 61.0) - 0.5) / 255.0;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
