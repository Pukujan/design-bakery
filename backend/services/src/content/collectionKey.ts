/** Mirrors frontend portfolio collection prefixes (see frontend portfolios/registry). */
const PREFIX_TO_PORTFOLIO: Record<string, string> = {
  lwe__: 'legal-workflow-engineer',
  ete__: 'endtoend-engineer',
  aie__: 'ai-engineer',
  fde__: 'forward-deployed-engineer',
};

export function parseFirestoreCollection(fullName: string): {
  portfolio_id: string;
  collection_name: string;
} {
  const name = fullName.trim();
  for (const [prefix, portfolioId] of Object.entries(PREFIX_TO_PORTFOLIO)) {
    if (name.startsWith(prefix)) {
      return { portfolio_id: portfolioId, collection_name: name.slice(prefix.length) };
    }
  }
  return { portfolio_id: 'default', collection_name: name };
}
