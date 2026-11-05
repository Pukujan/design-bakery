/** Thinking off for every provider this lane may use, by provider id. */
export function adjustBody(step: string, body: Record<string, unknown>): Record<string, unknown> {
  if (process.env.INFERHUB_THINKING === 'on') return body;
  switch (step.split(':')[0]) {
    case 'deepseek':
    case 'deepseek-b': return { ...body, thinking: { type: 'disabled' } };
    case 'qwen': return { ...body, enable_thinking: false, chat_template_kwargs: { enable_thinking: false } };
    case 'openrouter': return { ...body, reasoning: { enabled: false } };
    case 'dev': return { ...body, chat_template_kwargs: { enable_thinking: false } };
    default: return body;
  }
}
