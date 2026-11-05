/** LFM3 on llama.cpp: the chat template's switch. Thinking ran out the output budget before any answer. */
export function adjustBody(_step: string, body: Record<string, unknown>): Record<string, unknown> {
  if (process.env.INFERHUB_THINKING === 'on') return body;
  return { ...body, chat_template_kwargs: { enable_thinking: false } };
}
