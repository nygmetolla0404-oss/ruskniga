/* Сказочный остров «Адал азамат»: 6 регионов-лепестков вокруг озера с Книгой-порталом.
   Общая геометрия для 3D-карты и титульной 3D-книги. */
window.ISLAND = (function () {
  const R0 = 11.6, A0 = -Math.PI / 2;
  const regionAngle = k => A0 + k * Math.PI / 3;
  const radius = a => R0 * (.84 + .17 * Math.cos(6 * (a - A0))) + .45 * Math.sin(3 * a + 1.3) + .3 * Math.sin(7 * a + 2.1) + .18 * Math.sin(13 * a);
  function shape(n) { n = n || 220; const out = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const r = radius(a); out.push([Math.cos(a) * r, Math.sin(a) * r]); } return out; }
  function regionOf(x, z) { let a = Math.atan2(z, x) - A0; a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return Math.round(a / (Math.PI / 3)) % 6; }
  /* 6 книг региона: 0-2 — русская литература (слева), 3-5 — казахская (справа) */
  const SLOT = [[-.27, 4.4], [-.21, 6.6], [-.15, 8.7], [.27, 4.4], [.21, 6.6], [.15, 8.7]];
  function bookPos(k, slot) { const [da, r] = SLOT[slot]; const a = regionAngle(k) + da; return { x: Math.cos(a) * r, z: Math.sin(a) * r }; }
  function landmark(k) { const a = regionAngle(k), r = radius(a) - 1.7; return { x: Math.cos(a) * r, z: Math.sin(a) * r }; }
  /* границы регионов — реки от озера к морю */
  function river(k) { const a = regionAngle(k) + Math.PI / 6, pts = []; for (let r = 2.1; r < radius(a) + .3; r += .35) { const w = a + Math.sin(r * .9 + k) * .05; pts.push([Math.cos(w) * r, Math.sin(w) * r]); } return pts; }
  return { R0, A0, regionAngle, radius, shape, regionOf, bookPos, landmark, river, LAKE: 2.1 };
})();
