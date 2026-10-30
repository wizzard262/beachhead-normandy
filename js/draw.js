// Beachhead: the staff map. It is 1000 units wide and as tall as its box allows.
// Stations are placed for a clear game board rather than true geography

const Draw = (() => {
  const W = 1000;
  let H = 425;
  let canvas, ctx, paper, paperH = 0, scale = 1;

  // Room left round the stations for their labels
  const M = { left: 70, right: 80, top: 40, bottom: 48 };

  // Where each station sits: x from 0 (left) to 1 (right), y from 0 (top) to 1 (bottom)
  const LAYOUT = {
    beaches: [0.03, 0.24], caen: [0.14, 0.32], rouen: [0.33, 0.24], amiens: [0.50, 0.12], brussels: [0.74, 0.19], antwerp: [0.85, 0.05],
    stlo: [0.05, 0.44], alencon: [0.21, 0.62], paris: [0.45, 0.54], sedan: [0.73, 0.42], liege: [0.88, 0.30], aachen: [1.00, 0.24],
    avranches: [0.02, 0.68], lemans: [0.19, 0.92], chartres: [0.36, 0.84], reims: [0.62, 0.66], verdun: [0.80, 0.78], metz: [0.98, 0.90],
  };

  // Map position from a layout position
  const px = (fx, fy) => ({ x: M.left + fx * (W - M.left - M.right), y: M.top + fy * (H - M.top - M.bottom) });
  const P = {};
  function project() { for (const id in NODES) P[id] = px(...LAYOUT[id]); }
  project();

  // Point a given distance (km from the beaches) along a sector's line
  function along(sectorId, km) {
    const line = Sim.sectorDef(sectorId).line, kms = Sim.LINES[sectorId];
    for (let i = 1; i < line.length; i++) {
      if (km <= kms[i] || i === line.length - 1) {
        const f = Math.max(0, Math.min(1, (km - kms[i - 1]) / (kms[i] - kms[i - 1])));
        const a = P[line[i - 1]], b = P[line[i]];
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
      }
    }
    return P[line[0]];
  }

  function init(el) {
    canvas = el;
    ctx = canvas.getContext('2d');
    paperH = 0;
    resize();
  }

  // Fill the whole box (on narrow screens, or with no box, keep the 1000 x 425 shape)
  function resize() {
    const box = canvas.closest('.mapbox');
    const dpr = window.devicePixelRatio || 1;
    let w, h;
    if (box && !window.matchMedia('(max-width: 1300px)').matches && box.clientHeight > 100) {
      w = box.clientWidth; h = box.clientHeight;
    } else {
      w = box ? box.clientWidth : canvas.getBoundingClientRect().width; h = w * 425 / W;
    }
    // Not laid out yet (no width or height): keep the last size rather than draw on nothing
    if (!(w > 0) || !(h > 0)) return;
    H = Math.round(W * h / w);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    scale = canvas.width / W;
    if (H !== paperH) { project(); paper = makePaper(); paperH = H; }
  }

  // Seeded scatter so the paper, forests and marsh look the same every time
  function scatter(seed) {
    let a = seed;
    return () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  }

  // Looks for the map background. Preview one with ?map=<name> on the page address
  const THEMES = {
    paper:     { bg: ['#efe3c4', '#d9c79c'], noise: 'rgba(90,70,30,A)', grid: 'rgba(120,95,50,.16)', sea: '#c9d7d8', waves: 'rgba(70,110,150,.3)',
                 seaLabel: 'rgba(50,90,130,.75)', hedge: 'rgba(80,105,60,.35)', wood: 'blob', woodCol: 'rgba(80,105,60,A)', river: 'rgba(70,110,150,.7)',
                 label: 'rgba(60,80,60,.55)', border: 'rgba(110,60,110,.55)' },
    printed:   { bg: ['#f4f0e2', '#ebe5cf'], noise: null, grid: 'rgba(40,40,40,.28)', gridLabels: true, sea: '#a9cbe0', waves: null,
                 seaLabel: 'rgba(30,70,120,.9)', hedge: 'rgba(60,110,50,.45)', wood: 'trees', woodCol: '#a9cc8c', river: '#3d7fb8',
                 label: 'rgba(40,80,40,.8)', border: 'rgba(150,40,120,.7)', contours: 'rgba(150,100,50,.45)' },
    topo:      { bg: ['#f1e9d2', '#e2d4ae'], noise: 'rgba(90,70,30,A)', grid: 'rgba(120,95,50,.12)', sea: '#bcd3dc', waves: null,
                 seaLabel: 'rgba(50,90,130,.75)', hedge: 'rgba(80,105,60,.25)', wood: 'blob', woodCol: 'rgba(80,105,60,A)', river: 'rgba(60,110,160,.75)',
                 label: 'rgba(60,80,60,.55)', border: 'rgba(110,60,110,.55)', contours: 'rgba(140,90,40,.32)', many: true, shade: true },
    blueprint: { light: true, bg: ['#2a5f9a', '#1b4a80'], noise: null, grid: 'rgba(255,255,255,.12)', sea: '#173f6c', waves: 'rgba(255,255,255,.18)',
                 seaLabel: 'rgba(255,255,255,.7)', hedge: 'rgba(255,255,255,.18)', wood: 'outline', woodCol: 'rgba(255,255,255,.35)', river: 'rgba(200,225,255,.75)',
                 label: 'rgba(255,255,255,.65)', border: 'rgba(255,200,120,.7)' },
    recon:     { bg: ['#8f9184', '#76786d'], noise: 'rgba(30,30,30,A)', grain: true, grid: 'rgba(255,255,255,.08)', sea: '#4b5257', waves: 'rgba(255,255,255,.08)',
                 seaLabel: 'rgba(255,255,255,.75)', hedge: 'rgba(40,45,35,.35)', wood: 'blob', woodCol: 'rgba(35,40,30,A)', river: 'rgba(55,62,66,.9)',
                 label: 'rgba(255,255,255,.7)', border: 'rgba(255,255,255,.5)', fields: true },
  };
  // Ink for everything drawn on top of the map: dark on paper, light on the blueprint
  const INK = {
    ink: '#2b2418', soft: 'rgba(43,36,24,.45)', gap: '#efe3c4', bombed: 'rgba(120,40,30,.6)',
    townFill: '#f4ead2', enemyFill: '#e9c6b8', enemyInk: '#8a2a1e', barBg: 'rgba(40,30,15,.25)', hover: '#1a5fa8',
    front: 'rgba(150,35,25,.85)', enemyShade: 'rgba(170,50,35,.07)', enemyHatch: 'rgba(170,50,35,.12)', unitBody: '#4b5638', unitLight: '#e6dcc0',
  };
  const INK_LIGHT = Object.assign({}, INK, {
    ink: '#eef4ff', soft: 'rgba(238,244,255,.5)', gap: '#21548c', bombed: 'rgba(255,190,170,.8)',
    townFill: '#2a5f9a', enemyFill: '#5a3a5c', enemyInk: '#ffb4a6', barBg: 'rgba(255,255,255,.22)', hover: '#ffd166',
    front: 'rgba(255,95,80,.95)', enemyShade: 'rgba(255,90,70,.10)', enemyHatch: 'rgba(255,120,100,.16)', unitBody: '#e8f0fb', unitLight: '#2a5f9a',
  });
  let K = INK;
  // The game's own look is the blueprint; ?map=<name> shows another
  let THEME = THEMES.blueprint;
  try { const m = new URLSearchParams(location.search).get('map'); if (THEMES[m]) THEME = THEMES[m]; } catch (e) { /* default look */ }
  if (THEME.light) K = INK_LIGHT;

  // The paper, rivers, forests and marsh never change, so they are drawn once
  function makePaper() {
    const c = document.createElement('canvas');
    c.width = W * 2; c.height = H * 2;
    const g = c.getContext('2d');
    g.scale(2, 2);
    const T = THEME;
    const grad = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 700);
    grad.addColorStop(0, T.bg[0]); grad.addColorStop(1, T.bg[1]);
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    const r = scatter(7);
    // Aerial photo: a patchwork of fields
    if (T.fields) {
      for (let i = 0; i < 700; i++) {
        const v = 110 + Math.floor(r() * 50);
        g.fillStyle = `rgba(${v},${v + 4},${v - 8},.55)`;
        g.save(); g.translate(r() * W, r() * H); g.rotate((r() - 0.5) * 0.6);
        g.fillRect(0, 0, 14 + r() * 30, 10 + r() * 22); g.restore();
      }
    }
    if (T.noise) for (let i = 0; i < (T.grain ? 30000 : 9000); i++) {
      g.fillStyle = T.noise.replace('A', (r() * (T.grain ? 0.18 : 0.06)).toFixed(3));
      g.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5);
    }
    // Contour lines (and hill shading) on the printed and topographic looks
    if (T.contours) {
      const hills = [[0.30, 0.55], [0.58, 0.30], [0.86, 0.36], [0.70, 0.75], [0.15, 0.80], [0.95, 0.60], [0.40, 0.80]];
      for (const [hx, hy] of (T.many ? hills.concat([[0.12, 0.40], [0.50, 0.95], [0.78, 0.15]]) : hills)) {
        const c0 = px(hx, hy), rings = T.many ? 7 : 4;
        if (T.shade) { const sg = g.createRadialGradient(c0.x - 10, c0.y - 10, 5, c0.x, c0.y, 80); sg.addColorStop(0, 'rgba(120,80,30,.12)'); sg.addColorStop(1, 'rgba(120,80,30,0)'); g.fillStyle = sg; g.beginPath(); g.arc(c0.x, c0.y, 80, 0, Math.PI * 2); g.fill(); }
        g.strokeStyle = T.contours; g.lineWidth = 0.8;
        for (let k = 1; k <= rings; k++) {
          g.beginPath();
          for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.2) {
            const rr = k * 11 * (1 + 0.18 * Math.sin(a * 3 + hx * 9) + 0.1 * Math.cos(a * 5 + hy * 7));
            const x = c0.x + Math.cos(a) * rr * 1.5, y = c0.y + Math.sin(a) * rr;
            a ? g.lineTo(x, y) : g.moveTo(x, y);
          }
          g.closePath(); g.stroke();
        }
      }
    }
    // Map grid
    g.strokeStyle = T.grid; g.lineWidth = 0.7;
    for (let x = 50; x < W; x += 50) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 50; y < H; y += 50) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    if (T.gridLabels) {
      g.fillStyle = 'rgba(40,40,40,.6)'; g.font = '9px system-ui, sans-serif';
      for (let x = 50, n = 10; x < W; x += 50, n++) g.fillText(String(n), x + 2, H - 3);
      for (let y = 50, n = 30; y < H; y += 50, n--) g.fillText(String(n), 2, y - 2);
    }
    const pts = list => list.map(([fx, fy]) => px(fx, fy));
    const shape = (list, fill) => { const q = pts(list); g.fillStyle = fill; g.beginPath(); g.moveTo(q[0].x, q[0].y); for (const p of q) g.lineTo(p.x, p.y); g.closePath(); g.fill(); return q; };
    // The Channel, with the Cotentin peninsula reaching up to Cherbourg
    shape([[-0.2, -0.3], [0.62, -0.3], [0.56, -0.06], [0.46, 0.02], [0.30, 0.10], [0.24, 0.17], [0.16, 0.20], [0.08, 0.19], [0.02, 0.17],
           [-0.02, 0.12], [-0.03, 0.02], [-0.06, -0.02], [-0.12, 0.0], [-0.2, 0.3]], T.sea);
    g.strokeStyle = T.waves || 'transparent'; g.lineWidth = 1;
    for (let i = 0; i < (T.waves ? 90 : 0); i++) {
      const x = r() * W * 0.6, y = r() * px(0, 0.15).y;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - 3, x + 6, y); g.quadraticCurveTo(x + 9, y + 3, x + 12, y); g.stroke();
    }
    g.fillStyle = T.seaLabel; g.font = 'italic 15px Georgia, serif';
    const ch = px(0.22, 0.02);
    g.fillText('E n g l i s h   C h a n n e l', ch.x, ch.y);

    // Bocage: hedgerow country round Saint-Lô and Avranches
    g.strokeStyle = T.hedge; g.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const c0 = px(-0.04 + r() * 0.2, 0.30 + r() * 0.45);
      g.beginPath(); g.rect(c0.x, c0.y, 8 + r() * 10, 6 + r() * 7); g.stroke();
    }
    g.fillStyle = T.label; g.font = 'italic 11px Georgia, serif';
    const bo = px(0.08, 0.56);
    g.fillText('b o c a g e', bo.x, bo.y);
    // Forests: the Ardennes and a few others
    const forests = [[0.83, 0.30], [0.88, 0.40], [0.52, 0.32], [0.30, 0.46], [0.60, 0.86], [0.92, 0.62]];
    for (const [fx, fy] of forests) {
      const c0 = px(fx, fy);
      if (T.wood === 'trees') {
        // Printed-map woods: a flat green patch with little tree marks
        g.fillStyle = T.woodCol; g.beginPath(); g.ellipse(c0.x, c0.y, 52, 30, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(40,90,40,.55)';
        for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); const x = c0.x + Math.cos(a) * d * 46, y = c0.y + Math.sin(a) * d * 25; g.beginPath(); g.arc(x, y, 1.8, 0, Math.PI * 2); g.fill(); }
        continue;
      }
      for (let i = 0; i < 70; i++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 36;
        const x = c0.x + Math.cos(a) * d * 1.4, y = c0.y + Math.sin(a) * d * 0.8;
        if (T.wood === 'outline') { g.strokeStyle = T.woodCol; g.lineWidth = 0.8; g.beginPath(); g.arc(x, y, 3 + r() * 3, 0, Math.PI * 2); g.stroke(); continue; }
        g.fillStyle = T.woodCol.replace('A', (0.12 + r() * (T.grain ? 0.4 : 0.12)).toFixed(3));
        g.beginPath(); g.arc(x, y, 3 + r() * 3, 0, Math.PI * 2); g.fill();
      }
    }
    g.fillStyle = T.label; g.font = 'italic 11px Georgia, serif';
    const ar = px(0.85, 0.35);
    g.fillText('A r d e n n e s', ar.x - 30, ar.y);
    // Rivers, drawn to pass the right towns on this layout
    const rivers = {
      'Seine':   [[0.26, 0.14], [0.33, 0.27], [0.40, 0.38], [0.45, 0.57], [0.52, 0.70], [0.56, 0.90], [0.60, 1.15]],
      'Loire':   [[-0.08, 1.10], [0.10, 1.03], [0.28, 1.06], [0.46, 1.12]],
      'Somme':   [[0.40, -0.02], [0.47, 0.08], [0.52, 0.15], [0.62, 0.14]],
      'Marne':   [[0.46, 0.56], [0.55, 0.60], [0.63, 0.69], [0.70, 0.80]],
      'Meuse':   [[0.88, -0.12], [0.84, 0.10], [0.80, 0.25], [0.76, 0.43], [0.79, 0.62], [0.81, 0.80], [0.84, 1.12]],
      'Moselle': [[1.04, 0.55], [1.00, 0.72], [0.99, 0.92], [0.96, 1.12]],
      'Scheldt': [[0.66, -0.12], [0.74, -0.06], [0.80, -0.01], [0.85, 0.05]],
    };
    g.strokeStyle = T.river; g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = T.seaLabel; g.font = 'italic 11px Georgia, serif';
    for (const name in rivers) {
      const rp = pts(rivers[name]);
      g.lineWidth = name === 'Seine' || name === 'Meuse' ? 2.6 : 1.8;
      g.beginPath(); g.moveTo(rp[0].x, rp[0].y);
      for (let i = 1; i < rp.length - 1; i++) {
        const mx = (rp[i].x + rp[i + 1].x) / 2, my = (rp[i].y + rp[i + 1].y) / 2;
        g.quadraticCurveTo(rp[i].x, rp[i].y, mx, my);
      }
      g.lineTo(rp[rp.length - 1].x, rp[rp.length - 1].y); g.stroke();
      const m = rp[Math.max(1, Math.floor(rp.length / 3))];
      g.fillText(name, m.x + 6, m.y - 4);
    }
    // The German border
    const border = pts([[0.90, -0.12], [0.93, 0.12], [0.95, 0.36], [0.99, 0.60], [1.10, 0.80]]);
    g.strokeStyle = T.border; g.lineWidth = 2; g.setLineDash([10, 5, 2, 5]);
    g.beginPath(); g.moveTo(border[0].x, border[0].y); for (const p of border) g.lineTo(p.x, p.y); g.stroke();
    g.setLineDash([]);
    g.fillStyle = T.border; g.font = '10px "Special Elite", monospace';
    const bl = px(0.955, 0.40);
    g.save(); g.translate(bl.x, bl.y); g.rotate(1.35); g.fillText('German border', 0, 0); g.restore();

    return c;
  }

  // Emoji drawn on the canvas, in the colour emoji font of each system
  const emojiFont = px => `${px}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;

  // Condition bars: green, amber or red (c in %)
  const condInk = c => c > 66 ? '#3f7a3a' : c > 33 ? '#c47a1a' : '#a3291c';

  // Track: repaired part solid, bombed track dashed
  function drawLink(st, key) {
    const L = Sim.LINKS[key], a = P[L.a], b = P[L.b];
    const f = st.links[key].done / L.len;
    const mx = a.x + (b.x - a.x) * f, my = a.y + (b.y - a.y) * f;
    ctx.lineCap = 'butt';
    if (f < 1) {
      ctx.strokeStyle = K.bombed; ctx.lineWidth = 3; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (f > 0) {
      ctx.strokeStyle = K.ink; ctx.lineWidth = L.cap >= 7 ? 5 : 4;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke();
      // Railway sleepers
      ctx.strokeStyle = K.gap; ctx.lineWidth = 1.2;
      const len = Math.hypot(mx - a.x, my - a.y), ux = (mx - a.x) / (len || 1), uy = (my - a.y) / (len || 1);
      for (let d = 6; d < len; d += 9) {
        const x = a.x + ux * d, y = a.y + uy * d;
        ctx.beginPath(); ctx.moveTo(x - uy * 2.5, y + ux * 2.5); ctx.lineTo(x + uy * 2.5, y - ux * 2.5); ctx.stroke();
      }
      if (f < 1) {
        ctx.fillStyle = '#c47a1a';
        ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Port links (see PORT_LINKS): dashed until they carry trains, then solid like working track.
  // They bend round so they don't run along the rivers (the Seine between Rouen and Paris, the Meuse near Liège)
  const PORT_LINK_BENDS = { lehavre: [[0.47, 0.34]], antwerp: [[0.92, 0.15]] };
  function portLinkStyle(used) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = K.ink;
    ctx.globalAlpha = used ? 1 : 0.75;
    ctx.lineWidth = used ? 4 : 3;
    ctx.setLineDash(used ? [] : [9, 5]);
  }
  function drawPortLinks(st) {
    const fc = (window.Game && window.Game.forecast) || {};
    for (const L of PORT_LINKS) {
      // In use: today some of that army's trains come from this port
      const from = (fc[L.sector] && fc[L.sector].from) || [];
      const used = from.some(x => x.ports.includes(L.port) && x.trains > 0.05);
      // From the port's station, round the bend, to where it joins the army's line
      const route = [P[L.from], ...(PORT_LINK_BENDS[L.port] || []).map(b => px(...b)), P[L.at]];
      portLinkStyle(used);
      ctx.beginPath(); ctx.moveTo(route[0].x, route[0].y);
      for (const p of route.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
  }

  // Where each port's anchor sits on the map (Antwerp at its station)
  function portSpot(id) {
    if (id === 'cherbourg') return px(-0.035, 0.07);
    if (id === 'lehavre') return px(0.25, 0.165);
    if (id === 'antwerp') { const a = P.antwerp; return { x: a.x - 34, y: a.y + 4 }; }
    return null;
  }

  // Each port: an anchor, its name and a bar of how cleared it is; Le Havre's trains run to Rouen
  function drawPorts(st) {
    for (const id of ['cherbourg', 'lehavre', 'antwerp']) {
      const p = portSpot(id), ps = st.ports[id], PT = PORTS[id];
      // Le Havre's own line to Rouen, drawn like the port links
      if (id === 'lehavre') {
        portLinkStyle(Sim.portTrains(st, 'lehavre') > 0);
        ctx.beginPath(); ctx.moveTo(p.x + 6, p.y + 2); ctx.lineTo(P.rouen.x - 8, P.rouen.y - 2); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = ps.taken ? K.townFill : K.enemyFill; ctx.strokeStyle = ps.taken ? K.ink : K.enemyInk; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = emojiFont(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⚓', p.x, p.y + 0.5); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      if (id !== 'antwerp') { ctx.fillStyle = K.ink; ctx.font = 'bold 12px Georgia, serif'; ctx.fillText(PT.name, p.x + 12, p.y - 4); }
      if (!ps.taken) continue;
      // Cleared bar, and the Scheldt still to clear for Antwerp
      const c = ps.scheldt < 100 ? ps.scheldt : ps.cond;
      ctx.fillStyle = K.barBg; ctx.fillRect(p.x - 12, p.y + 12, 24, 4);
      ctx.fillStyle = ps.scheldt < 100 ? '#2f5d8a' : condInk(c);
      ctx.fillRect(p.x - 12, p.y + 12, 24 * c / 100, 4);
      if (ps.scheldt < 100) { ctx.fillStyle = '#2f5d8a'; ctx.font = 'bold 9px system-ui, sans-serif'; ctx.fillText('Scheldt mined', p.x - 30, p.y + 26); }
    }
  }

  // Where a bridge sits: part way along its link
  function bridgeSpot(br) {
    const L = Sim.LINKS[br.link], a = P[L.a], b = P[L.b];
    return { x: a.x + (b.x - a.x) * br.at, y: a.y + (b.y - a.y) * br.at, ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  // A bridge across the line: grey ahead of the front, red and broken when blown (with work done so far), black once working
  function drawBridges(st) {
    for (const br of st.bridges) {
      const p = bridgeSpot(br);
      const col = br.state === 'enemy' ? K.soft : br.state === 'blown' ? '#a3291c' : K.ink;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang);
      ctx.fillStyle = K.gap; ctx.fillRect(-10, -6, 20, 12);
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath();
      if (br.state === 'blown') { ctx.moveTo(-9, -5); ctx.lineTo(-2, -5); ctx.moveTo(2, -5); ctx.lineTo(9, -5); ctx.moveTo(-9, 5); ctx.lineTo(-2, 5); ctx.moveTo(2, 5); ctx.lineTo(9, 5); }
      else { ctx.moveTo(-9, -5); ctx.lineTo(9, -5); ctx.moveTo(-9, 5); ctx.lineTo(9, 5); }
      ctx.moveTo(-9, -5); ctx.lineTo(-12, -8); ctx.moveTo(9, -5); ctx.lineTo(12, -8); ctx.moveTo(-9, 5); ctx.lineTo(-12, 8); ctx.moveTo(9, 5); ctx.lineTo(12, 8);
      ctx.stroke();
      ctx.restore();
      if (br.state === 'blown') {
        // Rebuilding progress as a ring
        ctx.strokeStyle = K.barBg; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI * 2); ctx.stroke();
        if (br.done > 0) { ctx.strokeStyle = '#c47a1a'; ctx.beginPath(); ctx.arc(p.x, p.y, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * br.done / br.work); ctx.stroke(); }
        ctx.fillStyle = '#a3291c'; ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('✕', p.x, p.y + 0.5); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
    }
  }

  // Buildings for a small and a large town: [x, height, width, roof] from the town's centre
  const TOWN = {
    small: [[-8, 8, 6, 'gable'], [-1, 11, 6, 'flat'], [5, 7, 5, 'gable']],
    large: [[-12, 9, 6, 'gable'], [-6, 15, 5, 'flat'], [-1, 20, 4, 'spire'], [3, 12, 6, 'flat'], [9, 8, 5, 'gable']],
  };

  // Each station is a small or large town; the more it is damaged, the more fire and smoke
  function drawStation(st, id, hover) {
    const p = P[id], n = st.nodes[id], N = NODES[id];
    const objective = OBJECTIVES.includes(id);
    const big = N.cap >= 9;
    const base = p.y + 6;
    if (id === 'beaches') {
      ctx.fillStyle = '#e8c27a'; ctx.strokeStyle = K.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(p.x - 16, p.y - 8, 32, 14, 4) : ctx.rect(p.x - 16, p.y - 8, 32, 14); ctx.fill(); ctx.stroke();
      ctx.font = emojiFont(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⚓', p.x, p.y - 1); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = K.ink; ctx.font = 'bold 13px Georgia, serif';
      const [lx, ly] = labelOffset(id);
      ctx.fillText(N.name, p.x + lx, p.y + ly);
      return;
    }
    ctx.lineWidth = 1.2;
    ctx.fillStyle = n.captured ? K.townFill : K.enemyFill;
    ctx.strokeStyle = n.captured ? K.ink : K.enemyInk;
    for (const [bx, h, w, roof] of TOWN[big ? 'large' : 'small']) {
      const x = p.x + bx, top = base - h;
      ctx.beginPath();
      ctx.rect(x, top, w, h);
      if (roof === 'gable') { ctx.moveTo(x - 1, top); ctx.lineTo(x + w / 2, top - 4); ctx.lineTo(x + w + 1, top); }
      if (roof === 'spire') { ctx.moveTo(x, top); ctx.lineTo(x + w / 2, top - 7); ctx.lineTo(x + w, top); }
      ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(p.x - (big ? 14 : 10), base); ctx.lineTo(p.x + (big ? 15 : 11), base); ctx.stroke();
    if (n.captured && id !== 'beaches') {
      fire(p, base, 1 - n.cond / 100, big, id);
      // Condition bar
      ctx.fillStyle = K.barBg; ctx.fillRect(p.x - 12, base + 4, 24, 4);
      ctx.fillStyle = condInk(n.cond);
      ctx.fillRect(p.x - 12, base + 4, 24 * n.cond / 100, 4);
    }
    if (objective) {
      ctx.strokeStyle = n.captured ? '#3f7a3a' : '#a3291c'; ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(p.x, p.y - 2, big ? 20 : 16, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    if (hover) { ctx.strokeStyle = K.hover; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y - 2, big ? 24 : 20, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = K.ink;
    ctx.font = (big ? 'bold 13px' : '12px') + ' Georgia, serif';
    const [lx, ly] = labelOffset(id);
    ctx.fillText(N.name, p.x + lx, p.y + ly);
  }

  function labelOffset(id) {
    const big = NODES[id].cap >= 9;
    if (id === 'beaches') return [-34, -22];
    if (id === 'antwerp') return [-72, -10];   // name on the left, clear of the End day button
    return [big ? 17 : 13, -9];
  }

  // Flames and smoke over a damaged town: none when whole, more and bigger as damage grows
  function fire(p, base, dmg, big, id) {
    if (dmg < 0.08) return;
    let seed = 0;
    for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
    const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const spread = big ? 12 : 8;
    // Smoke first, so the flames sit in front of it
    const puffs = Math.round(dmg * 9);
    for (let k = 0; k < puffs; k++) {
      const up = 10 + k * (4 + dmg * 4);
      ctx.fillStyle = `rgba(60,55,50,${Math.max(0.08, 0.25 + dmg * 0.35 - k * 0.03)})`;
      ctx.beginPath(); ctx.arc(p.x + (r() - 0.3) * spread + k * 3, base - up - 6, 2.5 + k * 1.1 + dmg * 3, 0, Math.PI * 2); ctx.fill();
    }
    const flames = Math.max(1, Math.round(dmg * 7));
    for (let k = 0; k < flames; k++) {
      const x = p.x + (r() * 2 - 1) * spread, h = 4 + dmg * 16 * (0.6 + r() * 0.6), w = 2 + dmg * 3.5;
      const y = base - 4 - r() * (big ? 10 : 6);
      ctx.fillStyle = '#d9541e';
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w, y - h * 0.6, x, y - h); ctx.quadraticCurveTo(x + w, y - h * 0.6, x + w, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2b233';
      ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w / 2, y - h * 0.4, x, y - h * 0.6); ctx.quadraticCurveTo(x + w / 2, y - h * 0.4, x + w / 2, y); ctx.closePath(); ctx.fill();
    }
  }

  // Unit pictures facing east, on a 24 x 16 grid: a soldier, a tank and a field gun.
  // Each part is drawn in order in the dark body colour or the light paper colour
  const UNIT_ART = {
    inf: [
      ['body', 'M15.3 3.1L16.2 3.7L9.7 13.7L8.8 13.1Z'],
      ['body', 'M10 3.5C10.1 1.6 11.1 0.6 12.5 0.6S14.9 1.6 15 3.5Z'],
      ['body', 'M11.1 4.4a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0Z'],
      ['body', 'M10.4 6H14.6L14.1 10.4H10.9Z'],
      ['body', 'M10.9 10.2H12.3L11.8 15.6H10.3Z'],
      ['body', 'M12.7 10.2H14.1L14.8 15.6H13.3Z'],
    ],
    pz: [
      ['body', 'M3.5 10H20.5A2.5 2.5 0 0 1 20.5 15H3.5A2.5 2.5 0 0 1 3.5 10Z'],
      ['light', 'M3.7 12.5a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0-2.6 0ZM7.7 12.5a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0-2.6 0ZM11.7 12.5a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0-2.6 0ZM15.7 12.5a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0-2.6 0Z'],
      ['body', 'M2.5 9.6L4.6 6.8H19.6L22 9.6Z'],
      ['body', 'M8 6.8V4.6Q8 3.6 9 3.6H14.2Q15 3.6 15.4 4.6L16 6.8Z'],
      ['body', 'M15.2 4.5H23.6V5.7H15.4Z'],
    ],
    art: [
      ['body', 'M9.6 10.6L1 15L1.5 15.9L10.4 12Z'],
      ['body', 'M8.6 8.3L22.6 2.9L23.1 4.2L9.3 10.1Z'],
      ['body', 'M11.2 5.6L13.6 4.6L14.5 9.2L11.8 9.8Z'],
      ['body', 'M5.8 11.5a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0-8.4 0Z'],
      ['light', 'M7.2 11.5a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0-5.6 0Z'],
      ['body', 'M9 11.5a1 1 0 1 0 2 0a1 1 0 1 0-2 0Z'],
    ],
  };
  // On the map the unit pictures follow the ink; on the cream panels they stay olive (PANEL_UNIT_COLOURS)
  const UNIT_COLOURS = { get body() { return K.unitBody; }, get light() { return K.unitLight; } };
  const PANEL_UNIT_COLOURS = { body: '#4b5638', light: '#e6dcc0' };
  const paths = {};

  function unitPicture(type, x, y, w = 26, h = 17) {
    ctx.save(); ctx.translate(x, y); ctx.scale(w / 24, h / 16);
    for (const [part, d] of UNIT_ART[type]) {
      ctx.fillStyle = UNIT_COLOURS[part];
      ctx.fill(paths[d] || (paths[d] = new Path2D(d)));
    }
    ctx.restore();
  }

  // Reserves waiting at the beaches: one picture per unit, a row per type, overlapping a little when there are many
  function drawReserves(st) {
    const box = reserveBox();
    let row = 0;
    for (const type of UNIT_ORDER) {
      const n = st.reserves.filter(u => u.type === type).length;
      if (!n) continue;
      const step = n > 1 ? Math.min(20, (box.w - 26) / (n - 1)) : 0;
      for (let k = 0; k < n; k++) unitPicture(type, box.x + k * step, box.y + 4 + row * ROW_H);
      row++;
    }
  }

  // Where a sector's railhead flag pole stands: just left of the town at a station, on the track out on the line
  function flagSpot(st, sec, i) {
    const rh = Sim.railhead(st, sec);
    const past = rh.laid >= 1;
    const p = past ? along(sec.id, rh.km) : P[rh.node];
    const ox = past ? 0 : -20 + (i - 1) * 6;
    return { x: p.x + ox, y: p.y, node: rh.node };
  }

  // A railhead flag in the sector's colour
  function drawRailhead(st, sec, i) {
    const f = flagSpot(st, sec, i);
    if (f.node === 'beaches') return;
    ctx.strokeStyle = K.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(f.x, f.y + 4); ctx.lineTo(f.x, f.y - 20); ctx.stroke();
    ctx.fillStyle = Sim.sectorDef(sec.id).colour;
    ctx.beginPath(); ctx.moveTo(f.x, f.y - 20); ctx.lineTo(f.x - 13, f.y - 16); ctx.lineTo(f.x, f.y - 12); ctx.closePath(); ctx.fill();
  }

  // The front line and the German side shaded
  function drawFront(st) {
    const pts = st.sectors.map(s => along(s.id, s.front));
    const top = { x: pts[0].x + 40, y: 0 }, bottom = { x: pts[2].x + 10, y: H };
    const line = [top, ...pts, bottom];
    ctx.save();
    ctx.beginPath(); ctx.moveTo(line[0].x, line[0].y);
    for (const p of line) ctx.lineTo(p.x, p.y);
    ctx.lineTo(W, H); ctx.lineTo(W, 0); ctx.closePath();
    ctx.fillStyle = K.enemyShade; ctx.fill();
    ctx.clip();
    ctx.strokeStyle = K.enemyHatch; ctx.lineWidth = 1;
    for (let x = -H; x < W; x += 14) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = K.front; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(line[0].x, line[0].y);
    for (let i = 1; i < line.length - 1; i++) {
      const mx = (line[i].x + line[i + 1].x) / 2, my = (line[i].y + line[i + 1].y) / 2;
      ctx.quadraticCurveTo(line[i].x, line[i].y, mx, my);
    }
    ctx.lineTo(bottom.x, bottom.y); ctx.stroke();
    // Teeth facing the enemy
    ctx.fillStyle = K.front;
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
      for (let d = 10; d < len - 5; d += 18) {
        const x = a.x + ux * d, y = a.y + uy * d;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - uy * 7 + ux * 4, y + ux * 7 + uy * 4); ctx.lineTo(x + ux * 8, y + uy * 8); ctx.fill();
      }
    }
  }

  // The sector's badge sits back on the German side, as a speech bubble whose tail points at its front
  const BADGE_W = 98, BADGE_H = 40;

  // The railhead flags, which badges must not cover either
  function flagBoxes(st) {
    return st.sectors.map((sec, i) => {
      const f = flagSpot(st, sec, i);
      return { x: f.x - 16, y: f.y - 23, w: 19, h: 29 };
    });
  }

  // The stack of reserve units beside the beaches, and the room it may take
  const ROW_H = 20;
  function reserveBox() {
    const p = P.beaches;
    return { x: p.x - 60, y: p.y + 8, w: 100, h: 6 + ROW_H * UNIT_ORDER.length };
  }

  function portBridgeBoxes(st) {
    const out = [];
    for (const id of ['cherbourg', 'lehavre', 'antwerp']) { const p = portSpot(id); out.push({ x: p.x - 14, y: p.y - 14, w: id === 'antwerp' ? 28 : 90, h: 44 }); }
    for (const br of st.bridges) { const p = bridgeSpot(br); out.push({ x: p.x - 14, y: p.y - 14, w: 28, h: 28 }); }
    return out;
  }

  // Everything a badge must not cover: each station and its name, and the reserves
  function stationBoxes() {
    const boxes = [reserveBox()];
    for (const id in NODES) {
      const p = P[id], big = NODES[id].cap >= 9;
      ctx.font = (big ? 'bold 13px' : '12px') + ' Georgia, serif';
      const [lx, ly] = labelOffset(id);
      boxes.push({ x: p.x - 16, y: p.y - 34, w: 32, h: 50 });                                   // town, its smoke, condition bar, objective ring
      boxes.push({ x: p.x + lx - 2, y: p.y + ly - 13, w: ctx.measureText(NODES[id].name).width + 4, h: 17 }); // its name
    }
    return boxes;
  }

  // How many points along a badge's tail (box centre to its front) fall inside another box
  function tailHits(box, front, other) {
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const len = Math.hypot(front.x - cx, front.y - cy);
    let n = 0;
    for (let d = 0; d <= len; d += 5) {
      const x = cx + (front.x - cx) * d / len, y = cy + (front.y - cy) * d / len;
      if (x > other.x && x < other.x + other.w && y > other.y && y < other.y + other.h && !(x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h)) n++;
    }
    return n;
  }

  const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

  // Where the three badges go: back from their fronts on the German side if there's room,
  // otherwise anywhere nearby (over the front if need be), never on a station or another badge
  let placeCache = { key: '', places: null };
  function badgePlaces(st) {
    // Only worked out again when a front, railhead or the map size changes
    const key = H + '|' + st.sectors.map(sec => Math.round(sec.front) + ':' + Math.round(Sim.railhead(st, sec).km)).join('|');
    if (placeCache.key === key) return placeCache.places;
    placeCache = { key, places: findPlaces(st) };
    return placeCache.places;
  }

  // Score spots for each badge on its own (stations, flags, distance), keep the best few for each,
  // then pick the best combination of three: no overlaps, no hidden tails, North above Centre above South
  function findPlaces(st) {
    const stations = stationBoxes().concat(flagBoxes(st), portBridgeBoxes(st));
    const tries = [];
    for (let dx = -270; dx <= 150; dx += 30) {
      for (let dy = -200; dy <= 200; dy += 20) tries.push({ dx, dy });
    }
    const KEEP = 24;
    const lists = st.sectors.map((sec, i) => {
      const p = along(sec.id, sec.front);
      const want = [{ dx: -150, dy: -100 }, { dx: -165, dy: -20 }, { dx: -140, dy: 60 }][i];
      const opts = [];
      for (const t of tries) {
        const box = { x: p.x + t.dx, y: p.y + t.dy, w: BADGE_W, h: BADGE_H, front: p };
        if (box.x < 4 || box.y < 4 || box.x + box.w > W - 4 || box.y + box.h > H - 4) continue;
        let hit = 0;
        for (const s of stations) hit += overlap(box, s) + tailHits(box, p, s) * 20;
        box.score = hit * 100 + Math.hypot(t.dx - want.dx, (t.dy - want.dy) * 1.5) + (t.dx > 0 ? 120 : 0);
        opts.push(box);
      }
      opts.sort((a, b) => a.score - b.score);
      if (!opts.length) opts.push({ x: Math.max(4, Math.min(W - BADGE_W - 4, p.x - 150)), y: Math.max(4, Math.min(H - BADGE_H - 4, p.y)), w: BADGE_W, h: BADGE_H, front: p, score: 0 });
      return opts.slice(0, KEEP);
    });
    // What two badges cost each other: overlapping, hiding a tail, or being in the wrong order (a above b wanted)
    const pair = (a, b) => {
      let hit = overlap({ x: a.x - 6, y: a.y - 6, w: a.w + 12, h: a.h + 12 }, b) * 10
        + tailHits(a, a.front, b) * 400 + tailHits(b, b.front, a) * 400;
      return hit * 100 + Math.max(0, a.y + 24 - b.y) * 60;
    };
    let best = null, bestScore = Infinity;
    for (const n of lists[0]) {
      for (const c of lists[1]) {
        const nc = n.score + c.score + pair(n, c);
        if (nc >= bestScore) continue;
        for (const so of lists[2]) {
          const total = nc + so.score + pair(c, so) + pair(n, so);
          if (total < bestScore) { bestScore = total; best = [n, c, so]; }
        }
      }
    }
    return best;
  }

  function drawCounter(st, sec, place) {
    const p = along(sec.id, sec.front), col = Sim.sectorDef(sec.id).colour;
    const w = BADGE_W, h = BADGE_H, x = place.x, y = place.y;
    // Tail: from the bubble's nearest side to the exact front point
    const cx = x + w / 2, cy = y + h / 2;
    const ang = Math.atan2(p.y - cy, p.x - cx);
    const nx = -Math.sin(ang) * 7, ny = Math.cos(ang) * 7;
    ctx.fillStyle = '#f4ead2'; ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + nx, cy + ny); ctx.lineTo(p.x, p.y); ctx.lineTo(cx - nx, cy - ny); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 6) : ctx.rect(x, y, w, h);
    ctx.fill(); ctx.stroke();
    // Cover the tail's base inside the bubble
    ctx.beginPath(); ctx.moveTo(cx + nx * 0.8, cy + ny * 0.8); ctx.lineTo(cx - nx * 0.8, cy - ny * 0.8);
    ctx.strokeStyle = '#f4ead2'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = col; ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.fillText(Sim.sectorDef(sec.id).short.toUpperCase(), x + 6, y + 12);
    // Icon, bar, then days in hand. Full bar = 3 days of advancing, the most the trucks stock at the front
    const n = Sim.needs(sec, 'advance');
    const row = (ch, days, yy, c) => {
      ctx.font = emojiFont(9);
      ctx.textBaseline = 'middle'; ctx.fillText(ch, x + 5, yy + 2);
      ctx.fillStyle = 'rgba(40,30,15,.18)'; ctx.fillRect(x + 18, yy, 40, 5);
      ctx.fillStyle = c; ctx.fillRect(x + 18, yy, 40 * Math.max(0, Math.min(1, days / 3)), 5);
      ctx.fillStyle = days < 1 ? '#a3291c' : '#2b2418'; ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.fillText(`${days.toFixed(1)} d`, x + 62, yy + 3);
      ctx.textBaseline = 'alphabetic';
    };
    row('⛽', sec.stock.fuel / (n.fuel || 1), y + 18, '#c47a1a');
    row('💥', sec.stock.ammo / (n.ammo || 1), y + 29, '#5a5a5a');
  }

  function arrow(from, to, col, wide) {
    const ang = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = wide; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x - Math.cos(ang) * 10, to.y - Math.sin(ang) * 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - Math.cos(ang - 0.5) * 18, to.y - Math.sin(ang - 0.5) * 18);
    ctx.lineTo(to.x - Math.cos(ang + 0.5) * 18, to.y - Math.sin(ang + 0.5) * 18); ctx.fill();
  }

  function burst(p, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const r = i % 2 ? 7 : 16, a = i / 16 * Math.PI * 2;
      ctx.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
  }

  let bridgesNow = [];
  function render(st, opts) {
    bridgesNow = st.bridges;
    opts = opts || {};
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(paper, 0, 0, W, H);
    drawFront(st);
    drawPortLinks(st);
    for (const key in Sim.LINKS) drawLink(st, key);
    drawBridges(st);
    drawPorts(st);
    // Last day's German attacks and the reported build-up
    for (const id of st.events.attacks || []) {
      const p = along(id, st.sectors.find(s => s.id === id).front);
      arrow({ x: p.x + 90, y: p.y + 10 }, { x: p.x + 10, y: p.y + 2 }, 'rgba(170,30,20,.85)', 6);
    }
    if (st.intel) {
      const sec = st.sectors.find(s => s.id === st.intel.sector);
      const p = along(sec.id, sec.front + 45);
      p.y -= 28;
      ctx.fillStyle = 'rgba(170,30,20,.8)'; ctx.font = 'bold 22px Georgia, serif';
      ctx.fillText('?', p.x + 4, p.y + 8);
      ctx.strokeStyle = 'rgba(170,30,20,.6)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.ellipse(p.x + 10, p.y, 26, 18, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    for (const id in NODES) drawStation(st, id, opts.hover === id);
    drawReserves(st);
    for (const id of st.events.raids || []) burst({ x: P[id].x + 14, y: P[id].y - 14 }, 'rgba(200,60,20,.75)');
    st.sectors.forEach((s, i) => drawRailhead(st, s, i));
    const places = badgePlaces(st);
    st.sectors.forEach((s, i) => drawCounter(st, s, places[i]));
    if (opts.anim) drawMoving(st, opts.anim);
  }

  // Share of their route the trains and lorries cover in one day's animation (keeps their speed when the animation is shorter)
  const ROLL = 0.5;

  // Trains and lorries moving during the end-of-day animation, using the same 🚂 and 🚚 as the sector rows
  function drawMoving(st, a) {
    const t = a.t * ROLL;
    st.sectors.forEach((sec, i) => {
      const rhKm = a.railheads[i], frontKm = a.fronts[i];
      const trains = Math.min(4, Math.round(sec.trains));
      for (let k = 0; k < trains; k++) {
        const p = along(sec.id, ((t + k / trains) % 1) * rhKm);
        icon('🚂', p.x, p.y - 9);
      }
      if (frontKm - rhKm < 2) return;
      const trucks = Math.min(3, sec.trucks);
      for (let k = 0; k < trucks; k++) {
        const p = along(sec.id, rhKm + ((t + k / trucks) % 1) * (frontKm - rhKm));
        icon('🚚', p.x, p.y + 9);
      }
    });
  }

  // Draw an emoji icon facing right (the emoji themselves face left)
  function icon(ch, x, y) {
    ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
    ctx.font = emojiFont(17);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  // Which station is under the pointer (canvas pixels in, station id out)
  function hit(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) / r.width * W, y = (clientY - r.top) / r.height * H;
    for (const id of ['cherbourg', 'lehavre']) { const p = portSpot(id); if (Math.hypot(p.x - x, p.y - y) < 12) return 'port:' + id; }
    { const p = portSpot('antwerp'); if (Math.hypot(p.x - x, p.y - y) < 10) return 'port:antwerp'; }
    for (let k = 0; k < bridgesNow.length; k++) { const p = bridgeSpot(bridgesNow[k]); if (Math.hypot(p.x - x, p.y - y) < 12) return 'bridge:' + k; }
    for (const id in P) if (Math.hypot(P[id].x - x, P[id].y - y) < 16) return id;
    const b = reserveBox();
    if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return 'beaches';
    return null;
  }

  return { init, resize, render, hit, along, P, W, UNIT_ART, UNIT_COLOURS: PANEL_UNIT_COLOURS, get H() { return H; } };
})();
