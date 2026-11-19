/* Voice-over: pre-recorded neural audio (assets/audio, English + Kazakh, male/female voices)
   with browser speech as a fallback for dynamic text; speech recognition for speaking tasks. */
window.Voice = (function () {
  const SS = window.speechSynthesis, MAP = () => window.AUDIO_MAP || {};
  const enc = new TextEncoder();
  let enabled = true; try { enabled = localStorage.getItem('lp_voice') !== '0'; } catch (e) {}
  let token = 0, curBtn = null, audio = null, pending = null, unlocked = false;
  /* one shared player: once a click unlocks it, every next clip may play (Safari / iPhone too) */
  const player = new Audio(); player.preload = 'auto';
  const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  function unlock() {
    if (!unlocked) {
      unlocked = true;
      if (!player.src || player.paused) { try { player.src = SILENT; const p = player.play(); p && p.catch(() => { unlocked = false; }); } catch (e) {} }
      try { if (SS) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; SS.speak(u); } } catch (e) {}
    }
    try { window.Music && Music.resume && Music.resume(); } catch (e) {}
    if (pending) { const p = pending, n = sayN; pending = null; setTimeout(() => { if (sayN === n) say(p.texts, p.o); }, 350); } // a click that speaks itself wins
    document.dispatchEvent(new CustomEvent('voice-unblocked'));
  }
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, unlock, true));
  function key(lang, text) { let h = 0x811c9dc5; for (const b of enc.encode(lang + '|' + text)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); }
  const has = (lang, text) => !!MAP()[key(lang, text)];
  function synthVoice(lang, g) {
    const vs = (SS && SS.getVoices()) || [], code = lang === 'kk' ? 'kk' : 'ru', list = vs.filter(v => v.lang && v.lang.toLowerCase().startsWith(code));
    const male = /Dmitry|Pavel|Maxim|Yuri|Male|Daulet/i, fem = /Svetlana|Dariya|Milena|Irina|Katya|Alena|Female|Google русский|Aigul/i;
    const want = g === 'm' ? male : fem;
    return list.find(v => want.test(v.name) && /Natural|Neural|Premium|Enhanced|Online/i.test(v.name)) || list.find(v => want.test(v.name)) || list[0] || null;
  }
  function synth(text, o) {
    return new Promise(res => {
      if (!SS) return setTimeout(res, Math.min(6000, 600 + text.length * 55));
      if ((o.lang || 'ru') === 'kk' && !synthVoice('kk', 'f')) return res(); // нет казахского голоса — не читаем с акцентом
      const lang = o.lang || 'ru', u = new SpeechSynthesisUtterance(text); u.lang = lang === 'kk' ? 'kk-KZ' : 'ru-RU';
      const g = 'f'; // one calm female guide voice everywhere
      if (!u.voice) { const v = synthVoice(lang, g); if (v) { u.voice = v; u.lang = v.lang; } }
      u.rate = o.rate || .95; u.pitch = o.pitch || 1;
      let done = false; const fin = () => { if (!done) { done = true; res(); } };
      u.onend = fin; u.onerror = fin; SS.speak(u); setTimeout(fin, 2500 + text.length * 120);
    });
  }
  function playOne(text, o, my) {
    const lang = o.lang || 'ru', k = key(lang, text);
    if (!MAP()[k]) return synth(text, o);
    return new Promise(res => {
      const a = player; audio = a; let done = false;
      const fin = () => { if (done) return; done = true; clearInterval(iv); res(); };
      a.onended = fin; a.onerror = () => { if (!done && my === token) synth(text, o).then(fin); else fin(); };
      a.src = 'assets/audio/' + k + '.mp3';
      const pr = a.play();
      if (pr) pr.catch(e => {
        if (my !== token) return fin();
        if (e && e.name === 'NotAllowedError') { blocked(); return fin(); } // the browser waits for the first click
        if (e && e.name === 'AbortError') return fin();
        synth(text, o).then(fin);
      });
      const iv = setInterval(() => { if (my !== token) { a.pause(); fin(); } }, 200);
    });
  }
  function setBtn(b, on) { if (!b) return; b.classList.toggle('playing', on); const pi = b.querySelector('.pi'); if (pi) pi.textContent = on ? '■' : '▶'; }
  /* say(text|[texts], {lang:'en'|'kk', voice, btn, onPart(i), onEnd}) */
  let blockedNow = false, lastSay = null, sayN = 0;
  function blocked() { blockedNow = true; unlocked = false; if (lastSay && !pending) pending = lastSay; token++; document.dispatchEvent(new CustomEvent('voice-blocked')); }
  function say(texts, o) {
    o = o || {}; stop(); const my = ++token; lastSay = { texts, o }; blockedNow = false; sayN++; texts = [].concat(texts).filter(x => x && (typeof x !== 'object' || x.text));
    if (!enabled) { o.onEnd && o.onEnd(); return Promise.resolve(); }
    curBtn = o.btn; setBtn(curBtn, true); window.Music && Music.duck(true);
    return (async () => {
      for (let i = 0; i < texts.length; i++) { if (my !== token) return; o.onPart && o.onPart(i); const x = texts[i]; await (typeof x === 'object' ? playOne(x.text, Object.assign({}, o, { lang: x.lang }), my) : playOne(x, o, my)); }
      if (my === token) { setBtn(curBtn, false); curBtn = null; window.Music && Music.duck(false); o.onEnd && o.onEnd(); }
    })();
  }
  function stop() { token++; if (audio) { audio.pause(); audio = null; } if (SS) SS.cancel(); setBtn(curBtn, false); curBtn = null; window.Music && Music.duck(false); }
  function toggle(btn, texts, o) { if (curBtn === btn) { stop(); return; } say(texts, Object.assign({ btn }, o)); }
  if (SS) { SS.getVoices(); SS.onvoiceschanged = () => SS.getVoices(); }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function listen(onText, onEnd, lang) {
    if (!SR) return null;
    const r = new SR(); r.lang = lang === 'kk' ? 'kk-KZ' : 'ru-RU'; r.interimResults = true; r.continuous = true; let final = '';
    r.onresult = e => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) final += t + ' '; else interim += t; } onText((final + interim).trim()); };
    r.onend = () => onEnd && onEnd(final.trim()); r.onerror = () => {};
    try { r.start(); } catch (e) { return null; }
    return r;
  }
  return { say, stop, toggle, listen, key, has, canListen: !!SR,
    get enabled() { return enabled; }, set enabled(v) { enabled = v; try { localStorage.setItem('lp_voice', v ? '1' : '0'); } catch (e) {} if (!v) { stop(); pending = null; } }, get unlocked() { return unlocked; } };
})();

/* Calm steppe ambient: slow warm chords, soft wind, rare gentle bells through a soft reverb */
window.Music = (function () {
  let ctx = null, master = null, duckG = null, rev = null, on = false, timers = [], ci = 0;
  const CH = [[146.83, 220.0, 261.63, 329.63], [116.54, 174.61, 220.0, 293.66], [130.81, 196.0, 246.94, 329.63], [110.0, 164.81, 220.0, 261.63]]; // Dm9 · B♭maj7 · Cmaj7 · Am7
  const BELL = [587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; duckG = ctx.createGain(); duckG.gain.value = 1;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    master.connect(lp); lp.connect(duckG); duckG.connect(ctx.destination);
    // soft reverb (generated impulse)
    rev = ctx.createConvolver(); const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    rev.buffer = ir; const rg = ctx.createGain(); rg.gain.value = .55; rev.connect(rg); rg.connect(master);
    // wind
    const n = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; n.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = .4; const wg = ctx.createGain(); wg.gain.value = .008;
    n.connect(bp); bp.connect(wg); wg.connect(master); n.start();
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .05; lg.gain.value = 300; lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
  }
  function pad(freqs, t, dur) {
    freqs.forEach((f, i) => {
      [0, 1].forEach(det => {
        const o = ctx.createOscillator(), g = ctx.createGain(), flt = ctx.createBiquadFilter();
        o.type = det ? 'triangle' : 'sine'; o.frequency.value = f * (det ? 1.003 : 1); flt.type = 'lowpass'; flt.frequency.value = 900;
        const v = (i === 0 ? .05 : .03) * (det ? .5 : 1);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 3); g.gain.setValueAtTime(v, t + dur - 3); g.gain.linearRampToValueAtTime(0, t + dur + 1);
        o.connect(flt); flt.connect(g); g.connect(master); g.connect(rev); o.start(t); o.stop(t + dur + 1.2);
      });
    });
  }
  function bell(f, t, v) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 2.01;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .02); g.gain.exponentialRampToValueAtTime(.0005, t + 3.5);
    const g2 = ctx.createGain(); g2.gain.value = .25; o2.connect(g2); g2.connect(g); o.connect(g); g.connect(rev); g.connect(master);
    o.start(t); o2.start(t); o.stop(t + 3.6); o2.stop(t + 3.6);
  }
  function cycle() {
    if (!on) return; const t = ctx.currentTime + .05, dur = 9;
    pad(CH[ci % CH.length], t, dur);
    const nb = 2 + Math.floor(Math.random() * 2); for (let i = 0; i < nb; i++) bell(BELL[Math.floor(Math.random() * BELL.length)], t + 1.5 + i * (2 + Math.random() * 1.5), .035);
    ci++; timers.push(setTimeout(cycle, (dur - 1) * 1000));
  }
  function start() { if (!ctx) init(); ctx.resume(); if (on) return; on = true; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(.9, ctx.currentTime + 3); cycle(); }
  function stop() { on = false; timers.forEach(clearTimeout); timers = []; if (ctx) master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2); }
  function duck(dk) { if (ctx && duckG) duckG.gain.linearRampToValueAtTime(dk ? .3 : 1, ctx.currentTime + .5); }
  function whoosh() {
    if (!ctx) init(); ctx.resume(); const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => bell(f, t + i * .09, .06));
    const n = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.5; bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2500, t + 1.2);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .4); g.gain.exponentialRampToValueAtTime(.001, t + 1.6);
    n.connect(bp); bp.connect(g); g.connect(ctx.destination); n.start(t); n.stop(t + 2);
  }
  function chime(ok) { if (!ctx) init(); ctx.resume(); const t = ctx.currentTime; (ok ? [783.99, 987.77, 1174.66] : [392, 330]).forEach((f, i) => bell(f, t + i * .1, ok ? .07 : .05)); }
  function thunder() {
    if (!ctx || !on) return; const t = ctx.currentTime + .3;
    const n = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.35, t + .15); g.gain.exponentialRampToValueAtTime(.001, t + 2.8);
    n.connect(lp); lp.connect(g); g.connect(ctx.destination); n.start(t); n.stop(t + 3);
  }
  function page() {
    if (!ctx) init(); ctx.resume(); const t = ctx.currentTime;
    const n = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * .6, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = b; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.08, t + .12); g.gain.exponentialRampToValueAtTime(.001, t + .55);
    n.connect(hp); hp.connect(g); g.connect(ctx.destination); n.start(t); n.stop(t + .6);
  }
  function resume() { if (ctx && ctx.state !== 'running') ctx.resume(); }
  return { start, stop, duck, whoosh, chime, thunder, page, resume, get on() { return on; } };
})();
