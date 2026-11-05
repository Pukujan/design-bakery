"""Runs the benchmark on LFM3 (llama.cpp server, thinking off, JSON-schema constrained intent and target). Run on the Pro:
   python3 run_lfm.py cases.json prompt.json out-lfm3.json [url]"""
import json, sys, time, urllib.request
cases = json.load(open(sys.argv[1])); P = json.load(open(sys.argv[2])); out = sys.argv[3]
url = (sys.argv[4] if len(sys.argv) > 4 else 'http://127.0.0.1:8099') + '/v1/chat/completions'
INTENTS = ['open_page','next','previous','summarize','book','question','chitchat','off_topic','surprise','confirm','decline','unclear']
schema = {"type":"object","properties":{"intent":{"type":"string","enum":INTENTS},"target":{"type":"string","enum":P['targets']}},"required":["intent","target"],"additionalProperties":False}
shots = [m for p,l,i,t in P['shots'] for m in ({"role":"user","content":f"Page: {p}\nLine: {l}"},{"role":"assistant","content":json.dumps({"intent":i,"target":t})})]
res = []
for n, c in enumerate(cases):
    body = {"model":"lfm3","messages":[{"role":"system","content":P['system']}] + shots + [{"role":"user","content":f"Page: {c['page']}\nLine: {c['say']}"}],
            "temperature":0,"max_tokens":60,"chat_template_kwargs":{"enable_thinking":False},
            "response_format":{"type":"json_schema","json_schema":{"name":"route","schema":schema,"strict":True}}}
    t = time.time(); got = {}; ok = True
    try:
        r = json.load(urllib.request.urlopen(urllib.request.Request(url, data=json.dumps(body).encode(), headers={"content-type":"application/json"}), timeout=90))
        got = json.loads(r["choices"][0]["message"]["content"])
    except Exception as e:
        ok = False
    res.append({"i":n,"intent":got.get("intent"),"target":got.get("target"),"valid":ok,"ms":round((time.time()-t)*1000)})
    if n % 50 == 0: print(n, len(cases), flush=True)
json.dump(res, open(out,'w'))
print('done', len(res))
