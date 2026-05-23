/** Extract and parse JSON from LLM output (fences, preamble, trailing prose). */
export function parseAgentJson<T>(content: string): T {
  let raw = content.trim();
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  const tryParse = (text: string): T => JSON.parse(text) as T;

  try {
    return tryParse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return tryParse(raw.slice(start, end + 1));
    }
    throw new Error('Agent returned invalid JSON');
  }
}
