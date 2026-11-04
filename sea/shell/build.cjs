#!/usr/bin/env node
/* Build: concatena as fontes modulares em UM HTML autocontido (executável via file://, sem rede).
 * Uso: node sea/shell/build.cjs  →  sea/shell/index.html
 * Fontes: src/styles/*.css, src/**.js (ordem explícita abaixo), src/assets/pages/*.jpg (inline como data URI),
 * src/demo/fixture.generated.json (gerado por tools/prepare_fixture.py a partir do PDF oficial). */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = __dirname, src = (p) => path.join(root, 'src', p);
const read = (p) => fs.readFileSync(src(p), 'utf8').replace(/\r\n/g, '\n');

const css = ['styles/shell.css', 'styles/demo.css'];
const js = [
  'core/util.js', 'core/icons.js', 'core/ui.js', 'core/layout.js', 'core/morph.js', 'core/actionbar.js', 'core/explorer.js', 'core/host.js',
  'core/inspector.js', 'core/topbar.js', 'core/palette.js', 'atmosphere/atmosphere.js', 'atmosphere/original-adapter.js', 'core/shell.js',
  'demo/fixture.js', 'demo/viewers/pdf.js', 'demo/viewers/table.js', 'demo/viewers/structure.js', 'demo/viewers/record.js', 'demo/inspect.js', 'demo/main.js',
];
const fx = JSON.parse(read('demo/fixture.generated.json'));
const pages = {};
fx.pages.forEach((p) => { pages[p.n] = 'data:image/jpeg;base64,' + fs.readFileSync(src('assets/' + p.img)).toString('base64'); });
const original = { vert: read('atmosphere/shaders/atmosphere.vert'), frag: read('atmosphere/shaders/atmosphere.frag'), tokens: JSON.parse(read('atmosphere/sea.tokens.json')).atmosphere };
const data = `window.__FIXTURE__=${JSON.stringify(fx)};window.__FIXTURE_PAGES__=${JSON.stringify(pages)};window.__SEA_ORIGINAL__=${JSON.stringify(original)};`;
const code = js.map((f) => `/* ---- ${f} ---- */\n${read(f)}`).join('\n').replace(/<\/script/gi, '<\\/script');
let html = read('shell.html');
const font = fs.readFileSync(src('assets/inter/inter-latin-wght-normal.woff2')).toString('base64');
html = html.replace('/*@css*/', () => `@font-face{font-family:"SEA Inter";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:100 900;font-display:block;}\n` + css.map(read).join('\n')).replace('/*@data*/', () => data).replace('/*@js*/', () => code);
const out = path.join(root, 'index.html');
fs.writeFileSync(out, html);
const sha = crypto.createHash('sha256').update(html).digest('hex');
console.log(`ok  ${path.relative(process.cwd(), out)}  ${(html.length / 1024).toFixed(0)} KiB  sha256 ${sha.slice(0, 16)}…`);
// verificação estática: nenhuma referência externa
const ext = html.match(/(?:src|href)\s*=\s*["']https?:\/\/[^"']+/gi) || [];
const imp = html.match(/@import|url\(\s*["']?https?:/gi) || [];
if (ext.length && ext.some((e) => !/ti\.com/.test(e)) || imp.length) { console.error('ERRO: referência externa encontrada', ext, imp); process.exit(1); }
