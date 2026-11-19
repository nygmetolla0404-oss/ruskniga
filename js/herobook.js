/* Title page: an AR-style 3D book "Kazakh Fairy Tales & Legends" that opens by itself
   and lets a little world pop up from its pages */
window.HeroBook = function (canvas, opt) {
  const T = THREE, E = ENG; opt = opt || {};
  const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.outputEncoding = T.sRGBEncoding; r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(34, 1, .1, 100);
  scene.add(new T.HemisphereLight(0xfff6e8, 0x6080b0, .9));
  const sun = new T.DirectionalLight(0xfff1dc, 1.2); sun.position.set(-4, 10, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); scene.add(sun);
  const W = 3, H = 4, TH = .09;
  const world = new T.Group(); scene.add(world);
  const bookG = new T.Group(); world.add(bookG);

  /* --- AR marker under the book --- */
  const ar = new T.Group(); world.add(ar);
  const ringTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.strokeStyle = 'rgba(120,230,255,.9)'; g.lineWidth = 6; g.beginPath(); g.arc(256, 256, 240, 0, 7); g.stroke(); g.lineWidth = 2; g.setLineDash([14, 10]); g.beginPath(); g.arc(256, 256, 210, 0, 7); g.stroke(); g.setLineDash([]); g.strokeStyle = 'rgba(120,230,255,.25)'; for (let i = 32; i < 512; i += 32) { g.beginPath(); g.moveTo(i, 40); g.lineTo(i, 472); g.stroke(); g.beginPath(); g.moveTo(40, i); g.lineTo(472, i); g.stroke(); } return E.ctex(c); })();
  const ring = new T.Mesh(new T.PlaneGeometry(9, 9), new T.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, opacity: .55 })); ring.rotation.x = -Math.PI / 2; ring.position.y = -.25; ar.add(ring);
  const scan = new T.Mesh(new T.RingGeometry(1, 1.08, 64), new T.MeshBasicMaterial({ color: 0x8ff0ff, transparent: true, depthWrite: false, side: T.DoubleSide })); scan.rotation.x = -Math.PI / 2; scan.position.y = -.24; ar.add(scan);
  const shadow = new T.Mesh(new T.PlaneGeometry(14, 14), new T.ShadowMaterial({ opacity: .22 })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.24; shadow.receiveShadow = true; ar.add(shadow);

  /* --- textures --- */
  const F = 'Nunito, sans-serif';
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = E.ctex(c); t.anisotropy = r.capabilities.getMaxAnisotropy(); t.userData = { c, draw }; draw(c.getContext('2d'), w, h); return t; }
  function orn(g, x, y, s, col) { // қошқар мүйіз curl
    g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(0, 0, -40, -10, -40, 20); g.bezierCurveTo(-40, 40, -15, 40, -15, 25); g.stroke();
    g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(0, 0, 40, -10, 40, 20); g.bezierCurveTo(40, 40, 15, 40, 15, 25); g.stroke(); g.restore();
  }
  function wrap(g, text, x, y, mw, lh) { let line = ''; for (const w of text.split(' ')) { if (g.measureText(line + w).width > mw && line) { g.fillText(line.trim(), x, y); y += lh; line = ''; } line += w + ' '; } g.fillText(line.trim(), x, y); return y; }
  const coverTex = canvasTex(1024, 1366, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1f4f9f'); gr.addColorStop(1, '#0f2a62'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .04})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.strokeStyle = '#f2c14e'; g.lineWidth = 12; g.strokeRect(40, 40, w - 80, h - 80); g.lineWidth = 3; g.strokeRect(70, 70, w - 140, h - 140);
    [[110, 120, 1], [w - 110, 120, 1], [110, h - 150, -1], [w - 110, h - 150, -1]].forEach(([x, y, f]) => { g.save(); g.translate(x, y); g.scale(1, f); orn(g, 0, -10, 1.1, '#f2c14e'); g.restore(); });
    for (let x = 160; x < w - 160; x += 70) orn(g, x, 150, .55, 'rgba(242,193,78,.75)');
    for (let x = 160; x < w - 160; x += 70) { g.save(); g.translate(x, h - 175); g.scale(1, -1); orn(g, 0, 0, .55, 'rgba(242,193,78,.75)'); g.restore(); }
    // shanyrak emblem
    g.save(); g.translate(w / 2, 470); g.strokeStyle = '#f2c14e'; g.lineWidth = 10; g.beginPath(); g.arc(0, 0, 150, 0, 7); g.stroke(); g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.stroke();
    for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(0, 0, 118, 40, i * Math.PI / 3 + Math.PI / 6, 0, 7); g.stroke(); }
    g.fillStyle = '#ffd96a'; g.beginPath(); g.arc(0, 0, 34, 0, 7); g.fill(); g.restore();
    g.textAlign = 'center'; g.fillStyle = '#ffe9a8'; g.font = `900 34px ${F}`; g.fillText('«АДАЛ АЗАМАТ» · 3D ПОРТАЛ', w / 2, 255);
    g.fillStyle = '#ffffff'; g.font = `900 104px ${F}`; g.fillText('ОТ КНИГИ', w / 2, 760); g.font = `900 104px ${F}`; g.fillText('К ЖИЗНИ', w / 2, 870);
    g.fillStyle = '#ffd23f'; g.font = `800 50px ${F}`; g.fillText('Литературный портал', w / 2, 950);
    g.fillStyle = '#bfe0ff'; g.font = `800 44px ${F}`; g.fillText('КІТАПТАН ӨМІРГЕ', w / 2, 1035); g.fillText('Әдеби портал', w / 2, 1090);
    g.fillStyle = '#ffe9a8'; g.font = `700 32px ${F}`; g.fillText('6 регионов · 36 книг · 2 языка', w / 2, 1150);
    g.fillStyle = 'rgba(255,255,255,.8)'; g.font = `700 28px ${F}`; g.fillText((window.AUTHOR ? 'А. Ш. Тасбалта' : ''), w / 2, h - 105);
  });
  const leftTex = canvasTex(1024, 1366, (g, w, h) => {
    g.fillStyle = '#fbf3df'; g.fillRect(0, 0, w, h); const sh = g.createLinearGradient(w, 0, w - 160, 0); sh.addColorStop(0, 'rgba(120,80,30,.32)'); sh.addColorStop(1, 'rgba(120,80,30,0)'); g.fillStyle = sh; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.fillStyle = '#16306a'; g.font = `900 64px ${F}`; g.fillText('Остров «Адал азамат»', w / 2, 150); g.fillStyle = '#c8323a'; g.font = `800 44px ${F}`; g.fillText('«Адал азамат» аралы', w / 2, 215);
    const I = window.ISLAND, cx = w / 2, cy = 520, k = 24;
    if (I) {
      const sh = I.shape(200); g.beginPath(); sh.forEach(([x, z], i) => i ? g.lineTo(cx + x * k, cy + z * k) : g.moveTo(cx + x * k, cy + z * k)); g.closePath(); g.fillStyle = '#8fd46a'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#3f8a3a'; g.stroke();
      (window.REGIONS || []).forEach((R, ri) => { const a = I.regionAngle(ri); g.save(); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 300, a - Math.PI / 6, a + Math.PI / 6); g.closePath(); g.clip(); g.globalAlpha = .28; g.fillStyle = R.color; g.beginPath(); sh.forEach(([x, z], i) => i ? g.lineTo(cx + x * k, cy + z * k) : g.moveTo(cx + x * k, cy + z * k)); g.fill(); g.restore(); g.globalAlpha = 1; g.font = `64px ${F}`; g.fillText(R.ico, cx + Math.cos(a) * 205 - 30, cy + Math.sin(a) * 205 + 22); });
      g.fillStyle = '#46c0f5'; g.beginPath(); g.arc(cx, cy, I.LAKE * k, 0, 7); g.fill();
      (window.STORIES || []).forEach((s, i) => { const p = I.bookPos(s.region, s.slot), x = cx + p.x * k, y = cy + p.z * k; g.fillStyle = s.o === 'kz' ? '#3fb6f2' : '#ffd23f'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); g.lineWidth = 3; g.strokeStyle = '#16306a'; g.stroke(); });
    }
    g.fillStyle = '#3a4a6a'; g.font = `700 34px ${F}`; g.textAlign = 'left'; let y = 900;
    ['📖 36 книг: 18 русских + 18 казахских', '🐆 Барс Ақбарыс · 🦅 беркут Қыран', '⏳ Машина времени: от сказок до будущего', '✉ Письма героев · ✍ ответ герою', '🎬 Буктрейлеры · 🏛 музей · 🎙 речь'].forEach(t => { g.fillText(t, 110, y); y += 70; });
  });
  const rightTex = canvasTex(1024, 1366, (g, w, h) => {
    g.fillStyle = '#fbf3df'; g.fillRect(0, 0, w, h); const sh = g.createLinearGradient(0, 0, 160, 0); sh.addColorStop(0, 'rgba(120,80,30,.32)'); sh.addColorStop(1, 'rgba(120,80,30,0)'); g.fillStyle = sh; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.fillStyle = '#c8323a'; g.font = `italic 800 52px ${F}`; g.fillText('Кітап — өмір мектебі', w / 2, h - 300);
    g.fillStyle = '#16306a'; g.font = `800 44px ${F}`; g.fillText('Книга — школа жизни', w / 2, h - 230);
    g.fillStyle = '#5b6478'; g.font = `600 32px ${F}`; wrap(g, 'Читай, проживай, выбирай по совести — и стань Адал азаматом!', w / 2, h - 165, w - 200, 42);
  });

  /* --- book --- */
  const board = E.smooth(0x173f86, { roughness: .55 }), paperM = new T.MeshStandardMaterial({ color: 0xf8efd8, roughness: .95 });
  const back = new T.Mesh(new T.BoxGeometry(W + .08, TH, H + .16), board); back.position.set(W / 2 + .04, TH / 2, 0); back.castShadow = back.receiveShadow = true; bookG.add(back);
  const spine = new T.Mesh(new T.CylinderGeometry(.2, .2, H + .16, 16, 1, false, Math.PI, Math.PI), board); spine.rotation.x = Math.PI / 2; spine.position.set(0, TH, 0); bookG.add(spine);
  const edgeM = new T.MeshStandardMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 16; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#f3ead6'; g.fillRect(0, 0, 16, 64); for (let y = 0; y < 64; y += 4) { g.fillStyle = 'rgba(150,120,70,.35)'; g.fillRect(0, y, 16, 1); } const t = E.ctex(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(20, 3); return t; })(), roughness: .95 });
  const blockR = new T.Mesh(new T.BoxGeometry(W - .04, .26, H - .04), [edgeM, edgeM, paperM, paperM, edgeM, edgeM]); blockR.position.set(W / 2, TH + .13, 0); blockR.castShadow = true; bookG.add(blockR);
  const pr = new T.PlaneGeometry(W - .06, H - .06); pr.rotateX(-Math.PI / 2);
  const rightPage = new T.Mesh(pr, new T.MeshStandardMaterial({ map: rightTex, roughness: .9 })); rightPage.position.set(W / 2, TH + .262, 0); rightPage.receiveShadow = true; bookG.add(rightPage);
  const coverPivot = new T.Group(); coverPivot.position.set(0, TH + .27, 0); bookG.add(coverPivot);
  const coverBoard = new T.Mesh(new T.BoxGeometry(W + .08, TH, H + .16), board); coverBoard.position.set(W / 2 + .04, TH / 2, 0); coverBoard.castShadow = true; coverPivot.add(coverBoard);
  const cf = new T.PlaneGeometry(W + .04, H + .12); cf.rotateX(-Math.PI / 2); const coverFace = new T.Mesh(cf, new T.MeshStandardMaterial({ map: coverTex, roughness: .5, metalness: .05 })); coverFace.position.set(W / 2 + .04, TH + .002, 0); coverPivot.add(coverFace);
  const lf = new T.PlaneGeometry(W - .06, H - .06); lf.rotateZ(Math.PI); lf.rotateX(Math.PI / 2); const leftFace = new T.Mesh(lf, new T.MeshStandardMaterial({ map: leftTex, roughness: .9 })); leftFace.position.set(W / 2, -.003, 0); coverPivot.add(leftFace);

  /* --- pop-up world on the right page --- */
  const pop = new T.Group(); pop.position.set(W / 2, TH + .27, -.25); bookG.add(pop); const popItems = [], chars = [], mixers = [];
  function addPop(o, x, z, d) { o.position.x += x; o.position.z += z; o.userData.s0 = o.scale.clone(); o.userData.d = d; o.scale.multiplyScalar(.001); pop.add(o); popItems.push(o); return o; }
  const meadow = new T.Mesh(new T.CircleGeometry(1.35, 40), E.mat(0x7fd05a)); meadow.rotation.x = -Math.PI / 2; meadow.position.y = .01; meadow.scale.set(1, 1.15, 1); addPop(meadow, 0, 0, 0);
  addPop(E.yurt(.5, '#c8323a'), -.75, -.7, .15); addPop(E.izba(.45, '#2a6aa8'), -.05, -.95, .2);
  const bt = E.baiterek(.14); addPop(bt, .62, -.85, .3);
  [[-1.05, .05, 'pine'], [1.05, .1, ''], [-.25, -1.25, 'birch']].forEach(([x, z, k], i) => addPop(E.tree(.42, k), x, z, .25 + i * .08));
  [['abai6', -.35, .35], ['kapdochka', .3, .45]].forEach(([id, x, z], i) => { const s = (window.STORIES || []).find(q => q.id === id); if (!s) return; const h = E.character(s.chars[0].a, .36); h.rotation.y = i ? -.3 : .3; addPop(h, x, z, .45 + i * .1); chars.push(h); });
  const sunS = E.sunFace(.9); sunS.position.set(.95, 1.9, -1.1); addPop(sunS, 0, 0, .5);
  { const h = E.leopard(.6); h.rotation.y = 1.2; addPop(h, .5, -.1, .55); mixers.push(h.userData.mixer); } E.creatures().then(cr => { const e = E.instance(cr.eagle, .5); e.userData.orbit = true; addPop(e, 0, 0, .7); mixers.push(e.userData.mixer); }).catch(() => {});
  const sp = E.sparkles(40, 1.6); sp.position.set(W / 2, TH + .4, 0); bookG.add(sp);

  /* --- state & animation --- */
  let fr = 0, ldt = 0, openK = 0, target = 0, t0 = performance.now(), last = t0, running = true, raf = 0, mx = 0, my = 0, openedAt = -1;
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, easeBack = k => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  setTimeout(() => target = 1, 1100);
  canvas.addEventListener('click', () => { target = target ? 0 : 1; });
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; const d = w / h < 1 ? 15 : 13; cam.position.set(0, d * .78, d * .62); cam.lookAt(0, .2, .2); cam.updateProjectionMatrix(); }
  addEventListener('resize', resize);
  function frame(now) {
    raf = requestAnimationFrame(frame); fr++; if (!running) return;
    const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; ldt = dt; const t = (now - t0) / 1000;
    openK += Math.sign(target - openK) * Math.min(Math.abs(target - openK), dt / 1.4);
    const k = ease(openK); coverPivot.rotation.z = k * Math.PI * .995; bookG.position.x = -W / 2 * (1 - k);
    if (openK >= .98 && openedAt === -1) openedAt = t; if (openK < .5) openedAt = -1;
    popItems.forEach(o => { const kk = openedAt < 0 ? 0 : Math.min(1, Math.max(0, (t - openedAt - o.userData.d) / .6)); o.scale.copy(o.userData.s0).multiplyScalar(Math.max(.001, easeBack(kk))); o.visible = kk > 0;
      if (o.userData.orbit) { const a = t * .8; o.position.set(Math.cos(a) * 1.1, 1.5 + Math.sin(t * 1.4) * .12, Math.sin(a) * .8); o.rotation.set(0, -a, .35, 'YXZ'); } });
    sp.visible = openK > .9; sp.rotation.y = t * .3;
    chars.forEach((c, i) => E.animChar(c, t + i, null)); mixers.forEach(m => m.update(dt));
    world.rotation.y = Math.sin(t * .25) * .12 + mx * .35; world.rotation.x = my * .12; world.position.y = Math.sin(t * 1.1) * .08;
    const sc = (t * .5) % 1; scan.scale.setScalar(1 + sc * 3.6); scan.material.opacity = (1 - sc) * .8;
    r.render(scene, cam);
  }
  // redraw texts when the fonts are ready
  (document.fonts && document.fonts.ready || Promise.resolve()).then(() => [coverTex, leftTex, rightTex].forEach(tx => { const u = tx.userData; u.draw(u.c.getContext('2d'), u.c.width, u.c.height); tx.needsUpdate = true; }));
  if (window.__DEBUG) window.__hb = () => ({ openK, openedAt, fr, n: popItems.length, sc: popItems.map(o => +o.scale.x.toFixed(2) + (o.visible ? "v" : "h")).join(","), t: ((performance.now() - t0) / 1000).toFixed(1) });
  if (window.__DEBUG && /open=1/.test(location.search)) { openK = target = 1; openedAt = 0; }
  if (window.__DEBUG) setInterval(() => { cancelAnimationFrame(raf); frame(performance.now()); }, 60);
  resize(); raf = requestAnimationFrame(frame);
  return { set paused(v) { running = !v; if (!v) { last = performance.now(); resize(); } }, resize };
};
