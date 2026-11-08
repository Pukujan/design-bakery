"""A scripted call in a noisy room, scored: which lines the copilot answered and which it ignored, against what it should have done.

It joins a local call the way the page does (the API's /voice grant, the copilot.greet / copilot.turn RPCs answered through the
local /chat) and plays a room into the microphone: the caller, a roommate across the room, a TV, the copilot's own voice coming
back through the speakers, the caller turning to talk to someone else, and the caller talking over the roommate. People are
macOS `say` voices (so this runs on a Mac), the echo is the copilot's real voice from the speech server.

  local stack: LiveKit dev server, the API with VOICE_LIVEKIT_* set, the speech server on SPEECH_URL, `python agent.py dev`
  run:         .venv/bin/python scenarios.py [--caller Daniel] [--only 1,4] [--json out.json]

A line counts as answered when a copilot.turn reply for it was spoken, and as ignored when it never became a turn, the worker
dropped it (copilot.ignored), or the copilot chose not to answer it.
"""
import argparse, asyncio, json, os, re, subprocess, sys, tempfile, time, wave

import aiohttp, numpy as np
from livekit import rtc

API = os.environ.get('COPILOT_API', 'http://localhost:8787/api/copilot')
SPEECH = os.environ.get('SPEECH_URL', 'http://127.0.0.1:8799')
RATE = 24000

# (who, text, volume, expect, extra). who: caller | roommate | tv | echo | overlap (caller's text over the roommate's `extra`).
SCRIPT = [
    ('caller', 'Hi, what are you working on these days?', 1.0, 'answer', None),
    ('roommate', 'Did you feed the cat already?', 0.35, 'ignore', None),
    ('caller', "That sounds fun. What's the hardest part of it?", 1.0, 'answer', None),
    ('tv', 'And in other news, the storm is expected to reach the coast by Friday.', 0.3, 'ignore', None),
    ('caller', 'Do you ever take a day off?', 1.0, 'answer', None),
    ('echo', "Pretty good! I live on a website, so the weather in here is always seventy two and sunny.", 0.35, 'ignore', None),
    ('caller', 'Hey Campos, can you grab me a coffee?', 1.0, 'ignore', None),
    ('overlap', 'What kind of music do you like?', 1.0, 'answer', ("I'm going to the store, do you need anything?", 0.3)),
    ('roommate', "No, it's in the fridge.", 0.35, 'ignore', None),
    ('caller', 'Sorry, my roommate is chatty. Where were we?', 1.0, 'answer', None),
    ('roommate', 'Are you on a call right now?', 0.6, 'ignore', None),
    ('caller', 'Okay, tell me one more thing about your research.', 1.0, 'answer', None),
]
VOICES = {'roommate': 'Karen', 'tv': 'Moira'}
WAIT = {'answer': 14.0, 'ignore': 7.0}  # silence after a line: long enough for a reply to be spoken in full


def say(voice: str, text: str) -> np.ndarray:
    with tempfile.TemporaryDirectory() as d:
        path = os.path.join(d, 'line.wav')
        subprocess.run(['say', '-v', voice, '-o', path, '--file-format=WAVE', f'--data-format=LEI16@{RATE}', text], check=True)
        with wave.open(path) as w:
            return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32)


async def copilot_voice(http: aiohttp.ClientSession, text: str) -> np.ndarray:
    # Through the speech gateway the echo is named as this project's (not pinned to a call: it is the room, not the copilot).
    async with http.post(f'{SPEECH}/tts', json={'text': text, 'stack': 'english-fast', 'lang': 'en'},
                         headers={'X-Speech-Project': os.environ.get('SPEECH_PROJECT', 'design-bakery')}) as r:
        r.raise_for_status()
        return np.frombuffer(await r.read(), dtype=np.int16).astype(np.float32)


def overlap(heard: str, line: str) -> float:
    """The share of the line's words that were heard: 1.0 is every word."""
    norm = lambda s: re.findall(r"[a-z']+", s.lower())
    want, got = norm(line), set(norm(heard))
    return sum(w in got for w in want) / max(len(want), 1)


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--caller', default='Daniel')
    ap.add_argument('--only', default='')
    ap.add_argument('--json', default='')
    a = ap.parse_args()
    script = [s for i, s in enumerate(SCRIPT, 1) if not a.only or str(i) in a.only.split(',')]
    t0 = time.time()
    log = lambda *x: print(f'[{time.time() - t0:6.1f}s]', *x, flush=True)

    async with aiohttp.ClientSession() as http:
        async with http.post(f'{API}/pass', json={'token': ''}) as r:
            pass_ = (await r.json())['pass']
        async with http.post(f'{API}/voice', headers={'x-copilot-pass': pass_}) as r:
            grant = await r.json()
        room = rtc.Room()
        messages: list[dict] = []
        events: list[dict] = []  # what the copilot did, stamped so each line's window can find its own
        greeted = asyncio.Event()

        async def greet(data: rtc.RpcInvocationData):
            greeted.set()
            return json.dumps({'say': "Hi, I'm AI Pujan. Ask me about my work, or just chat.", 'call': grant.get('call', '')})

        async def turn(data: rtc.RpcInvocationData):
            p = json.loads(data.payload or '{}')
            heard = p.get('text', '')
            arrived = time.time()  # the line's window is when it was heard, not when a slow model finished answering it
            messages.append({'role': 'user', 'content': heard})
            text, ignored = '', ''
            async with http.post(f'{API}/chat', headers={'x-copilot-pass': pass_},
                                 json={'messages': messages, 'page': {'path': '/', 'title': 'Home'}, 'voice': True}) as r:
                for line in (await r.text()).splitlines():
                    e = json.loads(line)
                    if e['type'] == 'text':
                        text = e['text'] if e.get('replace') else text + e['text']
                    if e['type'] in ('quiet', 'ignored'):
                        text, ignored = '', e.get('reason', 'not for me')
            if text:
                messages.append({'role': 'assistant', 'content': text})
            else:
                messages.pop()
            events.append({'at': arrived, 'kind': 'ignored' if ignored else 'turn', 'heard': heard,
                           'confidence': p.get('confidence'), 'voice_match': p.get('voiceMatch'), 'reason': ignored, 'reply': text})
            log(f'  turn heard={heard!r} conf={p.get("confidence")} match={p.get("voiceMatch")} ->', f'IGNORED ({ignored})' if ignored else repr(text[:70]))
            return json.dumps({'say': text, 'call': grant.get('call', '')})

        async def dropped(data: rtc.RpcInvocationData):
            p = json.loads(data.payload or '{}')
            events.append({'at': time.time(), 'kind': 'ignored', 'heard': p.get('text', ''), 'reason': p.get('reason', ''),
                           'confidence': p.get('confidence'), 'voice_match': p.get('voiceMatch'), 'reply': ''})
            log(f'  worker dropped {p.get("text")!r}: {p.get("reason")} (match {p.get("voiceMatch")})')
            return '{}'

        await room.connect(grant['url'].replace('localhost', '127.0.0.1'), grant['token'])
        for name, fn in (('copilot.greet', greet), ('copilot.turn', turn), ('copilot.ignored', dropped)):
            room.local_participant.register_rpc_method(name, fn)
        source = rtc.AudioSource(RATE, 1)
        await room.local_participant.publish_track(rtc.LocalAudioTrack.create_audio_track('mic', source),
                                                   rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE))
        log('in room', room.name, 'caller voice', a.caller)

        async def play(samples: np.ndarray):
            for i in range(0, len(samples), 240):
                chunk = samples[i:i + 240]
                if len(chunk) < 240:
                    chunk = np.pad(chunk, (0, 240 - len(chunk)))
                await source.capture_frame(rtc.AudioFrame(np.clip(chunk, -32768, 32767).astype(np.int16).tobytes(), RATE, 1, 240))

        silence = lambda s: np.zeros(int(RATE * s), dtype=np.float32)
        await play(silence(2))
        await asyncio.wait_for(greeted.wait(), 90)
        await play(silence(8))  # the greeting is spoken
        rng = np.random.default_rng(7)
        results = []
        for n, (who, text, volume, expect, extra) in enumerate(script, 1):
            if who == 'echo':
                audio = await copilot_voice(http, text) * volume
            else:
                audio = say(a.caller if who in ('caller', 'overlap') else VOICES[who], text) * volume
            if who == 'tv':
                audio = audio + rng.standard_normal(len(audio)) * 250
            if who == 'overlap':
                other = say(VOICES['roommate'], extra[0]) * extra[1]
                start = int(RATE * 0.4)
                mix = np.zeros(max(len(audio), start + len(other)), dtype=np.float32)
                mix[:len(audio)] += audio
                mix[start:start + len(other)] += other
                audio = mix
            log(f'#{n} {who.upper()} {text!r} (volume {volume}) expect {expect}')
            begin = time.time()
            await play(audio)
            await play(silence(WAIT[expect]))
            mine = [e for e in events if begin <= e['at'] < time.time()]
            answered = any(e['kind'] == 'turn' and e['reply'] for e in mine)
            got = 'answer' if answered else 'ignore'
            heard = ' | '.join(e['heard'] for e in mine)
            results.append({'n': n, 'who': who, 'text': text, 'expect': expect, 'got': got, 'heard': heard,
                            'words_heard': round(overlap(heard, text), 2) if who in ('caller', 'overlap') else None, 'events': mine})
        await room.disconnect()

    wrong_ignored = [r for r in results if r['expect'] == 'answer' and r['got'] == 'ignore']
    wrong_answered = [r for r in results if r['expect'] == 'ignore' and r['got'] == 'answer']
    print('\n  #  who       expect  got     ok   heard')
    for r in results:
        ok = 'yes' if r['expect'] == r['got'] else 'NO'
        print(f"{r['n']:3}  {r['who']:<9} {r['expect']:<7} {r['got']:<7} {ok:<4} {r['heard'][:70]!r}" + (f"  words {r['words_heard']}" if r['words_heard'] is not None else ''))
    print(f"\n{len(results)} lines: {len(wrong_ignored)} wrongly ignored, {len(wrong_answered)} wrongly answered")
    if a.json:
        with open(a.json, 'w') as f:
            json.dump({'caller': a.caller, 'results': results}, f, indent=1)


if __name__ == '__main__':
    asyncio.run(main())
