/* Shared 3D engine — bright low‑poly style: chibi heroes, museum props, instanced grass/flowers/trees,
   ornamented yurts, gate, smiling sun, horse Tulpar & eagle Berkut controller (three.js r147, global THREE) */
window.ENG = (function () {
  const T = THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false; // treat hex colours as sRGB → rich colours
  const FILE = location.protocol === 'file:';

  /* ---------- keyboard / touch state ---------- */
  const KEYS = { up: 0, down: 0, left: 0, right: 0, fast: 0, rise: 0, sink: 0 };
  const kmap = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', ShiftLeft: 'fast', ShiftRight: 'fast', Space: 'rise', KeyC: 'sink', ControlLeft: 'sink' };
  const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable); };
  addEventListener('keydown', e => { if (typing()) return; const k = kmap[e.code]; if (k) { KEYS[k] = 1; if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); } });
  addEventListener('keyup', e => { const k = kmap[e.code]; if (k) KEYS[k] = 0; });
  addEventListener('blur', () => Object.keys(KEYS).forEach(k => KEYS[k] = 0));

  /* ---------- renderer preset (saturated, no filmic wash‑out) ---------- */
  function renderer(canvas, maxDpr) {
    const r = new T.WebGLRenderer({ canvas, antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio, maxDpr || 1.75));
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.NoToneMapping;
    return r;
  }
  function lights(scene, size, sunPos) {
    const hemi = new T.HemisphereLight(0xe8f6ff, 0x5a8a3a, .75); scene.add(hemi);
    const sun = new T.DirectionalLight(0xfff2d8, 1.25); sun.position.copy(sunPos || new T.Vector3(-30, 50, 25)); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: size * 6 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .02;
    scene.add(sun); scene.add(sun.target); return sun;
  }

  /* ---------- noise ---------- */
  const perm = new Uint8Array(512); { const p = [...Array(256).keys()]; let s = 1337; for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; }
  const hsh = (x, y) => perm[(perm[x & 255] + y) & 511] / 255;
  const sm = t => t * t * (3 - 2 * t);
  function vn(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const a = hsh(xi, yi), b = hsh(xi + 1, yi), c = hsh(xi, yi + 1), d = hsh(xi + 1, yi + 1); const u = sm(xf), v = sm(yf); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const fbm = (x, y) => vn(x, y) * .5 + vn(x * 2.03, y * 2.03) * .25 + vn(x * 4.1, y * 4.1) * .14 + vn(x * 8.3, y * 8.3) * .08;
  let seed = 7; const rnd = (a = 0, b = 1) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };
  const pick = a => a[Math.floor(rnd(0, a.length - 1e-9))];

  /* ---------- materials ---------- */
  const MAT = {};
  const mat = (c, o) => { const k = c + JSON.stringify(o || {}); return MAT[k] || (MAT[k] = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .85, flatShading: true }, o || {}))); };
  const smooth = (c, o) => mat(c, Object.assign({ flatShading: false, roughness: .6 }, o || {}));
  const gold = () => mat(0xf2b33d, { metalness: .55, roughness: .35 });
  const shadow = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
  const ctex = (cv, rep) => { const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };

  /* ---------- ornament textures (қошқар мүйіз) ---------- */
  function ram(c, x, y, s, col, lw) {
    c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = col; c.lineWidth = (lw || 2.6) / s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 9); c.lineTo(0, 0); c.bezierCurveTo(0, -7, -4, -10, -8, -10); c.bezierCurveTo(-12, -10, -13, -5, -10, -3); c.moveTo(0, 0); c.bezierCurveTo(0, -7, 4, -10, 8, -10); c.bezierCurveTo(12, -10, 13, -5, 10, -3); c.stroke(); c.restore();
  }
  const TEX = {};
  function bandTex(bg, fg) { // repeating ornament band
    const k = 'band' + bg + fg; if (TEX[k]) return TEX[k];
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d');
    c.fillStyle = bg; c.fillRect(0, 0, 256, 64); c.fillStyle = fg; c.fillRect(0, 4, 256, 4); c.fillRect(0, 56, 256, 4);
    for (let i = 0; i < 4; i++) { ram(c, 32 + i * 64, 38, 1.6, fg, 4); ram(c, 32 + i * 64 + 32, 26, -1.2, fg, 3); }
    return TEX[k] = ctex(cv, [1, 1]);
  }
  function carpetTex(a, b, c3) { // round syrmak carpet
    const k = 'carpet' + a + b; if (TEX[k]) return TEX[k];
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const c = cv.getContext('2d'); c.translate(512, 512);
    const ring = (r, col) => { c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = col; c.fill(); };
    ring(510, b); ring(470, a); ring(440, c3); ring(300, a); ring(270, b); ring(120, c3); ring(90, a);
    for (let i = 0; i < 16; i++) { c.save(); c.rotate(i / 16 * Math.PI * 2); ram(c, 0, -370, 5, b, 9); c.restore(); }
    for (let i = 0; i < 8; i++) { c.save(); c.rotate(i / 8 * Math.PI * 2 + .2); ram(c, 0, -190, 4, c3, 8); c.restore(); }
    for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2); ram(c, 0, -40, 2.5, b, 6); c.restore(); }
    return TEX[k] = ctex(cv);
  }

  /* ---------- creatures from embedded GLB ---------- */
  const b64ToBuf = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
  let creaturesP = null;
  function creatures() {
    if (creaturesP) return creaturesP;
    const loader = new T.GLTFLoader();
    const parse = n => new Promise((res, rej) => loader.parse(b64ToBuf(window.MODELS_B64[n]), '', res, rej));
    creaturesP = Promise.all([parse('Horse'), parse('Parrot')]).then(([h, p]) => {
      h.scene.traverse(o => { if (o.isMesh) { o.material = new T.MeshStandardMaterial({ vertexColors: true, roughness: .6, flatShading: true }); o.castShadow = true; } });
      p.scene.traverse(o => {
        if (!o.isMesh) return;
        const pos = o.geometry.attributes.position, col = o.geometry.attributes.color; if (!col) return;
        const c = new T.Color();
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); c.fromBufferAttribute(col, i); const L = c.r * .3 + c.g * .59 + c.b * .11;
          let r, gg, b;
          if (z > 17) { r = .98; gg = .8; b = .25; } else if (z > 2) { r = .85 + L * .1; gg = .6 + L * .1; b = .25; }
          else if (z < -48) { r = .28; gg = .17; b = .1; } else if (Math.abs(x) > 14) { const t = Math.min(1, (Math.abs(x) - 14) / 26); r = .5 - t * .2 + L * .08; gg = .32 - t * .12 + L * .05; b = .16 - t * .06; }
          else { r = .55 + L * .1; gg = .36 + L * .06; b = .18; }
          if (y < -6 && Math.abs(x) < 8 && z > -10) { r = .98; gg = .82; b = .3; }
          col.setXYZ(i, r, gg, b);
        }
        col.needsUpdate = true; o.material = new T.MeshStandardMaterial({ vertexColors: true, roughness: .7, side: T.DoubleSide, flatShading: true }); o.castShadow = true;
      });
      return { horse: h, eagle: p };
    });
    return creaturesP;
  }
  function instance(gltf, size, tint) {
    const root = new T.Group(), m = gltf.scene.clone(true);
    let mesh = null; gltf.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
    const box = new T.Box3().setFromBufferAttribute(mesh.geometry.attributes.position), s = size / (box.max.z - box.min.z);
    m.scale.setScalar(s); m.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s, -(box.min.z + box.max.z) / 2 * s);
    if (tint != null) m.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color = new T.Color(tint); } });
    root.add(m);
    const mixer = new T.AnimationMixer(m), act = mixer.clipAction(gltf.animations[0]); act.play();
    root.userData.mixer = mixer; root.userData.action = act; root.userData.h = (box.max.y - box.min.y) * s;
    return root;
  }

  /* ---------- sky ---------- */
  function sky(scene, top, bottom) {
    const m = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color(top) }, bottom: { value: new T.Color(bottom) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y*1.5+.1,0.,1.); gl_FragColor = vec4(mix(bottom, top, pow(h,.8)),1.); }' });
    const s = new T.Mesh(new T.SphereGeometry(500, 32, 16), m); s.renderOrder = -1; scene.add(s); return s;
  }
  function sunFace(r) { // cute smiling sun sprite
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d'); c.translate(256, 256);
    c.fillStyle = '#ffd23f'; for (let i = 0; i < 14; i++) { c.save(); c.rotate(i / 14 * Math.PI * 2); c.beginPath(); c.moveTo(-26, -150); c.lineTo(0, -240); c.lineTo(26, -150); c.fill(); c.restore(); }
    const g = c.createRadialGradient(-40, -40, 20, 0, 0, 160); g.addColorStop(0, '#fff27a'); g.addColorStop(1, '#ffc21a'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 155, 0, 7); c.fill();
    c.fillStyle = '#3a2a10'; [-50, 50].forEach(x => { c.beginPath(); c.ellipse(x, -20, 14, 20, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 5, -28, 5, 0, 7); c.fill(); c.fillStyle = '#3a2a10'; });
    c.fillStyle = 'rgba(255,110,90,.55)'; [-85, 85].forEach(x => { c.beginPath(); c.arc(x, 30, 22, 0, 7); c.fill(); });
    c.strokeStyle = '#3a2a10'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.arc(0, 25, 50, .2, Math.PI - .2); c.stroke();
    const s = new T.Sprite(new T.SpriteMaterial({ map: ctex(cv), transparent: true, fog: false, depthWrite: false })); s.scale.set(r, r, 1); return s;
  }
  function clouds(scene, n, area, y) {
    const grp = new T.Group(), m = smooth(0xffffff, { roughness: 1, emissive: 0x9aa8b8, emissiveIntensity: .35 });
    for (let i = 0; i < n; i++) {
      const c = new T.Group(); const k = rnd(.7, 1.4);
      for (let j = 0; j < 5; j++) { const b = new T.Mesh(new T.IcosahedronGeometry(rnd(1.2, 2) * k, 1), m); b.position.set((j - 2) * 1.3 * k, rnd(-.2, .5) * k, rnd(-.6, .6) * k); b.scale.y = .7; c.add(b); }
      c.position.set(rnd(-area, area), y + rnd(-2, 3), rnd(-area, area)); c.userData.v = rnd(.3, .8); grp.add(c);
    }
    scene.add(grp); return grp;
  }

  /* ---------- nature ---------- */
  function tree(s, kind) {
    const g = new T.Group();
    const trunk = new T.Mesh(new T.CylinderGeometry(.07, .12, .9, 6), mat(0x8a5a32)); trunk.position.y = .45; g.add(trunk);
    if (kind === 'pine') [[.62, 1.0, 1.0], [.48, .85, 1.5], [.32, .7, 1.95]].forEach(([r, h, y], i) => { const c = new T.Mesh(new T.ConeGeometry(r, h, 7), mat(i % 2 ? 0x3f9a4a : 0x4fae55)); c.position.y = y; g.add(c); });
    else if (kind === 'birch') { trunk.material = mat(0xf2f0e8); const c = new T.Mesh(new T.IcosahedronGeometry(.55, 0), mat(0x9ad25a)); c.position.y = 1.25; c.scale.y = 1.25; g.add(c); }
    else { const cols = [0x4fae55, 0x5fbf5a, 0x3f9a4a]; [[0, 1.3, 0, .62], [.32, 1.05, .1, .42], [-.3, 1.1, -.1, .45], [0, 1.7, 0, .42]].forEach(([x, y, z, r], i) => { const c = new T.Mesh(new T.IcosahedronGeometry(r, 0), mat(cols[i % 3])); c.position.set(x, y, z); c.rotation.set(rnd(0, 3), rnd(0, 3), 0); g.add(c); }); }
    g.scale.setScalar(s || 1); return shadow(g);
  }
  function mountain(h, r, snow, col) {
    const geo = new T.ConeGeometry(r, h, 7, 3); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < h / 2 - .01) { const k = 1 + (Math.random() - .5) * .3; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
    geo.computeVertexNormals();
    const g = new T.Group(); const m = new T.Mesh(geo, mat(col || 0x9aa7b8)); m.position.y = h / 2; g.add(m);
    if (snow) { const s = new T.Mesh(new T.ConeGeometry(r * .34, h * .32, 7), mat(0xffffff)); s.position.y = h * .84; g.add(s); }
    g.rotation.y = Math.random() * 6; return shadow(g);
  }
  function rock(s, c) { const m = new T.Mesh(new T.DodecahedronGeometry(s, 0), mat(c || 0xb7b0a6)); m.scale.y = .65; m.rotation.set(rnd(0, 3), rnd(0, 3), 0); return shadow(m); }

  /* instanced fields: pts = [[x,y,z], ...] */
  const M4 = new T.Matrix4(), Q = new T.Quaternion(), V3 = new T.Vector3(), S3 = new T.Vector3(), E3 = new T.Euler();
  function placeInst(mesh, i, x, y, z, s, ry, tilt) { E3.set(tilt || 0, ry || 0, (tilt || 0) * .5); Q.setFromEuler(E3); V3.set(x, y, z); S3.set(s, s, s); M4.compose(V3, Q, S3); mesh.setMatrixAt(i, M4); }
  function grassField(pts, size, cols) {
    const g = new T.ConeGeometry(.05 * size, .42 * size, 3); g.translate(0, .21 * size, 0);
    const m = new T.InstancedMesh(g, new T.MeshLambertMaterial({ color: 0xffffff }), pts.length);
    const palette = (cols || [0x5bb543, 0x6cc84d, 0x4ea83c, 0x7fd65a]).map(c => new T.Color(c));
    pts.forEach((p, i) => { placeInst(m, i, p[0], p[1], p[2], rnd(.7, 1.3), rnd(0, 6), rnd(-.25, .25)); m.setColorAt(i, palette[i % palette.length]); });
    m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.receiveShadow = true; return m;
  }
  function flowerField(pts, size, cols) {
    const s = size || 1, grp = new T.Group(), n = pts.length;
    const stemG = new T.CylinderGeometry(.018 * s, .022 * s, .5 * s, 4); stemG.translate(0, .25 * s, 0);
    const petalG = new T.ConeGeometry(.16 * s, .12 * s, 6, 1, true); petalG.rotateX(Math.PI); petalG.translate(0, .55 * s, 0); // cup of petals
    const discG = new T.CylinderGeometry(.17 * s, .17 * s, .03 * s, 7); discG.translate(0, .52 * s, 0);
    const midG = new T.SphereGeometry(.06 * s, 6, 4); midG.translate(0, .55 * s, 0);
    const stem = new T.InstancedMesh(stemG, mat(0x3f9a3a), n), disc = new T.InstancedMesh(discG, new T.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), n), mid = new T.InstancedMesh(midG, mat(0xffc93a), n);
    const pal = (cols || [0xff5d73, 0xffffff, 0xffd23f, 0xc77dff, 0xff8fb1, 0xff7b3a]).map(c => new T.Color(c));
    pts.forEach((p, i) => { const sc = rnd(.75, 1.25), ry = rnd(0, 6), tl = rnd(-.15, .15); [stem, disc, mid].forEach(m => placeInst(m, i, p[0], p[1], p[2], sc, ry, tl)); disc.setColorAt(i, pal[i % pal.length]); });
    [stem, disc, mid].forEach(m => { m.instanceMatrix.needsUpdate = true; m.castShadow = true; grp.add(m); }); disc.instanceColor.needsUpdate = true;
    petalG.dispose(); return grp;
  }
  function treeField(pts, size, cols) { // instanced round trees (trunk + 2 crowns)
    const s = size || 1, n = pts.length, grp = new T.Group();
    const tg = new T.CylinderGeometry(.07 * s, .12 * s, .9 * s, 6); tg.translate(0, .45 * s, 0);
    const cg = new T.IcosahedronGeometry(.62 * s, 0); cg.translate(0, 1.3 * s, 0);
    const c2 = new T.IcosahedronGeometry(.42 * s, 0); c2.translate(.25 * s, 1.75 * s, .05 * s);
    const trunk = new T.InstancedMesh(tg, mat(0x8a5a32), n), crown = new T.InstancedMesh(cg, new T.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), n), crown2 = new T.InstancedMesh(c2, new T.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), n);
    const pal = (cols || [0x4fae55, 0x5fbf5a, 0x3f9a4a, 0x6cc35a, 0x8fcf4f]).map(c => new T.Color(c));
    pts.forEach((p, i) => { const sc = p[3] || rnd(.8, 1.3), ry = rnd(0, 6); [trunk, crown, crown2].forEach(m => placeInst(m, i, p[0], p[1], p[2], sc, ry)); crown.setColorAt(i, pal[i % 5]); crown2.setColorAt(i, pal[(i + 2) % 5]); });
    [trunk, crown, crown2].forEach(m => { m.instanceMatrix.needsUpdate = true; m.castShadow = true; m.receiveShadow = true; grp.add(m); }); crown.instanceColor.needsUpdate = crown2.instanceColor.needsUpdate = true;
    return grp;
  }

  /* ---------- buildings & landmarks ---------- */
  function yurt(s, band) {
    const g = new T.Group();
    const felt = smooth(0xfff4e0, { roughness: .95 }), roofM = smooth(0xf4ead2, { roughness: .95 });
    const bt = bandTex(band || '#c8323a', '#f6c34a');
    const wallBand = new T.MeshStandardMaterial({ map: bt, roughness: .8 }); bt.repeat.set(5, 1);
    const b = new T.Mesh(new T.CylinderGeometry(1, 1, .8, 32, 1, true), felt); b.position.y = .4; g.add(b);
    const bandM = new T.Mesh(new T.CylinderGeometry(1.012, 1.012, .26, 32, 1, true), wallBand); bandM.position.y = .5; g.add(bandM);
    const r = new T.Mesh(new T.ConeGeometry(1.12, .7, 32), roofM); r.position.y = 1.15; g.add(r);
    const sh = new T.Mesh(new T.CylinderGeometry(.24, .26, .1, 16), mat(0x8a5a32)); sh.position.y = 1.5; g.add(sh);
    const door = new T.Mesh(new T.BoxGeometry(.4, .6, .06), new T.MeshStandardMaterial({ map: bandTex(band || '#c8323a', '#f6c34a'), roughness: .8 })); door.position.set(0, .3, .99); g.add(door);
    const frameD = new T.Mesh(new T.BoxGeometry(.5, .68, .04), mat(0xf6c34a)); frameD.position.set(0, .33, .975); g.add(frameD);
    g.scale.setScalar(s || 1); return shadow(g);
  }
  function gate(w, h) { // carved wooden aul gate with ornament
    const g = new T.Group(), red = mat(0xb5402f), woodD = mat(0x7a3a22);
    [-1, 1].forEach(sd => { const p = new T.Mesh(new T.BoxGeometry(.6, h, .6), red); p.position.set(sd * w / 2, h / 2, 0); g.add(p); const cap = new T.Mesh(new T.BoxGeometry(.8, .25, .8), woodD); cap.position.set(sd * w / 2, h + .05, 0); g.add(cap); const base = new T.Mesh(new T.BoxGeometry(.85, .3, .85), woodD); base.position.set(sd * w / 2, .15, 0); g.add(base); });
    const t = bandTex('#b5402f', '#f6c34a'); const bm = new T.MeshStandardMaterial({ map: t, roughness: .8 }); t.repeat.set(4, 1);
    const beam = new T.Mesh(new T.BoxGeometry(w + 1.6, 1.0, .5), [woodD, woodD, woodD, woodD, bm, bm]); beam.position.y = h + .55; g.add(beam);
    const top = new T.Mesh(new T.BoxGeometry(w + 2.2, .22, .7), woodD); top.position.y = h + 1.15; g.add(top);
    return shadow(g);
  }
  function mausoleum(s) {
    const g = new T.Group(), brick = mat(0xe0b67a), blue = smooth(0x2f9fd8, { roughness: .35 });
    const base = new T.Mesh(new T.BoxGeometry(2, 1.4, 2), brick); base.position.y = .7; g.add(base);
    const drum = new T.Mesh(new T.CylinderGeometry(.85, .9, .5, 16), brick); drum.position.y = 1.65; g.add(drum);
    const dome = new T.Mesh(new T.SphereGeometry(.85, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), blue); dome.position.y = 1.9; dome.scale.y = 1.25; g.add(dome);
    const portal = new T.Mesh(new T.BoxGeometry(1.1, 1.9, .3), brick); portal.position.set(0, .95, 1.05); g.add(portal);
    const arch = new T.Mesh(new T.BoxGeometry(.6, 1.1, .1), new T.MeshStandardMaterial({ map: bandTex('#2f9fd8', '#ffffff'), roughness: .6 })); arch.position.set(0, .7, 1.21); g.add(arch);
    g.scale.setScalar(s || 1); return shadow(g);
  }
  function baiterek(s) {
    const g = new T.Group(), white = smooth(0xffffff, { roughness: .4 }), gold = smooth(0xffc840, { metalness: .8, roughness: .2, emissive: 0x553300 });
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10, y = t * 6, r = .55 - .3 * Math.sin(t * Math.PI * .9) + (t > .85 ? (t - .85) * 6 : 0); pts.push(new T.Vector3(Math.cos(a + t * .4) * r, y, Math.sin(a + t * .4) * r)); } g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 20, .045, 5), white)); }
    const core = new T.Mesh(new T.CylinderGeometry(.18, .26, 6, 12), white); core.position.y = 3; g.add(core);
    const ball = new T.Mesh(new T.SphereGeometry(.75, 32, 20), gold); ball.position.y = 6.5; g.add(ball); g.userData.ball = ball;
    g.scale.setScalar(s || 1); return shadow(g);
  }
  function dombyra(s) {
    const g = new T.Group(), wood = smooth(0xc4843f, { roughness: .45 }), dark = mat(0x5a3418);
    const body = new T.Mesh(new T.SphereGeometry(.8, 24, 16), wood); body.scale.set(.75, 1, .3); g.add(body);
    const neck = new T.Mesh(new T.BoxGeometry(.18, 2.6, .12), dark); neck.position.y = 1.9; g.add(neck);
    const head = new T.Mesh(new T.BoxGeometry(.26, .5, .14), dark); head.position.y = 3.35; g.add(head);
    const hole = new T.Mesh(new T.CircleGeometry(.08, 12), mat(0x111111)); hole.position.set(0, .25, .245); g.add(hole);
    [-.03, .03].forEach(x => { const st = new T.Mesh(new T.CylinderGeometry(.008, .008, 3.3, 3), mat(0xeeeeee)); st.position.set(x, 1.6, .1); g.add(st); });
    ram && g.add(new T.Mesh(new T.RingGeometry(.4, .46, 24), mat(0xf6c34a)).translateZ(.245).translateY(-.1));
    g.scale.setScalar(s || 1); return shadow(g);
  }
  function banner(color) {
    const g = new T.Group();
    const pole = new T.Mesh(new T.CylinderGeometry(.04, .04, 3, 6), mat(0x7a4a2a)); pole.position.y = 1.5; g.add(pole);
    const fl = new T.Mesh(new T.PlaneGeometry(1.1, .7, 8, 2), mat(color, { side: T.DoubleSide })); fl.position.set(.56, 2.6, 0); g.add(fl); g.userData.flag = fl;
    const tip = new T.Mesh(new T.ConeGeometry(.08, .25, 6), gold()); tip.position.y = 3.1; g.add(tip);
    return shadow(g);
  }
  function balbal() { const g = new T.Group(), m = mat(0xb9b1a3); const b = new T.Mesh(new T.BoxGeometry(.55, 1.6, .38), m); b.position.y = .8; g.add(b); const h = new T.Mesh(new T.SphereGeometry(.3, 8, 6), m); h.position.y = 1.78; g.add(h); return shadow(g); }

  /* ---------- text / images ---------- */
  function textTex(lines, o) {
    o = o || {}; const W = o.w || 1024, H = o.h || 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    if (o.bg) { c.fillStyle = o.bg; roundRect(c, 4, 4, W - 8, H - 8, 40); c.fill(); if (o.border) { c.strokeStyle = o.border; c.lineWidth = 8; c.stroke(); } }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    lines.forEach((l, i) => { c.font = l.font || '800 64px Nunito, sans-serif'; c.fillStyle = l.color || '#fff'; c.fillText(l.t, W / 2, l.y != null ? l.y : H / 2 + (i - (lines.length - 1) / 2) * 80); });
    return ctex(cv);
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  const imgCache = {};
  function img(key) { // embedded small copies (work on file://) → else file
    if (imgCache[key]) return imgCache[key];
    const src = (window.IMGDATA && window.IMGDATA[key]) || (FILE ? null : 'assets/img/w/' + key + '.jpg');
    if (!src) return Promise.resolve(null);
    return imgCache[key] = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  }
  function frame(w, h, tex, col) {
    const g = new T.Group(), fr = mat(col || 0xf2b33d, { metalness: .4, roughness: .4 });
    const back = new T.Mesh(new T.BoxGeometry(w + .3, h + .3, .12), fr); g.add(back);
    const pic = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); pic.position.z = .065; g.add(pic); g.userData.pic = pic;
    return shadow(g);
  }
  function portalRing(r, color) {
    const g = new T.Group();
    g.add(new T.Mesh(new T.TorusGeometry(r, r * .09, 12, 48), new T.MeshStandardMaterial({ color: 0xffd27a, emissive: color || 0xffa400, emissiveIntensity: 1.1, metalness: .4, roughness: .3 })));
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
    const gr = c.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.45, 'rgba(120,210,255,.75)'); gr.addColorStop(1, 'rgba(150,90,255,.1)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 4; for (let i = 0; i < 6; i++) { c.beginPath(); for (let a = 0; a < 12; a += .05) { const rr = a * 9; c.lineTo(128 + Math.cos(a + i) * rr, 128 + Math.sin(a + i) * rr); } c.stroke(); }
    const disc = new T.Mesh(new T.CircleGeometry(r * .95, 48), new T.MeshBasicMaterial({ map: ctex(cv), transparent: true, side: T.DoubleSide, depthWrite: false }));
    g.add(disc); g.userData.disc = disc; return g;
  }
  function sparkles(n, spread, color) {
    const g = new T.BufferGeometry(), p = []; for (let i = 0; i < n; i++) p.push(rnd(-spread, spread), rnd(0, spread * 1.6), rnd(-spread, spread));
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    return new T.Points(g, new T.PointsMaterial({ color: color || 0xffd77a, size: .12, transparent: true, opacity: .95, depthWrite: false, blending: T.AdditiveBlending }));
  }
  let blobT = null;
  function blob(r) { // soft contact shadow
    if (!blobT) { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); const g = c.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(20,40,10,.45)'); g.addColorStop(1, 'rgba(20,40,10,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); blobT = new T.CanvasTexture(cv); }
    const m = new T.Mesh(new T.PlaneGeometry(r * 2, r * 2), new T.MeshBasicMaterial({ map: blobT, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = .03; return m;
  }

  /* ---------- chibi heroes ---------- */
  const SKIN = 0xf3c9a4, SKIN_KID = 0xf8d6b8;
  function character(a, size) {
    a = a || {};
    if (a.creature) return creatureModel(a, size);
    const root = new T.Group(), body = new T.Group(); root.add(body);
    const kid = a.age === 'kid', old = a.age === 'old', f = a.g === 'f';
    const coat = new T.Color(a.coat || '#2f4f7f').getHex();
    const skin = smooth(kid ? SKIN_KID : SKIN, { roughness: .7 }), coatM = mat(coat, { roughness: .8 }), coatD = mat(new T.Color(coat).multiplyScalar(.7).getHex()), G = gold();
    const hair = mat(old ? 0xe8e6e0 : 0x2b1b12, { roughness: .9 }), boots = mat(0x3a2418);
    // legs / boots
    if (!f) [-1, 1].forEach(sd => { const l = new T.Mesh(new T.CylinderGeometry(.12, .13, .46, 8), boots); l.position.set(sd * .15, .23, 0); body.add(l); const toe = new T.Mesh(new T.SphereGeometry(.13, 8, 6), boots); toe.scale.set(1, .6, 1.4); toe.position.set(sd * .15, .06, .06); body.add(toe); });
    // coat / dress
    const cH = f ? 1.25 : .98, cY = f ? .63 : .93;
    const robe = new T.Mesh(new T.CylinderGeometry(.3, f ? .6 : .48, cH, 16), coatM); robe.position.y = cY; body.add(robe);
    const hem = new T.Mesh(new T.TorusGeometry(f ? .6 : .48, .035, 6, 24), G); hem.rotation.x = Math.PI / 2; hem.position.y = cY - cH / 2 + .03; body.add(hem);
    const belt = new T.Mesh(new T.TorusGeometry(f ? .37 : .37, .05, 6, 24), f ? mat(0xffffff) : G); belt.rotation.x = Math.PI / 2; belt.position.y = 1.08; body.add(belt);
    // front trim & collar
    const trim = new T.Mesh(new T.BoxGeometry(.06, cH * .92, .03), G); trim.position.set(0, cY, (f ? .45 : .39)); trim.rotation.x = -.12; body.add(trim);
    const collar = new T.Mesh(new T.CylinderGeometry(.16, .26, .14, 12), mat(0xffffff)); collar.position.y = 1.43; body.add(collar);
    if (f) { const vest = new T.Mesh(new T.CylinderGeometry(.31, .4, .5, 16, 1, true), mat(new T.Color(coat).offsetHSL(.5, 0, -.15).getHex(), { side: T.DoubleSide })); vest.position.y = 1.18; body.add(vest); }
    // arms
    const arms = [-1, 1].map(sd => { const p = new T.Group(); p.position.set(sd * .36, 1.36, 0); const arm = new T.Mesh(new T.CapsuleGeometry(.09, .42, 4, 8), coatM); arm.position.y = -.27; p.add(arm); const cuff = new T.Mesh(new T.TorusGeometry(.095, .025, 6, 12), G); cuff.rotation.x = Math.PI / 2; cuff.position.y = -.5; p.add(cuff); const hand = new T.Mesh(new T.SphereGeometry(.09, 10, 8), skin); hand.position.y = -.58; p.add(hand); p.rotation.z = sd * .28; body.add(p); return p; });
    // head
    const head = new T.Group(); head.position.y = 1.86; body.add(head);
    const R = kid ? .46 : .42;
    const skull = new T.Mesh(new T.SphereGeometry(R, 28, 20), skin); head.add(skull);
    [-1, 1].forEach(sd => { const ear = new T.Mesh(new T.SphereGeometry(.08, 8, 6), skin); ear.position.set(sd * R * .97, -.02, 0); head.add(ear); if (f) { const e = new T.Mesh(new T.SphereGeometry(.035, 6, 4), G); e.position.set(sd * R * .97, -.12, .02); head.add(e); } });
    const eyeM = smooth(0x1a120c, { roughness: .2 }), whiteM = new T.MeshBasicMaterial({ color: 0xffffff });
    const eyes = [-1, 1].map(sd => { const e = new T.Mesh(new T.SphereGeometry(.068, 12, 10), eyeM); e.scale.set(1, kid ? 1.35 : 1.2, .55); e.position.set(sd * .15, .03, R * .9); head.add(e); const h = new T.Mesh(new T.SphereGeometry(.022, 6, 4), whiteM); h.position.set(sd * .15 + .022, .065, R * .96); head.add(h); return e; });
    [-1, 1].forEach(sd => { const b = new T.Mesh(new T.BoxGeometry(.13, .03, .03), old ? mat(0xdddddd) : hair); b.position.set(sd * .15, .16, R * .9); b.rotation.z = -sd * .12; head.add(b); });
    const cheekM = new T.MeshBasicMaterial({ color: 0xff8a8a, transparent: true, opacity: .55, depthWrite: false });
    [-1, 1].forEach(sd => { const ch = new T.Mesh(new T.CircleGeometry(.06, 12), cheekM); ch.position.set(sd * .25, -.09, R * .86); ch.rotation.y = sd * .5; head.add(ch); });
    const nose = new T.Mesh(new T.SphereGeometry(.035, 8, 6), smooth(new T.Color(kid ? SKIN_KID : SKIN).multiplyScalar(.92).getHex())); nose.position.set(0, -.05, R * .98); head.add(nose);
    const mouth = new T.Mesh(new T.TorusGeometry(.065, .016, 6, 12, Math.PI), mat(f ? 0xd8344a : 0x9a3a2a)); mouth.rotation.z = Math.PI; mouth.position.set(0, -.15, R * .93); head.add(mouth);
    // hair
    const hat = a.hat || 'none';
    if (hat !== 'bald' && hat !== 'kimeshek') { const hcap = new T.Mesh(new T.SphereGeometry(R * 1.04, 24, 12, 0, Math.PI * 2, 0, Math.PI * .5), hair); hcap.rotation.x = -.35; head.add(hcap); }
    if (hat === 'bald') { const sh = new T.Mesh(new T.SphereGeometry(.08, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5 })); sh.position.set(-.12, .3, .25); head.add(sh); }
    if (f && hat !== 'kimeshek') { [-1, 1].forEach(sd => { for (let i = 0; i < 6; i++) { const b = new T.Mesh(new T.SphereGeometry(.075 - i * .004, 8, 6), hair); b.position.set(sd * (R * .82), -.18 - i * .13, -.05 + i * .01); head.add(b); } const rib = new T.Mesh(new T.SphereGeometry(.05, 6, 4), mat(0xe03a3a)); rib.position.set(sd * R * .82, -.98, -.02); head.add(rib); }); const back = new T.Mesh(new T.SphereGeometry(R * 1.02, 16, 12), hair); back.position.set(0, -.12, -.12); back.scale.set(1, 1.05, .8); head.add(back); }
    // beards
    const bc = old || a.beard === 'white' ? mat(0xf2f0ea) : hair;
    if (['mustache', 'short', 'long', 'white'].includes(a.beard)) [-1, 1].forEach(sd => { const m = new T.Mesh(new T.CapsuleGeometry(.025, .09, 3, 6), bc); m.rotation.z = sd * 1.2; m.position.set(sd * .06, -.1, R * .95); head.add(m); });
    if (a.beard === 'short') { const b = new T.Mesh(new T.SphereGeometry(.2, 12, 8), bc); b.scale.set(1.1, .75, .6); b.position.set(0, -.3, R * .62); head.add(b); }
    if (a.beard === 'long' || a.beard === 'white') { const b = new T.Mesh(new T.ConeGeometry(.2, .55, 10), bc); b.rotation.x = Math.PI; b.position.set(0, -.45, R * .62); head.add(b); }
    // hats
    const topY = R * .72;
    if (hat === 'borik' || hat === 'crown') {
      const hc = hat === 'crown' ? 0x7a1a2a : new T.Color(coat).multiplyScalar(.75).getHex();
      const dome = new T.Mesh(new T.SphereGeometry(R * .9, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(hc)); dome.position.y = topY - .02; dome.scale.y = .85; head.add(dome);
      const fur = new T.Mesh(new T.TorusGeometry(R * .9, .09, 8, 24), mat(0x8a5a30, { roughness: 1 })); fur.rotation.x = Math.PI / 2; fur.position.y = topY; head.add(fur);
      if (hat === 'crown') for (let i = 0; i < 8; i++) { const sp = new T.Mesh(new T.ConeGeometry(.06, .2, 5), G); const an = i / 8 * Math.PI * 2; sp.position.set(Math.cos(an) * R * .75, topY + .28, Math.sin(an) * R * .75); head.add(sp); }
      const tas = new T.Mesh(new T.SphereGeometry(.06, 8, 6), G); tas.position.y = topY + R * .8; head.add(tas);
    } else if (hat === 'kalpak') {
      const k = new T.Mesh(new T.ConeGeometry(R * .95, R * 1.4, 4), smooth(0xfbf7ee)); k.rotation.y = Math.PI / 4; k.position.y = topY + R * .55; head.add(k);
      [-1, 1].forEach(sd => { const br = new T.Mesh(new T.BoxGeometry(.32, .07, .04), mat(0x1e1e1e)); br.position.set(sd * .2, topY + .02, R * .62); br.rotation.z = sd * .35; head.add(br); });
    } else if (hat === 'saukele') {
      const s = new T.Mesh(new T.CylinderGeometry(.1, R * .82, R * 2.3, 16), mat(0xc9283a)); s.position.y = topY + R * 1.1; head.add(s);
      for (let i = 0; i < 4; i++) { const r = new T.Mesh(new T.TorusGeometry(R * .78 - i * .07, .022, 6, 20), G); r.rotation.x = Math.PI / 2; r.position.y = topY + .06 + i * .26; r.scale.setScalar(1); head.add(r); }
      for (let i = 0; i < 6; i++) { const ft = new T.Mesh(new T.SphereGeometry(.09, 8, 6), smooth(0xffffff)); ft.position.set(Math.sin(i) * .08, topY + R * 2.25 + i * .07, Math.cos(i) * .06); head.add(ft); }
      [-1, 1].forEach(sd => { for (let k = 0; k < 3; k++) { const p = new T.Mesh(new T.CylinderGeometry(.01, .01, .5, 3), G); p.position.set(sd * (R * .85 + k * .04), topY - .26, .1 - k * .08); head.add(p); const c = new T.Mesh(new T.SphereGeometry(.035, 6, 4), G); c.position.set(sd * (R * .85 + k * .04), topY - .52, .1 - k * .08); head.add(c); } });
    } else if (hat === 'takiya') {
      const tk = new T.Mesh(new T.CylinderGeometry(R * .55, R * .62, .2, 16), mat(new T.Color(coat).multiplyScalar(.8).getHex())); tk.position.y = topY + .1; head.add(tk);
      const tb = new T.Mesh(new T.TorusGeometry(R * .62, .025, 6, 20), G); tb.rotation.x = Math.PI / 2; tb.position.y = topY + .02; head.add(tb);
      for (let i = 0; i < 4; i++) { const ft = new T.Mesh(new T.SphereGeometry(.06, 6, 4), smooth(0xffffff)); ft.position.set(.12 + i * .03, topY + .25 + i * .07, 0); head.add(ft); }
    } else if (hat === 'helmet') {
      const hm = new T.Mesh(new T.ConeGeometry(R * 1.0, R * 1.3, 14), smooth(0xc8d0d8, { metalness: .7, roughness: .3 })); hm.position.y = topY + R * .5; head.add(hm);
      const hb = new T.Mesh(new T.TorusGeometry(R * .98, .045, 6, 24), G); hb.rotation.x = Math.PI / 2; hb.position.y = topY - .05; head.add(hb);
      const pl = new T.Mesh(new T.ConeGeometry(.07, .35, 6), mat(0xd83a3a)); pl.position.y = topY + R * 1.3; head.add(pl);
      const av = new T.Mesh(new T.CylinderGeometry(R * 1.0, R * 1.08, .45, 16, 1, true, Math.PI * .25, Math.PI * 1.5), mat(0x9aa3ad, { side: T.DoubleSide })); av.position.y = topY - .3; head.add(av);
    } else if (hat === 'kimeshek') {
      const k = new T.Mesh(new T.SphereGeometry(R * 1.1, 20, 14), smooth(0xfdfbf5)); k.position.set(0, .03, -.06); head.add(k);
      const fr = new T.Mesh(new T.TorusGeometry(R * .74, .05, 8, 24), mat(0xc8323a)); fr.position.set(0, 0, R * .62); head.add(fr);
      skull.position.z = .08; skull.scale.setScalar(.95);
      eyes.forEach(e => e.position.z += .03); mouth.position.z += .03; nose.position.z += .03;
    } else if (hat === 'kokoshnik') {
      const kk = new T.Mesh(new T.CylinderGeometry(R * 1.05, R * 1.05, .06, 24, 1, false, -Math.PI * .45, Math.PI * .9), mat(0xc8283a, { side: T.DoubleSide })); kk.scale.set(1, 1, 1); kk.rotation.x = -.25; const crest = new T.Mesh(new T.CircleGeometry(R * 1.0, 24, 0, Math.PI), mat(0xc8283a, { side: T.DoubleSide })); crest.position.set(0, topY - .05, R * .35); crest.rotation.x = -.25; head.add(crest);
      for (let i = 0; i < 9; i++) { const pe = new T.Mesh(new T.SphereGeometry(.03, 6, 4), smooth(0xffffff)); const an = Math.PI * (i + .5) / 9; pe.position.set(Math.cos(an) * R * .92, topY - .05 + Math.sin(an) * R * .92, R * .35 + .03); head.add(pe); }
      const gb = new T.Mesh(new T.TorusGeometry(R * .55, .025, 6, 20, Math.PI), G); gb.position.set(0, topY - .05, R * .38); gb.rotation.x = -.25; head.add(gb);
    } else if (hat === 'cap') {
      const cp = new T.Mesh(new T.CylinderGeometry(R * .95, R * .9, .22, 20), mat(new T.Color(coat).multiplyScalar(.6).getHex())); cp.position.y = topY + .02; head.add(cp);
      const vz = new T.Mesh(new T.CylinderGeometry(R * .55, R * .55, .03, 16, 1, false, -Math.PI / 2, Math.PI), mat(0x1e1e1e)); vz.position.set(0, topY - .07, R * .62); head.add(vz);
    }
    const sc = (size || 1) * (kid ? .78 : 1);
    root.scale.setScalar(sc);
    root.add(blob(.6));
    shadow(body);
    root.userData = { body, head, arms, mouth, kind: 'human', talk: 0, h: 2.3 * sc };
    return root;
  }
  function animChar(c, t, lookYaw) {
    const u = c.userData; if (!u.body) { if (u.mixer) u.mixer.update(.016); return; }
    u.body.position.y = Math.abs(Math.sin(t * 2.2)) * .03;
    u.arms[0].rotation.x = Math.sin(t * 1.6) * .12; u.arms[1].rotation.x = -Math.sin(t * 1.6) * .12;
    if (u.wave > 0) { u.wave -= .016; u.arms[1].rotation.z = -2.4 + Math.sin(t * 10) * .3; } else u.arms[1].rotation.z = .28;
    u.head.rotation.z = Math.sin(t * .9) * .05;
    if (lookYaw != null) { const d = ((lookYaw - c.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; c.rotation.y += d * .06; }
    if (u.mouth) u.mouth.scale.y = u.talk > 0 ? 1 + Math.abs(Math.sin(t * 14)) * 1.6 : 1;
    if (u.talk > 0) u.talk -= .016;
  }
  function creatureModel(a, size) {
    const root = new T.Group(), s = size || 1, em = a.creature;
    const pend = (fn) => { creatures().then(cr => fn(cr)); };
    if (em === '🐎' || em === '🫏' || em === '🐴') { pend(cr => { const h = instance(cr.horse, 2.4 * s * (em === '🐎' ? 1 : .85), a.coat || 0xc58a4a); h.userData.action.timeScale = 0; h.userData.mixer.update(.4); root.add(h); root.userData.mixer = h.userData.mixer; }); root.userData = { kind: 'animal', h: 1.6 * s }; }
    else if (em === '🦅' || em === '🕊️') { pend(cr => { const e = instance(cr.eagle, 2 * s, em === '🕊️' ? 0xffffff : null); e.position.y = 1.4 * s; root.add(e); root.userData.mixer = e.userData.mixer; e.userData.action.timeScale = .4; }); const perch = new T.Mesh(new T.CylinderGeometry(.08 * s, .1 * s, 1.4 * s, 6), mat(0x8a5a32)); perch.position.y = .7 * s; root.add(perch); root.userData = { kind: 'bird', h: 2.4 * s }; }
    else if (em === '🐺') { root.add(wolf(s)); root.userData = { kind: 'animal', h: 1.3 * s }; }
    else if (em === '🐫') { root.add(camel(s)); root.userData = { kind: 'animal', h: 2.2 * s }; }
    else if (em === '🐉') { root.add(dragon(s)); root.userData = { kind: 'animal', h: 2 * s }; }
    else if (em === '🪕') { const d = dombyra(.45 * s); d.position.y = .5 * s; d.rotation.z = .2; root.add(d); root.userData = { kind: 'object', h: 2 * s }; }
    else if (em === '🐆') { const l = leopard(2.2 * s); root.add(l); root.userData = { kind: 'animal', h: 1.3 * s, mixer: l.userData.mixer }; l.userData.action.timeScale = 0; }
    else if (em === '🐭' || em === '🐜' || em === '🦗' || em === '🐑' || em === '🐦' || em === '🐐') { const c = critter(em, s); root.add(c); root.userData = { kind: 'animal', h: c.userData.h }; }
    else { const b = new T.Mesh(new T.SphereGeometry(.5 * s, 12, 8), mat(0xffc93a)); b.position.y = .5 * s; root.add(b); root.userData = { kind: 'object', h: 1.2 * s }; }
    root.add(blob(.9 * s)); return shadow(root);
  }
  function wolf(s) {
    const g = new T.Group(), fur = mat(0x8c97a6), light = mat(0xd8dde4), dark = mat(0x3a3f48);
    const b = new T.Mesh(new T.CapsuleGeometry(.32, .8, 4, 10), fur); b.rotation.z = Math.PI / 2; b.rotation.y = Math.PI / 2; b.position.y = .75; g.add(b);
    const chest = new T.Mesh(new T.SphereGeometry(.3, 10, 8), light); chest.position.set(0, .7, .45); g.add(chest);
    const head = new T.Group(); head.position.set(0, 1.1, .7); g.add(head);
    head.add(new T.Mesh(new T.SphereGeometry(.28, 12, 10), fur));
    const snout = new T.Mesh(new T.ConeGeometry(.15, .38, 8), light); snout.rotation.x = Math.PI / 2; snout.position.set(0, -.05, .3); head.add(snout);
    const nose = new T.Mesh(new T.SphereGeometry(.05, 6, 4), dark); nose.position.set(0, -.03, .5); head.add(nose);
    [-1, 1].forEach(sd => { const ear = new T.Mesh(new T.ConeGeometry(.08, .22, 4), fur); ear.position.set(sd * .14, .28, -.02); head.add(ear); const e = new T.Mesh(new T.SphereGeometry(.04, 6, 4), mat(0xffd23f)); e.position.set(sd * .1, .06, .22); head.add(e); });
    [[-.18, .45], [.18, .45], [-.18, -.4], [.18, -.4]].forEach(([x, z]) => { const l = new T.Mesh(new T.CylinderGeometry(.07, .06, .55, 6), fur); l.position.set(x, .28, z); g.add(l); });
    const tail = new T.Mesh(new T.ConeGeometry(.12, .7, 8), fur); tail.rotation.x = -2.2; tail.position.set(0, .85, -.75); g.add(tail);
    g.scale.setScalar(s); return shadow(g);
  }
  function camel(s) {
    const g = new T.Group(), m = mat(0xd9a65e);
    const b = new T.Mesh(new T.CapsuleGeometry(.35, .9, 4, 10), m); b.rotation.x = Math.PI / 2; b.position.y = 1.25; g.add(b);
    [-.25, .25].forEach(z => { const h = new T.Mesh(new T.SphereGeometry(.3, 10, 8), m); h.position.set(0, 1.6, z); h.scale.y = 1.2; g.add(h); });
    const n = new T.Mesh(new T.CylinderGeometry(.1, .14, .8, 8), m); n.position.set(0, 1.65, .75); n.rotation.x = .6; g.add(n);
    const hd = new T.Mesh(new T.BoxGeometry(.22, .2, .4), m); hd.position.set(0, 2.0, 1.0); g.add(hd);
    [[-.2, .45], [.2, .45], [-.2, -.45], [.2, -.45]].forEach(([x, z]) => { const l = new T.Mesh(new T.CylinderGeometry(.07, .06, 1.05, 6), m); l.position.set(x, .52, z); g.add(l); });
    const rug = new T.Mesh(new T.BoxGeometry(.8, .05, .7), new T.MeshStandardMaterial({ map: bandTex('#c8323a', '#f6c34a') })); rug.position.y = 1.62; g.add(rug);
    g.scale.setScalar(s); return shadow(g);
  }
  function dragon(s) {
    const g = new T.Group(), m = mat(0x3fae5a), belly = mat(0xf2d27a);
    for (let i = 0; i < 9; i++) { const r = .32 - i * .025; const b = new T.Mesh(new T.SphereGeometry(r, 10, 8), i % 2 ? m : mat(0x349a4c)); b.position.set(Math.sin(i * .8) * .5, .4 + Math.sin(i * .5) * .3, -i * .35); g.add(b); const sp = new T.Mesh(new T.ConeGeometry(.07, .2, 4), mat(0xe8503a)); sp.position.set(b.position.x, b.position.y + r, b.position.z); g.add(sp); }
    const head = new T.Group(); head.position.set(0, 1.0, .45); g.add(head);
    head.add(new T.Mesh(new T.SphereGeometry(.38, 12, 10), m));
    const jaw = new T.Mesh(new T.BoxGeometry(.4, .16, .4), belly); jaw.position.set(0, -.15, .3); head.add(jaw);
    [-1, 1].forEach(sd => { const hn = new T.Mesh(new T.ConeGeometry(.06, .35, 5), mat(0xf6e7b0)); hn.position.set(sd * .18, .38, -.05); hn.rotation.z = sd * -.4; head.add(hn); const e = new T.Mesh(new T.SphereGeometry(.07, 8, 6), mat(0xffffff)); e.position.set(sd * .15, .12, .3); head.add(e); const p = new T.Mesh(new T.SphereGeometry(.035, 6, 4), mat(0x111111)); p.position.set(sd * .15, .12, .36); head.add(p); });
    g.scale.setScalar(s); return shadow(g);
  }

  /* ---------- snow leopard (ақ барыс) — procedural, animated: the land guide ---------- */
  let furTexC = null;
  function furTex() {
    if (furTexC) return furTexC;
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#f2efe8'); gr.addColorStop(.5, '#e4e0d6'); gr.addColorStop(1, '#f6f4ef'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${150 + Math.random() * 60},${145 + Math.random() * 50},${130 + Math.random() * 40},.18)`; g.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 5); }
    const ros = (x, y, r) => { g.fillStyle = 'rgba(176,168,150,.55)'; g.beginPath(); g.ellipse(x, y, r * .62, r * .5, 0, 0, 7); g.fill(); g.fillStyle = '#4b4a49'; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 + Math.random() * .5; g.beginPath(); g.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r * .8, r * .32, r * .2, a + 1.57, 0, 7); g.fill(); } };
    for (let i = 0; i < 46; i++) ros(Math.random() * 512, Math.random() * 512, 13 + Math.random() * 9);
    g.fillStyle = '#4b4a49'; for (let i = 0; i < 90; i++) { g.beginPath(); g.arc(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 4, 0, 7); g.fill(); }
    furTexC = ctex(c); furTexC.wrapS = furTexC.wrapT = T.RepeatWrapping; return furTexC;
  }
  function leopard(size) {
    const root = new T.Group(), m = new T.Group(); root.add(m);
    const fur = new T.MeshStandardMaterial({ map: furTex(), roughness: .9 }), belly = smooth(0xf8f6f1, { roughness: .95 }), dark = smooth(0x3a3936), pink = smooth(0xd98c94), eyeM = smooth(0x9fd8c8, { roughness: .2, emissive: 0x16302a }), pup = smooth(0x111111);
    const sph = (r, mt, x, y, z, sx, sy, sz, par) => { const o = new T.Mesh(new T.SphereGeometry(r, 18, 12), mt); o.position.set(x, y, z); o.scale.set(sx || 1, sy || 1, sz || 1); o.castShadow = true; (par || m).add(o); return o; };
    sph(.2, fur, 0, .44, 0, 1, .92, 2.15); sph(.2, fur, 0, .45, .26, 1.02, 1.0, 1.05); sph(.2, fur, 0, .46, -.28, 1.05, 1.0, 1.1); sph(.15, belly, 0, .34, .02, .9, .55, 1.9);
    const neck = new T.Mesh(new T.CylinderGeometry(.11, .15, .24, 14), fur); neck.position.set(0, .56, .42); neck.rotation.x = .9; m.add(neck);
    const head = new T.Group(); head.position.set(0, .64, .56); m.add(head);
    sph(.135, fur, 0, 0, 0, 1.05, .9, 1.05, head); sph(.075, belly, 0, -.045, .1, 1.15, .78, 1, head); sph(.05, belly, 0, -.085, .07, 1.1, .6, 1, head);
    const nose = new T.Mesh(new T.ConeGeometry(.026, .03, 3), pink); nose.rotation.x = Math.PI / 2 + .4; nose.rotation.z = Math.PI; nose.position.set(0, -.012, .165); head.add(nose);
    [-1, 1].forEach(sd => {
      sph(.024, eyeM, sd * .056, .035, .108, 1.25, .9, .6, head); sph(.011, pup, sd * .058, .035, .121, .55, 1.4, .5, head);
      const ear = sph(.045, fur, sd * .085, .1, -.015, 1, 1, .45, head); sph(.026, dark, sd * .088, .112, -.03, 1, 1, .4, head);
      for (let k = 0; k < 3; k++) { const w = new T.Mesh(new T.CylinderGeometry(.002, .002, .12, 3), smooth(0xffffff)); w.rotation.z = sd * (1.35 + k * .12); w.position.set(sd * .08, -.045 - k * .012, .12); head.add(w); }
    });
    const legs = [];
    [[.11, .28, 0], [-.11, .28, Math.PI], [.11, -.3, Math.PI], [-.11, -.3, 0]].forEach(([x, z, ph]) => {
      const pv = new T.Group(); pv.position.set(x, .44, z); m.add(pv);
      const up = new T.Mesh(new T.CylinderGeometry(.065, .05, .34, 10), fur); up.position.y = -.17; up.castShadow = true; pv.add(up);
      sph(.06, belly, 0, -.36, .025, 1.05, .6, 1.35, pv); legs.push({ pv, ph });
    });
    const tail = new T.Group(); tail.position.set(0, .48, -.5); m.add(tail); const segs = [];
    let par = tail; for (let i = 0; i < 9; i++) { const g = new T.Group(); g.position.z = i ? -.1 : 0; par.add(g); const r = .07 - i * .002; sph(r, i === 8 ? dark : fur, 0, 0, -.05, 1, 1, 1.3, g); segs.push(g); par = g; }
    const st = { ph: 0, t: 0 }, action = { timeScale: 0 };
    const mixer = { update(dt) {
      st.t += dt; const sp = action.timeScale; st.ph += dt * 8 * Math.max(sp, 0);
      const amp = Math.min(.6, sp * .5);
      legs.forEach(L => { const target = Math.sin(st.ph + L.ph) * amp; L.pv.rotation.x += (target - L.pv.rotation.x) * Math.min(1, dt * 12); });
      m.position.y = Math.abs(Math.sin(st.ph)) * .025 * Math.min(1, sp);
      head.rotation.x = Math.sin(st.ph * 2) * .03 * Math.min(1, sp); head.rotation.y = sp < .05 ? Math.sin(st.t * .6) * .25 : 0;
      segs.forEach((g, i) => { g.rotation.x = (i === 0 ? -.55 : i < 4 ? -.22 : i < 7 ? .08 : .42) + Math.sin(st.t * 2 + i * .4) * .03; g.rotation.y = Math.sin(st.t * 1.6 - i * .35) * (.08 + sp * .04); });
    } };
    mixer.update(0);
    root.scale.setScalar(size || 1); root.userData.mixer = mixer; root.userData.action = action; root.userData.h = .75 * (size || 1);
    return root;
  }
  /* small fairy-tale animals for Russian fables & tales */
  function critter(em, s) {
    const g = new T.Group(), sp = (r, c, x, y, z, sx, sy, sz) => { const o = new T.Mesh(new T.SphereGeometry(r, 14, 10), smooth(c)); o.position.set(x, y, z); o.scale.set(sx || 1, sy || 1, sz || 1); o.castShadow = true; g.add(o); return o; };
    const eyes = (y, z, x, r) => [-1, 1].forEach(sd => { sp(r || .05, 0x111111, sd * x, y, z); sp((r || .05) * .35, 0xffffff, sd * x + .015, y + .02, z + .03); });
    let h = 1;
    if (em === '🐭') { sp(.35, 0xa8a8b0, 0, .35, 0, 1, .9, 1.3); sp(.24, 0xb8b8c0, 0, .55, .38); [-1, 1].forEach(sd => { sp(.14, 0xf3b8c0, sd * .17, .78, .3, 1, 1, .3); }); sp(.04, 0xf37a8a, 0, .55, .62); eyes(.62, .55, .09, .04); const t = new T.Mesh(new T.TorusGeometry(.3, .025, 6, 16, Math.PI * 1.2), smooth(0xf3b8c0)); t.position.set(0, .3, -.6); t.rotation.y = Math.PI / 2; g.add(t); h = 1; }
    else if (em === '🐜') { sp(.2, 0x5a2a1a, 0, .3, .32); sp(.16, 0x6a3420, 0, .3, 0); sp(.26, 0x4a2214, 0, .32, -.38, 1, .9, 1.2); eyes(.36, .48, .09, .04); for (let i = 0; i < 6; i++) { const l = new T.Mesh(new T.CylinderGeometry(.018, .018, .45, 4), smooth(0x3a1a10)); l.position.set((i % 2 ? 1 : -1) * .2, .18, (Math.floor(i / 2) - 1) * .18); l.rotation.z = (i % 2 ? 1 : -1) * .9; g.add(l); } [-1, 1].forEach(sd => { const a = new T.Mesh(new T.CylinderGeometry(.012, .012, .35, 4), smooth(0x3a1a10)); a.position.set(sd * .08, .55, .48); a.rotation.x = .6; a.rotation.z = sd * .4; g.add(a); }); h = .9; }
    else if (em === '🦗') { sp(.13, 0x58c25a, 0, .55, .3); sp(.1, 0x47b04a, 0, .5, -.1, 1, 1, 3.2); eyes(.6, .4, .08, .045); [-1, 1].forEach(sd => [.15, -.05].forEach((z, k) => { const w = new T.Mesh(new T.CircleGeometry(.32, 16), new T.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: .6, side: T.DoubleSide })); w.scale.set(1.6, .5, 1); w.rotation.x = -Math.PI / 2; w.position.set(sd * .5, .58 + k * .03, z); g.add(w); })); const st = new T.Mesh(new T.CylinderGeometry(.02, .02, .55, 4), smooth(0x8a5a32)); st.position.y = .27; g.add(st); h = 1; }
    else if (em === '🐑') { [[0, .55, 0, 1.25], [.18, .62, .2, .7], [-.18, .62, .2, .7], [.15, .65, -.25, .7], [-.15, .65, -.25, .7], [0, .78, 0, .8]].forEach(([x, y, z, k]) => sp(.25 * k, 0xfdfbf5, x, y, z)); sp(.16, 0x3a3532, 0, .7, .45, .9, 1, 1.1); eyes(.75, .58, .06, .03); [[-.15, .2], [.15, .2], [-.15, -.2], [.15, -.2]].forEach(([x, z]) => { const l = new T.Mesh(new T.CylinderGeometry(.045, .04, .4, 6), smooth(0x3a3532)); l.position.set(x, .2, z); g.add(l); }); h = 1.1; }
    else if (em === '🐐') { sp(.3, 0xf2efe8, 0, .6, 0, 1, .9, 1.5); sp(.15, 0xf2efe8, 0, .9, .45); eyes(.95, .58, .07, .03); [-1, 1].forEach(sd => { const hn = new T.Mesh(new T.ConeGeometry(.04, .25, 6), smooth(0x8a7a6a)); hn.position.set(sd * .07, 1.1, .4); hn.rotation.x = -.5; g.add(hn); }); [[-.15, .3], [.15, .3], [-.15, -.3], [.15, -.3]].forEach(([x, z]) => { const l = new T.Mesh(new T.CylinderGeometry(.04, .035, .45, 6), smooth(0xd8d2c6)); l.position.set(x, .22, z); g.add(l); }); h = 1.2; }
    else { sp(.16, 0x1d2a4a, 0, .6, 0, 1, .9, 1.5); sp(.11, 0x1d2a4a, 0, .72, .2); sp(.09, 0xf6efe8, 0, .56, .1, 1, .8, 1.2); sp(.03, 0xe8b23a, 0, .7, .32); eyes(.76, .27, .06, .025); [-1, 1].forEach(sd => { const w = new T.Mesh(new T.ConeGeometry(.14, .55, 3), smooth(0x1d2a4a)); w.rotation.z = sd * 1.3; w.position.set(sd * .3, .65, 0); w.scale.z = .25; g.add(w); }); const tl = new T.Mesh(new T.ConeGeometry(.08, .35, 3), smooth(0x1d2a4a)); tl.rotation.x = -1.7; tl.position.set(0, .58, -.3); g.add(tl); const st = new T.Mesh(new T.CylinderGeometry(.03, .03, .45, 5), smooth(0x8a5a32)); st.position.y = .22; g.add(st); h = 1; }
    g.scale.setScalar(s * 1.2); g.userData.h = h * s * 1.2; return shadow(g);
  }
  /* ---------- Russian fairy-tale house: izba with carved windows ---------- */
  let logTexC = null;
  function logTex() {
    if (logTexC) return logTexC;
    const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
    for (let i = 0; i < 8; i++) { const gr = g.createLinearGradient(0, i * 32, 0, i * 32 + 32); gr.addColorStop(0, '#b77a44'); gr.addColorStop(.5, '#d39a5c'); gr.addColorStop(1, '#8a5530'); g.fillStyle = gr; g.fillRect(0, i * 32, 128, 32); g.fillStyle = 'rgba(90,50,20,.5)'; g.fillRect(0, i * 32 + 30, 128, 2); for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(120,70,30,.25)'; g.fillRect(Math.random() * 128, i * 32 + 8 + Math.random() * 16, 20 + Math.random() * 30, 1); } }
    logTexC = ctex(c); logTexC.wrapS = logTexC.wrapT = T.RepeatWrapping; return logTexC;
  }
  function izba(s, accent) {
    const g = new T.Group(), acc = new T.Color(accent || '#2a6aa8').getHex();
    const logs = new T.MeshStandardMaterial({ map: logTex(), roughness: .9 }), white = smooth(0xfffaf0, { roughness: .7 }), accM = mat(acc), glass = smooth(0x9fd8ff, { roughness: .1, emissive: 0x204060 });
    const base = new T.Mesh(new T.BoxGeometry(1.75, .14, 1.45), mat(0x9a948a)); base.position.y = .07; g.add(base);
    const wall = new T.Mesh(new T.BoxGeometry(1.6, .95, 1.3), logs); wall.position.y = .6; g.add(wall);
    for (let i = 0; i < 6; i++) [[-.8, -.65], [.8, -.65], [-.8, .65], [.8, .65]].forEach(([x, z]) => { const e = new T.Mesh(new T.CylinderGeometry(.075, .075, .22, 8), mat(0xc8905a)); e.rotation.z = Math.PI / 2; e.position.set(x + Math.sign(x) * .06, .2 + i * .155, z); g.add(e); });
    const roofM = mat(acc, { roughness: .6 });
    [-1, 1].forEach(sd => { const r = new T.Mesh(new T.BoxGeometry(1.9, .07, 1.0), roofM); r.rotation.x = sd * .62; r.position.set(0, 1.36, sd * .4); g.add(r); const p = new T.Mesh(new T.BoxGeometry(.06, .06, 1.02), white); p.rotation.x = sd * .62; p.position.set(.96, 1.37, sd * .41); g.add(p); const p2 = p.clone(); p2.position.x = -.96; g.add(p2); });
    const tri = new T.Shape([new T.Vector2(-.66, 0), new T.Vector2(.66, 0), new T.Vector2(0, .5)]); [-1, 1].forEach(sd => { const gb = new T.Mesh(new T.ShapeGeometry(tri), new T.MeshStandardMaterial({ map: logTex(), side: T.DoubleSide })); gb.rotation.y = Math.PI / 2; gb.position.set(sd * .8, 1.07, 0); g.add(gb); const w = new T.Mesh(new T.CircleGeometry(.1, 16), glass); w.rotation.y = sd * Math.PI / 2; w.position.set(sd * .81, 1.25, 0); g.add(w); });
    const ridge = new T.Mesh(new T.CylinderGeometry(.05, .05, 1.95, 8), white); ridge.rotation.z = Math.PI / 2; ridge.position.y = 1.68; g.add(ridge);
    const cock = new T.Mesh(new T.ConeGeometry(.08, .22, 4), mat(0xf2b33d)); cock.position.set(.9, 1.82, 0); g.add(cock);
    [-.38, .38].forEach(x => { const fr = new T.Mesh(new T.BoxGeometry(.4, .42, .04), white); fr.position.set(x, .68, .66); g.add(fr); const top = new T.Mesh(new T.ConeGeometry(.26, .16, 3), white); top.rotation.z = Math.PI; top.rotation.x = Math.PI / 2; top.scale.z = .2; top.position.set(x, .95, .665); g.add(top); const gl = new T.Mesh(new T.PlaneGeometry(.28, .3), glass); gl.position.set(x, .68, .685); g.add(gl); [-1, 1].forEach(sd => { const sh = new T.Mesh(new T.BoxGeometry(.13, .38, .03), accM); sh.position.set(x + sd * .27, .68, .68); g.add(sh); }); const cr = new T.Mesh(new T.BoxGeometry(.28, .02, .02), white); cr.position.set(x, .68, .69); g.add(cr); });
    const ch = new T.Mesh(new T.BoxGeometry(.18, .45, .18), mat(0xb5402f)); ch.position.set(-.45, 1.6, -.3); g.add(ch);
    const step = new T.Mesh(new T.BoxGeometry(.5, .1, .25), mat(0x9a6236)); step.position.set(0, .12, .8); g.add(step);
    g.scale.setScalar(s || 1); return shadow(g);
  }
  function windmill(s) {
    const g = new T.Group(); const body = new T.Mesh(new T.CylinderGeometry(.5, .8, 2.4, 8), new T.MeshStandardMaterial({ map: logTex(), roughness: .9 })); body.position.y = 1.2; g.add(body);
    const roof = new T.Mesh(new T.ConeGeometry(.75, .7, 8), mat(0xc8323a)); roof.position.y = 2.75; g.add(roof);
    const hub = new T.Group(); hub.position.set(0, 2.3, .62); g.add(hub);
    for (let i = 0; i < 4; i++) { const a = new T.Group(); a.rotation.z = i * Math.PI / 2; hub.add(a); const arm = new T.Mesh(new T.BoxGeometry(.08, 1.6, .05), mat(0x8a5a30)); arm.position.y = .8; a.add(arm); const sail = new T.Mesh(new T.BoxGeometry(.4, 1.1, .02), smooth(0xfff6e4)); sail.position.set(.24, 1.0, 0); a.add(sail); }
    const door = new T.Mesh(new T.BoxGeometry(.4, .7, .05), mat(0x6a3a1a)); door.position.set(0, .35, .75); g.add(door);
    g.userData.blades = hub; g.scale.setScalar(s || 1); return shadow(g);
  }
  function scales(s) {
    const g = new T.Group(), G = gold();
    const p = new T.Mesh(new T.CylinderGeometry(.5, .7, .4, 8), mat(0xfff4e0)); p.position.y = .2; g.add(p);
    const col = new T.Mesh(new T.CylinderGeometry(.09, .12, 2.6, 10), G); col.position.y = 1.7; g.add(col);
    const beam = new T.Group(); beam.position.y = 2.95; g.add(beam); const bm = new T.Mesh(new T.BoxGeometry(2.2, .08, .08), G); beam.add(bm);
    [-1, 1].forEach(sd => { [-1, 1].forEach(k => { const c = new T.Mesh(new T.CylinderGeometry(.01, .01, .9, 3), G); c.position.set(sd * 1.05 + k * .14, -.45, 0); c.rotation.z = -k * .15; beam.add(c); }); const pan = new T.Mesh(new T.SphereGeometry(.35, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), smooth(0xf2b33d, { metalness: .7, roughness: .3, side: T.DoubleSide })); pan.position.set(sd * 1.05, -.88, 0); beam.add(pan); });
    const top = new T.Mesh(new T.SphereGeometry(.14, 12, 8), G); top.position.y = 3.1; g.add(top);
    g.userData.beam = beam; g.scale.setScalar(s || 1); return shadow(g);
  }
  function rocket(s) {
    const g = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(.42, .5, 2.6, 16), smooth(0xffffff, { metalness: .3, roughness: .35 })); b.position.y = 1.8; g.add(b);
    const n = new T.Mesh(new T.ConeGeometry(.42, .9, 16), mat(0xc8323a)); n.position.y = 3.55; g.add(n);
    const band = new T.Mesh(new T.CylinderGeometry(.43, .43, .25, 16), mat(0x2a6aa8)); band.position.y = 2.5; g.add(band);
    const win = new T.Mesh(new T.CircleGeometry(.16, 16), smooth(0x7fd8ff, { emissive: 0x1a4060 })); win.position.set(0, 2.15, .47); g.add(win);
    for (let i = 0; i < 4; i++) { const f = new T.Mesh(new T.BoxGeometry(.06, .7, .5), mat(0xc8323a)); f.position.set(Math.cos(i * Math.PI / 2) * .5, .75, Math.sin(i * Math.PI / 2) * .5); f.rotation.y = -i * Math.PI / 2; g.add(f); }
    const fl = new T.Mesh(new T.ConeGeometry(.3, .7, 12), new T.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: .85 })); fl.rotation.x = Math.PI; fl.position.y = .15; g.add(fl);
    const pad = new T.Mesh(new T.CylinderGeometry(1, 1.1, .2, 16), mat(0x9a948a)); pad.position.y = .1; g.add(pad);
    g.userData.flame = fl; g.scale.setScalar(s || 1); return shadow(g);
  }
  function kremlin(s) { // fortress tower with a tent roof — the City of Law
    const g = new T.Group(), wall = mat(0xd8574a), wh = smooth(0xfff6ea);
    const b = new T.Mesh(new T.BoxGeometry(1.6, 2.6, 1.6), wall); b.position.y = 1.3; g.add(b);
    for (let i = -2; i <= 2; i++) [[i * .32, .8], [i * .32, -.8], [.8, i * .32], [-.8, i * .32]].forEach(([x, z]) => { const m = new T.Mesh(new T.BoxGeometry(.16, .28, .16), wall); m.position.set(x, 2.74, z); g.add(m); });
    const t2 = new T.Mesh(new T.BoxGeometry(1.1, 1.0, 1.1), wall); t2.position.y = 3.3; g.add(t2);
    const tent = new T.Mesh(new T.ConeGeometry(.85, 1.8, 4), mat(0x2f8a5a)); tent.rotation.y = Math.PI / 4; tent.position.y = 4.7; g.add(tent);
    const star = new T.Mesh(new T.OctahedronGeometry(.16), smooth(0xffd34d, { emissive: 0x664400, metalness: .6 })); star.position.y = 5.75; g.add(star);
    const clock = new T.Mesh(new T.CircleGeometry(.3, 24), wh); clock.position.set(0, 3.3, .56); g.add(clock);
    const gate = new T.Mesh(new T.BoxGeometry(.6, .9, .05), mat(0x5a2a1a)); gate.position.set(0, .45, .81); g.add(gate);
    g.userData.star = star; g.scale.setScalar(s || 1); return shadow(g);
  }

  /* ---------- museum props ---------- */
  function prop(kind, s) {
    const g = new T.Group(), G = gold(); s = s || 1;
    const add = (m, x, y, z) => { m.position.set(x || 0, y || 0, z || 0); g.add(m); return m; };
    switch (kind) {
      case 'saukele': { add(new T.Mesh(new T.CylinderGeometry(.08, .42, 1.5, 16), mat(0xc9283a)), 0, 1.15); for (let i = 0; i < 5; i++) { const r = add(new T.Mesh(new T.TorusGeometry(.4 - i * .07, .025, 6, 20), G), 0, .5 + i * .28); r.rotation.x = Math.PI / 2; } for (let i = 0; i < 6; i++) add(new T.Mesh(new T.SphereGeometry(.09, 8, 6), smooth(0xffffff)), Math.sin(i) * .06, 1.95 + i * .07, Math.cos(i) * .05); [-1, 1].forEach(sd => { for (let k = 0; k < 3; k++) { add(new T.Mesh(new T.CylinderGeometry(.01, .01, .6, 3), G), sd * (.4 + k * .04), .2, -k * .05); add(new T.Mesh(new T.SphereGeometry(.035, 6, 4), G), sd * (.4 + k * .04), -.1, -k * .05); } }); add(new T.Mesh(new T.SphereGeometry(.3, 12, 8), smooth(0xf3c9a4)), 0, .3).scale.set(1, 1.1, 1); break; }
      case 'sword': { const blade = add(new T.Mesh(new T.BoxGeometry(.09, 1.5, .02), smooth(0xe6ecf2, { metalness: .9, roughness: .15 })), 0, 1.25); blade.rotation.z = .06; add(new T.Mesh(new T.BoxGeometry(.45, .07, .08), G), 0, .48); add(new T.Mesh(new T.CylinderGeometry(.04, .04, .32, 8), mat(0x5a3418)), 0, .3); add(new T.Mesh(new T.SphereGeometry(.07, 8, 6), G), 0, .12); const sc = add(new T.Mesh(new T.BoxGeometry(.13, 1.4, .05), mat(0x6a2a1a)), .35, .78); sc.rotation.z = -.2; for (let i = 0; i < 3; i++) add(new T.Mesh(new T.BoxGeometry(.15, .05, .06), G), .35 - .12 + i * .12 * 0 + (.06 * i - .06) * -.2 + .03, .4 + i * .45, 0).rotation.z = -.2; break; }
      case 'shield': { const sh = add(new T.Mesh(new T.CylinderGeometry(.6, .6, .08, 24), new T.MeshStandardMaterial({ map: carpetTex('#b5402f', '#f6c34a', '#2a6aa8'), roughness: .5 })), 0, .9); sh.rotation.x = Math.PI / 2; const rim = add(new T.Mesh(new T.TorusGeometry(.6, .04, 6, 28), G), 0, .9, .02); add(new T.Mesh(new T.SphereGeometry(.12, 10, 8), G), 0, .9, .06); break; }
      case 'bow': { const b = add(new T.Mesh(new T.TorusGeometry(.6, .03, 6, 24, Math.PI * .9), mat(0x7a3a1a)), 0, 1.0); b.rotation.z = Math.PI / 2 + .16; add(new T.Mesh(new T.CylinderGeometry(.006, .006, 1.15, 3), mat(0xffffff)), -.05, 1.0); const q = add(new T.Mesh(new T.CylinderGeometry(.13, .1, .8, 10), mat(0x9a4a22)), .45, .6); q.rotation.z = -.2; for (let i = 0; i < 4; i++) { const ar = add(new T.Mesh(new T.CylinderGeometry(.012, .012, .5, 3), mat(0xe0c090)), .5 + (i - 1.5) * .04 - .08, 1.15, (i % 2) * .04); ar.rotation.z = -.2; } break; }
      case 'dombyra': { const d = dombyra(.4); d.position.y = .35; d.rotation.z = .25; g.add(d); break; }
      case 'kobyz': { const b = add(new T.Mesh(new T.SphereGeometry(.4, 16, 12, 0, Math.PI * 2, 0, Math.PI * .6), smooth(0xa8642e)), 0, .55); b.rotation.x = Math.PI; add(new T.Mesh(new T.BoxGeometry(.1, 1.0, .08), mat(0x5a3418)), 0, 1.1); add(new T.Mesh(new T.BoxGeometry(.3, .2, .1), mat(0x5a3418)), 0, 1.65); const bow = add(new T.Mesh(new T.TorusGeometry(.4, .015, 4, 16, Math.PI * .8), mat(0x3a2418)), .45, .9); bow.rotation.z = 1.3; break; }
      case 'chapan': { add(new T.Mesh(new T.CylinderGeometry(.04, .04, .4, 6), mat(0x5a3418)), 0, .2); const ch = add(new T.Mesh(new T.CylinderGeometry(.3, .5, 1.1, 16), mat(s > 1 ? 0x2f4f9f : 0x2a5aa8)), 0, .95); add(new T.Mesh(new T.BoxGeometry(.06, 1.05, .03), G), 0, .95, .4).rotation.x = -.12; add(new T.Mesh(new T.TorusGeometry(.5, .035, 6, 24), G), 0, .43).rotation.x = Math.PI / 2; [-1, 1].forEach(sd => { const a = add(new T.Mesh(new T.CapsuleGeometry(.09, .5, 4, 8), ch.material), sd * .38, 1.15); a.rotation.z = sd * .4; }); const bk = add(new T.Mesh(new T.SphereGeometry(.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x8a1a2a)), 0, 1.62); add(new T.Mesh(new T.TorusGeometry(.25, .06, 6, 16), mat(0x8a5a30)), 0, 1.62).rotation.x = Math.PI / 2; break; }
      case 'holes': { const c = prop('chapan'); c.traverse(o => { if (o.isMesh && o.material.color && o.material.color.getHex() === 0x2a5aa8) o.material = mat(0x8a6a3a); }); g.add(c); for (let i = 0; i < 7; i++) { const an = rnd(-1, 1), y = rnd(.6, 1.3); const h = add(new T.Mesh(new T.CircleGeometry(.05, 8), mat(0x1a120c)), Math.sin(an) * .44, y, Math.cos(an) * .44); h.lookAt(Math.sin(an) * 2, y, Math.cos(an) * 2); } break; }
      case 'helmet': { add(new T.Mesh(new T.ConeGeometry(.35, .5, 14), smooth(0xc8d0d8, { metalness: .8, roughness: .25 })), 0, .95); add(new T.Mesh(new T.TorusGeometry(.35, .035, 6, 20), G), 0, .72).rotation.x = Math.PI / 2; add(new T.Mesh(new T.ConeGeometry(.05, .3, 6), mat(0xd83a3a)), 0, 1.3); add(new T.Mesh(new T.CylinderGeometry(.36, .4, .35, 16, 1, true), mat(0x9aa3ad, { side: T.DoubleSide })), 0, .55); add(new T.Mesh(new T.CylinderGeometry(.05, .05, .5, 6), mat(0x5a3418)), 0, .25); break; }
      case 'chest': { const tx = new T.MeshStandardMaterial({ map: bandTex('#d0453a', '#f6c34a'), roughness: .7 }); add(new T.Mesh(new T.BoxGeometry(1, .55, .6), [mat(0xd0453a), mat(0xd0453a), mat(0xc0392b), mat(0xd0453a), tx, tx]), 0, .3); add(new T.Mesh(new T.BoxGeometry(1.04, .12, .64), mat(0x8a3a22)), 0, .62); [-.48, .48].forEach(x => add(new T.Mesh(new T.BoxGeometry(.06, .68, .66), G), x, .34)); add(new T.Mesh(new T.BoxGeometry(.14, .14, .04), G), 0, .5, .31); break; }
      case 'ring': { const r = add(new T.Mesh(new T.TorusGeometry(.25, .05, 10, 28), smooth(0xffcf4a, { metalness: .9, roughness: .15 })), 0, 1.0); r.rotation.y = .5; add(new T.Mesh(new T.OctahedronGeometry(.1), smooth(0xff3a6a, { metalness: .3, roughness: .1 })), 0, 1.28); break; }
      case 'egg': { add(new T.Mesh(new T.TorusGeometry(.4, .14, 6, 16), mat(0x8a6a3a)), 0, .3).rotation.x = Math.PI / 2; const e = add(new T.Mesh(new T.SphereGeometry(.35, 24, 16), smooth(0xffc840, { metalness: .85, roughness: .15, emissive: 0x664400 })), 0, .7); e.scale.y = 1.3; g.userData.spin = e; break; }
      case 'bowl': { const b = add(new T.Mesh(new T.SphereGeometry(.4, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), smooth(0xa8642e, { side: T.DoubleSide })), 0, .5); add(new T.Mesh(new T.TorusGeometry(.4, .03, 6, 20), G), 0, .5).rotation.x = Math.PI / 2; add(new T.Mesh(new T.CylinderGeometry(.38, .38, .02, 20), mat(0xf2e6c8)), 0, .44); break; }
      case 'staff': { const st = add(new T.Mesh(new T.CylinderGeometry(.04, .05, 1.8, 6), mat(0x7a4a2a)), 0, .9); st.rotation.z = .1; add(new T.Mesh(new T.TorusGeometry(.12, .04, 6, 12, Math.PI), mat(0x7a4a2a)), .08, 1.82); break; }
      case 'feather': { const f = add(new T.Mesh(new T.ConeGeometry(.12, 1.0, 8), smooth(0xffffff)), 0, 1.0); f.scale.z = .25; f.rotation.z = .3; add(new T.Mesh(new T.CylinderGeometry(.01, .01, 1.1, 3), mat(0xd9a43a)), -.03, .95).rotation.z = .3; break; }
      case 'scroll': { add(new T.Mesh(new T.PlaneGeometry(.9, .7), smooth(0xf6e7c2, { side: T.DoubleSide })), 0, 1.0); [-.45, .45].forEach(x => add(new T.Mesh(new T.CylinderGeometry(.05, .05, .8, 8), mat(0x8a5a2a)), x, 1.0)); g.children.slice(-2).forEach(c => c.rotation.x = 0); break; }
      case 'horse': { creatures().then(cr => { const h = instance(cr.horse, 1.4, 0xf2b33d); h.userData.action.timeScale = 0; h.userData.mixer.update(.3); h.position.y = .1; h.traverse(o => { if (o.isMesh) o.material = smooth(0xf2b33d, { metalness: .7, roughness: .3, flatShading: true }); }); g.add(h); }); break; }
      case 'eagle': { const e = creatureModel({ creature: '🦅' }, .6); g.add(e); break; }
      case 'wolf': { const w = wolf(.6); g.add(w); break; }
      case 'camel': { const c = camel(.5); g.add(c); break; }
      case 'rock': { const r = rock(.5, 0x7a6a5a); r.position.y = .45; g.add(r); break; }
      case 'map': { add(new T.Mesh(new T.PlaneGeometry(1.1, .8), new T.MeshStandardMaterial({ map: textTex([{ t: '🗺️', font: '200px serif', y: 130 }], { w: 256, h: 256, bg: '#f6e7c2' }) })), 0, 1.0); break; }
      case 'samovar': { const b = add(new T.Mesh(new T.SphereGeometry(.42, 20, 14), smooth(0xd9a43a, { metalness: .85, roughness: .2 })), 0, .85); b.scale.y = 1.15; add(new T.Mesh(new T.CylinderGeometry(.22, .3, .3, 16), G), 0, .3); add(new T.Mesh(new T.CylinderGeometry(.12, .16, .3, 12), G), 0, 1.4); add(new T.Mesh(new T.SphereGeometry(.12, 10, 8), mat(0xc8323a)), 0, 1.62); const sp2 = add(new T.Mesh(new T.CylinderGeometry(.03, .04, .35, 6), G), .45, .7); sp2.rotation.z = -1.1; [-1, 1].forEach(sd => { const h = add(new T.Mesh(new T.TorusGeometry(.13, .025, 6, 12, Math.PI), mat(0x3a2418)), sd * .45, 1.05); h.rotation.z = sd * Math.PI / 2; }); break; }
      case 'quill': { const ink = add(new T.Mesh(new T.CylinderGeometry(.22, .26, .35, 14), smooth(0x1d2a4a, { roughness: .2 })), 0, .2); add(new T.Mesh(new T.CylinderGeometry(.1, .1, .1, 12), G), 0, .42); const f = add(new T.Mesh(new T.ConeGeometry(.14, 1.1, 8), smooth(0xffffff)), .15, 1.0); f.scale.z = .25; f.rotation.z = -.35; const pg = add(new T.Mesh(new T.PlaneGeometry(.9, .6), smooth(0xf6e7c2, { side: T.DoubleSide })), -.2, .05, .45); pg.rotation.x = -Math.PI / 2; break; }
      case 'book': { const bk = add(new T.Mesh(new T.BoxGeometry(1.1, .16, .8), [mat(0xf6e7c2), mat(0x8a1a2a), mat(0xf6e7c2), mat(0xf6e7c2), mat(0xf6e7c2), mat(0xf6e7c2)]), 0, .6); bk.rotation.x = .5; add(new T.Mesh(new T.BoxGeometry(1.16, .04, .86), mat(0x8a1a2a)), 0, .5).rotation.x = .5; add(new T.Mesh(new T.BoxGeometry(.5, .5, .1), mat(0x8a5a30)), 0, .25, -.1); break; }
      case 'balalaika': { const b = add(new T.Mesh(new T.ConeGeometry(.45, .7, 3), smooth(0xd9893a)), 0, .55); b.scale.z = .3; add(new T.Mesh(new T.BoxGeometry(.08, 1.1, .05), mat(0x5a3418)), 0, 1.4); add(new T.Mesh(new T.CircleGeometry(.08, 10), mat(0x2a1a10)), 0, .62, .07); add(new T.Mesh(new T.BoxGeometry(.16, .18, .06), mat(0x5a3418)), 0, 2.0); break; }
      case 'scales': { const sc = scales(.38); g.add(sc); break; }
      case 'key': { const k = add(new T.Mesh(new T.TorusGeometry(.2, .05, 8, 20), smooth(0xffcf4a, { metalness: .9, roughness: .15 })), 0, 1.35); add(new T.Mesh(new T.CylinderGeometry(.04, .04, .9, 8), smooth(0xffcf4a, { metalness: .9, roughness: .15 })), 0, .75); [.4, .52].forEach(y => add(new T.Mesh(new T.BoxGeometry(.18, .07, .05), smooth(0xffcf4a, { metalness: .9, roughness: .15 })), .1, y)); g.userData.spin = k; break; }
      case 'cup': { const c = add(new T.Mesh(new T.SphereGeometry(.45, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), smooth(0x1f9a6a, { roughness: .15, metalness: .2, side: T.DoubleSide })), 0, 1.0); add(new T.Mesh(new T.CylinderGeometry(.06, .1, .45, 10), smooth(0x1f9a6a, { roughness: .15 })), 0, .55); add(new T.Mesh(new T.CylinderGeometry(.3, .32, .08, 16), smooth(0x1f9a6a, { roughness: .15 })), 0, .32); add(new T.Mesh(new T.TorusGeometry(.45, .03, 6, 24), G), 0, 1.0).rotation.x = Math.PI / 2; break; }
      case 'flower': { add(new T.Mesh(new T.CylinderGeometry(.04, .05, .9, 6), smooth(0x1f9a6a)), 0, .7); for (let i = 0; i < 7; i++) { const p = add(new T.Mesh(new T.SphereGeometry(.18, 10, 8), smooth(0x2fbf8a, { roughness: .1, metalness: .3 })), Math.cos(i / 7 * 6.28) * .2, 1.2, Math.sin(i / 7 * 6.28) * .2); p.scale.set(1, .4, 1.6); p.lookAt(0, 1.6, 0); } add(new T.Mesh(new T.SphereGeometry(.1, 10, 8), G), 0, 1.25); break; }
      case 'lantern': { add(new T.Mesh(new T.BoxGeometry(.4, .55, .4), smooth(0xfff1b0, { emissive: 0xffa020, transparent: true, opacity: .85 })), 0, .9); add(new T.Mesh(new T.ConeGeometry(.33, .25, 4), mat(0x3a2418)), 0, 1.3).rotation.y = Math.PI / 4; add(new T.Mesh(new T.BoxGeometry(.45, .05, .45), mat(0x3a2418)), 0, .6); add(new T.Mesh(new T.TorusGeometry(.1, .02, 6, 12), mat(0x3a2418)), 0, 1.48); break; }
      case 'plough': { const pl = add(new T.Mesh(new T.BoxGeometry(.12, .12, 1.4), smooth(0xd8dde4, { metalness: .9, roughness: .15 })), 0, .5); pl.rotation.x = -.4; add(new T.Mesh(new T.ConeGeometry(.2, .45, 4), smooth(0xd8dde4, { metalness: .9, roughness: .15 })), 0, .25, .6).rotation.x = Math.PI / 2; [-1, 1].forEach(sd => { const h = add(new T.Mesh(new T.CylinderGeometry(.03, .03, .7, 6), mat(0x8a5a30)), sd * .2, 1.0, -.55); h.rotation.x = -.5; }); break; }
      case 'rocket': { const r = rocket(.3); g.add(r); break; }
      case 'medal': { const m2 = add(new T.Mesh(new T.CylinderGeometry(.35, .35, .06, 24), smooth(0xffcf4a, { metalness: .9, roughness: .2 })), 0, 1.0); m2.rotation.x = Math.PI / 2; add(new T.Mesh(new T.OctahedronGeometry(.16), mat(0xc8323a)), 0, 1.0, .05); add(new T.Mesh(new T.BoxGeometry(.3, .5, .02), mat(0x2a6aa8)), 0, 1.55); break; }
      case 'izba': { const iz = izba(.5, '#2a6aa8'); g.add(iz); break; }
      case 'yurt': { const y = yurt(.55, '#c8323a'); g.add(y); break; }
      case 'leopard': { const l = leopard(1.3); g.add(l); break; }
      default: { add(new T.Mesh(new T.IcosahedronGeometry(.3, 0), G), 0, .9); }
    }
    g.scale.setScalar(s); return shadow(g);
  }
  function pedestal(col) { const g = new T.Group(); const p = new T.Mesh(new T.CylinderGeometry(.55, .65, .5, 8), mat(col || 0xf6efe2)); p.position.y = .25; g.add(p); const r = new T.Mesh(new T.CylinderGeometry(.6, .6, .08, 8), gold()); r.position.y = .5; g.add(r); return shadow(g); }

  /* ---------- rider / flyer controller ---------- */
  function Controller(o) {
    const st = { mode: 'ride', pos: new T.Vector3(), yaw: 0, speed: 0, alt: o.minAlt || 2, bank: 0, active: true };
    const hR = o.horse, eR = o.eagle; eR.visible = false;
    const camTarget = new T.Vector3(), camPos = new T.Vector3(), tmp = new T.Vector3();
    function setMode(m) { st.mode = m; hR.visible = m === 'ride'; eR.visible = m === 'fly'; if (m === 'fly') st.alt = Math.max(st.alt, (o.minAlt || 2) + 1); }
    function place(x, z, yaw) { st.pos.set(x, o.ground(x, z), z); st.yaw = yaw || 0; st.speed = 0; hR.position.copy(st.pos); hR.rotation.y = st.yaw; eR.position.set(x, st.pos.y + st.alt, z); eR.rotation.set(0, st.yaw, 0, 'YXZ'); snap(); }
    function desiredCam() { const d = st.mode === 'fly' ? o.camDist * 1.35 : o.camDist, h = st.mode === 'fly' ? o.camH * 1.1 : o.camH; const obj = st.mode === 'fly' ? eR : hR; return tmp.set(obj.position.x - Math.sin(st.yaw) * d, obj.position.y + h, obj.position.z - Math.cos(st.yaw) * d); }
    function look() { const obj = st.mode === 'fly' ? eR : hR; camTarget.set(obj.position.x + Math.sin(st.yaw) * o.camDist * .5, obj.position.y + o.camH * .25, obj.position.z + Math.cos(st.yaw) * o.camDist * .5); o.camera.lookAt(camTarget); }
    function snap() { const p = desiredCam(); o.camera.position.copy(p); camPos.copy(p); look(); }
    function update(dt) {
      if (!st.active) return;
      const fwd = KEYS.up - KEYS.down, turn = KEYS.left - KEYS.right;
      if (st.mode === 'ride') {
        const max = (KEYS.fast ? 2.1 : 1) * o.rideSpeed * (fwd < 0 ? .45 : 1); st.speed += (fwd * max - st.speed) * Math.min(1, dt * 2.6);
        st.yaw += turn * dt * (1.4 + Math.abs(st.speed) / o.rideSpeed * .5);
        const nx = st.pos.x + Math.sin(st.yaw) * st.speed * dt, nz = st.pos.z + Math.cos(st.yaw) * st.speed * dt;
        if (o.inside(nx, nz)) { st.pos.x = nx; st.pos.z = nz; } else st.speed *= .3;
        st.pos.y = o.ground(st.pos.x, st.pos.z); hR.position.copy(st.pos); hR.rotation.y = st.yaw;
        const sp = Math.abs(st.speed) / o.rideSpeed; hR.userData.action.timeScale = sp < .05 ? 0 : .5 + sp * .7; hR.userData.mixer.update(dt);
      } else {
        const cruise = o.flySpeed * (KEYS.fast ? 1.9 : 1) * (fwd < 0 ? -.45 : fwd > 0 ? 1.25 : 0); st.speed += (cruise - st.speed) * Math.min(1, dt * 2.2);
        st.yaw += turn * dt * 1.25; st.bank += (turn * (Math.abs(st.speed) > .3 ? .55 : .15) - st.bank) * Math.min(1, dt * 3);
        st.alt += (KEYS.rise - KEYS.sink) * dt * o.flySpeed * .6; st.alt = Math.max(o.minAlt, Math.min(o.maxAlt, st.alt));
        const nx = st.pos.x + Math.sin(st.yaw) * st.speed * dt, nz = st.pos.z + Math.cos(st.yaw) * st.speed * dt;
        if (o.inside(nx, nz, true)) { st.pos.x = nx; st.pos.z = nz; } else st.speed *= .3;
        const gy = o.ground(st.pos.x, st.pos.z);
        st.hov = (st.hov || 0) + dt; const hv = Math.abs(st.speed) < .3 ? Math.sin(st.hov * 2.2) * .12 : 0; eR.position.set(st.pos.x, gy + st.alt + hv, st.pos.z); eR.rotation.set(-(KEYS.rise - KEYS.sink) * .2, st.yaw, -st.bank, 'YXZ');
        eR.userData.action.timeScale = .7 + (KEYS.rise ? .5 : 0) + (KEYS.fast ? .3 : 0); eR.userData.mixer.update(dt);
        hR.position.set(st.pos.x, gy, st.pos.z);
      }
      camPos.lerp(desiredCam(), Math.min(1, dt * 3.2)); o.camera.position.copy(camPos); look();
    }
    return { st, setMode, place, update, snap, get obj() { return st.mode === 'fly' ? eR : hR; } };
  }

  function glowTex(inner, outer) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner || 'rgba(255,240,180,1)'); gr.addColorStop(1, outer || 'rgba(255,200,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return ctex(c); }
  return { T, FILE, KEYS, glowTex, fbm, vn, rnd, pick, renderer, lights, creatures, instance, sky, sunFace, clouds, mat, smooth, gold, shadow, ctex, bandTex, carpetTex,
    tree, mountain, rock, grassField, flowerField, treeField, yurt, gate, mausoleum, baiterek, dombyra, banner, balbal, textTex, roundRect, img, frame, portalRing, sparkles, blob,
    character, animChar, prop, pedestal, Controller, leopard, critter, izba, windmill, scales, rocket, kremlin };
})();
