/* Book trailer: cinematic canvas animation with Russian voice-over (photos + cartoon heroes + titles) */
window.Trailer = function (canvas, capEl, barEl) {
  const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  let raf = 0, story = null, slide = 0, t0 = 0, playing = false, imgs = [], avs = [], dust = [], token = 0, onEndCb = null;
  for (let i = 0; i < 90; i++) dust.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.2 + .4, v: Math.random() * .3 + .1 });
  function load(s) {
    story = s; imgs = []; avs = s.chars.map(ch => Avatar.canvas(ch.a, 400));
    s.imgs.forEach((k, i) => { const im = new Image(); im.onload = () => imgs[i] = im; im.src = 'assets/img/w/' + k + '.jpg'; });
    slide = 0; t0 = performance.now(); draw(0, true);
  }
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  function cover(im, k, dir) { const r = Math.max(W / im.width, H / im.height) * (1.08 + k * .12), w = im.width * r, h = im.height * r; c.drawImage(im, (W - w) / 2 + dir * k * 40, (H - h) / 2 - k * 20, w, h); }
  function draw(now, poster) {
    const s = story; if (!s) return; const lines = s.trailer, N = lines.length;
    const el = poster ? 0 : (now - t0) / 1000, k = Math.min(1, el / 5.5);
    c.fillStyle = '#04060c'; c.fillRect(0, 0, W, H);
    const im = imgs[slide % Math.max(1, s.imgs.length)];
    if (slide < N - 1 && im) { c.globalAlpha = Math.min(1, el * 1.4); cover(im, ease(k), slide % 2 ? 1 : -1); c.globalAlpha = 1; }
    else {
      const g = c.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * .7); g.addColorStop(0, s.color); g.addColorStop(1, '#05060a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    // heroes on slides 1..N-2, all heroes on final
    if (slide === N - 1 || !im) {
      const n = avs.length; avs.forEach((a, i) => { const sz = n > 3 ? 230 : 280, x = W / 2 + (i - (n - 1) / 2) * (sz + 20) - sz / 2, y = H * .2 + Math.sin(now / 600 + i) * 6; c.globalAlpha = Math.min(1, el * 1.5 - i * .2); c.drawImage(a, x, y, sz, sz); }); c.globalAlpha = 1;
    } else if (slide % 2 === 1 && avs[slide % avs.length]) { const a = avs[(slide >> 1) % avs.length]; c.globalAlpha = Math.min(1, el); c.drawImage(a, W - 360 + (1 - ease(Math.min(1, el))) * 120, H - 420, 300, 300); c.globalAlpha = 1; }
    // vignette
    const v = c.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    // gold dust
    c.fillStyle = 'rgba(255,215,130,.8)'; dust.forEach(d => { d.y -= d.v; d.x += Math.sin(now / 900 + d.r) * .2; if (d.y < 0) d.y = H; c.globalAlpha = .3 + .5 * Math.abs(Math.sin(now / 500 + d.x)); c.beginPath(); c.arc(d.x, d.y, d.r, 0, 7); c.fill(); }); c.globalAlpha = 1;
    // letterbox
    c.fillStyle = '#000'; c.fillRect(0, 0, W, 70); c.fillRect(0, H - 70, W, 70);
    // text
    const line = poster ? s.ru : lines[slide], a = poster ? 1 : Math.min(1, el * 1.6);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (poster || slide === N - 1) {
      c.globalAlpha = a; c.fillStyle = '#ffd98a'; c.font = 'bold 34px Inter, sans-serif'; c.fillText('3D ЛИТЕРАТУРНЫЙ ПОРТАЛ ПРЕДСТАВЛЯЕТ', W / 2, H * .66);
      c.fillStyle = '#fff'; let tf = 76; c.font = `bold ${tf}px "Cormorant Garamond", Georgia, serif`; while (c.measureText(s.ru).width > W - 80 && tf > 34) { tf -= 4; c.font = `bold ${tf}px "Cormorant Garamond", Georgia, serif`; } c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 20; c.fillText(s.ru, W / 2, H * .76);
      c.fillStyle = '#ffd98a'; c.font = 'italic 44px "Cormorant Garamond", Georgia, serif'; c.fillText(s.kk, W / 2, H * .84); c.shadowBlur = 0;
      if (poster) { c.beginPath(); c.arc(W / 2, H * .4, 64, 0, 7); c.fillStyle = 'rgba(227,181,91,.92)'; c.fill(); c.fillStyle = '#1b1407'; c.beginPath(); c.moveTo(W / 2 - 20, H * .4 - 32); c.lineTo(W / 2 + 34, H * .4); c.lineTo(W / 2 - 20, H * .4 + 32); c.fill(); }
      c.globalAlpha = 1;
    } else {
      c.globalAlpha = a; c.fillStyle = '#fff'; c.font = 'italic 600 58px "Cormorant Garamond", Georgia, serif'; c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 18;
      wrapText(line, W / 2, H * .78, W - 240, 64); c.shadowBlur = 0; c.globalAlpha = 1;
    }
    if (!poster) { barEl.style.width = ((slide + Math.min(1, el / 5)) / N * 100) + '%'; }
  }
  function wrapText(t, x, y, mw, lh) { const w = t.split(' '), L = []; let l = ''; w.forEach(x2 => { if (c.measureText(l + x2).width > mw && l) { L.push(l.trim()); l = ''; } l += x2 + ' '; }); L.push(l.trim()); L.forEach((s, i) => c.fillText(s, x, y + (i - (L.length - 1) / 2) * lh)); }
  function frame(now) { draw(now); if (playing) raf = requestAnimationFrame(frame); }
  async function play(onEnd) {
    stop(); const my = ++token; playing = true; onEndCb = onEnd; window.Music && (Music.on || Music.start());
    raf = requestAnimationFrame(frame);
    for (slide = 0; slide < story.trailer.length; slide++) {
      if (my !== token) return; t0 = performance.now(); capEl.textContent = story.trailer[slide];
      const minT = new Promise(r => setTimeout(r, 3600));
      await Promise.all([minT, Voice.say(story.trailer[slide], { voice: 'narrator' })]);
    }
    if (my !== token) return; slide = story.trailer.length - 1; await new Promise(r => setTimeout(r, 1500));
    playing = false; cancelAnimationFrame(raf); barEl.style.width = '100%'; onEndCb && onEndCb();
  }
  function stop() { token++; playing = false; cancelAnimationFrame(raf); Voice.stop(); }
  return { load, play, stop, get playing() { return playing; } };
};
