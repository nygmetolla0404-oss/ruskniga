#!/usr/bin/env python3
"""Нейро-озвучка сайта (русский + казахский) через edge-tts.

Использование:  python3 tools/make_audio.py tools/clips.json
Файл clips.json создаёт  osascript -l JavaScript tools/collect_clips.js "<папка сайта>".
Уже готовые файлы пропускаются. Пишет assets/audio/<key>.mp3 и js/audio-map.js.
"""
import asyncio, json, os, subprocess, sys
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'audio')
VOICES = {  # голос: (русский, казахский)
    'guide':    ('ru-RU-SvetlanaNeural', 'kk-KZ-AigulNeural'),
    'narrator': ('ru-RU-DmitryNeural',   'kk-KZ-DauletNeural'),
    'm':        ('ru-RU-DmitryNeural',   'kk-KZ-DauletNeural'),
    'f':        ('ru-RU-SvetlanaNeural', 'kk-KZ-AigulNeural'),
}


def key(lang, text):
    h = 0x811c9dc5
    for b in (lang + '|' + text).encode('utf-8'):
        h ^= b
        h = (h * 0x01000193) & 0xffffffff
    return '%08x' % h


def dur(p):
    try:
        r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True)
        return round(float(r.stdout.strip()), 2)
    except Exception:
        return round(os.path.getsize(p) / 5000, 2)


async def one(c, sem, done, failed):
    k = key(c['lang'], c['text'])
    dst = os.path.join(OUT, k + '.mp3')
    if os.path.exists(dst) and os.path.getsize(dst) > 500:
        done[k] = dur(dst); return
    v = VOICES.get(c['voice'], VOICES['guide'])[1 if c['lang'] == 'kk' else 0]
    rate = c.get('rate') or ('-6%' if c['lang'] == 'kk' else '-3%')
    tmp = dst + '.tmp.mp3'
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(c['text'], v, rate=rate).save(tmp)
                break
            except Exception as e:
                print('retry', k, e); await asyncio.sleep(3 * (attempt + 1))
        else:
            failed.append(c['text'][:60]); return
    os.replace(tmp, dst)  # оригинальное качество нейроголоса, без пережатия
    done[k] = dur(dst)
    if len(done) % 100 == 0: print(len(done), 'done', flush=True)


async def main(path):
    os.makedirs(OUT, exist_ok=True)
    clips = json.load(open(path, encoding='utf-8'))
    sem, done, failed = asyncio.Semaphore(8), {}, []
    await asyncio.gather(*(one(c, sem, done, failed) for c in clips))
    with open(os.path.join(ROOT, 'js', 'audio-map.js'), 'w') as f:
        f.write('window.AUDIO_MAP=' + json.dumps(done, separators=(',', ':')) + ';\n')
    print('clips:', len(done), 'failed:', len(failed))
    for x in failed[:20]: print('  FAILED', x)


if __name__ == '__main__':
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools', 'clips.json')))
