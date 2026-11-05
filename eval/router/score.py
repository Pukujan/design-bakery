"""Scores results: python3 score.py cases.json out-a.json out-b.json ...  (name = file name without out- and .json)"""
import json, sys, statistics
from collections import Counter, defaultdict
cases = json.load(open(sys.argv[1]))
INTENTS = ['open_page','next','previous','summarize','book','question','chitchat','off_topic','surprise','confirm','decline','unclear']
runs = {f.split('out-')[-1].replace('.json',''): json.load(open(f)) for f in sys.argv[2:]}
print(f"{len(cases)} cases ({sum(c['source']=='real' for c in cases)} real, {sum(c['source']!='real' for c in cases)} synthetic)\n")
print(f"{'model':12} {'intent acc':>10} {'real':>6} {'synth':>6} {'target acc':>10} {'valid':>6} {'median ms':>10} {'p90 ms':>8}")
for name, res in runs.items():
    ok = [r['intent'] == c['intent'] for r, c in zip(res, cases)]
    real = [o for o, c in zip(ok, cases) if c['source'] == 'real']; syn = [o for o, c in zip(ok, cases) if c['source'] != 'real']
    op = [(r['target'] == c['target']) for r, c in zip(res, cases) if c['intent'] == 'open_page' and r['intent'] == 'open_page']
    ms = sorted(r['ms'] for r in res)
    print(f"{name:12} {sum(ok)/len(ok):10.1%} {sum(real)/len(real):6.0%} {sum(syn)/len(syn):6.0%} {sum(op)/max(1,len(op)):10.1%} {sum(r['valid'] for r in res)/len(res):6.0%} {ms[len(ms)//2]:10d} {ms[int(len(ms)*.9)]:8d}")
print('\nper intent (accuracy):')
print(f"{'intent':12}" + ''.join(f'{n:>12}' for n in runs) + '   n')
for it in INTENTS:
    idx = [k for k, c in enumerate(cases) if c['intent'] == it]
    print(f"{it:12}" + ''.join(f"{sum(runs[n][k]['intent']==it for k in idx)/len(idx):12.0%}" for n in runs) + f'  {len(idx)}')
for name, res in runs.items():
    conf = Counter((c['intent'], r['intent']) for r, c in zip(res, cases) if r['intent'] != c['intent'])
    print(f"\n{name}: most common mistakes (expected -> got): " + '; '.join(f'{a}->{b} x{n}' for (a, b), n in conf.most_common(6)))
