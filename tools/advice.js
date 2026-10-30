// Browser checks of the advice line under each army: node tools/advice.js
// Needs the game served at http://localhost:8767/ (python -m http.server 8767). It borrows Playwright from ..\harrier-carrier-playwright-tests
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'harrier-carrier-playwright-tests', 'node_modules', 'playwright'));

let failed = 0;
function check(name, ok, detail) {
  if (ok) console.log('ok   ', name);
  else { failed++; console.log('FAIL ', name, '\n      ', detail); }
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 40 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8767/');
  await page.waitForTimeout(600);
  await page.click('#help [data-close]');

  // Sets up a day from a fresh game, redraws the page, then returns each army's advice text
  const advice = setup => page.evaluate(setup => {
    Game.restart();
    const st = Game.state;
    const sec = id => st.sectors.find(s => s.id === id);
    // Enough ports that the landing isn't the limit, unless the test says otherwise
    st.ports.cherbourg.cond = setup.cherbourg;
    st.nodes.stlo.cond = setup.stlo;
    sec('north').trains = setup.north;
    sec('centre').trains = setup.centre;
    sec('south').trains = setup.south;
    // Today's train shares, then the page
    Game.forecast = Sim.forecast(st);
    UI.update();
    return [...document.querySelectorAll('.c-advice')].map(a => a.textContent);
  }, setup);

  // Saint-Lô repaired and shared by both US armies: repairs can't help
  let a = await advice({ cherbourg: 100, stlo: 100, north: 3, centre: 6, south: 6 });
  const usFull = a[1] + ' | ' + a[2];
  check('Saint-Lô at 100% does not ask for station repairs', !usFull.includes('Station 🚉'), usFull);
  check('Saint-Lô at 100% says the shared track is full', usFull.includes('is shared by US First Army and US Third Army and is full'), usFull);

  // Saint-Lô damaged: repairs help
  a = await advice({ cherbourg: 100, stlo: 50, north: 3, centre: 6, south: 6 });
  const usDamaged = a[1] + ' | ' + a[2];
  check('Saint-Lô at 50% asks for station repairs', usDamaged.includes('Station 🚉') && usDamaged.includes('50%'), usDamaged);

  // The ports land too little for everyone: blame the ports, not the line
  a = await advice({ cherbourg: 0, stlo: 100, north: 4, centre: 6, south: 6 });
  const ports = a.join(' | ');
  check('too few trains landed blames the ports', ports.includes('the ports land only') && !ports.includes('Station 🚉'), ports);

  // Front out of fuel with ammo in hand: the green mix is the most fuel
  const rec = await page.evaluate(() => {
    Game.restart();
    const s = Game.state.sectors.find(x => x.id === 'south');
    s.stock.fuel = 0; s.depot.fuel = 0; s.stock.ammo = 500;
    Game.forecast = Sim.forecast(Game.state);
    UI.update();
    // US Third Army is the third row; its green (recommended) mix button
    const cell = document.querySelectorAll('[data-label="⛽ / 💥 Mix"]')[2];
    const green = cell && cell.querySelector('.rec');
    return green ? green.textContent : 'no green button';
  });
  check('no fuel at the front: green mix is the most fuel', rec.includes('4:1'), rec);

  // The petrol badge above the mixes: tons both ways, never a percentage
  const badge = await page.evaluate(() => {
    const read = mix => {
      Game.restart();
      // Stations repaired so every landed train gets through, then every army on the same mix
      Game.state.nodes.caen.cond = 100;
      Game.state.nodes.stlo.cond = 100;
      Game.state.sectors.forEach(s => { s.fuelMix = mix; });
      Game.forecast = Sim.forecast(Game.state);
      UI.update();
      return document.querySelector('#fuel-state').textContent;
    };
    return { short: read(80), spare: read(20) };
  });
  check('petrol badge shows tons short', /^⛽ [\d,]+ t short$/.test(badge.short), badge.short);
  check('petrol badge shows tons spare', /^⛽ [\d,]+ t spare ashore$/.test(badge.spare), badge.spare);

  // Trains short in a storm: the badge says the landings change and why
  const trainsBadge = await page.evaluate(() => {
    Game.restart();
    Game.state.storm = 3;
    Game.forecast = Sim.forecast(Game.state);
    UI.update();
    const e = document.querySelector('#free-trains');
    return { text: e.textContent, title: e.title };
  });
  check('trains short in a storm: badge says short and why', trainsBadge.text.endsWith('short') && trainsBadge.title.includes('Channel storm'), JSON.stringify(trainsBadge));

  check('no errors on the page', errors.length === 0, errors.join('\n'));
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
