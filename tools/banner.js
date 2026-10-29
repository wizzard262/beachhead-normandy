// Saves the harriercarrier.com home page banner: node tools/banner.js <folder to save into> [map look]
// Needs the game served at http://localhost:8767/ (python -m http.server 8767)
const fs = require('fs'), path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'harrier-carrier-playwright-tests', 'node_modules', 'playwright'));
(async () => {
  const out = process.argv[2] || '.';
  const look = process.argv[3] || '';          // a map look, e.g. printed (see THEMES in js/draw.js)
  const tag = look ? '_' + look : '';
  const browser = await chromium.launch({ headless: false, slowMo: 40 });
  const page = await browser.newPage({ viewport: { width: 1300, height: 600 } });
  await page.goto('http://localhost:8767/tools/banner.html' + (look ? '?map=' + look : ''));
  const urls = await page.evaluate(() => makeBanner());
  const save = (name, url) => fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64'));
  save(`beachhead_banner${tag}.webp`, urls.big);
  save(`beachhead_banner${tag}_1440.webp`, urls.small);
  await page.waitForTimeout(1500);
  await browser.close();
  console.log('saved to', out);
})();
