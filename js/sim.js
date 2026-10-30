// Beachhead: Normandy 1944. The rules. No drawing here, so it also runs headless (tools/balance.js)

const Sim = (() => {
  // Seeded random numbers, so a game can be replayed
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // Rail distance between two stations (straight line plus 15% for curves)
  function railKm(a, b) {
    const A = NODES[a], B = NODES[b];
    const dx = (B.lon - A.lon) * 111 * Math.cos((A.lat + B.lat) / 2 * Math.PI / 180), dy = (B.lat - A.lat) * 111;
    return Math.round(Math.hypot(dx, dy) * 1.15);
  }

  const linkKey = (a, b) => a + '|' + b;

  // Each sector's line with the distance of every station from the beaches
  const LINES = {};
  const LINKS = {};
  for (const s of SECTORS) {
    const kms = [0];
    for (let i = 1; i < s.line.length; i++) {
      const a = s.line[i - 1], b = s.line[i];
      const len = railKm(a, b);
      kms.push(kms[i - 1] + len);
      const key = linkKey(a, b);
      LINKS[key] = { key, a, b, len, cap: LINK_CAP[key] || LINK_CAP_DEFAULT };
    }
    LINES[s.id] = kms;
  }

  function newGame(seed, level) {
    seed = seed || (Date.now() % 1e9);
    level = DIFFICULTY[level] ? level : 'normal';
    const st = {
      seed, day: 1, rand: null, level, lastDay: DIFFICULTY[level].lastDay,
      nodes: {}, links: {}, sectors: [],
      reserves: [], queue: [], marching: [],
      bombersLost: 0,
      soviet: { pool: 10, buildup: null, lastTarget: null },
      storm: 0, ports: {}, bridges: [], redBall: null, restCond: 100, fuelFactor: 1,
      report: [], events: { attacks: [], raids: [] },
      intel: null, won: false, lost: false, wonDay: null,
    };
    for (const id in NODES) st.nodes[id] = { captured: id === 'beaches', everCaptured: id === 'beaches', cond: 100, day: 0 };
    for (const id in START_CAPTURED) Object.assign(st.nodes[id], { captured: true, everCaptured: true, cond: START_CAPTURED[id] });
    for (const key in LINKS) st.links[key] = { done: START_CONVERTED.includes(key) ? LINKS[key].len : 0 };
    for (const id in PORTS) {
      const P = PORTS[id];
      st.ports[id] = { cond: P.cond, taken: !P.takenWith, companies: id === 'cherbourg' ? 6 : 0, scheldt: P.scheldt ? 0 : 100 };
    }
    st.bridges = BRIDGES.map(b => Object.assign({}, b, { state: 'enemy', done: 0 }));
    for (const s of SECTORS) {
      const startKm = LINES[s.id][1] + 5;
      const sec = {
        id: s.id, posture: 'advance',
        trains: s.id === 'south' ? 5 : 4, fuelMix: 67, focus: 'balanced', trucks: 6, truckCond: TRUCK_START_COND, engineers: 6, bombers: s.id === 'north' ? 2 : 3,
        front: startKm, lastAdvance: 0, lastCapture: 1,
        forces: Object.assign({}, s.forces),
        depot: { fuel: 2500, ammo: 2000 }, stock: { fuel: 0, ammo: 0 },
        res: s.resistance,
        got: { trains: 0, tons: 0, trucked: 0 },
        status: '', limit: '',
      };
      const need = needs(sec, 'advance');
      sec.stock.fuel = need.fuel * 3;
      sec.stock.ammo = need.ammo * 3;
      st.sectors.push(sec);
    }
    st.rand = rng(seed);
    arrivals(st);
    st.report = ['1 August 1944. The breakout has begun. Everything still comes ashore over the beaches. Take Paris, Antwerp, Aachen and Metz.'];
    return st;
  }

  // Tons a day a sector's forces need
  function needs(sec, posture) {
    const n = { fuel: 0, ammo: 0 };
    for (const t of UNIT_ORDER) {
      const per = UNIT_TYPES[t].need[posture || sec.posture];
      n.fuel += per.fuel * sec.forces[t];
      n.ammo += per.ammo * sec.forces[t];
    }
    return n;
  }

  function power(sec, kind) {
    let p = 0;
    for (const t of UNIT_ORDER) p += UNIT_TYPES[t][kind] * sec.forces[t];
    return p;
  }

  // km a day the sector could make with full supply
  function limits(sec) {
    const mobility = Math.min(MAX_SPEED, BASE_SPEED + UNIT_ORDER.reduce((a, t) => a + UNIT_TYPES[t].speed * sec.forces[t], 0));
    const combat = COMBAT_SPEED * power(sec, 'attack') / Math.max(8, sec.res);
    return { mobility, combat };
  }

  function sectorDef(id) { return SECTORS.find(s => s.id === id); }

  // km from the beaches to the end of a sector's line (its objective)
  const lineEnd = id => LINES[id][LINES[id].length - 1];

  // Troop trains still to load: for one sector, or for every sector when none is given
  function troopTrains(st, sectorId) {
    const units = st.queue.filter(q => !sectorId || q.sector === sectorId);
    return units.reduce((a, q) => a + UNIT_TYPES[q.type].trains - q.loaded, 0);
  }

  // The first bridge on a link that trains can't cross yet (still German-held or blown)
  function bridgeBlock(st, key) {
    return st.bridges.find(b => b.link === key && b.state !== 'intact' && b.state !== 'rebuilt');
  }

  // How far up the line trains can run: converted track to a captured, usable station
  function railheadIndex(st, sec) {
    const line = sectorDef(sec.id).line;
    let i = 0;
    while (i + 1 < line.length) {
      const key = linkKey(line[i], line[i + 1]);
      const n = st.nodes[line[i + 1]];
      if (st.links[key].done < LINKS[key].len || bridgeBlock(st, key) || !n.captured || n.cond <= 0) break;
      i++;
    }
    return i;
  }

  // Where trains can unload: the last usable station, plus any converted track beyond it towards the front
  function railhead(st, sec) {
    const i = railheadIndex(st, sec);
    const line = sectorDef(sec.id).line, kms = LINES[sec.id];
    let laid = 0;
    if (i + 1 < line.length) {
      const key = linkKey(line[i], line[i + 1]), br = bridgeBlock(st, key);
      laid = Math.min(st.links[key].done, Math.max(0, sec.front - kms[i]), br ? LINKS[key].len * br.at : Infinity);
    }
    return { index: i, node: line[i], stationKm: kms[i], laid, km: kms[i] + laid };
  }

  function gap(st, sec) { return Math.max(0, sec.front - railhead(st, sec).km); }

  // Tons a day the sector's trucks can carry from the railhead to the front
  // Worn columns carry less; the Red Ball army's trucks go twice as far, the others give up some of theirs
  function truckCapacity(st, sec) {
    const d = Math.max(20, gap(st, sec));
    const redBall = st.redBall === sec.id;
    const trips = Math.min(2, TRUCK_KM_PER_DAY * (redBall ? RED_BALL_SPEED : 1) / (2 * d));
    const order = TRUCK_MIN_LOAD + (1 - TRUCK_MIN_LOAD) * sec.truckCond / 100;
    const drain = st.redBall && !redBall ? RED_BALL_DRAIN : 1;
    return Math.round(sec.trucks * TRUCK_TONS * trips * order * drain);
  }

  // Moving columns in or out of an army: resting columns (unassigned) mix their condition in
  function moveTrucks(st, sec, delta) {
    if (delta > 0 && freePool(st, 'trucks', TRUCK_COLUMNS) <= 0) return;
    if (delta < 0 && sec.trucks <= 0) return;
    const free = freePool(st, 'trucks', TRUCK_COLUMNS);
    if (delta > 0) sec.truckCond = (sec.truckCond * sec.trucks + st.restCond) / (sec.trucks + 1);
    else st.restCond = (st.restCond * free + sec.truckCond) / (free + 1);
    sec.trucks += delta;
  }

  // Fuel landed against fuel asked for: if the mixes ask for more petrol than came ashore, every army gets a share
  function fuelPlan(st, got = allocateTrains(st)) {
    let asked = 0;
    for (const sec of st.sectors) {
      const supply = Math.max(0, got[sec.id] - requested(st, sec).troop);
      asked += supply * TRAIN_TONS * sec.fuelMix / 100;
    }
    const landed = landing(st).total * TRAIN_TONS * FUEL_SHARE;
    return { asked, landed, factor: asked > landed ? landed / asked : 1 };
  }

  // Trains each sector asks for today: supply trains plus troop trains queued for it
  function requested(st, sec) {
    return { supply: sec.trains, troop: troopTrains(st, sec.id) };
  }

  // Trainloads each port lands today: its size x its condition, the beaches cut by storms; nothing until taken (and the Scheldt cleared)
  function portTrains(st, id) {
    const P = PORTS[id], ps = st.ports[id];
    if (!ps.taken || ps.scheldt < 100) return 0;
    return P.trains * ps.cond / 100 * (P.beach && st.storm > 0 ? STORM.cut : 1);
  }

  function landing(st) {
    const ports = {};
    let total = 0;
    for (const id in PORTS) { ports[id] = portTrains(st, id); total += ports[id]; }
    return { ports, total: Math.round(total * 10) / 10 };
  }

  function trainsToday(st) { return Math.floor(landing(st).total + 1e-6); }

  // Where a port's trains join a sector's line: its own node if the line passes it, or a named junction
  const JOINS = { lehavre: { centre: 'paris' }, antwerp: { centre: 'liege' } };
  function joinIndex(port, sec) {
    const line = sectorDef(sec.id).line;
    const at = (JOINS[port] && JOINS[port][sec.id]) || PORTS[port].node;
    return line.indexOf(at);
  }

  // Share the landed trains out. Forward ports feed the sectors they reach first (a short haul), the beaches the rest;
  // then the track and stations between each port and each railhead cap what gets through
  function allocateTrains(st) {
    const left = {}, entries = [];
    for (const sec of st.sectors) {
      const r = requested(st, sec);
      left[sec.id] = r.supply + r.troop;
    }
    const pools = Object.keys(PORTS).filter(id => portTrains(st, id) > 0);
    // Forward ports first: the furthest along the lines
    const reach = id => Math.max(...st.sectors.map(sec => joinIndex(id, sec)));
    pools.sort((a, b) => reach(b) - reach(a));
    // The beaches and Cherbourg share one pool, as they land at the same place
    const groups = [];
    for (const id of pools) {
      const g = groups.find(g => PORTS[g.ids[0]].node === PORTS[id].node && !JOINS[id] && !JOINS[g.ids[0]]);
      if (g) { g.ids.push(id); g.cap += portTrains(st, id); } else groups.push({ ids: [id], cap: portTrains(st, id) });
    }
    for (const g of groups) {
      const port = g.ids[0];
      const users = st.sectors.filter(sec => {
        const j = joinIndex(port, sec);
        return j >= 0 && j <= railheadIndex(st, sec) && left[sec.id] > 1e-6;
      });
      const want = users.reduce((a, sec) => a + left[sec.id], 0);
      if (!want) continue;
      const share = Math.min(1, g.cap / want);
      for (const sec of users) {
        const amount = left[sec.id] * share;
        left[sec.id] -= amount;
        const line = sectorDef(sec.id).line, j = joinIndex(port, sec), rh = railheadIndex(st, sec);
        const res = [];
        if (JOINS[port] && JOINS[port][sec.id]) res.push('X' + port + '>' + sec.id);
        for (let i = j + 1; i <= rh; i++) { res.push('L' + linkKey(line[i - 1], line[i])); res.push('N' + line[i]); }
        entries.push({ sec: sec.id, ports: g.ids, amount, res });
      }
    }
    const cap = r => r[0] === 'L' ? LINKS[r.slice(1)].cap
      : r[0] === 'X' ? JUNCTION_CAP
      : NODES[r.slice(1)].cap * st.nodes[r.slice(1)].cond / 100;
    for (let pass = 0; pass < 4; pass++) {
      const load = {};
      for (const e of entries) for (const r of e.res) load[r] = (load[r] || 0) + e.amount;
      for (const r in load) {
        const c = cap(r);
        if (load[r] > c + 1e-6) for (const e of entries) if (e.res.includes(r)) e.amount *= c / load[r];
      }
    }
    const got = {}, from = {};
    for (const sec of st.sectors) { got[sec.id] = 0; from[sec.id] = []; }
    for (const e of entries) {
      got[e.sec] += e.amount;
      if (e.amount > 0.05) from[e.sec].push({ ports: e.ports, trains: e.amount });
    }
    got.from = from;
    return got;
  }

  // Forecast for the panel: what each sector would get if the day ended now
  function forecast(st) {
    const got = allocateTrains(st);
    const out = {};
    for (const sec of st.sectors) {
      const troop = requested(st, sec).troop;
      out[sec.id] = { trains: got[sec.id], supplyTrains: Math.max(0, got[sec.id] - troop), from: got.from[sec.id] };
    }
    return out;
  }

  function freePool(st, field, total) {
    return total - st.sectors.reduce((a, s) => a + s[field], 0);
  }

  // Whole trains still free. A unit part-way through loading still holds the rest of its trains,
  // which leaves a fraction over: round down, as you can only give out whole trains
  function freeTrains(st) {
    const free = trainsToday(st) - troopTrains(st) - st.sectors.reduce((a, s) => a + s.trains, 0);
    return Math.floor(free + 1e-6);
  }

  function arrivals(st) {
    for (const r of REINFORCEMENTS) if (r.day === st.day) st.reserves.push({ type: r.type, id: 'u' + st.day + Math.floor(st.rand() * 1e6) });
  }

  // Player orders: send a reserve unit east on the next trains
  function sendUnit(st, unitId, sectorId) {
    const i = st.reserves.findIndex(u => u.id === unitId);
    if (i < 0) return false;
    const u = st.reserves[i];
    if (freeTrains(st) < UNIT_TYPES[u.type].trains) return false;
    st.reserves.splice(i, 1);
    st.queue.push({ id: u.id, type: u.type, sector: sectorId, loaded: 0 });
    return true;
  }

  function cancelUnit(st, unitId) {
    const i = st.queue.findIndex(q => q.id === unitId);
    if (i < 0 || st.queue[i].loaded > 0) return;
    st.reserves.push({ id: st.queue[i].id, type: st.queue[i].type });
    st.queue.splice(i, 1);
  }

  // How weak a sector looks to the Germans
  function weakness(st, sec) {
    const n = needs(sec, 'hold');
    const daysAmmo = sec.stock.ammo / Math.max(1, n.ammo + 200);
    const neighbours = st.sectors.filter(s => s !== sec);
    const ahead = sec.front - neighbours.reduce((a, s) => a + s.front, 0) / neighbours.length;
    return (daysAmmo < 1 ? 3 : daysAmmo < 2 ? 1.5 : 0)
      + gap(st, sec) / 150
      + Math.max(0, ahead) / 120
      - power(sec, 'defend') / 15
      - (sec.posture === 'hold' ? 1 : 0)
      + st.rand() * 0.6;
  }

  const SECTOR_NAME = id => sectorDef(id).name;

  // One day passes
  function endDay(st) {
    if (st.won || st.lost) return;
    const R = st.rand;
    const rep = [];
    const ev = { attacks: [], raids: [] };
    const sov = st.soviet;

    // 1. German reserves grow and are sent to the front
    sov.pool += SOVIET_GROWTH + st.day * SOVIET_GROWTH_PER_DAY;
    let attack = null;
    if (sov.buildup) {
      sov.buildup.strength += sov.pool * 0.7;
      sov.pool *= 0.3;
      sov.buildup.days--;
      if (sov.buildup.days <= 0) { attack = sov.buildup; sov.buildup = null; }
    } else if (sov.pool >= 30 && R() < BUILDUP_CHANCE) {
      let best = null, bestW = -1e9;
      for (const sec of st.sectors) {
        if (sec.front >= lineEnd(sec.id)) continue;
        const w = weakness(st, sec);
        if (w > bestW) { bestW = w; best = sec; }
      }
      if (best) {
        sov.buildup = { sector: best.id, strength: sov.pool, days: 2 + Math.floor(R() * 2) };
        sov.pool = 0;
      }
    } else if (sov.pool >= 15) {
      // Stiffen the line, most where the Germans are moving fastest
      const fast = st.sectors.reduce((a, b) => (b.lastAdvance > a.lastAdvance ? b : a));
      fast.res += 6; sov.pool -= 6;
      for (const sec of st.sectors) sec.res += 2;
      sov.pool -= 6;
    }
    for (const sec of st.sectors) {
      sec.res += 0.6;
      if (lineEnd(sec.id) - sec.front < WEST_WALL_KM) sec.res += WEST_WALL_RES;
    }

    // 2. Bombers: fuel from the sector's depot, hit the German build-up or the line
    for (const sec of st.sectors) {
      let flying = 0;
      for (let g = 0; g < sec.bombers; g++) {
        if (sec.depot.fuel < BOMBER_FUEL) break;
        sec.depot.fuel -= BOMBER_FUEL;
        flying++;
      }
      if (!flying) continue;
      sec.res = Math.max(8, sec.res - flying * 2);
      if (sov.buildup && sov.buildup.sector === sec.id) {
        const hit = Math.min(sov.buildup.strength, flying * 6);
        sov.buildup.strength -= hit;
        rep.push(`✈️ ${SECTOR_NAME(sec.id)}: fighter-bombers caught German columns moving up.`);
      }
      for (let g = 0; g < flying; g++) {
        if (R() < BOMBER_LOSS && sec.bombers > 0) {
          sec.bombers--; st.bombersLost++;
          rep.push(`❌ ${SECTOR_NAME(sec.id)}: a bomber group was lost.`);
          break;
        }
      }
    }

    // 2b. The Channel and the ports: storms, autumn wear on the beaches, port companies clearing wrecked harbours
    if (st.storm > 0) st.storm--;
    else if (R() < STORM.chance + st.day * STORM.more) {
      st.storm = 2 + Math.floor(R() * 3);
      st.ports.beaches.cond = Math.max(20, st.ports.beaches.cond - 8);
      rep.push(`🌊 Channel storm: the beaches land a quarter of their supplies for about ${st.storm} days, and the Mulberry is damaged.`);
    }
    if (st.day >= BEACH_WEAR_DAY) st.ports.beaches.cond = Math.max(20, st.ports.beaches.cond - BEACH_WEAR * 100);
    for (const id in PORTS) {
      const P = PORTS[id], ps = st.ports[id];
      if (!ps.taken && P.takenWith && st.nodes[P.takenWith].captured) {
        ps.taken = true;
        rep.push(`⚓ ${P.name} taken: harbour ${ps.cond < 30 ? 'wrecked' : 'damaged'} (${Math.round(ps.cond)}%)${P.scheldt ? ', and the Scheldt estuary is still mined and held by the Germans' : ''}. Send port companies.`);
      }
      if (!ps.taken || !ps.companies) continue;
      let c = ps.companies;
      if (ps.scheldt < 100) {
        ps.scheldt = Math.min(100, ps.scheldt + c * SCHELDT_CLEAR);
        if (ps.scheldt >= 100) rep.push(`⚓ The Scheldt is clear: ships can reach ${P.name}.`);
        continue;
      }
      const before = ps.cond;
      ps.cond = Math.min(100, ps.cond + c * PORT_CLEAR);
      if (before < 100 && ps.cond >= 100) rep.push(`⚓ ${P.name} fully cleared: ${P.trains} trainloads a day.`);
      // A port at 100% needs no more work: its companies go back to the free pool
      if (ps.cond >= 100 && ps.scheldt >= 100 && ps.companies > 0) {
        rep.push(`⚓ ${ps.companies} port compan${ps.companies === 1 ? 'y' : 'ies'} freed from ${P.name}: it's at 100%.`);
        ps.companies = 0;
      }
    }
    // Clearing the Scheldt also takes fighting: the British & Canadians holding at Antwerp with ammo
    const brit = st.sectors.find(x => x.id === 'north');
    if (st.ports.antwerp.taken && st.ports.antwerp.scheldt < 100 && brit.posture === 'hold' && brit.stock.ammo >= needs(brit, 'advance').ammo) {
      st.ports.antwerp.scheldt = Math.min(100, st.ports.antwerp.scheldt + SCHELDT_HOLD);
      if (st.ports.antwerp.scheldt >= 100) rep.push('⚓ The British & Canadians have cleared the Scheldt: ships can reach Antwerp.');
    }

    // 3. Trains: troop trains first, the rest is supply. Fuel only as far as the ports landed it
    const got = allocateTrains(st);
    const fuel = fuelPlan(st, got);
    st.fuelFactor = fuel.factor;
    if (fuel.factor < 0.95) rep.push(`⛽ Fuel shortage: the armies asked for ${Math.round(fuel.asked).toLocaleString()} t of petrol, only ${Math.round(fuel.landed).toLocaleString()} t came ashore. The trains carried ammo instead.`);
    for (const sec of st.sectors) {
      let trains = got[sec.id];
      const mine = st.queue.filter(q => q.sector === sec.id);
      for (const q of mine) {
        // A unit can take several days to load if the line is busy
        const take = Math.min(trains, UNIT_TYPES[q.type].trains - q.loaded);
        q.loaded += take;
        trains -= take;
        if (q.loaded + 1e-6 >= UNIT_TYPES[q.type].trains) {
          st.queue.splice(st.queue.indexOf(q), 1);
          const g = gap(st, sec);
          const days = Math.max(1, Math.ceil(g / UNIT_TYPES[q.type].march));
          if (q.type === 'pz') sec.depot.fuel = Math.max(0, sec.depot.fuel - g * 1.2);
          st.marching.push({ id: q.id, type: q.type, sector: sec.id, day: st.day + days });
          rep.push(`🚂 ${SECTOR_NAME(sec.id)}: ${UNIT_TYPES[q.type].name} unloaded at ${NODES[railhead(st, sec).node].name}, ${days} day${days > 1 ? 's' : ''} to the front.`);
        }
      }
      const tons = Math.max(0, trains) * TRAIN_TONS;
      const fuelTons = tons * sec.fuelMix / 100 * fuel.factor;
      sec.depot.fuel += fuelTons;
      sec.depot.ammo += tons - fuelTons;
      sec.got = { trains: got[sec.id], tons: Math.round(tons), trucked: 0 };
    }

    // 4. German air raid on the fullest depot
    if (R() < AIR_RAID.chance) {
      const target = st.sectors.reduce((a, b) => (b.depot.fuel + b.depot.ammo > a.depot.fuel + a.depot.ammo ? b : a));
      if (target.depot.fuel + target.depot.ammo > AIR_RAID.minStock) {
        const rh = railhead(st, target);
        const lossF = target.depot.fuel * AIR_RAID.loss, lossA = target.depot.ammo * AIR_RAID.loss;
        target.depot.fuel -= lossF; target.depot.ammo -= lossA;
        if (rh.node !== 'beaches') st.nodes[rh.node].cond = Math.max(0, st.nodes[rh.node].cond - 20 - R() * 15);
        ev.raids.push(rh.node);
        rep.push(`💥 Air raid on ${NODES[rh.node].name}: ${Math.round(lossF + lossA).toLocaleString()} t of supplies burnt, station damaged.`);
      }
    }

    // 5. Trucks: railhead depot to the front, burning fuel on the way
    for (const sec of st.sectors) {
      // Trucks keep the front topped up to 3 days of advancing, even while it holds
      const n = needs(sec, 'advance');
      const d = Math.max(20, gap(st, sec));
      const burn = d * TRUCK_FUEL;
      const keep = sec.posture === 'hold' ? HOLD_STOCK_DAYS : STOCK_DAYS;
      let wf = Math.max(0, n.fuel * keep - sec.stock.fuel);
      let wa = Math.max(0, n.ammo * keep - sec.stock.ammo);
      if (attack && attack.sector === sec.id) wa += attack.strength * 4;
      wf = Math.min(wf, sec.depot.fuel / (1 + burn));
      wa = Math.min(wa, sec.depot.ammo);
      const cap = truckCapacity(st, sec);
      if (wf + wa > cap) { const f = cap / (wf + wa); wf *= f; wa *= f; }
      let fuelForBurn = (wf + wa) * burn;
      if (fuelForBurn > sec.depot.fuel - wf) {
        const f = Math.max(0, sec.depot.fuel - wf) / Math.max(1, fuelForBurn);
        wa *= f; fuelForBurn = (wf + wa) * burn;
      }
      sec.depot.fuel -= wf + fuelForBurn;
      sec.depot.ammo -= wa;
      sec.stock.fuel += wf;
      sec.stock.ammo += wa;
      sec.got.trucked = Math.round(wf + wa);
      // Wear: in proportion to how hard the columns worked today
      const use = cap > 0 ? Math.min(1, (wf + wa) / cap) : 0;
      const before = sec.truckCond;
      sec.truckCond = Math.max(5, sec.truckCond - use * TRUCK_WEAR * (st.redBall === sec.id ? RED_BALL_WEAR : 1));
      if (before >= 40 && sec.truckCond < 40) rep.push(`🔧 ${SECTOR_NAME(sec.id)}: trucks badly worn (${Math.round(sec.truckCond)}%). Rest some: take them off the army for a few days.`);
    }
    st.restCond = Math.min(100, st.restCond + TRUCK_REST);

    // 6. Fighting: German attack first, then the advance
    for (const sec of st.sectors) {
      const name = SECTOR_NAME(sec.id);
      let halted = false, slowed = false;
      if (attack && attack.sector === sec.id && attack.strength > 5) {
        const S = attack.strength;
        const ammoNeed = S * 8;
        const used = Math.min(sec.stock.ammo, ammoNeed);
        sec.stock.ammo -= used;
        const dug = sec.posture === 'hold' ? HOLD_DEFENCE : 1;
        const def = power(sec, 'defend') * 10 * (used / ammoNeed) * dug;
        ev.attacks.push(sec.id);
        if (def >= S) {
          slowed = true;
          rep.push(`🛡️ ${name}: German counterattack beaten off (${Math.round(used).toLocaleString()} t of ammo fired).`);
        } else {
          halted = true;
          const back = Math.round(clamp((S - def) / S * 35, 3, 40));
          const floor = railhead(st, sec).km + 5;
          sec.front = Math.max(floor, sec.front - back);
          sec.res += 5;
          rep.push(`⚠️ ${name}: German counterattack broke through. Pushed back ${back} km.`);
          if (S > def * 1.4) {
            const t = ['inf', 'art', 'pz'].find(t => sec.forces[t] > 1);
            if (t) { sec.forces[t]--; rep.push(`❌ ${name}: a ${UNIT_TYPES[t].name.toLowerCase()} was destroyed.`); }
          }
        }
      }
      const n = needs(sec);
      if (sec.posture === 'hold' || halted) {
        // Holding with ammo to spare: the guns soften up the Germans for the next push
        if (!halted && sec.stock.ammo >= n.ammo * 2) sec.res = Math.max(8, sec.res - HOLD_SOFTEN * (1 + 0.5 * sec.forces.art));
        sec.stock.fuel = Math.max(0, sec.stock.fuel - n.fuel);
        sec.stock.ammo = Math.max(0, sec.stock.ammo - n.ammo);
        sec.lastAdvance = 0;
        sec.status = halted ? 'Pushed back' : 'Holding';
        continue;
      }
      const end = lineEnd(sec.id);
      if (sec.front >= end) {
        sec.lastAdvance = 0; sec.status = 'Objective taken';
        const h = needs(sec, 'hold');
        sec.stock.fuel = Math.max(0, sec.stock.fuel - h.fuel);
        sec.stock.ammo = Math.max(0, sec.stock.ammo - h.ammo);
        continue;
      }
      const rF = sec.stock.fuel / Math.max(1, n.fuel), rA = sec.stock.ammo / Math.max(1, n.ammo);
      const r = clamp(Math.min(rF, rA), 0, 1);
      sec.stock.fuel -= n.fuel * r;
      sec.stock.ammo -= n.ammo * r;
      // Speed is the slowest of: how fast the units can move, how hard the Germans resist, and supply.
      // Short supply is wasted (units burn it but barely move); a well-stocked front pushes harder
      const lim = limits(sec);
      const push = r <= SHORT_SUPPLY ? 0 : (r - SHORT_SUPPLY) / (1 - SHORT_SUPPLY);
      const inHand = Math.min(sec.stock.fuel / Math.max(1, n.fuel), sec.stock.ammo / Math.max(1, n.ammo));
      const stocked = r >= 1 ? 1 + WELL_SUPPLIED * Math.min(4, inHand) : 1;
      let km = Math.min(lim.mobility, lim.combat) * push * stocked * (0.85 + R() * 0.3) * (slowed ? 0.5 : 1);
      sec.limit = r < 0.98 ? 'supply' : lim.combat < lim.mobility ? 'resistance' : 'mobility';
      km = Math.min(km, end - sec.front);
      sec.front += km;
      sec.lastAdvance = km;
      sec.res = Math.max(8, sec.res - km * 0.05);
      if (r < 0.98) {
        const short = rF < rA ? 'fuel' : 'ammo';
        sec.status = r < 0.1 ? `Stalled: out of ${short}` : `Slowed: short of ${short}`;
        if (r < 0.6) rep.push(`🔻 ${name}: ${sec.status.toLowerCase()} at the front (${Math.round(km)} km).`);
      } else sec.status = `Advancing ${Math.round(km)} km`;
    }

    // 7. Stations captured: the Germans wreck what they had time to
    for (const sec of st.sectors) {
      const line = sectorDef(sec.id).line, kms = LINES[sec.id];
      for (let i = 1; i < line.length; i++) {
        const node = st.nodes[line[i]];
        if (sec.front >= kms[i] && !node.captured) {
          node.captured = true;
          if (!node.everCaptured) {
            node.everCaptured = true;
            const days = st.day - sec.lastCapture;
            let cond = clamp(85 - days * 7 + (R() * 30 - 15), 5, 90);
            if (R() < STATION_BLOWN) cond = 0;
            node.cond = Math.round(cond);
            node.day = st.day;
            const what = cond === 0 ? 'station blown up' : cond < 35 ? 'badly wrecked' : cond < 65 ? 'damaged' : 'lightly damaged';
            rep.push(`🚩 ${NODES[line[i]].name} taken (${what}, ${node.cond}%).`);
          }
          sec.lastCapture = st.day;
        }
      }
    }
    // Pushed back past a station that trains don't reach yet: it is lost again
    for (const id in st.nodes) {
      if (id === 'beaches' || !st.nodes[id].captured) continue;
      let held = false;
      for (const sec of st.sectors) {
        const i = sectorDef(sec.id).line.indexOf(id);
        if (i < 0) continue;
        if (sec.front >= LINES[sec.id][i] || railheadIndex(st, sec) >= i) held = true;
      }
      if (!held) { st.nodes[id].captured = false; rep.push(`⚠️ ${NODES[id].name} lost.`); }
    }

    // 8. Engineers: repair badly hit stations, convert track, then tidy up
    for (const sec of st.sectors) {
      let b = sec.engineers * (sec.posture === 'hold' ? HOLD_ENGINEERS : 1);
      const line = sectorDef(sec.id).line, kms = LINES[sec.id];
      const rh = railheadIndex(st, sec);
      const top = Math.min(rh + 1, line.length - 1);
      const repair = (limit) => {
        for (let i = 1; i <= top && b > 0; i++) {
          const n = st.nodes[line[i]];
          if (!n.captured || n.cond >= limit) continue;
          const needB = (limit - n.cond) / REPAIR;
          const useB = Math.min(b, needB);
          n.cond = Math.min(100, n.cond + useB * REPAIR);
          b -= useB;
        }
      };
      // The player's focus: push the track forward, or keep stations running
      repair(ENGINEER_FOCUS[sec.focus].repairFirst);
      if (b > 0 && rh + 1 < line.length) {
        const key = linkKey(line[rh], line[rh + 1]);
        const link = st.links[key];
        const front = Math.min(LINKS[key].len, Math.max(...st.sectors
          .filter(s => sectorDef(s.id).line.includes(line[rh + 1]))
          .map(s => s.front - kms[rh])));
        for (let step = 0; step < 3 && b > 1e-6; step++) {
          const br = bridgeBlock(st, key);
          const reach = br ? Math.min(front, LINKS[key].len * br.at) : front;
          const useB = Math.min(b, Math.max(0, reach - link.done) / CONVERT_KM);
          link.done = Math.min(LINKS[key].len, link.done + useB * CONVERT_KM);
          b -= useB;
          // At a blown bridge: rebuild it
          if (br && br.state === 'blown' && link.done >= LINKS[key].len * br.at - 0.01 && b > 1e-6) {
            const w = Math.min(b, br.work - br.done);
            br.done += w; b -= w;
            if (br.done >= br.work - 1e-6) { br.state = 'rebuilt'; rep.push(`🌉 ${SECTOR_NAME(sec.id)}: ${br.river} bridge rebuilt, trains can cross.`); }
          } else break;
        }
      }
      if (b > 0) repair(100);
    }
    for (const sec of st.sectors) {
      const before = sec._rh;
      const rh = railhead(st, sec);
      if (before !== undefined && rh.index > before) rep.push(`🚂 ${SECTOR_NAME(sec.id)}: railhead moved up to ${NODES[rh.node].name}.`);
      if (before !== undefined && rh.index < before) rep.push(`⚠️ ${SECTOR_NAME(sec.id)}: railhead pulled back to ${NODES[rh.node].name}.`);
      sec._rh = rh.index;
    }

    // 9. Units reach the front
    for (const m of st.marching.slice()) {
      if (m.day <= st.day + 1) {
        const sec = st.sectors.find(s => s.id === m.sector);
        sec.forces[m.type]++;
        st.marching.splice(st.marching.indexOf(m), 1);
        rep.push(`✅ ${SECTOR_NAME(m.sector)}: ${UNIT_TYPES[m.type].name} reached the front.`);
      }
    }

    // Bridges the front has crossed: blown, unless it moved too fast for the demolition squads
    for (const br of st.bridges) {
      if (br.state !== 'enemy') continue;
      for (const sec of st.sectors) {
        const line = sectorDef(sec.id).line, [a1, b1] = br.link.split('|'), i = line.indexOf(a1);
        if (i < 0 || line[i + 1] !== b1) continue;
        if (sec.front < LINES[sec.id][i] + LINKS[br.link].len * br.at) continue;
        const fast = sec.lastAdvance >= FAST_ADVANCE_KM;
        br.state = R() < BRIDGE_INTACT * (fast ? 2 : 1) ? 'intact' : 'blown';
        rep.push(br.state === 'intact' ? `🌉 ${br.river} bridge taken intact by ${SECTOR_NAME(sec.id)}!` : `💥 ${br.river} bridge blown by the retreating Germans: ${br.work} battalion-days to rebuild.`);
        break;
      }
    }

    // 10. Intelligence: right most of the time
    st.intel = null;
    if (sov.buildup) {
      const right = R() < RECON_RIGHT;
      const others = st.sectors.filter(s => s.id !== sov.buildup.sector);
      const guess = right ? sov.buildup.sector : others[Math.floor(R() * others.length)].id;
      st.intel = { sector: guess, text: `🔍 Air recon: German forces massing opposite ${SECTOR_NAME(guess)}.` };
    }

    for (const sec of st.sectors) for (const k of ['fuel', 'ammo']) {
      sec.depot[k] = Math.max(0, sec.depot[k]);
      sec.stock[k] = Math.max(0, sec.stock[k]);
    }
    st.day++;
    arrivals(st);
    for (const r of REINFORCEMENTS) if (r.day === st.day) rep.push(`🆕 ${UNIT_TYPES[r.type].name} landed at the beaches, ready to send forward.`);

    if (OBJECTIVES.every(id => st.nodes[id].captured)) {
      st.won = true; st.wonDay = st.day - 1;
      rep.unshift(`🏆 All objectives taken on ${dateText(st.wonDay)}.`);
    } else if (st.day > st.lastDay) {
      st.lost = true;
      rep.unshift('⌛ Time is up. The offensive has run out of steam before reaching all the objectives.');
    }
    st.report = rep.length ? rep : ['A quiet day.'];
    st.events = ev;
  }

  function dateText(day) {
    const d = new Date(START_DATE);
    d.setDate(d.getDate() + day - 1);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  }

  return {
    landing, trainsToday, portTrains, bridgeBlock, moveTrucks, fuelPlan,
    LINES, LINKS, linkKey, lineEnd, troopTrains, newGame, endDay, needs, power, limits, railhead, railheadIndex, gap,
    truckCapacity, forecast, freePool, freeTrains, sendUnit, cancelUnit, dateText, sectorDef,
  };
})();

if (typeof module !== 'undefined') module.exports = Sim;
