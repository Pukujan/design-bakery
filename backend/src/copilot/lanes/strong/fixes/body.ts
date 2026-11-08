/** How to switch thinking off for the hosted models this lane uses (the same switches as before lanes, kept here with the lane). */
export function adjustBody(step: string, body: Record<string, unknown>): Record<string, unknown> {
  if (process.env.INFERHUB_THINKING === 'on') return body;
  const provider = step.split(':')[0];
  if (provider === 'haiku' || provider.startsWith('deepseek')) return { ...body, thinking: { type: 'disabled' } };
  // Qwen answers as "yolo" through an auto router, which passes on one switch or the other; both are sent.
  if (provider === 'qwen') return { ...body, enable_thinking: false, chat_template_kwargs: { enable_thinking: false } };
  return body;
}
