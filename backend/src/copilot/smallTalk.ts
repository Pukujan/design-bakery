/**
 * Plain small talk needs no tools: "im doing fine thanks!" took 15 s on the tool loop
 * (TASK-DB-0135). A short social reply that is not an answer to an offer about the
 * site ("Want me to open the Work page?") is answered from the prompt alone, one step.
 */
const SOCIAL = [
  /^(?:i ?m|i am)?\s*(?:doing )?(?:fine|good|great|well|ok|okay|alright|not bad|tired|busy|so so)(?: thanks| thank you| thx)?(?: and you| you| u)?$/,
  /^(?:thanks|thank you|thx|ty|cheers|cool|nice|lol|haha+|wow|bye|goodbye|see you|nothing|nope|nah|no|not much|same|fair enough|interesting|hmm+|wild|true|right|ha)$/,
  /^(?:how are (?:you|u)|how are you doing|how r u|what s up|whats up|sup|how s it going)$/,
];

/** The assistant's last message was an offer about the site, so a short reply to it may need tools. */
const OFFER = /\b(?:want me|shall i|should i|would you like|open|show|walk|dig|take you|page|section|paper|post|project|tour|summary)\b/i;

export function isPlainSmallTalk(question: string, before?: string): boolean {
  const q = question.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/'/g, '').replace(/\s+/g, ' ').trim();
  if (!q || q.split(' ').length > 7) return false;
  if (before?.includes('?') && OFFER.test(before)) return false;
  return SOCIAL.some((re) => re.test(q));
}
