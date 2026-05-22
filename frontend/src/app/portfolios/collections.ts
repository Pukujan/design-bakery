import type { PortfolioId } from './registry';
import { getPortfolioConfig } from './registry';

export function resolveCollection(portfolioId: PortfolioId, baseName: string): string {
  const { collectionPrefix } = getPortfolioConfig(portfolioId);
  if (!collectionPrefix) {
    return baseName;
  }
  return `${collectionPrefix}${baseName}`;
}
