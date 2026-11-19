/* The 3D book of every world: a full-screen book with a hard cover, turning pages,
   ribbon bookmarks and pop-up 3D scenes that rise from the right page */
window.BookView = function (o) {
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const root = o.root, book = $('.bk-book', root), L = $('#bkL .pg-in', root), R = $('#bkR .pg-in', root);
  const leaf = $('.bk-leaf', root), lfF = $('.lf-front .pg-in', root), lfB = $('.lf-back .pg-in', root);
  const cover = $('.bk-cover', root), cvBack = $('.cv-back .pg-in', root), maskL = $('#bkMaskL', root), maskR = $('#bkMaskR', root);
  const TABS = o.tabs;
  let isOpen = false, busy = false, tab = TABS[0], queue = null;
  const narrow = () => innerWidth < 760;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function snap(el, blank) { // clone a page; canvases become pictures so they survive the flip
    const c = el.cloneNode(true); c.removeAttribute('id'); $$('[id]', c).forEach(x => x.removeAttribute('id'));
    const src = $$('canvas', el), dst = $$('canvas', c);
    dst.forEach((cv, i) => { const im = document.createElement('img'); try { im.src = blank ? 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' : src[i].toDataURL(); } catch (e) {} im.className = cv.className; im.style.cssText = cv.style.cssText; im.style.width = src[i].clientWidth + 'px'; im.style.height = src[i].clientHeight + 'px'; cv.replaceWith(im); });
    return c;
  }
  function fill(target, clone, scroll) { target.innerHTML = ''; while (clone.firstChild) target.appendChild(clone.firstChild); target.scrollTop = scroll || 0; }
  function setNums() { const i = TABS.indexOf(tab); $('#bkL .pg-num', root).textContent = i * 2 + 1; $('#bkR .pg-num', root).textContent = i * 2 + 2; $$('.bk-tabs [data-tab]', root).forEach(b => b.classList.toggle('on', b.dataset.tab === tab)); $('#bkCount', root).textContent = `${i * 2 + 1}–${i * 2 + 2} / ${TABS.length * 2}`; }
  function anim(el, cls, ms) { return new Promise(res => { el.classList.add(cls); setTimeout(() => { el.classList.remove(cls); res(); }, ms); }); }

  async function open(s, t, extra) {
    o.cover(s, $('.cv-front', root));
    tab = TABS.includes(t) ? t : TABS[0];
    root.hidden = false; root.classList.remove('gone'); book.classList.add('closed'); cover.style.visibility = ''; cover.classList.remove('opened');
    o.render(tab, extra); setNums();
    await wait(60); root.classList.add('on');
    await wait(650);
    busy = true; book.classList.remove('flat'); try { Music.page(); } catch (e) {}
    fill(cvBack, snap(L));
    book.classList.remove('closed'); cover.classList.add('opened');
    await wait(1250); book.classList.add('lshow', 'flat'); cover.style.visibility = 'hidden'; busy = false; isOpen = true; o.onShown && o.onShown(tab);
    if (queue) { const q = queue; queue = null; go(q[0], q[1]); }
  }
  async function go(t, extra) {
    if (!isOpen) { if (busy) { queue = [t, extra]; return; } return; }
    if (busy) { queue = [t, extra]; return; }
    const from = TABS.indexOf(tab), to = TABS.indexOf(t);
    if (to === from || to < 0) { o.render(t, extra); return; }
    const dir = to > from ? 1 : -1;
    if (narrow()) { tab = t; o.leave && o.leave(); await anim(book, 'fade', 220); o.render(t, extra); setNums(); o.onShown && o.onShown(tab); return; }
    busy = true; book.classList.remove('flat');
    const oldL = snap(L), oldR = snap(R), sL = L.scrollTop, sR = R.scrollTop;
    tab = t; o.leave && o.leave(); o.render(t, extra); setNums();
    const newL = snap(L, true), newR = snap(R, true);
    try { Music.page(); } catch (e) {}
    if (dir > 0) { fill(maskL, oldL, sL); maskL.parentElement.hidden = false; fill(lfF, oldR, sR); fill(lfB, newL); leaf.className = 'bk-leaf fwd'; }
    else { fill(maskR, oldR, sR); maskR.parentElement.hidden = false; fill(lfB, oldL, sL); fill(lfF, newR); leaf.className = 'bk-leaf back'; }
    leaf.hidden = false; void leaf.offsetWidth; leaf.classList.add('go');
    await wait(900);
    leaf.hidden = true; leaf.className = 'bk-leaf'; maskL.parentElement.hidden = true; maskR.parentElement.hidden = true; lfF.innerHTML = lfB.innerHTML = maskL.innerHTML = maskR.innerHTML = '';
    book.classList.add('flat'); busy = false; o.onShown && o.onShown(tab);
    if (queue) { const q = queue; queue = null; go(q[0], q[1]); }
  }
  async function close() {
    if (!isOpen || busy) { if (!isOpen && !busy) { root.hidden = true; } return; }
    busy = true; o.leave && o.leave(); book.classList.remove('flat');
    fill(cvBack, snap(L)); cover.style.visibility = ''; book.classList.remove('lshow'); void cover.offsetWidth;
    try { Music.page(); } catch (e) {}
    cover.classList.remove('opened'); book.classList.add('closed');
    await wait(1150); root.classList.remove('on'); await wait(450);
    root.hidden = true; isOpen = false; busy = false; o.onClosed && o.onClosed();
  }
  $$('.bk-tabs [data-tab]', root).forEach(b => b.onclick = () => go(b.dataset.tab));
  $('#bkPrev', root).onclick = () => { const i = TABS.indexOf(tab); if (i > 0) go(TABS[i - 1]); else close(); };
  $('#bkNext', root).onclick = () => { const i = TABS.indexOf(tab); if (i < TABS.length - 1) go(TABS[i + 1]); };
  $('#bkClose', root).onclick = close;
  root.addEventListener('click', e => { if (e.target === root || e.target.classList.contains('bk-stage')) close(); });
  addEventListener('keydown', e => {
    if (root.hidden || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' && isOpen) $('#bkNext', root).click();
    if (e.key === 'ArrowLeft' && isOpen) $('#bkPrev', root).click();
  });
  // gentle AR-like tilt that follows the mouse
  root.addEventListener('pointermove', e => { if (narrow()) return; const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5; book.style.setProperty('--ry', (x * 4).toFixed(2) + 'deg'); book.style.setProperty('--rx', (10 - y * 4).toFixed(2) + 'deg'); });
  function hide() { isOpen = false; busy = false; queue = null; root.hidden = true; root.classList.remove('on'); leaf.hidden = true; cover.style.visibility = ''; cover.classList.remove('opened'); book.classList.add('closed'); book.classList.remove('lshow', 'flat'); o.leave && o.leave(); }
  return { open, go, close, hide, get isOpen() { return isOpen || busy; }, get tab() { return tab; }, L, R };
};

/* Pop-up 3D scenes that rise from the page (one shared WebGL renderer) */
window.PopUp = (function () {
  let dbg = 0, out, octx, r, scene, cam, rootG, raf = 0, t0 = 0, chars = [], mixers = [], spinners = [], fx = [], slot = null, last = 0, sel = null;
  const T = () => THREE;
  function ensure() {
    if (r) return true; if (!window.THREE) return false;
    const TT = T(), cv = document.createElement('canvas'); out = document.createElement('canvas'); out.className = 'pop3d'; octx = out.getContext('2d');
    r = new TT.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true });
    r.outputEncoding = TT.sRGBEncoding; r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.shadowMap.enabled = true;
    scene = new TT.Scene(); scene.add(new TT.HemisphereLight(0xfff6e8, 0x8a7050, .95));
    const d = new TT.DirectionalLight(0xfff1dc, 1.1); d.position.set(-3, 8, 5); d.castShadow = true; d.shadow.mapSize.set(1024, 1024); Object.assign(d.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); scene.add(d);
    cam = new TT.PerspectiveCamera(30, 1, .1, 100);
    return true;
  }
  const easeBack = k => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  function clear() { if (rootG) { scene.remove(rootG); rootG.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } chars = []; mixers = []; spinners = []; fx = []; sel = null; }
  function base(col, rad) { // a paper pop-up stand
    const TT = T(), E = ENG, g = new TT.Group();
    const d = new TT.Mesh(new TT.CylinderGeometry(rad, rad * 1.04, .16, 40), E.mat(col)); d.position.y = .08; d.receiveShadow = true; g.add(d);
    const rim = new TT.Mesh(new TT.TorusGeometry(rad * 1.02, .05, 6, 48), E.mat(0xfff8ea)); rim.rotation.x = Math.PI / 2; rim.position.y = .14; g.add(rim);
    return g;
  }
  function wxCol(id) { const w = (window.ERA && ERA[id] || {}).w; return { snow: 0xf2f7ff, autumn: 0xd8b24a, night: 0x3f7a4a, sunset: 0x8cc860, fog: 0xa8c8a0 }[w] || 0x7fd05a; }
  function sky(id, g) {
    const TT = T(), E = ENG, w = (window.ERA && ERA[id] || {}).w;
    if (w === 'night') { const m = new TT.Sprite(new TT.SpriteMaterial({ map: E.glowTex('rgba(255,250,220,1)', 'rgba(255,250,220,0)'), depthWrite: false })); m.scale.set(1.6, 1.6, 1); m.position.set(1.9, 3.3, -1); g.add(m); const core = new TT.Mesh(new TT.SphereGeometry(.28, 16, 12), new TT.MeshBasicMaterial({ color: 0xfff6d0 })); core.position.copy(m.position); g.add(core); for (let i = 0; i < 14; i++) { const st = new TT.Mesh(new TT.OctahedronGeometry(.05), new TT.MeshBasicMaterial({ color: 0xffffff })); st.position.set(E.rnd(-2.6, 2.6), E.rnd(2.4, 3.6), E.rnd(-1.6, -.6)); g.add(st); fx.push({ tw: st, ph: i }); } return; }
    if (w === 'rain' || w === 'storm' || w === 'snow') {
      const c = new TT.Group(), m = E.smooth(w === 'snow' ? 0xffffff : w === 'storm' ? 0x8a94a4 : 0xd8dee6, { roughness: 1 }); [[-.5, 0, .5], [0, .2, .6], [.5, 0, .5], [.2, -.1, .45]].forEach(([x, y, rr]) => { const b = new TT.Mesh(new TT.IcosahedronGeometry(rr, 1), m); b.position.set(x, y, 0); c.add(b); });
      c.position.set(-1.2, 3.2, -.6); g.add(c); fx.push({ cloud: c });
      for (let i = 0; i < 26; i++) { const d = w === 'snow' ? new TT.Mesh(new TT.SphereGeometry(.05, 6, 4), new TT.MeshBasicMaterial({ color: 0xffffff })) : new TT.Mesh(new TT.CylinderGeometry(.012, .012, .22, 4), new TT.MeshBasicMaterial({ color: 0x7ab8f0 })); d.position.set(E.rnd(-2, 2), E.rnd(0, 3), E.rnd(-1.4, 1.4)); g.add(d); fx.push({ drop: d, v: w === 'snow' ? .5 : 2.6 }); }
      return;
    }
    const s = E.sunFace(1.5); s.position.set(1.9, w === 'sunset' || w === 'dawn' ? 2.4 : 3.2, -1.2); g.add(s); fx.push({ sun: s });
  }
  function build(kind, s, opt) {
    const TT = T(), E = ENG, g = new TT.Group(); rootG = g; scene.add(g); opt = opt || {};
    cam.position.set(0, 3, 9.6); cam.lookAt(0, 1.1, 0);
    if (kind === 'story') {
      g.add(base(wxCol(s.id), 2.6));
      const y = s.o === 'ru' ? E.izba(1.15, '#2a6aa8') : E.yurt(1.25, s.color); y.position.set(-1.2, .16, -.9); g.add(y);
      [[1.6, -1.2], [-2.1, .2], [2.1, .3]].forEach(([x, z], i) => { const w = (ERA[s.id] || {}).w, t = E.tree(i ? .9 : 1.15, w === 'snow' || s.biome === 'mountain' ? 'pine' : i === 1 ? 'birch' : ''); t.position.set(x, .16, z); if (w === 'autumn') t.traverse(o => { if (o.isMesh && o.geometry.type === 'IcosahedronGeometry') o.material = E.mat(0xe8962a); }); if (w === 'spring') t.traverse(o => { if (o.isMesh && o.geometry.type === 'IcosahedronGeometry') o.material = E.mat(0xffb7d0); }); g.add(t); });
      if (s.mark === 'rocket') { const r = E.rocket(.45); r.position.set(1, .16, -1.2); g.add(r); }
      else if (s.mark === 'windmill') { const w = E.windmill(.5); w.position.set(1, .16, -1.2); g.add(w); spinners.push(w.userData.blades); }
      else if (s.mark === 'scales') { const sc = E.scales(.45); sc.position.set(1, .16, -1.2); g.add(sc); }
      else if (s.mark === 'kremlin') { const k = E.kremlin(.4); k.position.set(1, .16, -1.3); g.add(k); }
      else if (s.mark === 'izba') { const k = E.izba(.8, '#c8323a'); k.position.set(1.1, .16, -1.2); g.add(k); }
      else if (s.mark === 'tower') { const b = E.baiterek(.55); b.position.set(.9, .16, -1.3); g.add(b); }
      else if (s.mark === 'mausoleum') { const m = E.mausoleum(.7); m.position.set(1, .16, -1.3); g.add(m); }
      else if (s.mark === 'dombyra') { const d = E.dombyra(.7); d.position.set(1, 1, -1.2); d.rotation.z = .3; g.add(d); spinners.push(d); }
      s.chars.slice(0, 2).forEach((c, i) => { const h = E.character(c.a, c.a.creature ? .8 : .85); h.position.set(i ? .7 : -.2, .16, .7 + i * .1); h.rotation.y = i ? -.35 : .2; g.add(h); chars.push(h); });
      sky(s.id, g);
    }
    if (kind === 'heroes') {
      g.add(base(wxCol(s.id), 2.7));
      const n = s.chars.length, si = opt.i || 0;
      s.chars.forEach((c, i) => { const k = i === si, a = (i - (n - 1) / 2) * .62; const h = E.character(c.a, (c.a.creature ? .9 : 1) * (k ? 1.35 : .9)); h.position.set(Math.sin(a) * 1.9, .16, k ? .9 : -Math.cos(a) * .9 + .2); h.rotation.y = k ? 0 : -a * .6; g.add(h); chars.push(h); if (k) sel = h; });
      const sp = E.sparkles(26, 1.4); sp.position.set(sel ? sel.position.x : 0, .4, .9); g.add(sp); spinners.push(sp);
    }
    if (kind === 'museum') {
      g.add(base(0xf6e7c8, 2.3));
      const rug = new TT.Mesh(new TT.CircleGeometry(1.9, 40), new TT.MeshStandardMaterial({ map: E.carpetTex('#2a5aa8', '#f6c34a', '#c8323a') })); rug.rotation.x = -Math.PI / 2; rug.position.y = .17; g.add(rug);
      const ped = E.pedestal(0xfff4e0); ped.scale.setScalar(1.6); ped.position.y = .17; g.add(ped);
      const pp = E.prop(opt.p || s.props[0], 1.6); pp.position.y = .17 + .86; g.add(pp); spinners.push(pp);
      const sp = E.sparkles(30, 1.6); sp.position.y = 1; g.add(sp); spinners.push(sp);
      cam.position.set(0, 3.4, 9.4); cam.lookAt(0, 1.5, 0);
    }
    if (kind === 'guide') {
      g.add(base(wxCol(s.id), 2.4));
      const lp = E.leopard(2.6); lp.position.set(0, .16, .2); lp.rotation.y = .9; g.add(lp); mixers.push(lp.userData.mixer);
      E.creatures().then(cr => { if (rootG !== g) return; const e = E.instance(cr.eagle, 1.4); g.add(e); mixers.push(e.userData.mixer); fx.push({ orbit: e }); });
      sky(s.id, g);
    }
    // pop-up: everything rises from the page
    g.children.forEach((c, i) => { c.userData.s0 = c.scale.clone(); c.userData.d = .1 + Math.min(i, 12) * .05; c.scale.multiplyScalar(.01); });
    g.userData.rise = 0;
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!slot || !slot.isConnected) { stop(); return; }
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; const t = (now - t0) / 1000, E = ENG;
    const w = slot.clientWidth, h = slot.clientHeight; if (w && h && (r.domElement.width !== Math.round(w * r.getPixelRatio()) || r.domElement.height !== Math.round(h * r.getPixelRatio()))) { r.setSize(w, h, false); out.width = r.domElement.width; out.height = r.domElement.height; cam.aspect = w / h; cam.updateProjectionMatrix(); }
    if (rootG) {
      rootG.children.forEach(c => { if (!c.userData.s0) return; const k = Math.min(1, Math.max(0, (t - c.userData.d) / .55)); c.scale.copy(c.userData.s0).multiplyScalar(Math.max(.01, easeBack(k))); });
      rootG.rotation.y = Math.sin(t * .35) * .25;
    }
    chars.forEach((c, i) => E.animChar(c, t + i * .7, c === sel ? 0 : null));
    mixers.forEach(m => m.update(dt));
    spinners.forEach(o => o.rotation.y += dt * .7);
    fx.forEach(F => {
      if (F.drop) { F.drop.position.y -= F.v * dt; if (F.drop.position.y < .2) F.drop.position.y = 3; }
      if (F.tw) F.tw.scale.setScalar(.7 + Math.abs(Math.sin(t * 2 + F.ph)) * .6);
      if (F.cloud) F.cloud.position.x = -1.2 + Math.sin(t * .5) * .5;
      if (F.sun) F.sun.material.rotation = Math.sin(t) * .1;
      if (F.orbit) { const a = t * .7; F.orbit.position.set(Math.cos(a) * 2, 2.6 + Math.sin(t * 1.3) * .2, Math.sin(a) * 1.2); F.orbit.rotation.set(0, -a, .35, 'YXZ'); }
    });
    r.render(scene, cam); octx.clearRect(0, 0, out.width, out.height); octx.drawImage(r.domElement, 0, 0);
  }
  function show(slotEl, kind, s, opt) {
    if (!slotEl || !ensure()) return;
    clear(); build(kind, s, opt); slot = slotEl; slotEl.appendChild(out); t0 = last = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
    if (window.__DEBUG && !dbg) dbg = setInterval(() => { if (raf) { cancelAnimationFrame(raf); frame(performance.now()); } }, 60);
  }
  function talk(i, sec) { const h = chars[i]; if (h) { h.userData.talk = sec || 3; h.userData.wave = 1.6; } }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; slot = null; }
  if (window.__DEBUG) window.__pu = () => ({ raf, n: rootG ? rootG.children.length : -1, sc: rootG ? rootG.children.slice(0, 4).map(c => c.scale.x.toFixed(2)).join(',') : '', cam: cam && cam.aspect.toFixed(2), slot: !!(slot && slot.isConnected), px: out ? out.toDataURL().length : 0, vis: slot ? getComputedStyle(slot).visibility + '/' + slot.getBoundingClientRect().width.toFixed(0) : '' });
  return { show, stop, talk };
})();
