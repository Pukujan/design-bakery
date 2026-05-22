import {
  getFooterContent,
  setFooterContent,
  type FooterContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';
import { useAdminPortfolio } from '../AdminPortfolioContext';

export function FooterEditor() {
  const portfolioId = useAdminPortfolio();

  return (
    <ObjectSectionPage<FooterContent>
      title="Footer"
      reloadKey={portfolioId}
      load={() => getFooterContent(portfolioId)}
      save={(item) => setFooterContent(portfolioId, item)}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
