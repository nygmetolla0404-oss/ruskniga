/* 3D-карта: сказочный остров «Адал азамат» — 6 регионов, 36 волшебных книг с мини-героями,
   гид — снежный барс Ақбарыс (по земле) и беркут Қыран (в небе) */
window.MapView = function (opts) {
  const T = THREE, E = ENG, I = ISLAND;
  const { canvas, labelsEl, onPick, onNear, getLang, stories, onReady } = opts;
  const TOP = .8, DEPTH = .7;
  const REG = window.REGIONS;

  const renderer = E.renderer(canvas, 1.75);
  const scene = new T.Scene(); scene.fog = new T.Fog(0xcdeeff, 55, 150);
  const camera = new T.PerspectiveCamera(42, 1, .05, 900); camera.position.set(0, 24, 17);
  const controls = new T.OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: .08, minDistance: 4, maxDistance: 46, maxPolarAngle: Math.PI * .46 }); controls.target.set(0, 0, .5);

  E.sky(scene, 0x4cb8ff, 0xdff4ff);
  const sunS = E.sunFace(16); sunS.position.set(-55, 42, -70); scene.add(sunS);
  E.lights(scene, 18, new T.Vector3(-16, 26, 14));
  const cl = E.clouds(scene, 16, 30, 8);

  /* ---------- ocean ---------- */
  const wcv = document.createElement('canvas'); wcv.width = wcv.height = 256; { const c = wcv.getContext('2d'); c.fillStyle = '#39b0ee'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 120; i++) { c.strokeStyle = `rgba(255,255,255,${.12 + Math.random() * .2})`; c.lineWidth = 2; const x = Math.random() * 256, y = Math.random() * 256; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - 4, x + 18, y); c.stroke(); } }
  const wtex = E.ctex(wcv, [60, 60]);
  const ocean = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshStandardMaterial({ map: wtex, roughness: .35, metalness: .05 }));
  ocean.rotation.x = -Math.PI / 2; ocean.position.y = -.2; scene.add(ocean);

  /* ---------- island outline (x, z) ---------- */
  const pts = I.shape(240).map(([x, z]) => new T.Vector2(x, z));
  function inPolyArr(arr, x, y) { let ins = false; for (let i = 0, j = arr.length - 1; i < arr.length; j = i++) { const a = arr[i], b = arr[j]; if (((a.y > y) !== (b.y > y)) && (x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x)) ins = !ins; } return ins; }
  const inPoly = (x, z) => inPolyArr(pts, x, z);
  function segDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0; const qx = ax + t * dx - px, qy = ay + t * dy - py; return Math.sqrt(qx * qx + qy * qy); }
  const edgeDist = (x, z) => I.radius(Math.atan2(z, x)) - Math.hypot(x, z);
  const RIVERS = [0, 1, 2, 3, 4, 5].map(k => I.river(k));
  function riverDist(x, z) { let d = 1e9; RIVERS.forEach(r => { for (let i = 1; i < r.length; i++) d = Math.min(d, segDist(x, z, r[i - 1][0], r[i - 1][1], r[i][0], r[i][1])); }); return d; }
  /* горы: регион «Родина» — высокие, остальные — холмы */
  const MTN = [];
  { const a5 = I.regionAngle(5); [[0, 9.9, 1.7, 1.2], [-.2, 9.0, 1.3, 1.0], [.2, 9.2, 1.4, 1.0], [-.32, 7.6, .8, .8], [.33, 7.8, .9, .8]].forEach(([da, r, h, rr]) => MTN.push([Math.cos(a5 + da) * r, Math.sin(a5 + da) * r, h, rr]));
    const a4 = I.regionAngle(4); [[-.3, 9.6, .7, .9], [.35, 9.4, .6, .8]].forEach(([da, r, h, rr]) => MTN.push([Math.cos(a4 + da) * r, Math.sin(a4 + da) * r, h, rr]));
    const a3 = I.regionAngle(3); [[-.35, 9.2, .45, 1.0], [.35, 9.0, .4, 1.0]].forEach(([da, r, h, rr]) => MTN.push([Math.cos(a3 + da) * r, Math.sin(a3 + da) * r, h, rr])); }
  const FLAT = []; stories.forEach(s => { const p = I.bookPos(s.region, s.slot); FLAT.push([p.x, p.z, .75]); }); for (let k = 0; k < 6; k++) { const p = I.landmark(k); FLAT.push([p.x, p.z, 1.1]); }
  function rawH(x, z) {
    let h = (E.fbm(x * .45 + 3, z * .45 + 7) - .45) * .3;
    MTN.forEach(([mx, mz, mh, r]) => { const d2 = ((x - mx) ** 2 + (z - mz) ** 2) / (r * r); if (d2 < 4) h += mh * Math.exp(-d2 * 1.6) * (.75 + E.fbm(x * 2.2, z * 2.2) * .5); });
    FLAT.forEach(([fx, fz, fr]) => { const d = Math.hypot(x - fx, z - fz); if (d < fr) h *= Math.min(1, d / fr) * .6; });
    return h;
  }

  /* height grid */
  const minX = -15, maxX = 15, minZ = -15, maxZ = 15, STEP = .085;
  const NX = Math.ceil((maxX - minX) / STEP) + 1, NZ = Math.ceil((maxZ - minZ) / STEP) + 1;
  const HG = new Float32Array(NX * NZ), IN = new Uint8Array(NX * NZ), KIND = new Uint8Array(NX * NZ);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const x = minX + i * STEP, z = minZ + j * STEP, k = j * NX + i;
    if (!inPoly(x, z)) continue; IN[k] = 1;
    const e = Math.min(1, Math.max(0, edgeDist(x, z)) / .5), fall = e * e * (3 - 2 * e);
    let h = Math.max(-.02, rawH(x, z)) * fall + .02 * fall;
    const r = Math.hypot(x, z);
    if (r < I.LAKE) { h = -.04; KIND[k] = 2; }
    else if (r < 2.9) h *= (r - I.LAKE) / .8;
    else { const rd = riverDist(x, z); if (rd < .08) { h = Math.min(h, -.015); KIND[k] = 1; } else if (rd < .18) h *= (rd - .08) / .1; }
    HG[k] = h;
  }
  function ground(x, z) {
    const gx = (x - minX) / STEP, gz = (z - minZ) / STEP, i = Math.floor(gx), j = Math.floor(gz);
    if (i < 0 || j < 0 || i >= NX - 1 || j >= NZ - 1) return TOP;
    const fx = gx - i, fz = gz - j, k = j * NX + i;
    const h = HG[k] * (1 - fx) * (1 - fz) + HG[k + 1] * fx * (1 - fz) + HG[k + NX] * (1 - fx) * fz + HG[k + NX + 1] * fx * fz;
    return TOP + Math.max(0, h);
  }
  const at = (x, z, y) => new T.Vector3(x, ground(x, z) + (y || 0), z);

  /* terrain mesh: each region has its own colours */
  const PAL = [
    [0x6cc84d, 0x82d455, 0x5bb543, 0x93dc62], // единство — луга
    [0xd9c55a, 0xc8b84c, 0xe6d26c, 0x9fc85a], // труд — золотые поля
    [0x5cc8a0, 0x72d4ae, 0x56bc96, 0x8ad9b4], // созидание — бирюзовые луга
    [0xd9a84a, 0xc8963a, 0xe3b85a, 0xb8a040], // справедливость — осень
    [0x4ea86a, 0x5ab878, 0x46985e, 0x68c486], // закон — хвойные леса
    [0x6cc84d, 0x7fd257, 0x5bb543, 0x8ed95e]  // родина — горы
  ].map(p => p.map(c => new T.Color(c)));
  {
    const pos = new Float32Array(NX * NZ * 3), col = new Float32Array(NX * NZ * 3), idx = [];
    const c = new T.Color(), c2 = new T.Color(), ROCK = new T.Color(0xa9a8a2), SNOW = new T.Color(0xffffff), WATER = new T.Color(0x3fb6f2), SAND = new T.Color(0xf2dca0);
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      const k = j * NX + i, x = minX + i * STEP, z = minZ + j * STEP, h = HG[k];
      pos[k * 3] = x; pos[k * 3 + 1] = TOP + h; pos[k * 3 + 2] = z;
      const n = E.fbm(x * 1.7, z * 1.7), rg = I.regionOf(x, z), q = Math.floor(n * 7) % 4;
      c.copy(PAL[rg][q]);
      let a = Math.atan2(z, x) - I.A0; a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); const f = a / (Math.PI / 3), fr = f - Math.floor(f), nb = fr < .5 ? (rg + 5) % 6 : (rg + 1) % 6, dd = Math.abs(fr - .5);
      if (dd < .12) { c2.copy(PAL[nb][q]); c.lerp(c2, (.12 - dd) / .24); }
      const r = Math.hypot(x, z); if (r < 3.2 && r > I.LAKE) c.lerp(SAND, (3.2 - r) / 1.1 * .7);
      if (edgeDist(x, z) < .5) c.lerp(SAND, .55);
      if (h > .35) c.lerp(ROCK, Math.min(1, (h - .35) / .45)); if (h > .95) c.lerp(SNOW, Math.min(1, (h - .95) / .2));
      if (KIND[k]) c.copy(WATER);
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const k = j * NX + i; if (IN[k] && IN[k + 1] && IN[k + NX] && IN[k + NX + 1]) idx.push(k, k + NX, k + 1, k + 1, k + NX, k + NX + 1); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const terrain = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true })); terrain.receiveShadow = true; terrain.castShadow = true; scene.add(terrain);
    const shape = new T.Shape(pts.map(p => new T.Vector2(p.x, -p.y))); const eg = new T.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: .08, bevelSize: .06, bevelSegments: 2 }); eg.rotateX(-Math.PI / 2);
    const sideCv = document.createElement('canvas'); sideCv.width = 16; sideCv.height = 128; { const cc = sideCv.getContext('2d'); const gr = cc.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#5bb543'); gr.addColorStop(.14, '#5bb543'); gr.addColorStop(.16, '#b77a44'); gr.addColorStop(.6, '#9a6236'); gr.addColorStop(1, '#6a4224'); cc.fillStyle = gr; cc.fillRect(0, 0, 16, 128); }
    const slab = new T.Mesh(eg, [new T.MeshStandardMaterial({ color: 0x6cc84d, roughness: 1 }), new T.MeshStandardMaterial({ map: E.ctex(sideCv), roughness: .9 })]); slab.position.y = -.005; slab.receiveShadow = true; scene.add(slab);
    const lake = new T.Mesh(new T.CircleGeometry(I.LAKE, 48), new T.MeshStandardMaterial({ color: 0x46c0f5, roughness: .2, metalness: .1, transparent: true, opacity: .92 })); lake.rotation.x = -Math.PI / 2; lake.position.y = TOP + .005; scene.add(lake);
  }

  /* ---------- vegetation ---------- */
  const samplePts = (n, fn) => { const out = []; let tries = 0; while (out.length < n && tries < n * 30) { tries++; const x = E.rnd(minX, maxX), z = E.rnd(minZ, maxZ); const gi = Math.round((x - minX) / STEP), gj = Math.round((z - minZ) / STEP), k = gj * NX + gi; if (!IN[k] || KIND[k]) continue; if (Math.hypot(x, z) < 3) continue; if (fn(I.regionOf(x, z), HG[k], x, z)) out.push([x, ground(x, z), z]); } return out; };
  const nearBook = (x, z, d) => stories.some(s => { const p = I.bookPos(s.region, s.slot); return Math.hypot(p.x - x, p.z - z) < d; }) || [0, 1, 2, 3, 4, 5].some(k => { const p = I.landmark(k); return Math.hypot(p.x - x, p.z - z) < 1.2; });
  scene.add(E.grassField(samplePts(9000, (rg, h) => h < .9), .45));
  scene.add(E.flowerField(samplePts(2800, (rg, h, x, z) => h < .6 && !nearBook(x, z, .5) && (rg !== 1 || Math.random() < .3)), .2));
  const treePts = samplePts(900, (rg, h, x, z) => h < .9 && !nearBook(x, z, .8) && (rg === 4 ? Math.random() < .9 : rg === 3 ? Math.random() < .6 : rg === 1 ? Math.random() < .12 : Math.random() < .4)); treePts.forEach(p => p[3] = E.rnd(.13, .2));
  scene.add(E.treeField(treePts, 1, [0xe8962a, 0xd8692a, 0xf2c040, 0x5fbf5a, 0x4ea83c]));
  const add = (o, pos, ry) => { o.position.copy(pos); if (ry != null) o.rotation.y = ry; scene.add(o); return o; };
  samplePts(60, (rg, h, x, z) => (rg === 4 || rg === 5) && h < 1 && !nearBook(x, z, .8)).forEach(p => add(E.tree(E.rnd(.15, .22), 'pine'), new T.Vector3(p[0], p[1], p[2])));
  samplePts(40, (rg, h, x, z) => (rg === 0 || rg === 1) && !nearBook(x, z, .8)).forEach(p => add(E.tree(E.rnd(.15, .2), 'birch'), new T.Vector3(p[0], p[1], p[2])));
  for (let i = 0; i < 30; i++) { const p = samplePts(1, (rg, h, x, z) => rg === 3 && !nearBook(x, z, .6))[0]; if (p) add(E.rock(E.rnd(.04, .08), 0xd8c08a), new T.Vector3(p[0], p[1], p[2])); }
  /* деревни: юрты и избы рядом — дружба культур */
  const villages = [];
  for (let k = 0; k < 6; k++) {
    const a = I.regionAngle(k);
    [[-.5, 5.6], [.5, 5.6], [-.42, 7.6], [.42, 7.7]].forEach(([da, r], i) => { const x = Math.cos(a + da) * r, z = Math.sin(a + da) * r; if (nearBook(x, z, .7)) return; const o = i % 2 ? E.yurt(.13, ['#c8323a', '#2a6aa8', '#d0702a'][k % 3]) : E.izba(.17, ['#2a6aa8', '#2f8a5a', '#c8323a'][k % 3]); add(o, at(x, z), Math.atan2(-x, -z)); villages.push(o); });
  }

  /* ---------- landmarks of the 6 regions ---------- */
  const spinners = [];
  [0, 1, 2, 3, 4, 5].forEach(k => {
    const p = I.landmark(k), pos = at(p.x, p.z), ry = Math.atan2(-p.x, -p.z);
    if (k === 0) { [0, 1, 2, 3, 4].forEach(i => { const an = i / 5 * Math.PI * 2, x = p.x + Math.cos(an) * .55, z = p.z + Math.sin(an) * .55; add(i % 2 ? E.yurt(.16, '#c8323a') : E.izba(.2, '#2a6aa8'), at(x, z), Math.atan2(p.x - x, p.z - z)); }); const fire = new T.Mesh(new T.ConeGeometry(.08, .2, 8), new T.MeshBasicMaterial({ color: 0xffa020 })); add(fire, at(p.x, p.z, .1)); const sh = new T.Mesh(new T.TorusGeometry(.35, .04, 8, 24), E.mat(0xc8902a)); sh.rotation.x = Math.PI / 2; add(sh, at(p.x, p.z, .9)); spinners.push({ o: sh, ax: 'z' }); }
    if (k === 1) { const w = E.windmill(.42); add(w, pos, ry); spinners.push({ o: w.userData.blades, ax: 'z', sp: 1.2 }); for (let i = 0; i < 40; i++) { const st = new T.Mesh(new T.ConeGeometry(.03, .16, 4), E.mat(0xf2c94c)); add(st, at(p.x + E.rnd(-.9, .9), p.z + E.rnd(-.9, .9), .08)); } }
    if (k === 2) { const r = E.rocket(.38); add(r, pos, ry); spinners.push({ flame: r.userData.flame }); }
    if (k === 3) { const s = E.scales(.42); add(s, pos, ry); spinners.push({ beam: s.userData.beam }); }
    if (k === 4) { const kr = E.kremlin(.32); add(kr, pos, ry); spinners.push({ o: kr.userData.star, ax: 'y' }); }
    if (k === 5) { const b = E.baiterek(.16); add(b, pos); if (b.userData.ball) spinners.push({ o: b.userData.ball, ax: 'y', sp: .5 }); }
  });
  /* центр: озеро и Книга-портал */
  const hub = new T.Group(); hub.position.set(0, TOP, 0); scene.add(hub);
  const isl = new T.Mesh(new T.CylinderGeometry(.75, .9, .2, 24), E.mat(0xf2dca0)); isl.position.y = .02; hub.add(isl);
  const bigBook = new T.Group(); bigBook.position.y = .75; hub.add(bigBook);
  [-1, 1].forEach(sd => { const pg = new T.Mesh(new T.BoxGeometry(.7, .04, .9), E.mat(0xfff4dc)); pg.position.x = sd * .36; pg.rotation.z = sd * .18; bigBook.add(pg); const cv = new T.Mesh(new T.BoxGeometry(.74, .03, .94), E.mat(0x8a1a2a)); cv.position.set(sd * .37, -.03, 0); cv.rotation.z = sd * .18; bigBook.add(cv); });
  const hubRing = E.portalRing(.55, 0x7fe7dc); hubRing.position.y = 1.5; hub.add(hubRing); spinners.push({ o: hubRing.userData.disc, ax: 'y' });
  const hubSp = E.sparkles(60, 1.2); hubSp.position.y = .6; hub.add(hubSp);

  /* ---------- labels ---------- */
  const placeEls = [];
  REG.forEach((R, k) => { const a = I.regionAngle(k), r = I.radius(a) - .35; const el = document.createElement('div'); el.className = 'clabel cap region'; el.style.setProperty('--rc', R.color); labelsEl.appendChild(el); placeEls.push({ el, pos: at(Math.cos(a) * r, Math.sin(a) * r, .5), R, k }); });
  { const el = document.createElement('div'); el.className = 'clabel w'; labelsEl.appendChild(el); placeEls.push({ el, pos: at(0, 0, 2.2), hub: true }); }

  /* ---------- magic books with mini heroes ---------- */
  const books = [], pickables = [], minis = [];
  const parchment = (c, W, H) => { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fff8e6'); g.addColorStop(1, '#f6e2b4'); c.fillStyle = g; c.fillRect(0, 0, W, H); };
  function pageLeft(s, photo) {
    const W = 512, H = 640, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); parchment(c, W, H);
    c.save(); E.roundRect(c, 30, 30, W - 60, H - 60, 30); c.clip();
    if (photo) { const r = Math.max((W - 60) / photo.width, (H - 60) / photo.height), w = photo.width * r, h = photo.height * r; c.drawImage(photo, 30 + (W - 60 - w) / 2, 30 + (H - 60 - h) / 2, w, h); }
    else { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8fd8ff'); g.addColorStop(1, '#7ed957'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.drawImage(Avatar.canvas(s.chars[0].a, 400), 56, 110, 400, 400); }
    c.restore(); c.strokeStyle = '#f2b33d'; c.lineWidth = 12; E.roundRect(c, 30, 30, W - 60, H - 60, 30); c.stroke();
    c.fillStyle = s.o === 'kz' ? '#0094b3' : '#c0392b'; E.roundRect(c, 50, 50, 120, 50, 25); c.fill(); c.fillStyle = '#fff'; c.font = '900 26px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText(s.o === 'kz' ? 'ҚАЗ' : 'РУС', 110, 84);
    return cv;
  }
  function pageRight(s, lang) {
    const W = 512, H = 640, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); parchment(c, W, H);
    c.textAlign = 'center'; c.fillStyle = '#c8323a'; c.font = '800 30px Nunito, sans-serif'; c.fillText(s.author[lang === 'kk' ? 'kk' : 'ru'], W / 2, 70);
    const title = lang === 'kk' ? s.kk : s.ru, sub = lang === 'kk' ? s.ru : s.kk;
    c.fillStyle = '#16306a'; let fs = 58; c.font = `800 ${fs}px Nunito, sans-serif`; while (c.measureText(title).width > (W - 70) * 2 && fs > 32) { fs -= 3; c.font = `800 ${fs}px Nunito, sans-serif`; }
    wrap(c, title, W / 2, 160, W - 60, fs * 1.08, 3);
    c.fillStyle = '#b5652a'; c.font = '700 32px Nunito, sans-serif'; wrap(c, sub, W / 2, 340, W - 70, 38, 2);
    c.fillStyle = '#3a4a6a'; c.font = '600 26px Nunito, sans-serif'; wrap(c, '⏳ ' + (s.year[lang === 'kk' ? 'kk' : 'ru']), W / 2, 450, W - 70, 32, 1);
    const V = VALUES[s.value]; c.fillStyle = V.color || '#2fae6a'; E.roundRect(c, 50, 525, W - 100, 70, 35); c.fill(); c.fillStyle = '#fff'; c.font = '800 26px Nunito, sans-serif'; wrap(c, V.ico + ' ' + V[lang === 'kk' ? 'kk' : 'ru'], W / 2, 570, W - 120, 30, 1);
    return cv;
  }
  function wrap(c, text, x, y, mw, lh, max) { const w = text.split(' '); let line = '', n = 0; for (let i = 0; i < w.length; i++) { const t = line ? line + ' ' + w[i] : w[i]; if (c.measureText(t).width > mw && line) { c.fillText(line, x, y + n * lh); n++; line = w[i]; if (n >= max - 1) { line = w.slice(i).join(' '); break; } } else line = t; } c.fillText(line, x, y + n * lh); }
  function bentPage(side) { const g = new T.PlaneGeometry(.52, .66, 12, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + .26 * side, k = Math.abs(x) / .52; p.setX(i, x); p.setZ(i, Math.sin(k * Math.PI) * .05 + k * .06); } g.computeVertexNormals(); return g; }

  stories.forEach((s, i) => {
    const bp = I.bookPos(s.region, s.slot);
    const root = new T.Group(); root.position.copy(at(bp.x, bp.z)); root.scale.setScalar(1.2);
    const ped = new T.Mesh(new T.CylinderGeometry(.34, .42, .14, 8), E.mat(0xfff4e0)); ped.position.y = .07; ped.castShadow = true; root.add(ped);
    const band = new T.Mesh(new T.CylinderGeometry(.425, .425, .05, 8, 1, true), new T.MeshStandardMaterial({ map: E.bandTex(s.o === 'kz' ? '#0094b3' : '#c8323a', '#f6c34a') })); band.position.y = .07; root.add(band);
    const ring = new T.Mesh(new T.TorusGeometry(.48, .025, 8, 40), new T.MeshBasicMaterial({ color: 0xffd66b })); ring.rotation.x = Math.PI / 2; ring.position.y = .03; root.add(ring);
    const beam = new T.Mesh(new T.CylinderGeometry(.06, .3, 2.4, 16, 1, true), new T.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: .18, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); beam.position.y = 1.25; root.add(beam);
    const book = new T.Group(); book.position.y = .8; root.add(book);
    const tilt = new T.Group(); tilt.rotation.x = -.42; book.add(tilt);
    const cover = E.mat(new T.Color(s.color).getHex(), { roughness: .6 });
    [-1, 1].forEach(sd => { const b = new T.Mesh(new T.BoxGeometry(.56, .7, .03), cover); b.position.set(.28 * sd, 0, -.02); b.rotation.y = -sd * .12; b.castShadow = true; tilt.add(b); });
    tilt.add(new T.Mesh(new T.CylinderGeometry(.03, .03, .7, 8), E.gold()).translateZ(-.02));
    const lt = new T.CanvasTexture(pageLeft(s, null)), rt = new T.CanvasTexture(pageRight(s, getLang())); lt.encoding = rt.encoding = T.sRGBEncoding; lt.anisotropy = rt.anisotropy = 8;
    const pl = new T.Mesh(bentPage(-1), new T.MeshBasicMaterial({ map: lt, side: T.DoubleSide })); pl.position.z = .002;
    const pr = new T.Mesh(bentPage(1), new T.MeshBasicMaterial({ map: rt, side: T.DoubleSide })); pr.position.z = .002;
    tilt.add(pl); tilt.add(pr);
    const sp = E.sparkles(26, .5); sp.position.y = .3; root.add(sp);
    const star = new T.Mesh(new T.OctahedronGeometry(.1), new T.MeshStandardMaterial({ color: 0xffd34d, emissive: 0xffa000, emissiveIntensity: .8, metalness: .6 })); star.position.set(0, 1.4, 0); star.visible = false; root.add(star);
    const hit = new T.Mesh(new T.BoxGeometry(1.3, 1.5, .8), new T.MeshBasicMaterial({ visible: false })); hit.position.y = .8; hit.userData.story = s; root.add(hit); pickables.push(hit);
    scene.add(root);
    const mini = E.character(s.chars[0].a, .2); const mp = root.position; const mx = mp.x + .5, mz = mp.z + .2; mini.position.set(mx, ground(mx, mz), mz); mini.rotation.y = .4; scene.add(mini); minis.push(mini);
    const el = document.createElement('div'); el.className = 'blabel ' + s.o; el.innerHTML = `<b>${i + 1}</b><span></span>`; el.onclick = () => onPick(s); labelsEl.appendChild(el);
    books.push({ s, root, book, beam, ring, sp, star, lt, rt, el, phase: i * .7 });
    if (s.imgs[0]) E.img(s.imgs[0]).then(im => { if (im) { lt.image = pageLeft(s, im); lt.needsUpdate = true; } });
  });

  /* ---------- life: Ақбарыс on land, Қыран in the sky, herds, leopards in the mountains ---------- */
  let ctrl = null, herds = [], eagles = [], cats = [], mode = 'view', ready = false;
  E.creatures().then(cr => {
    const barys = E.leopard(.42), qyran = E.instance(cr.eagle, .55);
    scene.add(barys); scene.add(qyran);
    ctrl = E.Controller({ camera, horse: barys, eagle: qyran, rideSpeed: 1.1, flySpeed: 2.2, camDist: 1.25, camH: .55, minAlt: .9, maxAlt: 7,
      ground: (x, z) => ground(x, z), inside: (x, z, fly) => fly ? (Math.hypot(x, z) < 19) : (inPoly(x, z) && Math.hypot(x, z) > I.LAKE + .1) });
    const st = I.bookPos(0, 0); ctrl.place(st.x * .7, st.z * .7 + .4, Math.PI);
    ctrl.st.active = false; camera.position.set(0, 24, 17); controls.target.set(0, 0, .5); controls.update();
    [[0, 6.4, 1.1], [1, 6.6, 1.2], [3, 6.2, 1.0]].forEach(([k, r0, r], hi) => {
      const a = I.regionAngle(k), c = at(Math.cos(a) * r0, Math.sin(a) * r0);
      for (let n = 0; n < 4; n++) { const h = E.instance(cr.horse, E.rnd(.36, .44), [0xffffff, 0xc89060, 0x8a6048, 0xf0e0c8][n]); scene.add(h); h.userData.action.timeScale = E.rnd(.9, 1.2); herds.push({ h, c, r: r + E.rnd(-.15, .15), a: n * .35 + hi, sp: .28 + E.rnd(0, .05) }); }
    });
    [[5, 8.4, 1.2, 3.2], [3, 8.0, 1.6, 3.0], [2, 7.0, 1.2, 2.6]].forEach(([k, r0, r, y], n) => { const a = I.regionAngle(k), c = at(Math.cos(a) * r0, Math.sin(a) * r0, y); const e = E.instance(cr.eagle, .45); scene.add(e); eagles.push({ e, c, r, a: n * 2, sp: .45 }); });
    const a5 = I.regionAngle(5); [0, 1].forEach(n => { const l = E.leopard(.32); scene.add(l); l.userData.action.timeScale = .8; cats.push({ l, c: { x: Math.cos(a5) * 8.3, z: Math.sin(a5) * 8.3 }, r: .9 + n * .5, a: n * 3, sp: .25 }); });
    ready = true; onReady && onReady(); if (mode !== 'view') setMode(mode);
  });

  /* ---------- interaction ---------- */
  const ray = new T.Raycaster(), mouse = new T.Vector2(); let hovered = null, downAt = null;
  function pickAt(e) { const r = canvas.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(mouse, camera); const h = ray.intersectObjects(pickables, false)[0]; return h ? h.object.userData.story : null; }
  canvas.addEventListener('pointermove', e => { const s = pickAt(e); hovered = s; canvas.style.cursor = s ? 'pointer' : ''; });
  canvas.addEventListener('pointerdown', e => downAt = [e.clientX, e.clientY]);
  canvas.addEventListener('pointerup', e => { if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; const s = pickAt(e); if (s) onPick(s); });

  let fly = null;
  function flyTo(pos, target) { fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, k: 0 }; }
  function intro() { if (mode !== 'view') return; camera.position.set(0, 78, 3); controls.target.set(0, 0, .5); controls.update(); fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new T.Vector3(0, 24, 17), t1: new T.Vector3(0, 0, .5), k: 0, sp: .38 }; }
  function setMode(m) {
    mode = m; if (!ctrl) return;
    if (m === 'view') { ctrl.st.active = false; controls.enabled = true; ctrl.obj.visible = true; flyTo(new T.Vector3(0, 24, 17), new T.Vector3(0, 0, .5)); }
    else { fly = null; controls.enabled = false; ctrl.setMode(m === 'fly' ? 'fly' : 'ride'); ctrl.st.active = true; ctrl.snap(); }
  }
  function focus(id) {
    const B = books.find(b => b.s.id === id); if (!B) return;
    if (mode === 'view') { const t = B.root.position.clone(); flyTo(t.clone().add(new T.Vector3(0, 4.5, 5)), t); }
    else if (ctrl) { const p = B.root.position, d = Math.hypot(p.x, p.z) || 1; ctrl.place(p.x - p.x / d * 1.3, p.z - p.z / d * 1.3, Math.atan2(p.x, p.z)); }
  }
  function focusRegion(k) { const a = I.regionAngle(k), t = at(Math.cos(a) * 6.5, Math.sin(a) * 6.5); if (mode !== 'view') setMode('view'); flyTo(t.clone().add(new T.Vector3(Math.cos(a) * 3, 9, Math.sin(a) * 3 + 6)), t); }
  function setLang(l) {
    books.forEach(B => { B.rt.image = pageRight(B.s, l); B.rt.needsUpdate = true; B.el.querySelector('span').textContent = l === 'kk' ? B.s.kk : B.s.ru; });
    placeEls.forEach(Pl => Pl.el.textContent = Pl.hub ? (l === 'kk' ? '📖 Кітап-портал' : '📖 Книга-портал') : `${Pl.R.ico} ${l === 'kk' ? Pl.R.kk : Pl.R.ru}`);
  }
  function markDone(ids) { books.forEach(B => { B.star.visible = ids.includes(B.s.id); B.el.classList.toggle('done', ids.includes(B.s.id)); }); }
  function highlight(id) { books.forEach(B => B.el.classList.toggle('quest', B.s.id === id)); }

  /* ---------- loop ---------- */
  let W = 0, H = 0, paused = false, near = null;
  const clock = new T.Clock(), tmp = new T.Vector3(), one = new T.Vector3();
  function resize() { const r = canvas.parentElement.getBoundingClientRect(); W = r.width; H = r.height; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  function loop() {
    requestAnimationFrame(loop); if (paused) return;
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    wtex.offset.x = t * .004; wtex.offset.y = t * .002;
    cl.children.forEach(c => { c.position.x += c.userData.v * dt; if (c.position.x > 34) c.position.x = -34; });
    if (fly) { fly.k = Math.min(1, fly.k + dt * (fly.sp || .8)); const k = 1 - Math.pow(1 - fly.k, 3); camera.position.lerpVectors(fly.p0, fly.p1, k); controls.target.lerpVectors(fly.t0, fly.t1, k); if (fly.k >= 1) fly = null; }
    if (mode === 'view' || !ctrl) controls.update(); else ctrl.update(dt);
    spinners.forEach(S => { if (S.o) S.o.rotation[S.ax || 'y'] += dt * (S.sp || .6); if (S.flame) S.flame.scale.y = 1 + Math.sin(t * 20) * .15; if (S.beam) S.beam.rotation.z = Math.sin(t * .8) * .12; });
    bigBook.rotation.y = Math.sin(t * .4) * .3; bigBook.position.y = .75 + Math.sin(t * 1.3) * .05; hubSp.rotation.y = t * .3;
    minis.forEach((m, i) => E.animChar(m, t + i));
    herds.forEach(Hd => { Hd.a += Hd.sp * dt / Hd.r * 1.6; const x = Hd.c.x + Math.cos(Hd.a) * Hd.r, z = Hd.c.z + Math.sin(Hd.a) * Hd.r * .7; Hd.h.position.set(x, ground(x, z), z); Hd.h.rotation.y = Math.atan2(-Math.sin(Hd.a) * Hd.r, Math.cos(Hd.a) * Hd.r * .7); Hd.h.userData.mixer.update(dt); });
    cats.forEach(C => { C.a += C.sp * dt / C.r; const x = C.c.x + Math.cos(C.a) * C.r, z = C.c.z + Math.sin(C.a) * C.r; C.l.position.set(x, ground(x, z), z); C.l.rotation.y = Math.atan2(-Math.sin(C.a), Math.cos(C.a)); C.l.userData.mixer.update(dt); });
    eagles.forEach(G => { G.a += G.sp * dt; G.e.position.set(G.c.x + Math.cos(G.a) * G.r, G.c.y + Math.sin(G.a * 2) * .2, G.c.z + Math.sin(G.a) * G.r); G.e.rotation.set(0, -G.a, .35, 'YXZ'); G.e.userData.mixer.update(dt); });
    if (ctrl && ctrl.st.mode === 'fly' && ctrl.st.active) { ctrl.obj.visible = true; }
    let best = null, bd = 1e9; const pp = ctrl && mode !== 'view' ? ctrl.obj.position : null;
    books.forEach(B => {
      const ph = t * 1.6 + B.phase; B.book.position.y = .8 + Math.sin(ph) * .05;
      B.book.rotation.y = Math.atan2(camera.position.x - B.root.position.x, camera.position.z - B.root.position.z);
      const hov = hovered === B.s || near === B.s, sc = hov ? 1.18 : 1; B.book.scale.lerp(one.set(sc, sc, sc), .15);
      B.beam.material.opacity = (hov ? .32 : .16) + Math.sin(ph * 1.3) * .04; B.ring.scale.setScalar(1 + Math.sin(ph * 2) * .05); B.sp.rotation.y = t * .3; B.star.rotation.y = t * 2;
      if (pp) { const d = Math.hypot(pp.x - B.root.position.x, pp.z - B.root.position.z); if (d < bd) { bd = d; best = B.s; } }
      tmp.copy(B.root.position); tmp.y += 2.0; tmp.project(camera);
      const dist = camera.position.distanceTo(B.root.position), vis = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1 && dist < (mode === 'view' ? 70 : 14);
      B.el.style.opacity = vis ? (mode === 'view' ? 1 : Math.max(0, Math.min(1, (14 - dist) / 5))) : 0; B.el.style.pointerEvents = vis ? 'auto' : 'none'; B.el.classList.toggle('compact', dist > 19);
      B.el.style.transform = `translate(-50%,-100%) translate(${(tmp.x * .5 + .5) * W}px,${(-tmp.y * .5 + .5) * H}px)`;
    });
    placeEls.forEach(Pl => { tmp.copy(Pl.pos).project(camera); const d = camera.position.distanceTo(Pl.pos); const vis = tmp.z < 1 && d < (mode === 'view' ? 60 : 12); Pl.el.style.opacity = vis ? .97 : 0; Pl.el.style.transform = `translate(-50%,-50%) translate(${(tmp.x * .5 + .5) * W}px,${(-tmp.y * .5 + .5) * H}px)`; });
    const nn = pp && bd < (ctrl.st.mode === 'fly' ? 1.6 : 1.0) ? best : null;
    if (nn !== near) { near = nn; onNear && onNear(near); }
    renderer.render(scene, camera);
  }
  loop();
  return { intro, setMode, focus, focusRegion, setLang, markDone, highlight, resize, get near() { return near; }, get ready() { return ready; }, set paused(v) { paused = v; if (!v) { clock.getDelta(); resize(); } } };
};
