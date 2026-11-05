// Runs the benchmark on a hosted provider from inside the API container (its keys stay there): node run_hosted.js DEEPSEEK|QWEN|WORKBUDDY|OPENROUTER
const fs = require('fs');
const [id, concurrency = '3'] = process.argv.slice(2);
const cases = JSON.parse(fs.readFileSync(process.env.CASES || '/tmp/router/cases.json', 'utf8'));
const P = JSON.parse(fs.readFileSync('/tmp/router/prompt.json', 'utf8'));
const TABLE = { DEEPSEEK: ['https://api.inferhub.dev/v1', 'cb/deepseek-v4.1-flash'], QWEN: ['https://yolo-auto.com/v1', 'yolo'], WORKBUDDY: ['https://www.workbuddy.ai/v2', 'auto'], OPENROUTER: ['https://openrouter.ai/api/v1', 'nvidia/nemotron-3.5-super-vl:free'] };
const [target, model] = [TABLE[id][0], process.env[`SMART_${id}_MODEL`] || TABLE[id][1]];
const key = process.env[`SMART_${id}_KEY`]?.trim();
const octo = (process.env.OCTO_BASE_URL ?? 'https://octodb.design-bakery.com').replace(/\/+$/, '').replace(/\/api$/, '');
const working = key.startsWith('octo_tmp_');
const url = working ? `${octo}/api/vault/proxy` : `${target}/chat/completions`;
const headers = { 'content-type': 'application/json', authorization: `Bearer ${key}`, ...(working ? { 'x-octo-target': `${target}/chat/completions` } : {}) };
const shots = P.shots.flatMap(([p, l, i, t]) => [{ role: 'user', content: `Page: ${p}\nLine: ${l}` }, { role: 'assistant', content: JSON.stringify({ intent: i, target: t }) }]);
const res = new Array(cases.length);
let next = 0;
async function worker() {
  for (;;) {
    const n = next++; if (n >= cases.length) return;
    const c = cases[n]; const t0 = Date.now(); let got = {}; let valid = true;
    try {
      const body = { model, temperature: 0, max_tokens: 600, messages: [{ role: 'system', content: P.system }, ...shots, { role: 'user', content: `Page: ${c.page}\nLine: ${c.say}` }] };
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) });
      const j = await r.json();
      got = JSON.parse((j?.choices?.[0]?.message?.content ?? '').match(/\{[\s\S]*?\}/)?.[0] ?? '{}');
      if (!got.intent) valid = false;
    } catch { valid = false; }
    res[n] = { i: n, intent: got.intent, target: got.target, valid, ms: Date.now() - t0 };
  }
}
(async () => { await Promise.all(Array.from({ length: Number(concurrency) }, worker)); fs.writeFileSync(`/tmp/router/out-${id.toLowerCase()}${process.env.OUTSUF || ''}.json`, JSON.stringify(res)); console.log(id, 'done', res.length); })();
