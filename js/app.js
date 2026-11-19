/* 3D Литературный портал: от книги к жизни — приложение */
(function () {
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const S = window.STORIES, V = window.VALUES, R = window.REGIONS;
  let lang = 'ru'; try { lang = localStorage.getItem('lp_lang') || 'ru'; } catch (e) {} if (lang !== 'kk') lang = 'ru';
  const t = k => (I18N[lang] && I18N[lang][k]) || I18N.ru[k] || k;
  const L = o => (o && (o[lang] || o.ru)) || '';
  const TL = s => lang === 'kk' ? s.kk : s.ru;
  const esc = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  let prog = store.get('lp_prog', { tales: {}, games: {} });
  const saveProg = () => { store.set('lp_prog', prog); updateBadges(); };
  const toast = (msg, ms) => { const el = $('#toast'); el.innerHTML = msg; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), ms || 2600); };
  const imgUrl = k => 'assets/img/w/' + k + '.jpg';
  const CRED = window.CREDITS || {};
  const words = x => (String(x).toLowerCase().replace(/ё/g, 'е').match(/[a-zа-яәғқңөұүһі0-9-]+/gi) || []);
  let svgN = 0; const guideSVG = kind => { const n = ++svgN; return GUIDES[kind].replace(/id="(\w+)"/g, `id="$1_${n}"`).replace(/url\(#(\w+)\)/g, `url(#$1_${n})`); };
  const cover0 = s => s.imgs[0] ? imgUrl(s.imgs[0]) : Avatar.url(s.chars[0].a, 300);
  const litTag = s => `<span class="lit ${s.o}">${s.o === 'kz' ? '📘 ' + t('kzLit') : '📕 ' + t('ruLit')}</span>`;

  /* ---------- language ---------- */
  function applyLang() {
    document.documentElement.lang = lang === 'kk' ? 'kk' : 'ru';
    $$('[data-i]').forEach(el => el.textContent = t(el.dataset.i));
    $$('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
    renderTales(); renderValues(); renderMuseum(); renderIdea(); renderAuthor(); renderList(); renderRegionBar(); updateBadges(); if (page === 'time') renderTime();
    if (map) map.setLang(lang);
    if (cur && bookOpen()) renderPanel(curTab);
    setGuideHelp(); syncVoice();
  }
  function setLang(l) { lang = l === 'kk' ? 'kk' : 'ru'; try { localStorage.setItem('lp_lang', lang); } catch (e) {} applyLang(); }
  $$('[data-lang]').forEach(b => b.onclick = () => setLang(b.dataset.lang));

  /* ---------- splash ---------- */
  if ($('#sgLeopard')) { $('#sgLeopard').innerHTML = guideSVG('leopard'); $('#sgEagle').innerHTML = guideSVG('eagle'); }
  $$('[data-pick]').forEach(b => b.onclick = () => { setLang(b.dataset.pick); $('#splash').classList.add('gone'); setTimeout(() => $('#splash') && $('#splash').remove(), 800); try { Music.start(); $('#musicBtn').classList.add('on'); } catch (e) {} Voice.say([{ lang, text: SAY.chosen[lang] }, { lang, text: GUIDE_LINES[lang].hello }]); });

  /* ---------- top bar ---------- */
  function syncVoice() { $('#voiceBtn').classList.toggle('off', !Voice.enabled); $$('.vtoggle').forEach(b => { b.classList.toggle('off', !Voice.enabled); b.querySelector('.vi').textContent = Voice.enabled ? '🔊' : '🔇'; b.querySelector('.vl').textContent = t(Voice.enabled ? 'voiceOn' : 'voiceOff'); }); }
  function toggleVoice() { Voice.enabled = !Voice.enabled; syncVoice(); toast(Voice.enabled ? t('voiceOn') : t('voiceOff')); if (Voice.enabled) Voice.say(SAY.voiceOn[lang], { lang }); }
  $('#voiceBtn').onclick = toggleVoice; $$('.vtoggle').forEach(b => b.onclick = e => { e.stopPropagation(); toggleVoice(); });
  $('#musicBtn').onclick = () => { if (Music.on) { Music.stop(); $('#musicBtn').classList.remove('on'); } else { Music.start(); $('#musicBtn').classList.add('on'); } };
  $('#burger').onclick = () => $('#nav').classList.toggle('open');
  $$('#nav a').forEach(a => a.onclick = () => $('#nav').classList.remove('open'));
  addEventListener('scroll', () => $('#topbar').classList.toggle('solid', scrollY > 40));
  const isDone = id => { const x = prog.tales[id]; return !!(x && x.t1 && x.t2 && x.t3 && x.t4); };
  function updateBadges() {
    const n = S.filter(s => isDone(s.id)).length + Object.keys(prog.games).length;
    $('#badgeCount').textContent = n;
    if (map) map.markDone(S.filter(s => isDone(s.id)).map(s => s.id));
  }

  /* ---------- pages ---------- */
  const PAGES = ['hero', 'map', 'tales', 'time', 'museum', 'values', 'games', 'idea', 'author'];
  let page = null, heroBook = null, mapIntroDone = false, langAsked = false;
  function route() {
    let id = (location.hash || '#hero').slice(1); if (!PAGES.includes(id)) id = 'hero';
    if (id === page) return; page = id;
    PAGES.forEach(p => { const el = document.getElementById(p); if (el) el.classList.toggle('page-off', p !== id); });
    $$('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
    document.body.dataset.page = id; scrollTo(0, 0);
    if (heroBook) heroBook.paused = id !== 'hero';
    if (id === 'map' && !langAsked && !$('#splash')) { langAsked = true; setTimeout(askLang, 700); }
    if (id === 'map' && map) { map.resize(); if (!mapIntroDone && map.ready) { mapIntroDone = true; map.intro(); } }
    if (id === 'time') renderTime();
  }
  addEventListener('hashchange', route);
  function initHeroBook() { try { if (window.THREE && window.HeroBook) heroBook = HeroBook($('#heroBook')); if (heroBook) heroBook.paused = page !== 'hero'; } catch (e) { console.error(e); } }
  $('#openMuseumHero').onclick = () => location.hash = '#museum';

  /* ---------- 3D map ---------- */
  let map = null, mapMode = 'view';
  function initMap() {
    if (!window.THREE) { $('#mapLoading').textContent = 'Не удалось загрузить three.js — проверьте интернет.'; return; }
    map = MapView({ canvas: $('#mapCanvas'), labelsEl: $('#mapLabels'), stories: S, getLang: () => lang, onPick: pickStory, onNear: nearStory, onReady: () => { $('#mapLoading').hidden = true; if (page === 'map' && !mapIntroDone) { mapIntroDone = true; map.intro(); } } });
    map.setLang(lang); updateBadges();
    const io = new IntersectionObserver(es => es.forEach(e => { map.paused = !e.isIntersecting || worldOpen; }), { threshold: .05 }); io.observe($('#mapStage'));
  }
  function setMapMode(m) {
    mapMode = m; map && map.setMode(m);
    $$('#mapHud [data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
    $('#mapStage').classList.toggle('riding', m !== 'view');
    if (m === 'ride') guideSay(GUIDE_LINES[lang].hello); if (m === 'fly') guideSay(GUIDE_LINES[lang].fly);
    setGuideHelp();
    if (m !== 'view') { if (page !== 'map') location.hash = '#map'; $('#mapCanvas').focus(); }
  }
  $$('#mapHud [data-mode]').forEach(b => b.onclick = () => setMapMode(b.dataset.mode));
  $('#ctaRide').onclick = e => { e.preventDefault(); location.hash = '#map'; setTimeout(() => setMapMode('ride'), 200); };
  let guideKind = '';
  function setGuideHelp() {
    $('#mapHelp').textContent = t(mapMode === 'ride' ? 'rideHelp' : mapMode === 'fly' ? 'flyHelp' : 'viewHelp');
    $('#guideName').textContent = mapMode === 'fly' ? t('guideNameFly') : t('guideName');
    const k = mapMode === 'fly' ? 'eagle' : 'leopard'; if (k !== guideKind) { guideKind = k; $('#guideIco').innerHTML = guideSVG(k); }
  }
  function renderRegionBar() {
    $('#regionBar').innerHTML = R.map((r, k) => `<button class="rchip" data-r="${k}" style="--rc:${r.color}"><i>${r.ico}</i><span>${esc(L(r))}</span></button>`).join('');
    $$('#regionBar [data-r]').forEach(b => b.onclick = () => { const k = +b.dataset.r; map && map.focusRegion(k); guideSay(NARR.region(R[k], lang)); });
  }
  let nearS = null;
  function nearStory(s) {
    nearS = s; $('#nearPrompt').hidden = !s;
    if (s) { $('#nearTitle').textContent = TL(s); guideSay(NARR.near(s, lang)); }
  }
  $('#nearPrompt').onclick = () => nearS && pickStory(nearS);
  addEventListener('keydown', e => {
    if (e.code !== 'KeyE' || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (worldOpen) { if (!bookOpen()) world && world.activate(); } else if (nearS) pickStory(nearS);
  });
  $$('.pad [data-k]').forEach(b => { const k = b.dataset.k; const on = e => { e.preventDefault(); ENG.KEYS[k] = 1; b.classList.add('on'); }, off = () => { ENG.KEYS[k] = 0; b.classList.remove('on'); }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off); });
  $$('.pad [data-act]').forEach(b => b.onclick = () => worldOpen ? (!bookOpen() && world.activate()) : nearS && pickStory(nearS));

  let guideIdleT = null;
  function guideSay(text, silent) {
    $('#guideBubble').textContent = text; $('#guideBox').classList.add('talk');
    clearTimeout(guideIdleT); guideIdleT = setTimeout(() => { $('#guideBox').classList.remove('talk'); }, 9000);
    if (!silent && Voice.enabled && !worldOpen) Voice.say(text, { lang, voice: 'guide' });
  }
  function askLang() {
    $('#guideBubble').textContent = 'Выберите язык · Тілді таңдаңыз'; $('#guideLang').hidden = false; $('#guideBox').classList.add('talk'); clearTimeout(guideIdleT);
    Voice.say(SAY.ask);
  }
  $$('[data-glang]').forEach(x => x.onclick = e => { e.stopPropagation(); $('#guideLang').hidden = true; const l = x.dataset.glang; setLang(l); $('#guideBubble').textContent = SAY.chosen[l]; Voice.say([{ lang: l, text: SAY.chosen[l] }, { lang: l, text: GUIDE_LINES[l].hello }]); });
  $('#guideBox').onclick = () => { const a = GUIDE_LINES[lang].idle; guideSay(a[Math.floor(Math.random() * a.length)]); };

  function renderList() {
    $('#taleList').innerHTML = R.map((r, k) => `<li class="lgroup" style="--rc:${r.color}"><b>${r.ico} ${esc(L(r))}</b></li>` + S.filter(s => s.region === k).map(s => `<li><button data-id="${s.id}"><img src="${Avatar.url(s.chars[0].a, 96)}" alt=""><span><b>${S.indexOf(s) + 1}. ${esc(TL(s))}</b><small>${s.o === 'kz' ? '📘' : '📕'} ${esc(L(s.author))}</small></span>${isDone(s.id) ? '<em>★</em>' : ''}</button></li>`).join('')).join('');
    $$('#taleList button').forEach(b => b.onclick = () => { map && map.focus(b.dataset.id); if (innerWidth < 800) $('#mapSide').classList.remove('open'); });
  }
  $('#sideToggle').onclick = () => $('#mapSide').classList.toggle('open');

  /* ---------- books grid ---------- */
  let filter = 'all';
  function renderTales() {
    const F = [['all', t('filterAll')], ['ru', t('filterRu')], ['kz', t('filterKz')]].concat(R.map((r, k) => ['r' + k, r.ico + ' ' + L(r)]));
    $('#taleFilters').innerHTML = F.map(([f, l]) => `<button class="chip ${f === filter ? 'on' : ''}" data-f="${f}">${esc(l)}</button>`).join('');
    $$('#taleFilters .chip').forEach(b => b.onclick = () => { filter = b.dataset.f; renderTales(); });
    $('#taleCards').innerHTML = S.filter(s => filter === 'all' || s.o === filter || 'r' + s.region === filter).map(s => {
      const i = S.indexOf(s) + 1, v = V[s.value];
      return `<article class="tcard" data-id="${s.id}" style="--c:${s.color}">
        <div class="tc-img"><img loading="lazy" src="${cover0(s)}" class="${s.imgs[0] ? '' : 'ava'}" alt=""><span class="tc-n">${i}</span><span class="tc-type">${esc(typeOf(s, lang))}</span>${isDone(s.id) ? '<span class="tc-done">★</span>' : ''}</div>
        <div class="tc-heroes">${s.chars.slice(0, 4).map(c => `<img src="${Avatar.url(c.a, 120)}" title="${esc(L(c.n))}" alt="">`).join('')}</div>
        <div class="tc-body">${litTag(s)}<h3>${esc(TL(s))}</h3><p class="kk">${esc(lang === 'kk' ? s.ru : s.kk)}</p><p class="tc-place">✍ ${esc(L(s.author))} · ${esc(L(s.year))}</p><p class="tc-sum">${esc(L(s.sum))}</p>
        <div class="tc-foot"><span class="vbadge" style="--vc:${v.color}">${v.ico} ${esc(L(v))}</span><button class="btn btn-gold btn-small">${t('open')} ✨</button></div></div></article>`;
    }).join('');
    $$('#taleCards .tcard').forEach(c => c.onclick = () => pickStory(S.find(s => s.id === c.dataset.id)));
  }

  /* ---------- portal / world ---------- */
  let world = null, worldOpen = false, cur = null, curTab = 'story', trailer = null, worldMode = 'ride', bookV = null, heroSel = 0, propSel = null;
  const TABS = ['story', 'heroes', 'museum', 'trailer', 'letters', 'tasks', 'guide'];
  const era = s => s.era || { y: 2026, c: { ru: '', kk: '' }, w: 'clear' };
  const wxOf = s => WEATHER[era(s).w] || WEATHER.clear;
  const eraLine = s => `⏳ ${eraYear(era(s).y, lang)} · ${L(era(s).c)} · ${wxOf(s).ico} ${L(wxOf(s))}`;
  function pickStory(s) {
    if (quest.on) return questPick(s);
    if (worldOpen) return;
    Voice.stop(); Music.whoosh && Music.whoosh();
    const tr = $('#travel'), e = era(s);
    $('#travelTitle').textContent = TL(s); $('#travelKk').textContent = lang === 'kk' ? s.ru : s.kk; $('#travelImg').src = Avatar.url(s.chars[0].a, 300);
    $('#travelEra').textContent = `${L(e.c)} · ${wxOf(s).ico} ${L(wxOf(s))}`;
    tr.hidden = false; requestAnimationFrame(() => tr.classList.add('on'));
    const y0 = 2026, t0 = performance.now(), y1 = Math.min(e.y, 2100);
    (function tick(now) { const k = Math.min(1, (now - t0) / 1800), kk = 1 - Math.pow(1 - k, 3); $('#travelYear').textContent = eraYear(Math.round(y0 + (y1 - y0) * kk), lang); if (k < 1) requestAnimationFrame(tick); })(t0);
    setTimeout(() => openWorld(s), 2000);
    setTimeout(() => { tr.classList.remove('on'); setTimeout(() => tr.hidden = true, 600); }, 2800);
  }
  function ensureBook() {
    if (bookV) return;
    bookV = BookView({ root: $('#bk'), tabs: TABS, cover: drawCover,
      render: (tab, extra) => { curTab = tab; renderPanel(tab, extra); },
      leave: () => { bookReady = false; stopMic(); Voice.stop(); trailer && trailer.stop(); PopUp.stop(); },
      onShown: tab => narrate(tab),
      onClosed: () => { world && world.freeze(false); $('#world').classList.remove('reading'); PopUp.stop(); } });
  }
  function drawCover(s, el) {
    const i = S.indexOf(s) + 1, r = R[s.region];
    el.style.setProperty('--cc', s.color);
    el.innerHTML = `<div class="cv-orn"></div><p class="cv-top">${r.ico} ${esc(L(r))}</p><div class="cv-medal"><img src="${cover0(s)}" alt=""></div>
      <p class="cv-n">${i} · ${esc(typeOf(s, lang))} · ${s.o === 'kz' ? t('kzLit') : t('ruLit')}</p><h2>${esc(TL(s))}</h2><p class="cv-kk">${esc(lang === 'kk' ? s.ru : s.kk)}</p><p class="cv-place">✍ ${esc(L(s.author))}</p><p class="cv-era">${eraLine(s)}</p>`;
  }
  function openWorld(s) {
    cur = s; worldOpen = true; if (map) map.paused = true; document.body.classList.add('locked');
    $('#world').hidden = false; $('#wTitle').textContent = TL(s); $('#wKk').textContent = lang === 'kk' ? s.ru : s.kk; $('#wPlace').textContent = '📍 ' + L(s.place); $('#wEra').textContent = eraLine(s);
    $('#world').dataset.wx = era(s).w;
    if (!world) world = PortalView({ canvas: $('#worldCanvas'), labelsEl: $('#worldLabels'), getLang: () => lang, onHotspot: (tab, extra) => openPanel(tab, extra), onExit: closeWorld, onNear: n => { $('#wNear').hidden = !n; if (n) $('#wNearName').textContent = n.name; } });
    world.freeze(false); world.open(s); world.setMode(worldMode); ensureBook();
    $$('#wModes [data-wm]').forEach(b => b.classList.toggle('on', b.dataset.wm === worldMode));
    curTab = 'story'; heroSel = 0; propSel = null;
    setTimeout(() => { if (!bookOpen()) Voice.say([SAY.travel(s, lang), NARR.welcome(s, lang)], { lang, voice: 'guide' }); }, 300);
  }
  function closeWorld() {
    if (!worldOpen) return; worldOpen = false; Voice.stop(); trailer && trailer.stop(); stopMic(); PopUp.stop();
    if (bookV) bookV.hide(); $('#world').classList.remove('reading');
    world.close(); $('#world').hidden = true; document.body.classList.remove('locked'); if (map) map.paused = false; renderList(); renderTales(); updateBadges();
  }
  $('#wBack').onclick = closeWorld;
  $('#wBook').onclick = () => openPanel(curTab || 'story');
  $$('#wModes [data-wm]').forEach(b => b.onclick = () => { worldMode = b.dataset.wm; world.setMode(worldMode); $$('#wModes [data-wm]').forEach(x => x.classList.toggle('on', x === b)); });
  $('#wNear').onclick = () => world.activate();
  function openPanel(tab, extra) {
    if (tab === 'exit') return closeWorld();
    if (tab === 'prop') tab = 'museum';
    ensureBook(); world && world.freeze(true); $('#world').classList.add('reading'); $('#wNear').hidden = true;
    if (bookV.isOpen) bookV.go(tab, extra); else { bookReady = false; pendingSay = null; Voice.stop(); bookV.open(cur, tab, extra); }
  }
  const bookOpen = () => bookV && !$('#bk').hidden;
  let bookReady = false, pendingSay = null, guideQ0 = '';
  function sayLater(fn) { if (bookReady) setTimeout(fn, 300); else pendingSay = fn; }
  const heroOf = s => s.chars.find(c => c.n.ru === s.letter.from) || s.chars.find(c => s.letter.from.startsWith(c.n.ru.split(' ')[0])) || s.chars[0];
  const letterVoice = s => VOICE_OF(heroOf(s).a);
  function narrate(tab) {
    bookReady = true; const s = cur; if (!s) return;
    if (pendingSay) { const f = pendingSay; pendingSay = null; f(); return; }
    if (!Voice.enabled) return;
    if (tab === 'story') { const b = $(lang === 'kk' ? '#readStoryKk' : '#readStory'); b && b.click(); }
    if (tab === 'heroes') Voice.say(SAY.heroes(s, lang), { lang });
    if (tab === 'museum') Voice.say([{ lang, text: SAY.museum(s, lang) }, { lang, text: L(s.kzfact) }]);
    if (tab === 'trailer') Voice.say(SAY.trailer(s, lang), { lang });
    if (tab === 'letters') Voice.say([{ lang, text: SAY.letters(s, lang) }, ...s.letter.text.split('\n').map(x => x.trim()).filter(Boolean).map(x => ({ lang: 'ru', text: x }))], { btn: $('#readLetter'), voice: letterVoice(s) });
    if (tab === 'tasks') Voice.say(SAY.tasks(s, lang), { lang });
    if (tab === 'guide') Voice.say([{ lang, text: SAY.guide(s, lang) }, { lang: 'ru', text: guideQ0 }]);
  }

  const head = (s, title) => `<header class="pg-head"><span>${esc(TL(s))}</span><span>${title}</span></header>`;
  function pages(lh, rh) { const A = bookV.L, B = bookV.R; A.innerHTML = lh; B.innerHTML = rh; A.scrollTop = B.scrollTop = 0; }
  function renderPanel(tab, extra) {
    const s = cur; if (!s || !bookV) return; stopMic(); PopUp.stop();
    const v = V[s.value];
    if (tab === 'story') {
      pages(`${head(s, t('tStory'))}<div class="p-head"><img src="${cover0(s)}" alt=""><div>${litTag(s)}<h2>${esc(TL(s))}</h2><p class="kk">${esc(lang === 'kk' ? s.ru : s.kk)}</p><p>✍ ${esc(L(s.author))} · ${esc(L(s.year))}</p><span class="vbadge" style="--vc:${v.color}">${v.ico} ${esc(L(v))}</span></div></div>
        <p class="lead">${esc(L(s.sum))}</p>
        <h3>${t('howItHappened')}</h3><div class="row"><button class="btn btn-small btn-gold btn-audio" id="readStory"><span class="pi">▶</span> Русский</button><button class="btn btn-small btn-ghost btn-audio" id="readStoryKk"><span class="pi">▶</span> Қазақша</button></div>
        <div class="story">${s.story.map((p, i) => `<p data-p="${i}">${esc(p)}</p>`).join('')}</div>`,
        `${head(s, '⏳ ' + t('navTime'))}<div class="pop-slot" id="popSlot"></div>
        <div class="era-card"><div><small>${lang === 'kk' ? 'Дәуір' : 'Эпоха'}</small><b>${eraYear(era(s).y, lang)}</b><span>${esc(L(era(s).c))}</span></div><div><small>${lang === 'kk' ? 'Ауа райы' : 'Погода'}</small><b>${wxOf(s).ico}</b><span>${esc(L(wxOf(s)))}</span></div></div>
        <details class="kkstory" ${lang === 'kk' ? 'open' : ''}><summary>🇰🇿 Қазақша мәтін</summary>${s.storyKk.map((p, i) => `<p data-k="${i}">${esc(p)}</p>`).join('')}</details>
        <div class="value-box"><b>${v.ico} Адал азамат · ${esc(v.ru)} / ${esc(v.kk)}</b><p>${esc(v.d.ru)}</p><p class="kk">${esc(v.d.kk)}</p></div>`);
      $('#readStory').onclick = e => Voice.toggle(e.currentTarget, s.story, { lang: 'ru', voice: 'guide', onPart: i => { $$('.story p').forEach(p => p.classList.toggle('reading', +p.dataset.p === i)); }, onEnd: () => $$('.story p').forEach(p => p.classList.remove('reading')) });
      $('#readStoryKk').onclick = e => { $('.kkstory').open = true; Voice.toggle(e.currentTarget, s.storyKk, { lang: 'kk', voice: 'guide', onPart: i => { $$('.kkstory p').forEach(p => p.classList.toggle('reading', +p.dataset.k === i)); }, onEnd: () => $$('.kkstory p').forEach(p => p.classList.remove('reading')) }); };
      PopUp.show($('#popSlot'), 'story', s);
    }
    if (tab === 'heroes') {
      if (extra && extra.i != null) heroSel = extra.i; if (heroSel >= s.chars.length) heroSel = 0;
      const c = s.chars[heroSel];
      pages(`${head(s, t('tHeroes'))}<h2>${t('heroesOf')}</h2><div class="heroes">${s.chars.map((h, i) => `<div class="hero-card ${i === heroSel ? 'hl' : ''}" data-hc="${i}"><img src="${Avatar.url(h.a, 240)}" alt=""><div><h3>${esc(L(h.n))}</h3><p class="kk">${esc(lang === 'kk' ? h.n.ru : h.n.kk)}</p><p>${esc(h.d)}</p></div></div>`).join('')}</div>`,
        `${head(s, '🎭 3D')}<div class="pop-slot" id="popSlot"></div><div class="hero-say"><h3>${esc(L(c.n))} <small class="kk">${esc(lang === 'kk' ? c.n.ru : c.n.kk)}</small></h3><blockquote>«${esc(c.line)}»</blockquote><button class="btn btn-small btn-gold btn-audio" id="sayHero"><span class="pi">▶</span> ${t('speakLine')}</button></div>
        <p class="note">👆 ${lang === 'kk' ? 'Сол беттен кейіпкерді таңда — ол кітаптан 3D болып шығады.' : 'Выбери героя на левой странице — он выйдет из книги в 3D.'}</p>`);
      $$('[data-hc]').forEach(b => b.onclick = () => { heroSel = +b.dataset.hc; renderPanel('heroes'); setTimeout(() => $('#sayHero') && $('#sayHero').click(), 300); });
      PopUp.show($('#popSlot'), 'heroes', s, { i: heroSel });
      $('#sayHero').onclick = e => { world && world.talk(heroSel, 3); PopUp.talk(heroSel, 3); Voice.toggle(e.currentTarget, c.line, { lang: 'ru', voice: VOICE_OF(c.a) }); };
      if (extra && extra.i != null) sayLater(() => $('#sayHero') && $('#sayHero').click());
    }
    if (tab === 'museum') {
      if (extra && extra.p) propSel = extra.p; if (!s.props.includes(propSel)) propSel = s.props[0];
      const P0 = PROPS[propSel], lk = lang === 'kk' ? 'kk' : 'ru';
      pages(`${head(s, t('tMuseum'))}<h2>🏛 ${t('museumOf')}</h2>
        <div class="value-box kzbox"><b>🇰🇿 ${t('kzLink')}</b><p>${esc(L(s.kzfact))}</p><p class="kk">${esc(lang === 'kk' ? s.kzfact.ru : s.kzfact.kk)}</p><button class="btn btn-small btn-ghost btn-audio" id="sayKz"><span class="pi">▶</span> ${t('listen')}</button></div>
        ${s.imgs.length ? `<p class="muted">${t('realPhotos')}</p><div class="mu-grid">${s.imgs.map(k => `<figure data-k="${k}"><img loading="lazy" src="${imgUrl(k)}" onerror="this.closest('figure').classList.add('noimg')" alt=""><figcaption><b>${esc(L(IMG_CAP[k]))}</b>${CRED[k] ? `<small>© ${esc(CRED[k].author)} · ${esc(CRED[k].license)}</small>` : ''}</figcaption></figure>`).join('')}</div>` : `<div class="mu-heroes">${s.chars.map(c => `<img src="${Avatar.url(c.a, 200)}" alt="">`).join('')}</div>`}
        <div class="value-box"><b>📜 ${t('didYouKnow')}</b><p>${esc(s.story[s.story.length - 1])}</p></div>`,
        `${head(s, '✨ ' + t('objects'))}<div class="pop-slot" id="popSlot"></div><div class="prop-now"><h3>${PROP_ICO[propSel] || '✨'} ${esc(P0[lk])}</h3><p>${esc(P0.d[lk])}</p><button class="btn btn-small btn-gold btn-audio" id="sayProp"><span class="pi">▶</span> ${t('readAloud')}</button></div>
        <div class="props">${s.props.map(p => `<button class="prop-card ${p === propSel ? 'hl' : ''}" data-p="${p}"><span class="p-ico">${PROP_ICO[p] || '✨'}</span><b>${esc(PROPS[p][lk])}</b></button>`).join('')}</div>`);
      $$('.mu-grid figure').forEach(f => f.onclick = () => lightbox(f.dataset.k));
      $$('.prop-card').forEach(c => c.onclick = () => { propSel = c.dataset.p; renderPanel('museum'); setTimeout(() => $('#sayProp') && $('#sayProp').click(), 300); });
      $('#sayProp').onclick = e => Voice.toggle(e.currentTarget, NARR.prop(propSel, lang), { lang, voice: 'guide' });
      $('#sayKz').onclick = e => Voice.toggle(e.currentTarget, L(s.kzfact), { lang, voice: 'guide' });
      PopUp.show($('#popSlot'), 'museum', s, { p: propSel });
      if (extra && extra.p) sayLater(() => $('#sayProp') && $('#sayProp').click());
    }
    if (tab === 'trailer') {
      pages(`${head(s, t('tTrailer'))}<h2>🎬 ${t('tTrailer')}</h2><ol class="tr-scenes">${s.trailer.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
        <div class="value-box"><b>💬 ${t('discuss')}</b><p>${t('discussText')}</p></div>
        <h3>📚 ${t('newWords')}</h3><table class="vocab">${s.vocab.map((w, i) => `<tr><td><button class="vw" data-l="ru" data-i="${i}">🔊</button> <b>${esc(w[0])}</b></td><td><button class="vw" data-l="kk" data-i="${i}">🔊</button> ${esc(w[1])}</td></tr>`).join('')}</table>`,
        `${head(s, '🎬 ' + t('trPlay'))}<div class="trailer"><canvas id="trCanvas" width="1280" height="720"></canvas><div class="tr-ctrl"><button class="btn btn-gold btn-small" id="trPlay">▶ ${t('trPlay')}</button><div class="tr-progress"><i id="trBar"></i></div><button class="icon-btn" id="trFull" title="⛶">⛶</button></div></div><p class="tr-cap" id="trCap"></p>`);
      $$('.vw').forEach(b => b.onclick = () => Voice.say(s.vocab[+b.dataset.i][b.dataset.l === 'kk' ? 1 : 0], { lang: b.dataset.l, rate: .9 }));
      trailer = Trailer($('#trCanvas'), $('#trCap'), $('#trBar')); trailer.load(s);
      $('#trPlay').onclick = () => { $('#trPlay').textContent = '▶ ' + t('trAgain'); trailer.play(); };
      $('#trCanvas').onclick = () => trailer.playing || trailer.play();
      $('#trFull').onclick = () => { const el = $('.trailer'); (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el); };
    }
    if (tab === 'letters') renderLetters(s);
    if (tab === 'tasks') renderTasks(s);
    if (tab === 'guide') renderGuide(s);
  }

  /* ---------- letters (письмо) ---------- */
  const VALUE_WORDS = ['дружб', 'друг', 'вместе', 'единств', 'помощ', 'помога', 'труд', 'работ', 'мастер', 'учи', 'знани', 'честн', 'чест', 'правд', 'справедл', 'ответствен', 'закон', 'правил', 'родин', 'отан', 'добр', 'уваж', 'смел', 'мир', 'бірлік', 'еңбек', 'адал'];
  function renderLetters(s) {
    const from = s.letter.from, hero = heroOf(s);
    const mine = store.get('lp_letters', {})[s.id] || [];
    pages(`${head(s, t('tLetters'))}<h2>✉ ${t('letterFrom')}</h2>
      <div class="letter"><div class="l-head"><img src="${Avatar.url(hero.a, 140)}" alt=""><div><small>${t('letterFrom')}</small><b>${esc(from)}</b></div><button class="btn btn-small btn-audio" id="readLetter"><span class="pi">▶</span> ${t('readAloud')}</button></div><div class="l-text">${esc(s.letter.text).replace(/\n/g, '<br>')}</div></div>
      ${mine.length ? `<h3>📂 ${t('myLetters')}</h3>` + mine.map(m => `<details class="old"><summary>${esc(m.date)}</summary><p>${esc(m.text).replace(/\n/g, '<br>')}</p></details>`).join('') : ''}`,
      `${head(s, '✍ ' + t('writeBack'))}<h3>✍ ${t('writeBack')}</h3>
      <div class="write"><textarea id="myLetter" rows="10" placeholder="Дорогой (Дорогая) ${esc(from)}!&#10;&#10;Спасибо за твоё письмо...">${esc(store.get('lp_draft_' + s.id, ''))}</textarea>
      <div class="wl-side"><b>${t('checklist')}</b><ul id="ck"><li data-c="g">${t('ckGreeting')}</li><li data-c="l">${t('ckLen')}</li><li data-c="v">${t('ckValue')}</li><li data-c="q">${t('ckQuestion')}</li><li data-c="c">${t('ckClosing')}</li><li data-c="p">${t('ckCaps')}</li></ul><p class="wc"><span id="wc">0</span> ${t('words')}</p>
      <p class="hint">💡 ${lang === 'kk' ? 'Пайдалы сөздер' : 'Полезные слова'}: ${s.vocab.map(v => v[0]).slice(0, 4).join(', ')}, ${esc(V[s.value].ru.toLowerCase())}</p></div></div>
      <div class="row"><button class="btn btn-gold" id="sendL">${t('send')}</button><button class="btn btn-ghost btn-small" id="readMine">🔊 ${t('readAloud')}</button><button class="btn btn-ghost btn-small" id="dlL">⬇ ${t('download')}</button></div>
      <div id="reply"></div>`);
    const lv = VOICE_OF(hero.a);
    $('#readLetter').onclick = e => Voice.toggle(e.currentTarget, s.letter.text.split('\n').map(x => x.trim()).filter(Boolean), { lang: 'ru', voice: lv });
    const ta = $('#myLetter');
    const check = () => {
      const x = ta.value, w = words(x).length, lo = x.toLowerCase().replace(/ё/g, 'е');
      const body = x.trim().split('\n').filter(l => l.trim()).slice(0, -1).join(' ') || x;
      const sents = (body.match(/[^.!?…]+[.!?…]*/g) || []).map(q => q.trim()).filter(q => q.length > 2);
      const ok = { g: /^\s*(дорог|здравствуй|привет|уважаем|милый|милая|сәлем|құрметті)/i.test(x), l: w >= 40, v: VALUE_WORDS.some(k => lo.includes(k)), q: /\?/.test(x),
        c: /(с уважением|твой|твоя|ваш|ваша|до свидания|пока|с любовью|обнимаю|с теплом)/i.test(x.slice(-90)),
        p: sents.length > 1 && sents.every(q => /^[«"(—-]?\s*[A-ZА-ЯЁӘҒҚҢӨҰҮҺІ]/.test(q)) && sents.slice(0, -1).every(q => /[.!?…»)]$/.test(q)) };
      $$('#ck li').forEach(li => li.classList.toggle('ok', ok[li.dataset.c])); $('#wc').textContent = w; store.set('lp_draft_' + s.id, x); return ok;
    };
    ta.oninput = check; check();
    $('#readMine').onclick = e => Voice.toggle(e.currentTarget, ta.value, { lang: 'ru', voice: 'guide' });
    $('#dlL').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ta.value], { type: 'text/plain;charset=utf-8' })); a.download = `pismo-${s.id}.txt`; a.click(); };
    $('#sendL').onclick = () => {
      const ok = check(), score = Object.values(ok).filter(Boolean).length;
      if (words(ta.value).length < 10) { toast('✍ ' + t('fbShort')); return; }
      const all = store.get('lp_letters', {}); (all[s.id] = all[s.id] || []).push({ date: new Date().toLocaleString(), text: ta.value }); store.set('lp_letters', all);
      const p = tp(s.id); if (score >= 4 && !p.l) { p.l = 1; saveProg(); }
      const q = (ta.value.match(/[^.!?\n]*\?/) || [''])[0].trim();
      const name = (ta.value.match(/(?:меня зовут)\s+([А-ЯЁӘҒҚҢӨҰҮҺІ][а-яёәғқңөұүһі]+)/) || [])[1];
      const reply = `Дорогой друг${name ? ' ' + name : ''}!\n\nСпасибо тебе за чудесное письмо! Я прочитал его и улыбнулся. ${score >= 5 ? 'Ты пишешь грамотно и красиво — сразу видно настоящего Адал азамата!' : score >= 3 ? 'Ты хорошо пишешь. В следующий раз попробуй рассказать о себе ещё подробнее.' : 'Я рад, что ты мне написал. Добавь обращение, вопрос и подпись — так письмо станет настоящим.'}\n\n${q ? `Ты спросил меня: «${q}» Какой хороший вопрос! ` : ''}Моя история научила меня главному: ${V[s.value].d.ru.toLowerCase()}\n\nПриходи ко мне в гости ещё — в мир книги «${s.ru}».\n\nС теплом,\n${from}`;
      $('#reply').innerHTML = `<div class="letter reply"><div class="l-head"><img src="${Avatar.url(hero.a, 140)}" alt=""><div><small>${t('replyFrom')}</small><b>${esc(from)}</b></div><button class="btn btn-small btn-audio" id="readReply"><span class="pi">▶</span> ${t('readAloud')}</button></div><div class="l-text">${esc(reply).replace(/\n/g, '<br>')}</div><p class="score">✔ ${t('checklist')}: ${score}/6</p></div>`;
      $('#readReply').onclick = e => Voice.toggle(e.currentTarget, reply.split('\n').filter(Boolean), { lang: 'ru', voice: lv });
      Music.chime(score >= 4); $('#reply').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
  }

  /* ---------- 4 tasks ---------- */
  function tp(id) { return prog.tales[id] = prog.tales[id] || {}; }
  function renderTasks(s) {
    const p = tp(s.id), reg = R[s.region], life = reg.life;
    const passage = s.story[0];
    pages(`${head(s, t('tTasks'))}<h2>🧩 ${t('tTasks')}</h2><div class="tprog">${['t1', 't2', 't3', 't4'].map((k, i) => `<span class="${p[k] ? 'ok' : ''}">${i + 1}</span>`).join('')}</div>
      <section class="task"><h3>${t('task1')} ${p.t1 ? '✅' : ''}</h3><p class="muted">${t('task1d')}</p>${s.quiz.map((q, qi) => `<div class="q" data-q="${qi}"><p><b>${qi + 1}.</b> ${esc(q.q)}</p>${q.o.map((o, oi) => `<label><input type="radio" name="q${qi}" value="${oi}"> ${esc(o)}</label>`).join('')}</div>`).join('')}<button class="btn btn-gold btn-small" id="chk1">${t('check')}</button> <span id="r1"></span></section>
      <section class="task"><h3>${t('task2')} ${p.t2 ? '✅' : ''}</h3><p class="muted">${t('task2d')}</p><blockquote class="passage">${esc(passage)}</blockquote>
        <div class="row"><button class="btn btn-ghost btn-small btn-audio" id="hearP"><span class="pi">▶</span> ${t('listen')}</button>${Voice.canListen ? `<button class="btn btn-gold btn-small mic" id="mic2">${t('mic')}</button><span class="timer" id="tm2"></span>` : `<button class="btn btn-gold btn-small" id="self2">${t('selfRead')}</button>`}</div>
        <p class="transcript" id="tx2"></p><div id="r2"></div></section>`,
      `${head(s, '3 · 4')}<section class="task"><h3>${t('task3')} ${p.t3 ? '✅' : ''}</h3><p class="muted">${t('task3d')}</p><p class="prompt">🗣 ${esc(s.speak.p)}</p>
        <div class="speak"><button class="btn btn-gold btn-small mic" id="mic3">${t('mic')}</button><textarea id="sp3" rows="3" placeholder="${t('typeInstead')}"></textarea></div><button class="btn btn-ghost btn-small" id="chk3">${t('check')}</button> <span id="r3"></span>${Voice.canListen ? '' : `<p class="note">${t('noMic')}</p>`}</section>
      <section class="task life"><h3>${t('task4')} ${p.t4 ? '✅' : ''}</h3><p class="muted">${reg.ico} ${esc(L(reg))} · ${t('task4d')}</p><p class="prompt">⚖️ ${esc(L(life.t))}</p>
        <div class="opts">${life.c.map((c, j) => `<button class="opt" data-j="${j}">${'АБВ'[j]}. ${esc(L(c.t))}</button>`).join('')}</div><div class="conseq" id="lifeRes" hidden></div>
        <p class="bridge"><b>🌉 ${t('bridgeQ')}:</b> ${esc(L(reg.bridge))}</p><textarea id="refl" rows="2" placeholder="${t('reflect')}">${esc(store.get('lp_refl_' + s.id, ''))}</textarea></section>`);
    $('#chk1').onclick = () => {
      let ok = 0; s.quiz.forEach((q, qi) => { const sel = $(`input[name=q${qi}]:checked`), box = $(`.q[data-q="${qi}"]`); const right = sel && +sel.value === q.a; if (right) ok++; box.classList.toggle('good', right); box.classList.toggle('bad', !right); });
      $('#r1').textContent = `${t('score')}: ${ok}/3`; Music.chime(ok === 3); if (ok === 3) done('t1');
    };
    $('#hearP').onclick = e => Voice.toggle(e.currentTarget, passage, { lang: 'ru', voice: 'guide' });
    if ($('#self2')) $('#self2').onclick = () => done('t2');
    if ($('#mic2')) {
      let t0 = 0, tmr = null, txt = '';
      const finishRead = () => {
        clearInterval(tmr);
        const target = words(passage), said = words(txt), bag = {}; said.forEach(x => bag[x] = (bag[x] || 0) + 1);
        let hit = 0; target.forEach(x => { if (bag[x]) { hit++; bag[x]--; } });
        const acc = Math.round(hit / Math.max(1, target.length) * 100), mins = Math.max(.1, (Date.now() - t0) / 60000), wpm = Math.round(said.length / mins);
        $('#r2').innerHTML = `<div class="meter"><span>${t('accuracy')}</span><b>${acc}%</b><i style="width:${acc}%"></i></div><div class="meter"><span>${t('speed')}</span><b>${wpm} ${t('wpm')}</b><i style="width:${Math.min(100, wpm)}%"></i></div>`;
        Music.chime(acc >= 60); if (acc >= 60) done('t2');
      };
      $('#mic2').onclick = () => {
        if (rec) { stopMic(); return; }
        Voice.stop(); txt = ''; t0 = Date.now(); $('#tx2').textContent = '…';
        rec = Voice.listen(x => { txt = x; $('#tx2').innerHTML = `<b>🎙</b> ${esc(x)}`; }, () => { stopMic(); finishRead(); }, 'ru');
        if (!rec) { toast(t('noMic'), 4000); return; }
        $('#mic2').classList.add('rec'); $('#mic2').textContent = t('micStop');
        tmr = setInterval(() => { $('#tm2').textContent = Math.round((Date.now() - t0) / 1000) + ' с'; }, 300);
      };
    }
    micBtn($('#mic3'), $('#sp3'));
    $('#chk3').onclick = () => {
      const x = $('#sp3').value.toLowerCase().replace(/ё/g, 'е'), w = words(x).length, hit = s.speak.k.filter(k => x.includes(k.toLowerCase()));
      if (w < 12 && hit.length < 2) { $('#r3').textContent = `${w} ${t('words')} · ${t('fbShort')}`; Music.chime(false); return; }
      $('#r3').innerHTML = `✅ ${w} ${t('words')} · ${t('fbGreat')} <b>${hit.join(', ') || '—'}</b>`; Music.chime(true); done('t3');
    };
    $$('.task.life .opt').forEach(b => b.onclick = () => {
      const c = life.c[+b.dataset.j], r = $('#lifeRes');
      $$('.task.life .opt').forEach(y => y.classList.remove('good', 'mid', 'bad')); b.classList.add(c.s === 2 ? 'good' : c.s === 1 ? 'mid' : 'bad');
      r.hidden = false; r.className = 'conseq s' + c.s; r.innerHTML = `<b>${c.s === 2 ? '🌟' : c.s === 1 ? '🤔' : '⚠️'}</b> ${esc(L(c.r))}`;
      Voice.say(L(c.r), { lang, voice: 'guide' }); Music.chime(c.s === 2); if (c.s === 2) done('t4');
    });
    $('#refl').oninput = e => store.set('lp_refl_' + s.id, e.target.value);
    function done(k) { if (!p[k]) { p[k] = 1; saveProg(); } $$('.tprog span')[+k[1] - 1].classList.add('ok'); if (isDone(s.id)) { toast(`🏅 ${t('badge')} — ${esc(TL(s))}`, 3500); Voice.say(NARR.done(s, lang), { lang, voice: 'guide' }); } }
  }

  /* ---------- speech ---------- */
  let rec = null;
  function stopMic() { if (rec) { const r = rec; rec = null; try { r.stop(); } catch (e) {} } $$('.mic.rec').forEach(b => { b.classList.remove('rec'); b.textContent = t('mic'); }); }
  function micBtn(btn, ta) {
    btn.onclick = () => {
      if (rec) return stopMic();
      if (!Voice.canListen) { toast(t('noMic'), 4000); ta.focus(); return; }
      Voice.stop(); const base = ta.value ? ta.value + ' ' : '';
      rec = Voice.listen(txt => ta.value = base + txt, () => stopMic(), 'ru');
      if (rec) { btn.classList.add('rec'); btn.textContent = t('micStop'); }
    };
  }

  /* ---------- guide dialogue ---------- */
  function renderGuide(s) {
    const v = V[s.value];
    const qs = s.guide.concat([{ q: `Какой ценности учит книга «${s.ru}»? Объясни в двух предложениях.`, k: words(v.ru).filter(w => w.length > 2).map(w => w.slice(0, 5)), m: `Книга учит ценности «${v.ru}». ${v.d.ru}` }]);
    let qi = 0;
    pages(`${head(s, t('tGuide'))}<h2>🐆 ${t('tGuide')}</h2><div class="chat" id="chat"></div><div class="speak"><button class="btn btn-gold btn-small mic" id="micG">${t('mic')}</button><textarea id="ansG" rows="2" placeholder="${t('yourAnswer')}"></textarea></div><div class="row"><button class="btn btn-gold btn-small" id="sendG">${t('answer')}</button><button class="btn btn-ghost btn-small" id="nextG">${t('next')} ›</button></div>`,
      `${head(s, '🐆 Ақбарыс · 🦅 Қыран')}<div class="pop-slot" id="popSlot"></div><h3>📚 ${t('newWords')}</h3><table class="vocab">${s.vocab.map(w => `<tr><td><b>${esc(w[0])}</b></td><td>${esc(w[1])}</td></tr>`).join('')}</table>
      <p class="note">💡 ${lang === 'kk' ? 'Орыс тілінде жауап бер: сөйле немесе жаз. Ақбарыс түйін сөздерді тексеріп, жауап үлгісін көрсетеді.' : 'Отвечай по-русски: говори или пиши. Ақбарыс проверит ключевые слова и покажет пример ответа.'}</p>`);
    PopUp.show($('#popSlot'), 'guide', s);
    const chat = $('#chat');
    const bubble = (who, html) => { chat.insertAdjacentHTML('beforeend', `<div class="msg ${who}">${who === 'ai' ? '<i>🐆</i>' : '<i>🧒</i>'}<p>${html}</p></div>`); chat.scrollTop = chat.scrollHeight; };
    const ask = () => { const q = qs[qi % qs.length]; bubble('ai', `<b>${t('guideAsk')}:</b> ${esc(q.q)}`); Voice.say(q.q, { lang: 'ru', voice: 'guide' }); };
    bubble('ai', `Сәлем! Я — снежный барс Ақбарыс. Давай поговорим о книге <b>«${esc(s.ru)}»</b>. Отвечай по-русски — голосом или письменно.`);
    guideQ0 = qs[0].q; bubble('ai', `<b>${t('guideAsk')}:</b> ${esc(qs[0].q)}`); if (bookReady) Voice.say(qs[0].q, { lang: 'ru', voice: 'guide' });
    micBtn($('#micG'), $('#ansG'));
    $('#sendG').onclick = () => {
      const a = $('#ansG').value.trim(); if (!a) return; stopMic(); bubble('me', esc(a)); $('#ansG').value = '';
      const q = qs[qi % qs.length], lo = a.toLowerCase().replace(/ё/g, 'е'), w = words(lo).length, hit = q.k.filter(k => lo.includes(k.toLowerCase()));
      let fb;
      if (w < 5) fb = t('fbShort');
      else if (hit.length) fb = `${t('fbGreat')} <b>${hit.join(', ')}</b>. 🌟 ${grammarTip(a)}`;
      else fb = `${t('fbOk')} <i>${esc(q.m)}</i>`;
      bubble('ai', fb + (w >= 5 ? `<br><small>${t('model')}: ${esc(q.m)}</small>` : '')); Voice.say(w < 5 ? [{ lang, text: t('fbShort') }] : hit.length ? [{ lang, text: t('fbGreat').replace(/:$/, '!') }, { lang: 'ru', text: grammarTip(a) }] : [{ lang, text: t('fbOk').replace(/:$/, '.') }, { lang: 'ru', text: q.m }], { voice: 'guide' }); Music.chime(w >= 5 && hit.length > 0);
      if (w >= 5) { qi++; setTimeout(ask, 2600); }
    };
    $('#nextG').onclick = () => { qi++; ask(); };
    function grammarTip(a) { if (!/^[A-ZА-ЯЁӘҒҚҢӨҰҮҺІ]/.test(a)) return 'Совет: начни предложение с заглавной буквы.'; if (!/[.!?…]$/.test(a)) return 'Совет: поставь точку в конце предложения.'; if (!/,/.test(a) && words(a).length > 9) return 'Совет: проверь запятые в сложном предложении.'; return 'Предложение построено отлично!'; }
  }

  /* ---------- museum ---------- */
  function renderMuseum() {
    const keys = Object.keys(IMG_CAP).filter(hasImg);
    $('#museumGrid').innerHTML = keys.map(k => { const st = S.filter(s => s.imgs.includes(k)); return `<figure data-k="${k}"><img loading="lazy" src="${imgUrl(k)}" onerror="this.closest('figure').remove()" alt=""><figcaption><b>${esc(L(IMG_CAP[k]))}</b>${st.length ? `<small>📖 ${st.map(x => esc(TL(x))).join(' · ')}</small>` : ''}</figcaption></figure>`; }).join('');
    $$('#museumGrid figure').forEach(f => f.onclick = () => lightbox(f.dataset.k));
    $('#credList').innerHTML = Object.entries(CRED).filter(([k]) => IMG_CAP[k]).map(([k, c]) => `<li><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.file.replace('File:', ''))}</a> — ${esc(c.author)} (${esc(c.license)})</li>`).join('');
  }
  function lightbox(k) {
    const st = S.find(s => s.imgs.includes(k));
    $('#lbImg').src = imgUrl(k); $('#lbCap').innerHTML = `<b>${esc(L(IMG_CAP[k]))}</b>${st ? ` · ${esc(TL(st))}` : ''}${CRED[k] ? `<br><small>© ${esc(CRED[k].author)} · ${esc(CRED[k].license)} · Wikimedia Commons</small>` : ''}`;
    $('#lightbox').hidden = false;
  }
  $('#lightbox').onclick = () => $('#lightbox').hidden = true;
  $('#openGallery').onclick = () => { const f = $('#museumGrid figure'); f && lightbox(f.dataset.k); };

  /* ---------- values = regions ---------- */
  function renderValues() {
    $('#valuesBox').innerHTML = R.map((r, k) => { const hs = S.filter(s => s.region === k); return `<div class="vcard" style="--vc:${r.color}"><div class="v-ico">${r.ico}</div><h3>${esc(L(r))}</h3><p class="kk">${esc(lang === 'kk' ? r.ru : r.kk)}</p><p>${esc(L(r.d))}</p><p class="v-place">📍 ${esc(L(r.place))}</p><div class="v-heroes">${hs.map(s => `<button data-id="${s.id}" title="${esc(TL(s))}"><img src="${Avatar.url(s.chars[0].a, 96)}" alt=""><span>${s.o === 'kz' ? '📘' : '📕'} ${esc(TL(s))}</span></button>`).join('')}</div><button class="btn btn-small btn-ghost" data-reg="${k}">🗺 ${t('go')}</button></div>`; }).join('');
    $$('#valuesBox [data-id]').forEach(b => b.onclick = () => pickStory(S.find(s => s.id === b.dataset.id)));
    $$('#valuesBox [data-reg]').forEach(b => b.onclick = () => { location.hash = '#map'; setTimeout(() => { map && map.focusRegion(+b.dataset.reg); guideSay(NARR.region(R[+b.dataset.reg], lang)); }, 400); });
  }

  /* ---------- games ---------- */
  const gm = $('#gameModal'), gb = $('#gameBody');
  const openGame = title => { $('#gmTitleH').textContent = title; gm.hidden = false; document.body.classList.add('locked'); };
  const closeGame = () => { gm.hidden = true; document.body.classList.remove('locked'); Voice.stop(); };
  $$('#gameModal [data-close]').forEach(b => b.onclick = closeGame);
  const winGame = id => { prog.games[id] = 1; saveProg(); Music.chime(true); Voice.say(GUIDE_LINES[lang].win, { lang, voice: 'guide' }); };
  const stepper = (i, n) => `<div class="stepper">${[...Array(n)].map((_, k) => `<span class="${k < i ? 'ok' : k === i ? 'cur' : ''}">${t('taskN')} ${k + 1}</span>`).join('')}</div>`;
  const finishScreen = (id, again) => { gb.innerHTML = `<div class="win"><div class="shanyrak">☸</div><h3>${t('wellDone')}</h3><p>🏅 ${t('badge')}</p><button class="btn btn-gold" id="again">${t('again')}</button></div>`; $('#again').onclick = again; winGame(id); };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function gamePath() {
    openGame('🐆 ' + t('g1t')); const all = GAMES.path; let lvl = 0, idx = 0, pos = 0;
    const draw = () => {
      if (lvl >= 3) return finishScreen('path', gamePath);
      const sc = all[lvl * 3 + idx];
      gb.innerHTML = `${stepper(lvl, 3)}<div class="track"><span class="tr-h" style="left:${pos / 9 * 92}%">🐆</span><span class="tr-goal">🏁</span></div><p class="scen">${esc(sc.s)}</p><div class="opts">${sc.o.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join('')}</div><p class="why" id="why"></p>`;
      Voice.say(sc.s, { lang: 'ru' });
      $$('.opt', gb).forEach(b => b.onclick = () => {
        const right = +b.dataset.i === sc.a; b.classList.add(right ? 'good' : 'bad'); Music.chime(right);
        if (!right) { $('#why').textContent = '🤔 ' + t('wrong'); return; }
        $('#why').textContent = '✅ ' + sc.why; Voice.say(sc.why, { lang: 'ru' }); pos++; $('.tr-h').style.left = (pos / 9 * 92) + '%';
        setTimeout(() => { idx++; if (idx === 3) { idx = 0; lvl++; } draw(); }, 2200);
      });
    }; draw();
  }
  function gameMatch() {
    openGame('📚 ' + t('g2t')); let lvl = 0;
    const draw = () => {
      if (lvl >= 3) return finishScreen('match', gameMatch);
      const regs = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 4), pairs = regs.map(k => shuffle(S.filter(s => s.region === k))[0]), vals = shuffle(pairs); let sel = null, ok = 0;
      gb.innerHTML = `${stepper(lvl, 3)}<p class="muted">${t('g2d')}</p><div class="match big"><div>${pairs.map(s => `<button class="mw hero" data-h="${s.id}"><img src="${Avatar.url(s.chars[0].a, 80)}" alt="">${esc(TL(s))}</button>`).join('')}</div><div>${vals.map(s => { const v = V[s.value]; return `<button class="mw" data-v="${s.id}">${v.ico} ${esc(L(v))}<small>${esc(lang === 'kk' ? v.ru : v.kk)}</small></button>`; }).join('')}</div></div>`;
      $$('.mw', gb).forEach(b => b.onclick = () => {
        if (b.classList.contains('ok')) return;
        if (b.dataset.h) { $$('.mw[data-h]', gb).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = b; return; }
        if (!sel) return;
        if (S.find(s => s.id === sel.dataset.h).value === S.find(s => s.id === b.dataset.v).value) { sel.classList.add('ok'); b.classList.add('ok'); sel.classList.remove('sel'); sel = null; ok++; Music.chime(true); if (ok === 4) setTimeout(() => { lvl++; draw(); }, 900); }
        else { b.classList.add('no'); Music.chime(false); setTimeout(() => b.classList.remove('no'), 500); }
      });
    }; draw();
  }
  function gameYurt() {
    openGame('⛺ ' + t('g3t')); let lvl = 0, idx = 0, built = 0;
    const yurtSvg = n => `<svg viewBox="0 0 200 150" class="yurt-svg"><ellipse cx="100" cy="140" rx="90" ry="8" fill="rgba(0,0,0,.2)"/>
      <g opacity="${n > 0 ? 1 : .12}"><rect x="30" y="80" width="140" height="58" rx="6" fill="#f4eee0" stroke="#b2452f" stroke-width="3"/><rect x="30" y="100" width="140" height="8" fill="#b2452f"/></g>
      <g opacity="${n > 1 ? 1 : .12}"><rect x="86" y="98" width="28" height="40" fill="#b2452f"/><path d="M90 104h20M90 112h20" stroke="#e3b55b" stroke-width="2"/></g>
      <g opacity="${n > 2 ? 1 : .12}"><path d="M24 82 Q100 20 176 82 Z" fill="#f4eee0" stroke="#b2452f" stroke-width="3"/></g>
      <g opacity="${n > 3 ? 1 : .12}"><path d="M40 78 Q100 38 160 78" fill="none" stroke="#e3b55b" stroke-width="4"/></g>
      <g opacity="${n > 4 ? 1 : .12}"><circle cx="100" cy="42" r="12" fill="none" stroke="#7a4520" stroke-width="4"/><path d="M90 42h20M100 32v20" stroke="#7a4520" stroke-width="3"/></g>
      <g opacity="${n > 5 ? 1 : .12}"><path d="M100 30 v-14" stroke="#7a4520" stroke-width="3"/><path d="M100 16 l22 6 -22 6z" fill="#2a8ac0"/></g>
      <g opacity="${n > 6 ? 1 : .12}"><circle cx="20" cy="132" r="6" fill="#d8343a"/><circle cx="180" cy="132" r="6" fill="#d8343a"/></g>
      <g opacity="${n > 7 ? 1 : .12}"><text x="58" y="72" font-size="14">🐆</text><text x="128" y="72" font-size="14">🦅</text></g>
      <g opacity="${n > 8 ? 1 : .12}"><text x="100" y="12" font-size="12" text-anchor="middle" fill="#e3b55b">★</text></g></svg>`;
    const draw = () => {
      if (lvl >= 3) return finishScreen('yurt', gameYurt);
      const sent = GAMES.yurt[lvl * 3 + idx], wl = /[әғқңөұүһі]/i.test(sent) ? 'kk' : 'ru', ws = sent.split(' '), sh = shuffle(ws.map((w, i) => ({ w, i }))); let built2 = [];
      gb.innerHTML = `${stepper(lvl, 3)}${yurtSvg(built)}<p class="muted">${t('g3d')} ${wl === 'kk' ? '🇰🇿' : '🇷🇺'}</p><div class="sentence" id="sent"></div><div class="words">${sh.map((o, i) => `<button class="wd" data-i="${i}">${esc(o.w)}</button>`).join('')}</div><div class="row"><button class="btn btn-ghost btn-small" id="undo">↺</button><button class="btn btn-gold btn-small" id="chkY">${t('check')}</button></div><p id="ry"></p>`;
      const upd = () => $('#sent').innerHTML = built2.map(i => `<span>${esc(sh[i].w)}</span>`).join(' ') || '…';
      $$('.wd', gb).forEach(b => b.onclick = () => { b.disabled = true; built2.push(+b.dataset.i); upd(); });
      $('#undo').onclick = () => { built2 = []; $$('.wd', gb).forEach(b => b.disabled = false); upd(); };
      $('#chkY').onclick = () => { const x = built2.map(i => sh[i].w).join(' '); if (x === sent) { built++; Music.chime(true); Voice.say(sent, { lang: wl }); $('#ry').textContent = '✅ ' + t('correct'); setTimeout(() => { idx++; if (idx === 3) { idx = 0; lvl++; } draw(); }, 1600); } else { Music.chime(false); $('#ry').textContent = '🤔 ' + t('wrong'); } };
      upd();
    }; draw();
  }
  const quest = { on: false, list: [], i: 0, miss: 0 };
  function gameQuest() {
    quest.list = shuffle(S).slice(0, 3); quest.i = 0; quest.on = true; quest.miss = 0; closeGame();
    location.hash = '#map'; setMapMode('view'); askQuest();
  }
  function askQuest() {
    const s = quest.list[quest.i]; $('#questBar').hidden = false;
    let d = L(s.sum); words(TL(s)).filter(w => w.length > 3).forEach(w => { d = d.replace(new RegExp(w.slice(0, -1) + '[а-яёәғқңөұүһі]*', 'gi'), '___'); });
    $('#questQ').innerHTML = `<b>${t('taskN')} ${quest.i + 1}/3:</b> ${esc(d)} <small>(${R[s.region].ico} ${esc(L(R[s.region]))})</small>`;
    guideSay(GUIDE_LINES[lang].quest);
  }
  function questPick(s) {
    const target = quest.list[quest.i];
    if (s.id === target.id) { Music.chime(true); toast('✅ ' + esc(TL(s))); quest.i++; quest.miss = 0; map.highlight(null); if (quest.i >= 3) { quest.on = false; $('#questBar').hidden = true; winGame('quest'); toast('🏅 ' + t('wellDone'), 4000); } else askQuest(); }
    else { Music.chime(false); quest.miss++; toast('🤔 ' + t('wrong')); if (quest.miss >= 2) map.highlight(target.id); }
  }
  $('#questStop').onclick = () => { quest.on = false; $('#questBar').hidden = true; map && map.highlight(null); };
  $('#gPath').onclick = gamePath; $('#gMatch').onclick = gameMatch; $('#gYurt').onclick = gameYurt; $('#gQuest').onclick = gameQuest;

  /* ---------- idea, time, author ---------- */
  function renderIdea() {
    const I = IDEA, two = lang === 'kk' ? 'kk' : 'ru';
    $('#ideaBox').innerHTML = `<div class="idea-top"><h3>${esc(L(I.title))}</h3><p class="dir">${esc(L(I.direction))}</p><p class="essence">${esc(L(I.essence))}</p>
        <div class="idea-flow">${(lang === 'kk' ? ['📖 Кітап', '🌐 3D әлем', '⚖️ Өмірлік жағдаят', '🇰🇿 Адал азамат'] : ['📖 Книга', '🌐 3D-мир', '⚖️ Жизненная ситуация', '🇰🇿 Адал азамат']).map(x => `<span>${x}</span>`).join('<i>→</i>')}</div></div>
      <div class="idea-grid">${I.blocks.map(b => `<article class="idea-card"><div class="ic-h"><span>${b.ico}</span><h4>${esc(L(b.h))}</h4></div><ul>${b[two].map(x => `<li>${esc(x)}</li>`).join('')}</ul></article>`).join('')}</div>
      <article class="idea-card wide"><div class="ic-h"><span>🗺</span><h4>${lang === 'kk' ? 'Алты өлке және кітаптар' : 'Шесть регионов и книги'}</h4></div><table class="vocab idea-table"><tr><th>${lang === 'kk' ? 'Құндылық' : 'Ценность'}</th><th>${t('ruLit')}</th><th>${t('kzLit')}</th></tr>${R.map((r, k) => `<tr><td><b>${r.ico} ${esc(L(r))}</b></td><td>${S.filter(s => s.region === k && s.o === 'ru').map(s => esc(s.ru)).join('<br>')}</td><td>${S.filter(s => s.region === k && s.o === 'kz').map(s => esc(TL(s))).join('<br>')}</td></tr>`).join('')}</table></article>
      <article class="idea-card wide"><div class="ic-h"><span>🎤</span><h4>${esc(L(I.ted.h))}</h4></div><ol class="ted">${I.ted[two].map(([a, b]) => `<li><b>${a}</b><span>${esc(b)}</span></li>`).join('')}</ol></article>
      <article class="idea-card wide"><div class="ic-h"><span>📝</span><h4>${esc(L(I.annotation.h))}</h4></div><div class="annot"><div><b>Қазақша</b><p>${esc(I.annotation.kk)}</p><button class="btn btn-ghost btn-small btn-audio" id="annKk"><span class="pi">▶</span> Тыңдау</button></div><div><b>Русский</b><p>${esc(I.annotation.ru)}</p><button class="btn btn-ghost btn-small btn-audio" id="annRu"><span class="pi">▶</span> Слушать</button></div></div><button class="btn btn-ghost btn-small" id="copyAnn">📋 Копировать · Көшіру</button></article>
      <blockquote class="idea-final">${esc(L(I.final))}</blockquote>`;
    $('#copyAnn').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(I.annotation.kk + '\n\n' + I.annotation.ru).then(() => toast('📋 ✓')); };
    $('#annKk').onclick = e => Voice.toggle(e.currentTarget, I.annotation.kk, { lang: 'kk', voice: 'guide' });
    $('#annRu').onclick = e => Voice.toggle(e.currentTarget, I.annotation.ru, { lang: 'ru', voice: 'guide' });
  }
  function renderTime() {
    const list = [...S].sort((a, b) => era(a).y - era(b).y);
    $('#timeline').innerHTML = list.map(s => { const e = era(s), w = wxOf(s); return `<button class="tm-node ${s.o}" data-id="${s.id}" data-wx="${e.w}"><span class="tm-y">${eraYear(e.y, lang)}</span><span class="tm-dot">${w.ico}</span><img src="${cover0(s)}" alt=""><b>${esc(TL(s))}</b><small>${esc(L(e.c))}</small><em>${R[s.region].ico} ${esc(L(R[s.region]))}</em></button>`; }).join('');
    $$('#timeline .tm-node').forEach(b => {
      const s = S.find(x => x.id === b.dataset.id);
      b.onmouseenter = b.onfocus = () => { $('#tmYear').textContent = eraYear(era(s).y, lang); $('#tmEra').textContent = L(era(s).c) + ' · ' + wxOf(s).ico + ' ' + L(wxOf(s)); };
      b.onclick = () => pickStory(s);
    });
    $('#tmYear').textContent = '2026'; $('#tmEra').textContent = t('timeToday');
  }
  function renderAuthor() {
    const A = AUTHOR; $('#heroAuthorImg').src = A.photo; $('#heroAuthorName').textContent = L(A.name); $('#heroAuthorRole').textContent = L(A.role); $('#authorImg').src = A.photo; $('#authorName').textContent = L(A.name); $('#authorRole').textContent = L(A.role);
    $('#authorSchool').textContent = '🏫 ' + L(A.school); $('#authorExp').textContent = '📍 ' + L(A.exp); $('#authorText').textContent = L(A.text);
    $('#authorTags').innerHTML = A.tags[lang === 'kk' ? 'kk' : 'ru'].map(x => `<span>${esc(x)}</span>`).join('');
  }

  /* ---------- hero particles ---------- */
  (function heroFx() {
    const cv = $('#heroCanvas'), c = cv.getContext('2d'); let W, H; const P = [...Array(90)].map(() => ({ x: Math.random(), y: Math.random(), r: Math.random() * 2 + .5, v: Math.random() * .0006 + .0002 }));
    const rs = () => { W = cv.width = cv.offsetWidth; H = cv.height = cv.offsetHeight; }; rs(); addEventListener('resize', rs);
    (function f(ts) { c.clearRect(0, 0, W, H); P.forEach(p => { p.y -= p.v; if (p.y < 0) p.y = 1; c.globalAlpha = .4 + .5 * Math.abs(Math.sin(ts / 900 + p.x * 9)); c.fillStyle = '#ffd98a'; c.beginPath(); c.arc(p.x * W, p.y * H, p.r, 0, 7); c.fill(); }); requestAnimationFrame(f); })(0);
  })();

  route(); applyLang(); setGuideHelp(); initHeroBook();
  const sh = document.createElement('button'); sh.id = 'soundHint'; sh.className = 'sound-hint'; sh.hidden = true;
  sh.innerHTML = '🔊 <b>Нажмите, чтобы включить звук</b> · <b>Дыбысты қосу үшін басыңыз</b>'; document.body.appendChild(sh);
  sh.onclick = () => { sh.hidden = true; };
  document.addEventListener('voice-blocked', () => { if (Voice.enabled) sh.hidden = false; });
  document.addEventListener('voice-unblocked', () => { sh.hidden = true; });
  if ($('#splash')) setTimeout(() => { if ($('#splash')) Voice.say(SAY.ask); }, 900);
  else Voice.say([{ lang, text: GUIDE_LINES[lang].hello }]);
  if (document.readyState === 'complete') initMap(); else addEventListener('load', initMap);
})();
