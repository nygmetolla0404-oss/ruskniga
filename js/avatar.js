/* Cartoon hero portraits drawn on canvas (Kazakh costumes: borik, saukele, takiya, kalpak, helmet, crown, kimeshek) */
window.Avatar = (function () {
  const cache = {};
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
  function ell(c, x, y, rx, ry, fill, stroke, lw) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 3; c.stroke(); } }
  function ornament(c, x, y, s, col) { // қошқар мүйіз
    c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = col; c.lineWidth = 2.4 / s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 8); c.lineTo(0, 0); c.bezierCurveTo(0, -7, -4, -10, -8, -10); c.bezierCurveTo(-12, -10, -13, -5, -10, -3); c.moveTo(0, 0); c.bezierCurveTo(0, -7, 4, -10, 8, -10); c.bezierCurveTo(12, -10, 13, -5, 10, -3); c.stroke(); c.restore();
  }

  function draw(a, S) {
    const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'); c.scale(S / 512, S / 512);
    const coat = a.coat || '#2f4f7f';
    // background medallion
    const bg = c.createRadialGradient(256, 210, 40, 256, 256, 260); bg.addColorStop(0, shade(coat, .75)); bg.addColorStop(1, shade(coat, .25));
    c.fillStyle = bg; c.beginPath(); c.arc(256, 256, 250, 0, Math.PI * 2); c.fill();
    c.save(); c.globalAlpha = .18; for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; ornament(c, 256 + Math.cos(an) * 205, 256 + Math.sin(an) * 205, 2.2, '#fff'); } c.restore();
    c.beginPath(); c.arc(256, 256, 247, 0, Math.PI * 2); c.lineWidth = 10; c.strokeStyle = '#e3b55b'; c.stroke();
    c.save(); c.beginPath(); c.arc(256, 256, 242, 0, Math.PI * 2); c.clip();

    if (a.creature) {
      const bg = c.createRadialGradient(256, 200, 20, 256, 256, 300); bg.addColorStop(0, '#fff7e2'); bg.addColorStop(.55, a.coat || '#e8c890'); bg.addColorStop(1, shade(a.coat || '#e8c890', -.35)); c.fillStyle = bg; c.fillRect(0, 0, 512, 512); const g = c.createRadialGradient(256, 256, 10, 256, 256, 200); g.addColorStop(0, 'rgba(255,255,255,.65)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 512, 512);
      c.font = '260px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 24; c.shadowOffsetY = 10; c.fillText(a.creature, 256, 280);
      c.restore(); return cv;
    }
    const kid = a.age === 'kid', old = a.age === 'old', f = a.g === 'f';
    const skin = a.skin || (kid ? '#f7d4b5' : '#efc39d'), skinD = shade(skin, -.12);
    const hair = old ? '#d9d6d0' : (a.hair || '#2b1b12');
    const R = kid ? 112 : 104, cx = 256, cy = kid ? 238 : 232;

    // hair behind (girls)
    if (f && a.hat !== 'kimeshek') { c.fillStyle = hair; c.beginPath(); c.ellipse(cx, cy + 40, R * 1.05, R * 1.25, 0, 0, Math.PI * 2); c.fill(); }
    // body / chapan
    const bodyTop = cy + R * .95;
    const bg2 = c.createLinearGradient(0, bodyTop, 0, 512); bg2.addColorStop(0, shade(coat, .12)); bg2.addColorStop(1, shade(coat, -.25));
    c.fillStyle = bg2; c.beginPath(); c.moveTo(40, 520); c.bezierCurveTo(50, bodyTop + 40, 140, bodyTop, cx, bodyTop - 6); c.bezierCurveTo(372, bodyTop, 462, bodyTop + 40, 472, 520); c.closePath(); c.fill();
    // white shirt + gold trim V
    c.fillStyle = f ? '#fff6ea' : '#f4efe4'; c.beginPath(); c.moveTo(cx - 46, bodyTop - 4); c.lineTo(cx, bodyTop + 92); c.lineTo(cx + 46, bodyTop - 4); c.closePath(); c.fill();
    c.strokeStyle = '#e3b55b'; c.lineWidth = 12; c.lineJoin = 'round'; c.beginPath(); c.moveTo(cx - 54, bodyTop - 6); c.lineTo(cx, bodyTop + 100); c.lineTo(cx + 54, bodyTop - 6); c.stroke();
    c.lineWidth = 3; c.strokeStyle = shade(coat, -.4); c.stroke();
    ornament(c, cx - 120, bodyTop + 110, 2.2, '#e3b55b'); ornament(c, cx + 120, bodyTop + 110, 2.2, '#e3b55b');
    if (a.hat === 'helmet') { // chainmail shoulders
      c.fillStyle = '#9aa3ad'; c.beginPath(); c.ellipse(cx, bodyTop + 20, 150, 46, 0, Math.PI, 0); c.fill();
      c.fillStyle = 'rgba(60,70,80,.35)'; for (let x = -140; x < 140; x += 14) for (let y = -30; y < 10; y += 12) { c.beginPath(); c.arc(cx + x + (y % 24 ? 7 : 0), bodyTop + 20 + y, 3, 0, 7); c.fill(); }
    }
    // neck
    c.fillStyle = skinD; c.fillRect(cx - 30, cy + R * .7, 60, 50);
    // ears
    ell(c, cx - R * .93, cy + 8, 18, 26, skinD); ell(c, cx + R * .93, cy + 8, 18, 26, skinD);
    if (f) { ell(c, cx - R * .93, cy + 40, 7, 9, '#e3b55b'); ell(c, cx + R * .93, cy + 40, 7, 9, '#e3b55b'); }
    // face
    const fg = c.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, R * 1.1); fg.addColorStop(0, shade(skin, .1)); fg.addColorStop(1, skinD);
    ell(c, cx, cy, R * .92, R * 1.02, fg);
    // hair front
    if (a.hat === 'none' || a.hat === 'takiya' || (f && a.hat !== 'kimeshek')) {
      c.fillStyle = hair; c.beginPath(); c.ellipse(cx, cy - R * .42, R * .95, R * .62, 0, Math.PI, 0); c.fill();
      c.beginPath(); c.moveTo(cx - R * .95, cy - R * .4); c.quadraticCurveTo(cx - R * .2, cy - R * .2, cx + R * .1, cy - R * .78); c.quadraticCurveTo(cx + R * .5, cy - R * .25, cx + R * .95, cy - R * .4); c.lineTo(cx + R * .95, cy - R * .6); c.lineTo(cx - R * .95, cy - R * .6); c.fill();
    }
    if (a.hat === 'bald') { const sh = c.createRadialGradient(cx - 30, cy - R * .7, 4, cx - 30, cy - R * .7, 40); sh.addColorStop(0, 'rgba(255,255,255,.7)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sh; c.fillRect(cx - 80, cy - R - 20, 120, 100); }
    // braids
    if (f && a.hat !== 'kimeshek') [-1, 1].forEach(sd => { for (let i = 0; i < 6; i++) ell(c, cx + sd * R * .98, cy + 70 + i * 30, 17 - i, 18, shade(hair, i % 2 ? .08 : 0)); ell(c, cx + sd * R * .98, cy + 252, 9, 14, '#c0392b'); });
    // cheeks
    c.globalAlpha = .35; ell(c, cx - R * .55, cy + R * .3, 22, 14, '#ff7b7b'); ell(c, cx + R * .55, cy + R * .3, 22, 14, '#ff7b7b'); c.globalAlpha = 1;
    // eyes
    const ey = cy + R * .05, ex = R * .37, er = kid ? 1.15 : old ? .8 : 1;
    [-1, 1].forEach(sd => {
      const x = cx + sd * ex;
      ell(c, x, ey, 23 * er, 27 * er, '#fff', '#2b1b12', 2.5);
      ell(c, x + 2, ey + 3, 15 * er, 17 * er, '#5a3218'); ell(c, x + 2, ey + 4, 8 * er, 9 * er, '#120a06');
      ell(c, x - 4 * er, ey - 6 * er, 5 * er, 5 * er, '#fff'); ell(c, x + 7 * er, ey + 7 * er, 2.5 * er, 2.5 * er, '#fff');
      if (f) { c.strokeStyle = '#120a06'; c.lineWidth = 3.5; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + sd * (10 + i * 7), ey - 22 * er + i * 3); c.lineTo(x + sd * (16 + i * 9), ey - 30 * er + i * 4); c.stroke(); } }
      // brows
      c.strokeStyle = old ? '#bdb8b0' : hair; c.lineWidth = old ? 9 : 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - sd * 22, ey - 40 * er + (a.mood === 'angry' ? sd * 0 : 4)); c.quadraticCurveTo(x, ey - 50 * er, x + sd * 22, ey - 38 * er); c.stroke();
      if (old) { c.strokeStyle = 'rgba(120,70,40,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + sd * 30, ey + 2); c.lineTo(x + sd * 40, ey - 4); c.moveTo(x + sd * 30, ey + 10); c.lineTo(x + sd * 40, ey + 12); c.stroke(); }
    });
    // nose
    c.strokeStyle = shade(skin, -.3); c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - 4, cy + R * .32); c.quadraticCurveTo(cx + 8, cy + R * .4, cx - 2, cy + R * .45); c.stroke();
    // mouth
    const my = cy + R * .62;
    c.fillStyle = f ? '#d43c4a' : '#a8443a'; c.beginPath(); c.moveTo(cx - 26, my - 4); c.quadraticCurveTo(cx, my + 24, cx + 26, my - 4); c.quadraticCurveTo(cx, my + 6, cx - 26, my - 4); c.fill();
    // beards
    const bc = a.beard === 'white' || old ? '#e6e3dd' : hair;
    if (a.beard === 'mustache' || a.beard === 'short' || a.beard === 'long' || a.beard === 'white') {
      c.fillStyle = bc; [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(cx, my - 12); c.quadraticCurveTo(cx + sd * 30, my - 22, cx + sd * 48, my + 4); c.quadraticCurveTo(cx + sd * 26, my - 4, cx, my - 4); c.fill(); });
    }
    if (a.beard === 'short') { c.fillStyle = bc; c.beginPath(); c.moveTo(cx - 40, my + 8); c.quadraticCurveTo(cx, my + 60, cx + 40, my + 8); c.quadraticCurveTo(cx, my + 30, cx - 40, my + 8); c.fill(); }
    if (a.beard === 'long' || a.beard === 'white') { c.fillStyle = bc; c.beginPath(); c.moveTo(cx - 52, my); c.quadraticCurveTo(cx - 40, my + 70, cx, my + 120); c.quadraticCurveTo(cx + 40, my + 70, cx + 52, my); c.quadraticCurveTo(cx, my + 34, cx - 52, my); c.fill(); }

    // hats
    const top = cy - R * .62;
    const hat = a.hat;
    if (hat === 'borik' || hat === 'crown') {
      const hc = hat === 'crown' ? '#6a1a2a' : shade(coat, -.25);
      c.fillStyle = hc; c.beginPath(); c.ellipse(cx, top - 6, R * .86, R * .78, 0, Math.PI, 0); c.fill();
      if (hat === 'crown') { c.fillStyle = '#e8b84a'; c.beginPath(); c.moveTo(cx - R * .8, top - 10); for (let i = 0; i <= 6; i++) { const x = cx - R * .8 + i * R * .8 / 3; c.lineTo(x, top - (i % 2 ? 40 : 70)); } c.lineTo(cx + R * .8, top - 10); c.fill(); ell(c, cx, top - 40, 12, 14, '#3fb0c8'); }
      else { c.fillStyle = '#e3b55b'; ell(c, cx, top - R * .78, 10, 10, '#e3b55b'); ornament(c, cx, top - 34, 2, '#e3b55b'); }
      // fur rim
      const fur = c.createLinearGradient(0, top - 26, 0, top + 30); fur.addColorStop(0, '#8a5a32'); fur.addColorStop(1, '#4e2f17');
      c.fillStyle = fur; c.beginPath(); c.ellipse(cx, top + 4, R * 1.0, 34, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,220,170,.25)'; c.lineWidth = 2; for (let i = -10; i <= 10; i++) { c.beginPath(); c.moveTo(cx + i * 10, top - 22); c.lineTo(cx + i * 10 + 5, top + 30); c.stroke(); }
    } else if (hat === 'kalpak') {
      c.fillStyle = '#f5f1e6'; c.beginPath(); c.moveTo(cx - R * .9, top + 16); c.quadraticCurveTo(cx - R * .5, top - R * 1.1, cx, top - R * 1.2); c.quadraticCurveTo(cx + R * .5, top - R * 1.1, cx + R * .9, top + 16); c.closePath(); c.fill();
      c.strokeStyle = '#2a2a2a'; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#1e1e1e'; c.beginPath(); c.moveTo(cx - R * .95, top + 20); c.lineTo(cx - R * .1, top - 2); c.lineTo(cx - R * .05, top + 22); c.closePath(); c.fill(); c.beginPath(); c.moveTo(cx + R * .95, top + 20); c.lineTo(cx + R * .1, top - 2); c.lineTo(cx + R * .05, top + 22); c.closePath(); c.fill();
      c.strokeStyle = '#2a2a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, top - R * 1.15); c.lineTo(cx, top); c.stroke();
    } else if (hat === 'saukele') {
      const g = c.createLinearGradient(cx - 60, 0, cx + 60, 0); g.addColorStop(0, '#9e1c26'); g.addColorStop(.5, '#d33a3a'); g.addColorStop(1, '#9e1c26');
      c.fillStyle = g; c.beginPath(); c.moveTo(cx - R * .78, top + 12); c.lineTo(cx - 34, top - R * 1.55); c.quadraticCurveTo(cx, top - R * 1.7, cx + 34, top - R * 1.55); c.lineTo(cx + R * .78, top + 12); c.closePath(); c.fill();
      c.strokeStyle = '#f0c45a'; c.lineWidth = 6; c.stroke();
      for (let i = 0; i < 5; i++) { const y = top - i * 30; ornament(c, cx, y - 6, 1.4, '#f6d27a'); }
      c.fillStyle = '#f0c45a'; c.fillRect(cx - R * .82, top, R * 1.64, 22);
      for (let i = -6; i <= 6; i++) ell(c, cx + i * 14, top + 11, 4, 4, i % 2 ? '#3fb0c8' : '#fff');
      // owl feathers
      for (let i = 0; i < 9; i++) ell(c, cx - 22 + Math.sin(i) * 18, top - R * 1.62 - i * 8, 16, 12, 'rgba(255,255,255,.96)');
      // pendants
      [-1, 1].forEach(sd => { c.strokeStyle = '#f0c45a'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(cx + sd * (R * .74 + k * 8), top + 18); c.lineTo(cx + sd * (R * .8 + k * 8), top + 120 + k * 16); c.stroke(); ell(c, cx + sd * (R * .8 + k * 8), top + 124 + k * 16, 6, 6, '#f0c45a'); } });
    } else if (hat === 'takiya') {
      c.fillStyle = shade(coat, -.1); c.beginPath(); c.ellipse(cx, top - 22, R * .7, R * .45, 0, Math.PI, 0); c.fill(); c.fillRect(cx - R * .7, top - 24, R * 1.4, 18);
      c.strokeStyle = '#f0c45a'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx - R * .7, top - 6); c.lineTo(cx + R * .7, top - 6); c.stroke(); ornament(c, cx, top - 40, 1.8, '#f0c45a');
      for (let i = 0; i < 5; i++) ell(c, cx + 30 + i * 5, top - R * .45 - 10 - i * 12, 10, 8, '#fff');
    } else if (hat === 'helmet') {
      const g = c.createLinearGradient(cx - R, 0, cx + R, 0); g.addColorStop(0, '#6c7682'); g.addColorStop(.45, '#dfe5ea'); g.addColorStop(1, '#6c7682');
      c.fillStyle = g; c.beginPath(); c.moveTo(cx - R * .95, top + 18); c.quadraticCurveTo(cx - R * .9, top - R * .8, cx, top - R * 1.25); c.quadraticCurveTo(cx + R * .9, top - R * .8, cx + R * .95, top + 18); c.closePath(); c.fill();
      c.fillStyle = '#d9a43a'; c.fillRect(cx - R * .97, top + 2, R * 1.94, 18); ell(c, cx, top - R * 1.25, 9, 9, '#d9a43a');
      c.strokeStyle = '#c0392b'; c.lineWidth = 6; c.beginPath(); c.moveTo(cx, top - R * 1.25); c.quadraticCurveTo(cx + 30, top - R * 1.5, cx + 56, top - R * 1.2); c.stroke();
      // aventail
      c.fillStyle = '#9aa3ad'; [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(cx + sd * R * .95, top + 18); c.lineTo(cx + sd * R * 1.02, cy + R * .7); c.lineTo(cx + sd * R * .78, cy + R * .7); c.lineTo(cx + sd * R * .82, top + 18); c.fill(); });
    } else if (hat === 'kimeshek') {
      c.fillStyle = '#fbf8f2'; c.beginPath(); c.ellipse(cx, cy - 10, R * 1.12, R * 1.25, 0, Math.PI * 1.02, Math.PI * 1.98); c.fill();
      c.beginPath(); c.moveTo(cx - R * 1.1, cy - 10); c.lineTo(cx - R * 1.0, cy + R * 1.0); c.quadraticCurveTo(cx, cy + R * 1.5, cx + R * 1.0, cy + R * 1.0); c.lineTo(cx + R * 1.1, cy - 10); c.lineTo(cx + R * .86, cy - 10); c.quadraticCurveTo(cx + R * .9, cy + R * 1.05, cx, cy + R * 1.06); c.quadraticCurveTo(cx - R * .9, cy + R * 1.05, cx - R * .86, cy - 10); c.fill();
      c.strokeStyle = '#c0392b'; c.lineWidth = 6; c.beginPath(); c.ellipse(cx, cy - 10, R * .98, R * 1.1, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      c.fillStyle = '#fbf8f2'; c.beginPath(); c.ellipse(cx, top - 30, R * .9, R * .6, 0, Math.PI, 0); c.fill();
      ornament(c, cx, top - 40, 1.8, '#c0392b');
    } else if (hat === 'kokoshnik') {
      const kg = c.createLinearGradient(0, top - R * 1.2, 0, top + 10); kg.addColorStop(0, '#e0404a'); kg.addColorStop(1, '#9e1c26');
      c.fillStyle = kg; c.beginPath(); c.moveTo(cx - R * .95, top + 18); c.quadraticCurveTo(cx - R * .95, top - R * 1.25, cx, top - R * 1.3); c.quadraticCurveTo(cx + R * .95, top - R * 1.25, cx + R * .95, top + 18); c.closePath(); c.fill();
      c.strokeStyle = '#f0c45a'; c.lineWidth = 6; c.stroke();
      for (let i = 0; i < 11; i++) { const an = Math.PI * (i + .5) / 11; ell(c, cx - Math.cos(an) * R * .8, top + 6 - Math.sin(an) * R * 1.05, 6, 6, '#fff'); }
      ornament(c, cx, top - R * .55, 2.2, '#f6d27a'); ell(c, cx, top - R * .55, 12, 12, '#3fb0c8');
    } else if (hat === 'cap') {
      c.fillStyle = shade(coat, -.35); c.beginPath(); c.ellipse(cx, top - 10, R * .92, R * .42, 0, Math.PI, 0); c.fill(); c.fillRect(cx - R * .92, top - 12, R * 1.84, 24);
      c.fillStyle = '#1e1e1e'; c.beginPath(); c.ellipse(cx + R * .25, top + 14, R * .7, 14, 0, 0, Math.PI); c.fill();
      c.fillStyle = '#c0392b'; c.fillRect(cx - R * .92, top + 2, R * 1.84, 6);
    } else if (hat === 'none' && a.g === 'm' && !kid) { /* side part */ }
    if (hat !== 'none' && hat !== 'bald' && !f && hat !== 'kimeshek') { /* sideburn */ c.fillStyle = hair; c.fillRect(cx - R * .9, top + 26, 12, 30); c.fillRect(cx + R * .9 - 12, top + 26, 12, 30); }

    c.restore();
    return cv;
  }
  function canvas(a, size) { return draw(a || {}, size || 512); }
  function url(a, size) { const k = JSON.stringify(a) + (size || 256); if (!cache[k]) cache[k] = draw(a || {}, size || 256).toDataURL('image/png'); return cache[k]; }
  return { canvas, url };
})();
