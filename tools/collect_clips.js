// Собирает все озвучиваемые строки сайта → tools/clips.json
// Запуск (macOS): osascript -l JavaScript tools/collect_clips.js "<путь к папке сайта>"
ObjC.import('Foundation');
var window = this; window.IMGDATA = null;
function run(argv) {
  var ROOT = argv[0];
  function load(f) { eval.call(window, $.NSString.stringWithContentsOfFileEncodingError(ROOT + '/js/' + f + '.js', 4, null).js); }
  ['data', 'books-1', 'books-2', 'books-3', 'books-4', 'books-5', 'books-6', 'i18n', 'extra'].forEach(load);
  var C = [], add = function (lang, voice, text, rate) { if (text && String(text).trim()) C.push({ lang: lang, voice: voice, text: String(text).trim(), rate: rate || '' }); };
  STORIES.forEach(function (s) {
    ['ru', 'kk'].forEach(function (l) { add(l, 'guide', NARR.welcome(s, l)); add(l, 'guide', NARR.near(s, l)); add(l, 'guide', NARR.done(s, l)); add(l, 'guide', s.kzfact[l]); add(l, 'guide', s.sum[l]);
      ['travel', 'heroes', 'museum', 'trailer', 'letters', 'tasks', 'guide'].forEach(function (k) { add(l, 'guide', SAY[k](s, l)); }); });
    s.story.forEach(function (p) { add('ru', 'guide', p); });
    s.storyKk.forEach(function (p) { add('kk', 'guide', p); });
    s.trailer.forEach(function (p) { add('ru', 'narrator', p); });
    s.chars.forEach(function (c) { add('ru', VOICE_OF(c.a), c.line); });
    var hero = s.chars.filter(function (c) { return c.n.ru === s.letter.from; })[0] || s.chars.filter(function (c) { return s.letter.from.indexOf(c.n.ru.split(' ')[0]) === 0; })[0] || s.chars[0];
    s.letter.text.split('\n').filter(function (x) { return x.trim(); }).forEach(function (p) { add('ru', VOICE_OF(hero.a), p); });
    s.guide.forEach(function (g) { add('ru', 'guide', g.q); });
    add('ru', 'guide', 'Какой ценности учит книга «' + s.ru + '»? Объясни в двух предложениях.');
    s.vocab.forEach(function (v) { add('ru', 'guide', v[0], '-10%'); add('kk', 'guide', v[1], '-10%'); });
  });
  REGIONS.forEach(function (R) { ['ru', 'kk'].forEach(function (l) { add(l, 'guide', NARR.region(R, l)); R.life.c.forEach(function (c) { add(l, 'guide', c.r[l]); }); }); });
  SAY.ask.forEach(function (x) { add(x.lang, 'guide', x.text); });
  ['ru', 'kk'].forEach(function (l) { add(l, 'guide', SAY.chosen[l]); add(l, 'guide', SAY.voiceOn[l]); var G = GUIDE_LINES[l]; [G.hello, G.fly, G.win, G.quest].concat(G.idle).forEach(function (x) { add(l, 'guide', x); }); });
  Object.keys(PROPS).forEach(function (p) { ['ru', 'kk'].forEach(function (l) { add(l, 'guide', NARR.prop(p, l)); }); });
  GAMES.path.forEach(function (g) { add('ru', 'guide', g.s); add('ru', 'guide', g.why); });
  GAMES.yurt.forEach(function (x) { add(/[әғқңөұүһі]/i.test(x) ? 'kk' : 'ru', 'guide', x); });
  ['ru', 'kk'].forEach(function (l) { add(l, 'guide', I18N[l].fbShort); add(l, 'guide', I18N[l].fbGreat.replace(/:$/, '!')); add(l, 'guide', I18N[l].fbOk.replace(/:$/, '.')); });
  ['Совет: начни предложение с заглавной буквы.', 'Совет: поставь точку в конце предложения.', 'Совет: проверь запятые в сложном предложении.', 'Предложение построено отлично!'].forEach(function (x) { add('ru', 'guide', x); });
  STORIES.forEach(function (s) { s.guide.forEach(function (g) { add('ru', 'guide', g.m); }); var v = VALUES[s.value]; add('ru', 'guide', 'Книга учит ценности «' + v.ru + '». ' + v.d.ru); });
  add('ru', 'guide', IDEA.annotation.ru); add('kk', 'guide', IDEA.annotation.kk);
  var seen = {}, U = C.filter(function (c) { var k = c.lang + '|' + c.text; if (seen[k]) return false; return seen[k] = 1; });
  var json = JSON.stringify(U);
  $.NSString.alloc.initWithUTF8String(json).writeToFileAtomicallyEncodingError(ROOT + '/tools/clips.json', true, 4, null);
  return 'clips: ' + U.length;
}
