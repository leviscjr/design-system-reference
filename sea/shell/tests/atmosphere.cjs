// Validação pontual dos dois renderizadores do HTML autocontido.
const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = require('path');
const assert = require('assert');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.SEA_CHROME_PATH || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const fallback of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    if (fallback) await context.addInitScript(() => { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...args) { return /webgl/.test(type) ? null : get.call(this, type, ...args); }; });
    const page = await context.newPage();
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => window.SEA && SEA.app && document.querySelector('.atmo-cv'));
    const result = await page.evaluate((fb) => {
      const a = SEA.app.atmosphere, c = document.querySelector('.atmo-cv');
      const renderer = !!c.getContext(fb ? '2d' : 'webgl');
      a.setTheme('light'); a.setSpeed(0); const stopped = !a.running; a.ping(200, 120); a.destroy();
      return { renderer, stopped, removed: !document.querySelector('.atmo-cv') };
    }, fallback);
    assert(result.renderer && result.stopped && result.removed, JSON.stringify({ fallback, ...result }));
    console.log('PASS', fallback ? 'Canvas 2D sem WebGL' : 'Shader WebGL', JSON.stringify(result));
    await context.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
