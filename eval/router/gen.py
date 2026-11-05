"""Builds the router benchmark: the real lines (real.json) plus many paraphrases per intent on varied pages, some with the
slips a speech recogniser makes. Each case: say, page, intent, target ('none' unless the line opens a page), source.
Deterministic (seeded). Usage: python3 eval/router/gen.py  -> cases.json"""
import json, random, re
random.seed(7)
projects = json.load(open('../../frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json'))
SLUG = {p['title']: p['slug'] for p in projects}
PAPERS = [f'/research/papers/db-r-2026-{i:03d}' for i in range(1, 12)]
WORK = [f"/work/{p['slug']}" for p in projects]
LIST = ['/', '/research', '/blogs', '/contact']
ANY = LIST + PAPERS[:4] + WORK[:5]
ITEM_PAGES = PAPERS + WORK            # a page of one paper or project
def pick(pages): return random.choice(pages)

C = []   # (intent, target, say, pages)
def add(intent, target, says, pages): C.extend((intent, target, s, pages) for s in says)

verbs = ['show me', 'take me to', 'open', 'go to', 'can you open', 'pull up', "let's see", 'I want to see', 'bring up', "I'd like to see", 'can I see']
for t, things in {
    '/research': ['your research', 'the research papers', 'research', 'the papers', 'your papers', 'your research section'],
    '/blogs': ['the blog', 'your blog posts', 'your writing', 'your articles'],
    '/#work': ['your projects', 'your work', 'the work section', 'your portfolio', 'what you have built'],
    '/contact': ['the contact page', 'your contact info', 'how to reach you'],
    '/#experience': ['your experience', 'your work history', 'where you have worked'],
    '/#about': ['the about section', 'about you'],
}.items():
    for th in things:
        add('open_page', t, [f'{random.choice(verbs)} {th}'], ANY)
for title, slug in SLUG.items():
    for say in (f'tell me about {title}', f'open the {title} project', f'show me {title}', f"what's {title}"):
        add('open_page', f'/work/{slug}', [say], LIST)
for say, slug in [('the President project', 'precedent'), ('show me President', 'precedent'), ('open Arise', 'precedent'), ('tell me about Eval Labs', 'eval-lab'), ('the NYC map', 'nyc-map-agent'), ('show me Octa', 'octo')]:
    add('open_page', f'/work/{slug}', [say], LIST)
add('next', 'none', ['next', 'next one', 'next please', 'go on', 'keep going', 'and then', "what's next", 'continue', 'another one', 'the next one', 'okay next', 'more', 'okay and then', 'show me the next paper', 'next article', 'skip to the next', 'move on', 'carry on'], ITEM_PAGES)
add('previous', 'none', ['previous', 'go back', 'take me back', 'the last one', 'one back', 'back', 'the one before', 'previous one', 'go to the previous paper', 'back to the last one', 'show me the one before that'], ITEM_PAGES)
add('summarize', 'none', ['summarize this', 'summarise it', "what's this about", 'explain this', 'what does this paper say', 'give me the gist', 'tell me about this one', 'sum it up', 'what is this page about', 'walk me through this', 'can you explain what this is', "what's the point of this", 'what does this project do', 'give me a quick overview', 'TLDR this', 'what are the highlights'], ITEM_PAGES)
add('book', 'none', ['book the call', 'I want to book a consultation', 'can I schedule a call', 'set up a meeting', "I'd like to talk to you, how do I book", 'book a time', 'schedule a consultation', 'can we have a call', 'I want to hire you, can we talk', "let's set up a call", 'how do I book a call with you', 'I need a consultation'], ANY)
add('question', 'none', ['how does it work', 'what stack does it use', 'why did you build this', 'what problem does this solve', 'how long did it take', "what's the hardest part", 'who is it for', 'is it open source', 'what models does it use', 'how does it handle errors', 'what are the results', 'what did you learn', 'what do you do', "what's your background", 'do you do consulting', 'which projects used React', 'what tech do you know', 'where are you based', 'are you available for hire', "what's your favorite project", 'how many projects do you have', 'what is RAG', 'do you work with legal companies'], ANY)
add('chitchat', 'none', ['hello', 'hi there', 'hey', 'how are you', 'good morning', 'thanks', 'thank you', 'nice', 'cool', 'lol', 'who are you', "what's your name", 'are you a robot', 'can you hear me', 'are you there', 'hello?', 'good evening', 'that was great', 'wow'], ANY)
add('off_topic', 'none', ["what's the weather today", 'order me a taxi', "what's the capital of France", 'play some music', 'how do I bake bread', 'who won the game last night', "what's the price of bitcoin", 'translate this to Spanish', 'help me with my homework', "get me McDonald's", 'turn off the lights', 'set a timer for ten minutes', 'call my mom', 'what time is it in Tokyo', 'recommend a movie'], ANY)
add('surprise', 'none', ['show me anything', 'surprise me', 'you pick', "I don't know, you decide", 'show me something interesting', 'whatever you like', 'give me a tour', 'what have you got', 'just show me something', 'anything', 'show me your best work', 'you choose', 'take me somewhere cool', 'impress me', 'I dunno, show me whatever'], ANY)
add('confirm', 'none', ['yes', 'yeah', 'sure', 'okay', 'please do', 'go ahead', 'sounds good', 'yes please', 'absolutely', 'do it', 'yep', 'why not', 'that would be great', 'right', 'correct'], ['/research', '/', '/contact', '/blogs'])
add('decline', 'none', ['no', 'nope', 'not now', 'never mind', 'no thanks', 'maybe later', 'cancel', 'stop', "that's okay", "I'm good", "no that's fine", 'forget it', 'not really'], ['/research', '/', '/contact', '/blogs'])
add('unclear', 'none', ['and even here', "we're trying some", 'uh', 'hmm', 'what what', 'the thing is', 'so um', 'okay so', "it's because of this", 'right right', 'I saw it somewhere', 'yeah no', 'mm hm', 'the light is still blocked', 'and then the', 'oh wait', 'sorry what', 'he said that', 'because the', 'I mean like'], ANY)

def noisy(s):
    s = s.rstrip('.?!')
    if random.random() < .5: s = s.lower()
    if random.random() < .3: s = random.choice(['uh ', 'um ', 'okay ', 'so ', 'yeah ']) + s
    if random.random() < .25: s += random.choice(['', ' uh', ' you know', ' please', ' come on'])
    for a, b in [('Pujan', 'Poojan'), ('Precedent', 'President'), ('Octo', 'Octa'), ('research', 'reasearch'), ('projects', 'proojects')]:
        if random.random() < .3: s = s.replace(a, b).replace(a.lower(), b.lower())
    return s

cases = json.load(open('real.json'))
seen = {(c['say'].lower(), c['page']) for c in cases}
for intent, target, say, pages in C:
    page = pick(pages)
    # paper/project-page intents need a page of that kind
    for variant in (say, noisy(say)):
        key = (variant.lower(), page)
        if key in seen: continue
        seen.add(key)
        cases.append({'say': variant[0].upper() + variant[1:] if random.random() < .6 else variant, 'page': page, 'intent': intent, 'target': target, 'source': 'synthetic'})
random.shuffle(cases)
json.dump(cases, open('cases.json', 'w'), indent=1)
from collections import Counter
print(len(cases), 'cases;', dict(Counter(c['intent'] for c in cases)), '| real:', sum(c['source'] == 'real' for c in cases))
