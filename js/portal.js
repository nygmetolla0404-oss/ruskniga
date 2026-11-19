/* Portal worlds — a bright 3D aul for every tale: 3D heroes, museum with photos and objects,
   outdoor cinema, mailbox, quest stones, landmark, nature and animals */
window.PortalView = function (opts) {
  const T = THREE, E = ENG;
  const { canvas, labelsEl, onHotspot, onExit, onNear } = opts; const LG = () => (opts.getLang ? opts.getLang() : 'ru'); const TT = (ru, kk) => LG() === 'kk' ? kk : ru;
  const renderer = E.renderer(canvas, 1.6);
  const camera = new T.PerspectiveCamera(55, 1, .1, 1200);
  let frozen = false, scene, ctrl, story, running = false, near = null, sunL, mode = 'ride', exiting = false;
  let hot = [], life = [], heroes = [], spin = [], flags = [], flyers = [];
  const clock = new T.Clock(), tmp = new T.Vector3();

  const BIOME = {
    steppe:   { top: 0x4cb8ff, bot: 0xdff4ff, g: [0x6cc84d, 0x82d455, 0x5bb543, 0x93dc62], amp: 1.4, fog: 0xd8f0ff },
    river:    { top: 0x48b4ff, bot: 0xdaf2ff, g: [0x66c44a, 0x7fd257, 0x56b240, 0x8ed95e], amp: 1.0, fog: 0xd8f0ff, water: 'river' },
    forest:   { top: 0x4cb0f0, bot: 0xe2f6ff, g: [0x4ea83c, 0x5fba48, 0x469a36, 0x6cc84d], amp: 2.2, fog: 0xd4ecf4 },
    canyon:   { top: 0x4cb0ff, bot: 0xfff0dc, g: [0xf3dcc0, 0xeac9a4, 0xf6e6d0, 0xe8bf94], amp: 0, fog: 0xfbeedc },
    desert:   { top: 0x55aef5, bot: 0xffe6bd, g: [0xf5d58a, 0xf0c873, 0xf8df9e, 0xeec068], amp: 0, fog: 0xfff0d4 },
    mountain: { top: 0x46b2ff, bot: 0xe0f4ff, g: [0x5fbf4a, 0x74cc55, 0x52ad40, 0x86d45e], amp: 2.6, fog: 0xdcf0ff },
    lake:     { top: 0x48b6ff, bot: 0xdff4ff, g: [0x6cc84d, 0x82d455, 0x5bb543, 0x93dc62], amp: .9, fog: 0xd8f0ff, water: 'lake' },
    city:     { top: 0x4cb8ff, bot: 0xe6f6ff, g: [0x6cc84d, 0x82d455, 0x5bb543, 0x93dc62], amp: .6, fog: 0xe0f2ff }
  };
  const WX = {
    clear: {},
    spring: { flowers: 2.2, tree: [0xffb7d0, 0xff9ec4, 0x6cc35a, 0xffd0e0, 0x5fbf5a] },
    autumn: { g: [0xc9b04a, 0xd8b850, 0xb8a040, 0xe0c060], grass: [0xd9a84a, 0xc8963a, 0xe3c25a, 0xb88a30], tree: [0xe8962a, 0xd8692a, 0xf2c040, 0xc8502a, 0xe0a030], top: 0x6aa8e0, bot: 0xffe2b0, fog: 0xf6dcb0, sunC: 0xffd0a0, flowers: .3 },
    rain: { top: 0x7f93a8, bot: 0xc9d4de, fog: 0xb8c4cf, fogN: 40, fogF: 170, sunI: .38, hemi: .55, rain: 5000, rainbow: true, noSun: true, dark: 0x9aa4b0 },
    storm: { top: 0x36435a, bot: 0x7d8a9c, fog: 0x6f7b8c, fogN: 25, fogF: 130, sunI: .22, hemi: .42, rain: 7000, lightning: true, noSun: true, dark: 0x5a6474 },
    fog: { top: 0xb8c6d2, bot: 0xeef2f4, fog: 0xe2e8ec, fogN: 12, fogF: 85, sunI: .5, hemi: .7, noSun: true },
    snow: { g: [0xf4f8ff, 0xe9f0fa, 0xffffff, 0xdde8f4], top: 0x8fb8e0, bot: 0xeef6ff, fog: 0xe8f0f8, fogN: 40, fogF: 170, snow: 3500, noGrass: true, tree: [0xd8eadf, 0xeef4f0, 0xa8ccb4, 0xffffff, 0xc4dccb], sunI: .62, hemi: .58, water: 0xd4ecfa },
    night: { top: 0x070f33, bot: 0x26346e, fog: 0x18224a, fogN: 45, fogF: 190, sunI: .45, sunC: 0x9fb4ff, hemi: .55, hemiSky: 0x7080d0, hemiGr: 0x203050, stars: true, moon: true, fire: true, noSun: true, flowers: .5 },
    sunset: { top: 0x3a4aa0, bot: 0xffa060, fog: 0xf8b888, sunI: 1.05, sunC: 0xffa060, hemiSky: 0xffc8a0, low: true, fire: true },
    dawn: { top: 0x6a90e0, bot: 0xffc8d8, fog: 0xffe0e8, sunI: 1, sunC: 0xffd0b0, hemiSky: 0xffe0f0, low: true }
  };
  let wx = WX.clear, wfx = [];
  let height = () => 0, bio = BIOME.steppe;
  const GATE_Z = 32, CLEAR = (x, z) => { const r = Math.hypot(x, z); const path = Math.abs(x) < 2.6 && z > 0 && z < GATE_Z + 4; return r < 24 || path || Math.hypot(x + 21, z + 4) < 9 || Math.hypot(x - 21, z + 4) < 7 || Math.hypot(x, z + 27) < 12; };
  function makeHeight(b, kind) {
    return (x, z) => {
      const r = Math.hypot(x, z), flat = Math.min(1, Math.max(0, (r - 26) / 16)) * (Math.abs(x) < 4 && z > 0 && z < 40 ? 0 : 1);
      let h;
      if (kind === 'desert') h = (Math.sin(x * .08 + Math.sin(z * .05) * 2) * 2.4 + E.fbm(x * .02 + 9, z * .02) * 3) * flat + (r > 70 ? (r - 70) * .3 : 0);
      else if (kind === 'canyon') { const n = E.fbm(x * .016 + 3, z * .016); h = (n > .5 ? 6 + Math.floor((n - .5) * 40) * 1.8 : n * 1.5) * flat; }
      else { h = (E.fbm(x * .022 + 5, z * .022 + 1) - .35) * b.amp * 4 * flat; if (kind === 'mountain') h += Math.max(0, r - 50) * .55 * (.6 + E.fbm(x * .04, z * .04)); else h += Math.max(0, r - 85) * .35; }
      if (b.water === 'river') { const rv = Math.abs(z + 34 + Math.sin(x * .05) * 6); if (rv < 9 && Math.abs(x) > 3) h = Math.min(h, -1.4 + rv * .14); }
      if (b.water === 'lake') { const rv = Math.hypot(x - 34, z + 30) - 16; if (rv < 6) h = Math.min(h, -1.4 + Math.max(0, rv) * .2); }
      return h;
    };
  }

  function nameSprite(t1, t2, col) {
    const tex = E.textTex([{ t: t1, font: '800 66px Nunito, sans-serif', color: '#ffffff', y: 92 }, { t: t2, font: '700 44px Nunito, sans-serif', color: '#ffe08a', y: 170 }], { w: 768, h: 230, bg: col || 'rgba(22,48,106,.92)', border: '#f6c34a' });
    const s = new T.Sprite(new T.SpriteMaterial({ map: tex, depthWrite: false })); s.scale.set(3.3, 1, 1); return s;
  }

  function green0(s) { return !['desert', 'canyon'].includes(s.biome); }
  function weatherFx(hemi) {
    const cam = new T.Group(); scene.add(cam); // follows the player
    if (wx.rain) {
      const n = wx.rain, pos = new Float32Array(n * 6);
      for (let i = 0; i < n; i++) { const x = E.rnd(-45, 45), y = E.rnd(0, 40), z = E.rnd(-45, 45); pos.set([x, y, z, x + .05, y - .9, z], i * 6); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
      const ln = new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xcfe0f0, transparent: true, opacity: .55 })); ln.frustumCulled = false; cam.add(ln);
      wfx.push({ rain: g, n, sp: wx.lightning ? 34 : 26 });
    }
    if (wx.snow) {
      const n = wx.snow, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) pos.set([E.rnd(-45, 45), E.rnd(0, 40), E.rnd(-45, 45)], i * 3);
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
      const pt = new T.Points(g, new T.PointsMaterial({ size: .35, map: E.glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)'), transparent: true, depthWrite: false })); pt.frustumCulled = false; cam.add(pt);
      wfx.push({ snow: g, n });
    }
    if (wx.stars) {
      const n = 1400, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = E.rnd(0, 6.28), b = E.rnd(.05, 1.5), r = 420; pos.set([Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r], i * 3); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
      const st = new T.Points(g, new T.PointsMaterial({ size: 2.2, color: 0xffffff, fog: false, sizeAttenuation: false, transparent: true, opacity: .9 })); scene.add(st); wfx.push({ twinkle: st.material });
    }
    if (wx.moon) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'); const gr = c.createRadialGradient(128, 128, 40, 128, 128, 128); gr.addColorStop(0, 'rgba(255,250,220,.9)'); gr.addColorStop(.45, 'rgba(255,250,220,.25)'); gr.addColorStop(1, 'rgba(255,250,220,0)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
      c.fillStyle = '#fff8dc'; c.beginPath(); c.arc(128, 128, 44, 0, 7); c.fill(); c.fillStyle = 'rgba(200,190,160,.45)'; [[112, 116, 9], [142, 134, 7], [124, 148, 5]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); });
      const m = new T.Sprite(new T.SpriteMaterial({ map: E.ctex(cv), fog: false, depthWrite: false, transparent: true })); m.scale.set(60, 60, 1); m.position.set(60, 110, -200); scene.add(m);
    }
    if (wx.rainbow) {
      const rb = new T.Group(); [0xff4040, 0xff9a30, 0xffe040, 0x50d050, 0x40a0ff, 0x5060e0, 0xa050e0].forEach((cc, i) => { const t = new T.Mesh(new T.TorusGeometry(90 - i * 2.2, 1.1, 6, 64, Math.PI), new T.MeshBasicMaterial({ color: cc, transparent: true, opacity: .38, fog: false, depthWrite: false })); rb.add(t); });
      rb.position.set(30, -8, -190); scene.add(rb);
    }
    if (wx.fire) { // campfire with warm light
      const f = new T.Group(); f.position.set(-5.6, height(-5.6, 6.6), 6.6); scene.add(f);
      for (let i = 0; i < 5; i++) { const l = new T.Mesh(new T.CylinderGeometry(.09, .11, 1.3, 6), E.mat(0x6a3a1a)); l.rotation.set(Math.PI / 2 - .35, i / 5 * Math.PI * 2, 0); l.position.y = .25; f.add(l); }
      for (let i = 0; i < 8; i++) { const r = E.rock(.25, 0x8a8a8a); r.position.set(Math.cos(i / 8 * 6.28) * .85, 0, Math.sin(i / 8 * 6.28) * .85); f.add(r); }
      const fl = new T.Mesh(new T.ConeGeometry(.45, 1.3, 8), new T.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: .9 })); fl.position.y = .8; f.add(fl);
      const fl2 = new T.Mesh(new T.ConeGeometry(.25, .9, 8), new T.MeshBasicMaterial({ color: 0xfff080 })); fl2.position.y = .7; f.add(fl2);
      const gl = new T.Sprite(new T.SpriteMaterial({ map: E.glowTex('rgba(255,190,90,.9)', 'rgba(255,120,40,0)'), transparent: true, depthWrite: false })); gl.scale.set(6, 6, 1); gl.position.y = 1; f.add(gl);
      const pl = new T.PointLight(0xffa050, wx.stars ? 2.2 : 1.2, 26, 1.6); pl.position.y = 1.6; f.add(pl);
      wfx.push({ fire: [fl, fl2, pl, gl] });
    }
    if (wx.stars) { // glowing lanterns around the aul
      [[-34, 14], [-30, 26], [32, 16], [28, 28], [-40, -16], [40, -14], [-12, 40], [14, 42], [-3, 30], [3, 30], [-21, 3], [21, 3]].forEach(([x, z]) => { const g = new T.Sprite(new T.SpriteMaterial({ map: E.glowTex('rgba(255,220,140,1)', 'rgba(255,160,60,0)'), transparent: true, depthWrite: false })); g.scale.set(3.4, 3.4, 1); g.position.set(x, height(x, z) + 2.4, z); scene.add(g); });
    }
    if (wx.lightning) wfx.push({ flash: hemi, base: hemi ? hemi.intensity : .7, next: 3 });
    wfx.push({ follow: cam });
  }
  function weatherFrame(dt, t, pp) {
    wfx.forEach(F => {
      if (F.follow && pp) F.follow.position.set(pp.x, 0, pp.z);
      if (F.rain) { const a = F.rain.attributes.position.array; for (let i = 0; i < F.n; i++) { const k = i * 6; a[k + 1] -= F.sp * dt; a[k + 4] -= F.sp * dt; if (a[k + 4] < -2) { const y = 40 + Math.random() * 4; a[k + 1] = y; a[k + 4] = y - .9; } } F.rain.attributes.position.needsUpdate = true; }
      if (F.snow) { const a = F.snow.attributes.position.array; for (let i = 0; i < F.n; i++) { const k = i * 3; a[k + 1] -= 2.4 * dt; a[k] += Math.sin(t + i) * .6 * dt; if (a[k + 1] < -1) a[k + 1] = 40; } F.snow.attributes.position.needsUpdate = true; }
      if (F.twinkle) F.twinkle.opacity = .75 + Math.sin(t * 2) * .15;
      if (F.fire) { const k = 1 + Math.sin(t * 13) * .08 + Math.sin(t * 7.3) * .06; F.fire[0].scale.set(k, k * (1 + Math.sin(t * 9) * .1), k); F.fire[1].scale.setScalar(2 - k); F.fire[2].intensity = (wx.stars ? 2.2 : 1.2) * k; }
      if (F.flash) { F.next -= dt; if (F.next < 0) { F.on = .25; F.next = 4 + Math.random() * 6; try { Music.thunder && Music.thunder(); } catch (e) {} } if (F.on > 0) { F.on -= dt; F.flash.intensity = F.base + (Math.sin(F.on * 60) > 0 ? 2.2 : .4); } else F.flash.intensity = F.base; }
    });
  }

  function build(s) {
    if (scene) dispose(scene);
    scene = new T.Scene(); hot = []; life = []; heroes = []; spin = []; flags = []; flyers = []; labelsEl.innerHTML = '';
    bio = BIOME[s.biome] || BIOME.steppe; height = makeHeight(bio, s.biome);
    wx = WX[(window.ERA && ERA[s.id] || {}).w] || WX.clear; wfx = [];
    scene.fog = new T.Fog(wx.fog || bio.fog, wx.fogN || 70, wx.fogF || 230);
    E.sky(scene, wx.top || bio.top, wx.bot || bio.bot);
    const sun = E.sunFace(26); sun.position.set(-70, wx.low ? 16 : 60, -120); sun.visible = !wx.noSun; scene.add(sun);
    sunL = E.lights(scene, 40, new T.Vector3(-30, 55, 30));
    if (wx.sunI) sunL.intensity = wx.sunI; if (wx.sunC) sunL.color.set(wx.sunC);
    const hemi = scene.children.find(o => o.isHemisphereLight); if (hemi) { if (wx.hemi) hemi.intensity = wx.hemi; if (wx.hemiSky) hemi.color.set(wx.hemiSky); if (wx.hemiGr) hemi.groundColor.set(wx.hemiGr); }
    const cl = E.clouds(scene, wx.dark ? 26 : wx.stars ? 4 : 14, 110, 38); life.push({ clouds: cl });
    if (wx.dark) cl.traverse(o => { if (o.isMesh) { o.material.color.set(wx.dark); o.material.emissive.set(0x30343c); } });
    if (wx.stars) cl.visible = false;
    weatherFx(hemi);

    /* terrain */
    const g = new T.PlaneGeometry(280, 280, 150, 150); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = [], c = new T.Color(), pal = (wx.g && green0(s) ? wx.g : bio.g).map(x => new T.Color(x)), SAND = new T.Color(0xf0d890), PATH = new T.Color(0xf2dca0), ROCK = new T.Color(0xa9a8a2), SNOW = new T.Color(0xffffff), MUD = new T.Color(0xc9b07a);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = height(x, z); p.setY(i, h);
      c.copy(pal[Math.floor(E.fbm(x * .09, z * .09) * 9) % 4]);
      if (s.biome === 'canyon' && h > 4) c.lerp(new T.Color(h % 3.6 < 1.8 ? 0xf6e4cc : 0xe9b98c), .8);
      if (s.biome === 'mountain' || s.biome === 'forest') { if (h > 10) c.lerp(ROCK, Math.min(1, (h - 10) / 8)); if (h > 22) c.lerp(SNOW, Math.min(1, (h - 22) / 6)); }
      if (Math.abs(x) < 2.4 && z > 6 && z < GATE_Z + 6) c.lerp(PATH, .7);
      if (h < -.4) c.lerp(MUD, .8);
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true })); ground.receiveShadow = true; scene.add(ground);
    if (bio.water) { const w = new T.Mesh(new T.PlaneGeometry(280, 280), new T.MeshStandardMaterial({ color: wx.water || (wx.stars ? 0x2a4a9a : 0x3fb6f2), roughness: .15, metalness: .1, transparent: true, opacity: .9 })); w.rotation.x = -Math.PI / 2; w.position.y = -.35; scene.add(w); }

    /* far mountains */
    const ringN = s.biome === 'mountain' ? 26 : s.biome === 'desert' ? 0 : 16;
    for (let i = 0; i < ringN; i++) { const a = i / ringN * Math.PI * 2 + E.rnd(0, .2), r = E.rnd(110, 135), h = s.biome === 'mountain' ? E.rnd(34, 55) : E.rnd(14, 26); const m = E.mountain(h, h * .8, h > 18, s.biome === 'canyon' ? 0xe8c39a : 0x9aa7b8); m.position.set(Math.cos(a) * r, height(Math.cos(a) * r, Math.sin(a) * r) - 1, Math.sin(a) * r); scene.add(m); }

    /* vegetation */
    const green = green0(s);
    const scatter = (n, rMin, rMax, filter) => { const out = []; let k = 0; while (out.length < n && k++ < n * 20) { const a = E.rnd(0, 6.28), r = Math.sqrt(E.rnd(rMin * rMin, rMax * rMax)), x = Math.cos(a) * r, z = Math.sin(a) * r, y = height(x, z); if (y < -.3 || (filter && !filter(x, z, y))) continue; out.push([x, y, z]); } return out; };
    if (green) {
      if (!wx.noGrass) scene.add(E.grassField(scatter(12000, 4, 95, (x, z) => !(Math.hypot(x, z) < 7.8) && !(Math.abs(x) < 2.4 && z > 6 && z < GATE_Z + 6)), 1.0, wx.grass));
      const patches = []; for (let i = 0; i < (wx.noGrass ? 0 : Math.round(26 * (wx.flowers || 1))); i++) { const a = E.rnd(0, 6.28), r = E.rnd(10, 60), cx = Math.cos(a) * r, cz = Math.sin(a) * r; if (Math.hypot(cx, cz) < 9 || (Math.abs(cx) < 4 && cz > 5)) continue; for (let k = 0; k < 40; k++) { const x = cx + E.rnd(-4, 4), z = cz + E.rnd(-4, 4), y = height(x, z); if (y > -.3) patches.push([x, y, z]); } }
      if (patches.length) scene.add(E.flowerField(patches, 1.6));
      const tp = scatter(s.biome === 'forest' ? 240 : 120, 30, 100, (x, z) => !CLEAR(x, z)); tp.forEach(q => q[3] = E.rnd(2.2, 3.6)); scene.add(E.treeField(tp, 1, wx.tree));
      if (s.biome === 'forest' || s.biome === 'mountain') scatter(60, 32, 90, (x, z) => !CLEAR(x, z)).forEach(q => { const t = E.tree(E.rnd(2.4, 3.4), 'pine'); t.position.set(q[0], q[1], q[2]); scene.add(t); });
      if (s.biome === 'forest') scatter(40, 30, 80, (x, z) => !CLEAR(x, z)).forEach(q => { const t = E.tree(E.rnd(2.4, 3.2), 'birch'); t.position.set(q[0], q[1], q[2]); scene.add(t); });
    } else {
      scene.add(E.grassField(scatter(900, 20, 90, (x, z) => !CLEAR(x, z)), 1.4, [0xb8c060, 0xa8b050, 0xc8c870]));
      scatter(50, 24, 100, (x, z) => !CLEAR(x, z)).forEach(q => { const r = E.rock(E.rnd(.8, 2.2), s.biome === 'canyon' ? 0xf0d8bc : 0xd9b27a); r.position.set(q[0], q[1], q[2]); scene.add(r); });
      if (s.biome === 'desert') scatter(30, 24, 90, (x, z) => !CLEAR(x, z)).forEach(q => { const t = E.tree(E.rnd(1.6, 2.2), ''); t.position.set(q[0], q[1], q[2]); t.traverse(o => { if (o.isMesh && o.geometry.type === 'IcosahedronGeometry') o.material = E.mat(0x9ab84a); }); scene.add(t); });
    }
    scatter(24, 26, 80, (x, z) => !CLEAR(x, z)).forEach(q => { const r = E.rock(E.rnd(.4, 1.0)); r.position.set(q[0], q[1], q[2]); scene.add(r); });

    /* aul: yurts */
    const ycol = ['#c8323a', '#2a6aa8', '#d0702a', '#2f8a5a'];
    [[-34, 14], [-30, 26], [32, 16], [28, 28], [-40, -16], [40, -14], [-12, 40], [14, 42]].forEach(([x, z], i) => { const y = s.o === 'ru' ? (i % 4 === 3 ? E.yurt(2.6, ycol[i % 4]) : E.izba(2.6, ['#2a6aa8', '#2f8a5a', '#c8323a'][i % 3])) : (i % 4 === 3 ? E.izba(2.4, '#2a6aa8') : E.yurt(2.8, ycol[i % 4])); y.position.set(x, height(x, z), z); y.rotation.y = Math.atan2(-x, -z); scene.add(y); });

    /* gate + exit portal */
    const gt = E.gate(6, 4.6); gt.position.set(0, height(0, GATE_Z), GATE_Z); scene.add(gt);
    const pr = E.portalRing(2.3); pr.position.set(0, 2.6, GATE_Z); scene.add(pr); spin.push(pr.userData.disc);
    addHot(pr, 'exit', '🌀', TT('На карту', 'Картаға'), 2.8);

    /* carpet + central book */
    const carpet = new T.Mesh(new T.CircleGeometry(7.5, 48), new T.MeshStandardMaterial({ map: E.carpetTex('#c8323a', '#f6c34a', '#2a5aa8'), roughness: .9 })); carpet.rotation.x = -Math.PI / 2; carpet.position.y = .06; carpet.receiveShadow = true; scene.add(carpet);
    const lect = new T.Group(); lect.position.set(0, 0, -2.5); scene.add(lect);
    const stand = new T.Mesh(new T.CylinderGeometry(.5, .9, 1.4, 8), E.mat(0x9a5a2e)); stand.position.y = .7; lect.add(stand);
    const bandS = new T.Mesh(new T.CylinderGeometry(.62, .62, .25, 8, 1, true), new T.MeshStandardMaterial({ map: E.bandTex('#c8323a', '#f6c34a') })); bandS.position.y = 1.1; lect.add(bandS);
    const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 640; drawBook(bcv, s, null); const btex = E.ctex(bcv);
    const book = new T.Mesh(new T.BoxGeometry(3.4, .14, 2.2), [E.mat(0xf6e7c2), E.mat(0xf6e7c2), new T.MeshBasicMaterial({ map: btex }), E.mat(new T.Color(s.color).getHex()), E.mat(0xf6e7c2), E.mat(0xf6e7c2)]);
    book.position.y = 1.65; book.rotation.x = .45; book.castShadow = true; lect.add(book);
    if (s.imgs[0]) E.img(s.imgs[0]).then(im => { if (im) { drawBook(bcv, s, im); btex.needsUpdate = true; } });
    const sp = E.sparkles(70, 2.4); sp.position.y = .8; lect.add(sp); spin.push(sp);
    addHot(lect, 'story', '📖', TT(s.ru, s.kk), 3.2);

    /* 3D heroes */
    s.chars.forEach((ch, i) => {
      const n = s.chars.length, a = Math.PI + Math.PI * (.18 + .64 * (i + .5) / n), r = 9.5;
      const x = Math.cos(a) * r * 1.2, z = Math.sin(a) * r * .85 + 1;
      const hero = E.character(ch.a, ch.a.creature ? 1.1 : 1.25); hero.position.set(x, height(x, z) + .02, z); hero.rotation.y = Math.atan2(-x, 12 - z); scene.add(hero);
      const tag = nameSprite(TT(ch.n.ru, ch.n.kk), TT(ch.n.kk, ch.n.ru)); tag.position.set(0, (hero.userData.h || 2.8) / hero.scale.x + .9, 0); tag.scale.multiplyScalar(1 / hero.scale.x); hero.add(tag);
      heroes.push(hero);
      addHot(hero, 'heroes', '🎭', TT(ch.n.ru, ch.n.kk), 0, { i }, 0, 'near');
    });

    /* museum */
    const mu = new T.Group(); mu.position.set(-21, height(-21, -4), -4); mu.rotation.y = .75; scene.add(mu);
    const marble = E.mat(0xfff8ec), turq = E.smooth(0x2fb4c8, { roughness: .35 });
    const floor = new T.Mesh(new T.CylinderGeometry(7, 7.4, .5, 10), marble); floor.position.y = .25; mu.add(floor);
    const rug = new T.Mesh(new T.CircleGeometry(6, 40), new T.MeshStandardMaterial({ map: E.carpetTex('#2a5aa8', '#f6c34a', '#c8323a') })); rug.rotation.x = -Math.PI / 2; rug.position.y = .52; mu.add(rug);
    for (let i = 0; i < 10; i++) { if (i === 2) continue; const an = i / 10 * Math.PI * 2; const cc = new T.Mesh(new T.CylinderGeometry(.28, .32, 4.6, 10), marble); cc.position.set(Math.cos(an) * 6.5, 2.8, Math.sin(an) * 6.5); mu.add(cc); const cap = new T.Mesh(new T.BoxGeometry(.8, .3, .8), E.gold()); cap.position.set(Math.cos(an) * 6.5, 5.15, Math.sin(an) * 6.5); mu.add(cap); }
    const dome = new T.Mesh(new T.SphereGeometry(7.2, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), turq); dome.position.y = 5.3; dome.scale.y = .55; mu.add(dome);
    const dband = new T.Mesh(new T.CylinderGeometry(7.25, 7.25, .7, 32, 1, true), new T.MeshStandardMaterial({ map: (() => { const t = E.bandTex('#2fb4c8', '#ffffff').clone(); t.repeat.set(10, 1); t.needsUpdate = true; return t; })() })); dband.position.y = 5.6; mu.add(dband);
    const finial = new T.Mesh(new T.SphereGeometry(.45, 16, 12), E.gold()); finial.position.y = 9.4; mu.add(finial);
    const sign = nameSprite(TT('Музей', 'Мұражай'), TT('Мұражай', 'Музей'), 'rgba(47,180,200,.95)'); sign.position.set(0, 10.6, 0); sign.scale.set(5, 1.5, 1); mu.add(sign);
    const ph = s.imgs.slice(0, 3);
    ph.forEach((k, i) => {
      const an = Math.PI * (1.1 + i * .4); const eg = new T.Group(); eg.position.set(Math.cos(an) * 4.2, .5, Math.sin(an) * 4.2); eg.lookAt(0, .5, 0); mu.add(eg);
      [-.7, .7].forEach(x => { const leg = new T.Mesh(new T.CylinderGeometry(.06, .06, 3.2, 5), E.mat(0x8a5a2e)); leg.position.set(x, 1.5, -.1); leg.rotation.z = x > 0 ? -.08 : .08; eg.add(leg); });
      const fr = E.frame(2.3, 1.7, E.ctex(placeholder(k))); fr.position.y = 2.3; fr.rotation.x = -.06; eg.add(fr);
      E.img(k).then(im => { if (!im) return; const t2 = new T.Texture(im); t2.encoding = T.sRGBEncoding; t2.needsUpdate = true; fr.userData.pic.material.map = t2; fr.userData.pic.material.needsUpdate = true; const ar = im.width / im.height; fr.scale.set(Math.max(.6, Math.min(1.5, ar / 1.35)), 1, 1); });
    });
    s.props.forEach((pk, i) => {
      const an = Math.PI * (-.15 + i * .3) - Math.PI * .05; const g2 = new T.Group(); g2.position.set(Math.cos(an) * 4.4, .5, Math.sin(an) * 4.4); mu.add(g2);
      g2.add(E.pedestal(0xfff4e0)); const pp = E.prop(pk, 1); pp.position.y = .55; g2.add(pp); if (pp.userData.spin) spin.push(pp.userData.spin); life.push({ turn: pp });
      addHot(g2, 'prop', '✨', (PROPS[pk] || {})[LG() === 'kk' ? 'kk' : 'ru'] || pk, 2.6, { p: pk }, 0, 'near');
    });
    addHot(mu, 'museum', '🏛', TT('Музей', 'Мұражай'), 8);

    /* cinema */
    const cin = new T.Group(); cin.position.set(21, height(21, -4), -4); cin.rotation.y = -.75; scene.add(cin);
    const scv = document.createElement('canvas'); scv.width = 1024; scv.height = 576; drawScreen(scv, s, null); const stex = E.ctex(scv);
    const scr = E.frame(8, 4.5, stex, 0xc8323a); scr.position.y = 4.6; cin.add(scr);
    if (s.imgs[0]) E.img(s.imgs[1] || s.imgs[0]).then(im => { if (im) { drawScreen(scv, s, im); stex.needsUpdate = true; } });
    [-4.2, 4.2].forEach(x => { const l = new T.Mesh(new T.BoxGeometry(.4, 7.2, .4), E.mat(0x9a5a2e)); l.position.set(x, 3.6, -.25); cin.add(l); });
    const ct = new T.Mesh(new T.BoxGeometry(9.6, .9, .5), [E.mat(0x7a3a22), E.mat(0x7a3a22), E.mat(0x7a3a22), E.mat(0x7a3a22), new T.MeshStandardMaterial({ map: (() => { const t = E.bandTex('#c8323a', '#f6c34a').clone(); t.repeat.set(5, 1); t.needsUpdate = true; return t; })() }), E.mat(0x7a3a22)]); ct.position.y = 7.3; cin.add(ct);
    for (let i = 0; i < 6; i++) { const seat = new T.Mesh(new T.CylinderGeometry(.5, .5, .4, 10), E.mat([0xc8323a, 0xf2b33d, 0x2a8ac0][i % 3])); seat.position.set((i % 3 - 1) * 1.8, .2, 3.2 + Math.floor(i / 3) * 1.6); cin.add(seat); }
    addHot(cin, 'trailer', '🎬', TT('Буктрейлер', 'Буктрейлер'), 8.2);

    /* mailbox */
    const mb = new T.Group(); mb.position.set(-9, height(-9, 13), 13); scene.add(mb);
    const post = new T.Mesh(new T.CylinderGeometry(.12, .14, 1.6, 6), E.mat(0x9a5a2e)); post.position.y = .8; mb.add(post);
    const box = new T.Mesh(new T.BoxGeometry(1.1, .8, 1.5), E.mat(0x2a8ac0)); box.position.y = 1.9; mb.add(box);
    const lid = new T.Mesh(new T.CylinderGeometry(.55, .55, 1.5, 16, 1, false, 0, Math.PI), E.mat(0x2a8ac0)); lid.rotation.z = Math.PI / 2; lid.rotation.y = Math.PI / 2; lid.position.y = 2.3; mb.add(lid);
    const flag = new T.Mesh(new T.BoxGeometry(.06, .7, .3), E.mat(0xd8453a)); flag.position.set(.6, 2.4, .3); mb.add(flag);
    const env = new T.Group(); env.position.y = 3.4; mb.add(env);
    env.add(new T.Mesh(new T.BoxGeometry(1.2, .8, .05), E.smooth(0xfff8ec)));
    const flap = new T.Mesh(new T.ConeGeometry(.6, .5, 4, 1), E.mat(0xf2e0b8)); flap.rotation.set(Math.PI / 2, 0, Math.PI / 4); flap.scale.set(1.4, 1, .1); flap.position.set(0, .12, .03); env.add(flap);
    const seal = new T.Mesh(new T.CircleGeometry(.12, 12), E.mat(0xc8323a)); seal.position.z = .06; env.add(seal);
    life.push({ bob: env, base: 3.4, ph: 2, rot: true });
    addHot(mb, 'letters', '✉', TT('Письмо герою', 'Кейіпкерге хат'), 4.4);

    /* quest stones */
    const qs = new T.Group(); qs.position.set(9, height(9, 13), 13); scene.add(qs);
    ['#ff5d73', '#ffd23f', '#3fb6f2'].forEach((cc, i) => { const st = new T.Mesh(new T.DodecahedronGeometry(.75, 0), E.mat(new T.Color(cc).getHex())); st.position.set((i - 1) * 1.6, .7 + (i === 1 ? .3 : 0), 0); st.scale.y = 1.3; st.castShadow = true; qs.add(st); const num = new T.Sprite(new T.SpriteMaterial({ map: E.textTex([{ t: String(i + 1), font: '900 180px Nunito, sans-serif', color: '#fff' }], { w: 256, h: 256 }), depthWrite: false })); num.position.set((i - 1) * 1.6, 2.1 + (i === 1 ? .3 : 0), 0); num.scale.set(1, 1, 1); qs.add(num); life.push({ bob: num, base: num.position.y, ph: i }); });
    addHot(qs, 'tasks', '🧩', TT('Задания', 'Тапсырмалар'), 3.6);

    /* landmark */
    const lm = new T.Group(); lm.position.set(0, height(0, -27), -27); scene.add(lm);
    const mk = s.mark;
    if (mk === 'mausoleum') lm.add(E.mausoleum(3.2));
    else if (mk === 'tower') { const t = E.baiterek(2.6); lm.add(t); spin.push(t.userData.ball); }
    else if (mk === 'dombyra') { const d = E.dombyra(2.4); d.position.y = 2; d.rotation.z = .25; lm.add(d); life.push({ bob: d, base: 2, ph: 1 }); }
    else if (mk === 'banners') { [-7, -3.5, 0, 3.5, 7].forEach((x, i) => { const f = E.banner([0x2a8ac0, 0xc8323a, 0xf2b33d, 0x2f8a5a, 0x7a3ab0][i]); f.position.set(x, 0, Math.abs(x) * .4); f.scale.setScalar(1.8); lm.add(f); flags.push(f.userData.flag); }); }
    else if (mk === 'petroglyph') { for (let i = 0; i < 7; i++) { const r = E.rock(E.rnd(1.6, 2.6), 0x8a6a5a); r.position.set(E.rnd(-8, 8), 1, E.rnd(-3, 3)); lm.add(r); } const w = E.character({ creature: '🐺' }, 1.6); w.position.set(0, 2.6, 1); lm.add(w); }
    else if (mk === 'tree') { const tr = new T.Group(); const trunk = new T.Mesh(new T.CylinderGeometry(1, 1.7, 13, 10), E.mat(0x8a5a32)); trunk.position.y = 6.5; tr.add(trunk); for (let i = 0; i < 10; i++) { const cc = new T.Mesh(new T.IcosahedronGeometry(E.rnd(2.6, 3.8), 0), E.mat([0x4fae55, 0x5fbf5a, 0x3f9a4a][i % 3])); cc.position.set(E.rnd(-3.5, 3.5), 13 + E.rnd(-1, 3), E.rnd(-3.5, 3.5)); tr.add(cc); } const egg = new T.Mesh(new T.SphereGeometry(1, 24, 16), E.smooth(0xffc840, { metalness: .85, roughness: .2, emissive: 0x664400 })); egg.position.y = 17.6; egg.scale.y = 1.25; tr.add(egg); spin.push(egg); lm.add(E.shadow(tr)); }
    else if (mk === 'cave') { for (let i = 0; i < 6; i++) { const r = E.rock(E.rnd(2.5, 4), 0xf0d8bc); r.position.set(E.rnd(-7, 7), 1.5, E.rnd(-2, 2)); lm.add(r); } const pr2 = E.portalRing(2.4, 0x9a5aff); pr2.position.set(0, 2.4, 3.8); lm.add(pr2); spin.push(pr2.userData.disc); }
    else if (mk === 'dunes') { const d = new T.Mesh(new T.SphereGeometry(10, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), E.mat(0xf5d58a)); d.scale.set(1.6, .45, 1); lm.add(d); }
    else if (mk === 'forest') { for (let i = 0; i < 14; i++) { const t = E.tree(E.rnd(2.6, 3.6), 'birch'); t.position.set(E.rnd(-9, 9), 0, E.rnd(-4, 4)); lm.add(t); } }
    else if (mk === 'mountains') { [[-9, 15], [0, 22], [9, 16]].forEach(([x, h]) => { const m = E.mountain(h, h * .6, true); m.position.x = x; lm.add(m); }); }
    else if (mk === 'river' || mk === 'lake') { const boat = new T.Mesh(new T.CapsuleGeometry(.7, 2.6, 4, 8), E.mat(0x9a5a2e)); boat.rotation.z = Math.PI / 2; boat.scale.y = .5; boat.position.y = .4; lm.add(boat); for (let i = 0; i < 3; i++) { const y = E.yurt(2.6, ycol[i]); y.position.set(-6 + i * 6, 0, -4); lm.add(y); } }
    else if (mk === 'izba') { for (let i = 0; i < 3; i++) { const y = E.izba(3.2, ['#c8323a', '#2a6aa8', '#2f8a5a'][i]); y.position.set(-7 + i * 7, 0, Math.abs(i - 1) * 2); lm.add(y); } const w = E.windmill(2.4); w.position.set(11, 0, 3); lm.add(w); life.push({ blades: w.userData.blades }); }
    else if (mk === 'windmill') { const w = E.windmill(4); lm.add(w); life.push({ blades: w.userData.blades }); [-8, 8].forEach((x, i) => { const y = i ? E.yurt(2.6, '#c8323a') : E.izba(2.8, '#2a6aa8'); y.position.set(x, 0, 2); lm.add(y); }); }
    else if (mk === 'rocket') { const r = E.rocket(3.4); lm.add(r); life.push({ flame: r.userData.flame }); }
    else if (mk === 'scales') { const sc = E.scales(3.6); lm.add(sc); life.push({ beam: sc.userData.beam }); }
    else if (mk === 'kremlin') { const k = E.kremlin(3); lm.add(k); spin.push(k.userData.star); }
    else { for (let i = 0; i < 4; i++) { const y = E.yurt(2.8, ycol[i]); y.position.set(-7.5 + i * 5, 0, Math.abs(i - 1.5) * 1.5); lm.add(y); } }
    const tt = nameSprite(TT(s.ru, s.kk), TT(s.kk, s.ru), 'rgba(200,50,58,.95)'); tt.scale.set(12, 3.6, 1); tt.position.set(0, mk === 'tower' ? 20 : mk === 'tree' ? 23 : mk === 'rocket' ? 17 : mk === 'kremlin' ? 21 : 12.5, -27); scene.add(tt);

    /* bees & butterflies */
    for (let i = 0; i < 10; i++) { const b = i % 2 ? bee() : butterfly(); const a = E.rnd(0, 6.28), r = E.rnd(9, 22); b.userData = { cx: Math.cos(a) * r, cz: Math.sin(a) * r, r: E.rnd(1.5, 3), sp: E.rnd(.8, 1.5), ph: E.rnd(0, 6) }; scene.add(b); flyers.push(b); }

    /* herd, eagles, player */
    E.creatures().then(cr => {
      if (story !== s) return;
      for (let k = 0; k < 6; k++) { const h = E.instance(cr.horse, E.rnd(2.1, 2.6), [0xffffff, 0xc89060, 0x8a6048, 0xf0e0c8, 0xb07850, 0xffffff][k]); scene.add(h); life.push({ herd: h, a: k * .4, r: 52 + k * 1.8, sp: 5 }); }
      for (let k = 0; k < 3; k++) { const e = E.instance(cr.eagle, 2.4); scene.add(e); life.push({ eagle: e, a: k * 2.1, r: 24 + k * 9, y: 20 + k * 4, sp: .32 }); }
      const barys = E.leopard(2.2), berkut = E.instance(cr.eagle, 2.6);
      scene.add(barys); scene.add(berkut);
      ctrl = E.Controller({ camera, horse: barys, eagle: berkut, rideSpeed: 6.5, flySpeed: 11, camDist: 7.5, camH: 3.2, minAlt: 3, maxAlt: 45,
        ground: (x, z) => Math.max(height(x, z), bio.water ? -.35 : -99) + (Math.hypot(x, z) < 7.5 ? .06 : 0), inside: (x, z) => Math.hypot(x, z) < 80 });
      ctrl.place(0, GATE_Z - 13, Math.PI); ctrl.setMode(mode); ctrl.snap(); if (frozen) ctrl.st.active = false;
    });
  }

  function bee() { const g = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(.18, 10, 8), E.mat(0xffc93a)); b.scale.set(1, .9, 1.3); g.add(b); [-.06, .08].forEach(z => { const s2 = new T.Mesh(new T.TorusGeometry(.17, .04, 4, 12), E.mat(0x2a1a10)); s2.position.z = z; g.add(s2); }); [-1, 1].forEach(sd => { const w = new T.Mesh(new T.CircleGeometry(.14, 10), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .75, side: T.DoubleSide })); w.position.set(sd * .14, .16, 0); w.rotation.set(-Math.PI / 2, 0, sd * .5); g.add(w); }); return g; }
  function butterfly() { const g = new T.Group(); const colr = E.pick([0xff5d73, 0xc77dff, 0x3fb6f2, 0xffd23f]); [-1, 1].forEach(sd => { const w = new T.Mesh(new T.CircleGeometry(.3, 12), new T.MeshBasicMaterial({ color: colr, side: T.DoubleSide })); w.position.x = sd * .25; w.rotation.x = -Math.PI / 2; w.userData.sd = sd; g.add(w); }); g.add(new T.Mesh(new T.CapsuleGeometry(.04, .3, 3, 6), E.mat(0x2a1a10)).rotateX(Math.PI / 2)); g.userData.wings = true; return g; }

  function drawBook(cv, s, im) {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height;
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#f6e2b4'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(160,100,40,.25)'; c.fillRect(W / 2 - 4, 0, 8, H);
    c.save(); E.roundRect(c, 40, 40, W / 2 - 80, H - 80, 24); c.clip();
    if (im) { const r = Math.max((W / 2 - 80) / im.width, (H - 80) / im.height); c.drawImage(im, 40 + (W / 2 - 80 - im.width * r) / 2, 40 + (H - 80 - im.height * r) / 2, im.width * r, im.height * r); }
    else { c.fillStyle = '#8fd8ff'; c.fillRect(0, 0, W, H); c.drawImage(Avatar.canvas(s.chars[0].a, 512), 50, 80, 400, 400); }
    c.restore(); c.strokeStyle = '#f2b33d'; c.lineWidth = 10; E.roundRect(c, 40, 40, W / 2 - 80, H - 80, 24); c.stroke();
    c.textAlign = 'center'; c.fillStyle = '#16306a'; c.font = '800 52px Nunito, sans-serif';
    const words = s.ru.split(' '); let l1 = '', l2 = ''; words.forEach(w => { if (c.measureText(l1 + ' ' + w).width < W / 2 - 90 && !l2) l1 = (l1 + ' ' + w).trim(); else l2 = (l2 + ' ' + w).trim(); });
    c.fillText(l1, W * .75, 115); if (l2) c.fillText(l2, W * .75, 175);
    c.fillStyle = '#c8323a'; c.font = '700 36px Nunito, sans-serif'; c.fillText(s.kk, W * .75, 240);
    c.fillStyle = '#3a4a6a'; c.font = '600 27px Nunito, sans-serif'; let line = '', y = 310; for (const w of s.sum.ru.split(' ')) { if (c.measureText(line + w).width > W / 2 - 110) { c.fillText(line, W * .75, y); y += 38; line = ''; if (y > 580) break; } line += w + ' '; } if (y <= 580) c.fillText(line, W * .75, y);
  }
  function drawScreen(cv, s, im) {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4cb8ff'); g.addColorStop(1, '#16306a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (im) { const r = Math.max(W / im.width, H / im.height); c.globalAlpha = .85; c.drawImage(im, (W - im.width * r) / 2, (H - im.height * r) / 2, im.width * r, im.height * r); c.globalAlpha = 1; }
    const g2 = c.createLinearGradient(0, H * .45, 0, H); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(10,20,60,.85)'); c.fillStyle = g2; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.fillStyle = '#ffd23f'; c.font = '800 40px Nunito, sans-serif'; c.fillText('БУКТРЕЙЛЕР · BOOKTRAILER', W / 2, 80);
    c.fillStyle = '#fff'; let fs2 = 62; c.font = `900 ${fs2}px Nunito, sans-serif`; while (c.measureText(s.ru).width > W - 60 && fs2 > 30) { fs2 -= 4; c.font = `900 ${fs2}px Nunito, sans-serif`; } c.fillText(s.ru, W / 2, H - 70);
    c.beginPath(); c.arc(W / 2, H / 2, 72, 0, 7); c.fillStyle = 'rgba(255,210,63,.95)'; c.fill(); c.fillStyle = '#16306a'; c.beginPath(); c.moveTo(W / 2 - 22, H / 2 - 36); c.lineTo(W / 2 + 38, H / 2); c.lineTo(W / 2 - 22, H / 2 + 36); c.fill();
  }
  function placeholder(k) { const cv = document.createElement('canvas'); cv.width = 440; cv.height = 320; const c = cv.getContext('2d'); c.fillStyle = '#fff4e0'; c.fillRect(0, 0, 440, 320); c.fillStyle = '#16306a'; c.font = '700 22px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('🏛', 220, 140); const cap = (IMG_CAP[k] || {}).ru || ''; c.fillText(cap.slice(0, 36), 220, 190); c.fillText(cap.slice(36, 72), 220, 220); return cv; }

  /* hotspots: show = 'always' | 'near' */
  function addHot(obj, tab, ico, name, h, extra, dy, show) {
    const el = document.createElement('button'); el.className = 'hot' + (show === 'near' ? ' small' : ''); el.innerHTML = `<i>${ico}</i><span>${name}</span>`;
    el.onclick = () => activateHot(H);
    labelsEl.appendChild(el); const H = { obj, tab, el, h, extra, dy: dy || 0, show: show || 'always', name }; hot.push(H);
  }
  function activateHot(Hh) { if (Hh.tab === 'exit') return exit(); onHotspot(Hh.tab, Hh.extra); }
  function exit() { if (exiting) return; exiting = true; onExit(); }
  function dispose(sc) { sc.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  function resize() { const W = canvas.clientWidth, H = canvas.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
  addEventListener('resize', () => running && resize());

  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect(); let best = null, bd = 90;
    hot.forEach(Hh => { Hh.obj.getWorldPosition(tmp); tmp.y += (Hh.h || 1.4) * .6; tmp.project(camera); if (tmp.z > 1) return; const x = (tmp.x * .5 + .5) * r.width, y = (-tmp.y * .5 + .5) * r.height; const d = Math.hypot(x - (e.clientX - r.left), y - (e.clientY - r.top)); if (d < bd) { bd = d; best = Hh; } });
    if (best) activateHot(best);
  });

  function loop() { if (!running) return; requestAnimationFrame(loop); try { frame(); } catch (err) { console.error('portal loop', err && err.stack || err); } }
  function frame() {
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    if (ctrl) ctrl.update(dt); else { camera.position.set(0, 7, GATE_Z + 4); camera.lookAt(0, 2, 0); }
    const pp = ctrl ? ctrl.obj.position : null;
    if (pp) { sunL.position.set(pp.x - 30, wx.low ? 22 : 55, pp.z + (wx.low ? -10 : 30)); sunL.target.position.copy(pp); }
    weatherFrame(dt, t, pp);
    spin.forEach(o => o && (o.rotation.y += dt * .6));
    flags.forEach((f, i) => { const p = f.geometry.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k); p.setZ(k, Math.sin(x * 4 + t * 4 + i) * .08 * (x + .55)); } p.needsUpdate = true; });
    heroes.forEach((h, i) => { let look = null; if (pp && Math.hypot(pp.x - h.position.x, pp.z - h.position.z) < 12) look = Math.atan2(pp.x - h.position.x, pp.z - h.position.z); E.animChar(h, t + i * .7, look); });
    flyers.forEach(f => { const u = f.userData, a = t * u.sp + u.ph; f.position.set(u.cx + Math.cos(a) * u.r, 1.2 + Math.sin(a * 2.3) * .4, u.cz + Math.sin(a) * u.r); f.rotation.y = -a; if (u.wings) f.children.forEach(w => { if (w.userData.sd) w.rotation.y = w.userData.sd * Math.sin(t * 18) * .9; }); });
    life.forEach(L => {
      if (L.clouds) L.clouds.children.forEach(c => { c.position.x += c.userData.v * dt * 2; if (c.position.x > 120) c.position.x = -120; });
      if (L.bob) { L.bob.position.y = L.base + Math.sin(t * 1.4 + L.ph) * .2; if (L.rot) L.bob.rotation.y = t * .7; }
      if (L.turn) L.turn.rotation.y = t * .35;
      if (L.blades) L.blades.rotation.z += dt * 1.1; if (L.flame) L.flame.scale.y = 1 + Math.sin(t * 20) * .15; if (L.beam) L.beam.rotation.z = Math.sin(t * .8) * .12;
      if (L.herd) { L.a += L.sp * dt / L.r; const x = Math.cos(L.a) * L.r, z = Math.sin(L.a) * L.r; L.herd.position.set(x, Math.max(height(x, z), -.4), z); L.herd.rotation.y = -L.a; L.herd.userData.mixer.update(dt); }
      if (L.eagle) { L.a += L.sp * dt; L.eagle.position.set(Math.cos(L.a) * L.r, L.y + Math.sin(L.a * 2), Math.sin(L.a) * L.r); L.eagle.rotation.set(0, -L.a, .4, 'YXZ'); L.eagle.userData.mixer.update(dt); }
    });
    const W = canvas.clientWidth, H = canvas.clientHeight; let nb = null, nd = 1e9;
    hot.forEach(Hh => {
      Hh.obj.getWorldPosition(tmp); const wx = tmp.x, wz = tmp.z; tmp.y += (Hh.h || (Hh.obj.userData.h || 2.6) * 1.05) + Hh.dy + (Hh.tab === 'heroes' ? .9 : 0); tmp.project(camera);
      const pd = pp ? Math.hypot(pp.x - wx, pp.z - wz) : 99, cd = Math.hypot(camera.position.x - wx, camera.position.z - wz);
      const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.2 && Math.abs(tmp.y) < 1.2 && (Hh.show === 'near' ? pd < 7 : cd < 60);
      Hh.el.style.display = vis ? '' : 'none'; if (vis) Hh.el.style.transform = `translate(-50%,-100%) translate(${(tmp.x * .5 + .5) * W}px,${(-tmp.y * .5 + .5) * H}px)`;
      if (pp) { const lim = Hh.show === 'near' ? 4 : Hh.tab === 'museum' ? 9 : Hh.tab === 'trailer' ? 8 : 5; if (pd < lim && pd < nd) { nd = pd; nb = Hh; } }
    });
    if (nb !== near) { hot.forEach(h => h.el.classList.toggle('near', h === nb)); near = nb; onNear && onNear(nb ? { tab: nb.tab, name: nb.name, extra: nb.extra } : null); }
    if (pp && Math.hypot(pp.x, pp.z - GATE_Z) < 2.2 && ctrl.st.mode === 'ride') exit();
    renderer.render(scene, camera);
  }

  if (window.__DEBUG) window.__pv = { get ctrl() { return ctrl; } };
  return {
    open(s) { story = s; ctrl = null; near = null; exiting = false; build(s); running = true; resize(); clock.getDelta(); loop(); },
    close() { running = false; labelsEl.innerHTML = ''; },
    setMode(m) { mode = m; if (ctrl) ctrl.setMode(m); },
    freeze(v) { frozen = v; if (ctrl) ctrl.st.active = !v; Object.keys(E.KEYS).forEach(k => E.KEYS[k] = 0); },
    activate() { if (near) activateHot(near); },
    talk(i, sec) { const h = heroes[i]; if (h && h.userData) { h.userData.talk = sec || 3; h.userData.wave = 1.6; } },
    resize, get near() { return near; }
  };
};
