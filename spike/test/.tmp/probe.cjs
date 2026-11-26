const H = require('./harness.cjs');
const { chromium } = require('playwright');
(async () => {
  const server = H.startBridgeServer({ port: H.BRIDGE_PORT, allowedOrigins: H.EXTENSION_ORIGINS, files: H.EXTENSION_FILES, version: 't', onLog: l => console.log('server:', l), onMessage: () => {} });
  await server.listening;
  const b = await chromium.launch();
  const page = await b.newPage();
  page.on('console', m => console.log('console:', m.text()));
  page.on('requestfailed', r => console.log('reqfailed:', r.url(), r.failure()?.errorText));
  await page.route('https://www.owlbear.rodeo/**', r => r.fulfill({ contentType: 'text/html', body: '<iframe src="http://127.0.0.1:27190/ext/index.html"></iframe>' }));
  await page.goto('https://www.owlbear.rodeo/room/x');
  await page.waitForTimeout(3000);
  console.log(page.frames().map(f => f.url()));
  await b.close(); await server.close();
})();
