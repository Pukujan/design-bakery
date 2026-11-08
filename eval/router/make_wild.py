"""Builds wild.json: lines from public datasets of how people really talk to assistants, mapped to this router's intents.
The datasets are not in the repo (fetch them to a scratch folder):
  CLINC150   https://github.com/clinc/oos-eval        (data/data_full.json)
  MASSIVE    https://github.com/alexa/massive          (1.0/data/en-US.jsonl)
  MultiWOZ   https://github.com/budzianowski/multiwoz  (data/MultiWOZ_2.2/test/dialogues_001.json)
  SGD        https://github.com/google-research-datasets/dstc8-schema-guided-dialogue (test/dialogues_001.json)
Usage: python3 make_wild.py <folder holding clinc150/ massive/ multiwoz/ sgd/>"""
import json, random, re, sys
random.seed(11)
root = sys.argv[1]
PAGES = ['/', '/research', '/blogs', '/contact', '/work/cortex', '/research/papers/db-r-2026-010']
out = []
def add(say, intent, src):
    out.append({'say': say.strip(), 'page': random.choice(PAGES), 'intent': intent, 'target': 'none', 'source': src})

# CLINC150: out-of-scope lines and the in-scope lines of other assistants are off_topic for a portfolio; its small-talk intents map.
clinc = json.load(open(f'{root}/clinc150/data_full.json'))
oos = [q for q, _ in clinc['oos_test']]; random.shuffle(oos)
for q in oos[:45]: add(q, 'off_topic', 'clinc150:oos')
by = {}
for q, intent in clinc['test']: by.setdefault(intent, []).append(q)
SMALL = {'greeting': 'chitchat', 'goodbye': 'chitchat', 'thank_you': 'chitchat', 'what_is_your_name': 'chitchat', 'are_you_a_bot': 'chitchat',
         'who_made_you': 'chitchat', 'how_old_are_you': 'chitchat', 'what_can_i_ask_you': 'chitchat', 'tell_joke': 'chitchat',
         'yes': 'confirm', 'no': 'decline', 'cancel': 'decline', 'maybe': 'unclear', 'repeat': 'unclear', 'user_name': 'unclear'}
for intent, label in SMALL.items():
    for q in random.sample(by.get(intent, []), min(6, len(by.get(intent, [])))): add(q, label, f'clinc150:{intent}')
others = [q for i, qs in by.items() if i not in SMALL for q in qs]
for q in random.sample(others, 50): add(q, 'off_topic', 'clinc150:in-scope-elsewhere')

# MASSIVE: what people say to a voice assistant. general_* is small talk; every other scenario is a task for some other assistant.
rows = [json.loads(l) for l in open(f'{root}/massive/1.0/data/en-US.jsonl') if '"partition": "test"' in l]
chat = [r for r in rows if r['scenario'] == 'general']
for r in random.sample(chat, min(25, len(chat))): add(r['utt'], 'chitchat', f"massive:{r['intent']}")
tasks = [r for r in rows if r['scenario'] not in ('general', 'qa')]
for r in random.sample(tasks, 60): add(r['utt'], 'off_topic', f"massive:{r['scenario']}")

# MultiWOZ and SGD: the caller's turns inside a multi-turn task. Short answers to the system are real human yes/no phrasing.
users = []
for path in (f'{root}/multiwoz/dialogues_001.json', f'{root}/sgd/dialogues_001.json'):
    for d in json.load(open(path)):
        for t in d['turns']:
            if t['speaker'] in ('USER',): users.append(t['utterance'])
yes = [u for u in users if len(u.split()) <= 9 and re.match(r"^(yes|yeah|yep|sure|ok|okay|that sounds good|that works|perfect|great)\b", u.strip().lower())]
no = [u for u in users if len(u.split()) <= 9 and re.match(r"^(no|nope|no thanks|no that's all|that's all)\b", u.strip().lower())]
for u in random.sample(yes, min(30, len(yes))): add(u, 'confirm', 'multiwoz/sgd:yes')
for u in random.sample(no, min(20, len(no))): add(u, 'decline', 'multiwoz/sgd:no')
longer = [u for u in users if 6 <= len(u.split()) <= 18 and not re.match(r"^(yes|no|ok)", u.lower())]
for u in random.sample(longer, 40): add(u, 'off_topic', 'multiwoz/sgd:task')

seen = set(); wild = []
for c in out:
    k = c['say'].lower()
    if k in seen or not c['say']: continue
    seen.add(k); wild.append(c)
random.shuffle(wild)
json.dump(wild, open('wild.json', 'w'), indent=1)
from collections import Counter
print(len(wild), 'wild cases', dict(Counter(c['intent'] for c in wild)))
