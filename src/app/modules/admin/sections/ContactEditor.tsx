import { getSocialLinks, setSocialLinks, type SocialLink } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';
import { useAdminPortfolio } from '../AdminPortfolioContext';

const TEMPLATE: SocialLink = { name: '', icon: '', href: '', handle: '', color: '#6366f1' };

export function ContactEditor() {
  const portfolioId = useAdminPortfolio();

  return (
    <SectionPage
      title="Social Links"
      reloadKey={portfolioId}
      load={() => getSocialLinks(portfolioId)}
      save={(items) => setSocialLinks(portfolioId, items)}
    >
      {(items, onChange) => (
        <JsonArrayEditor
          items={items}
          onChange={onChange}
          template={TEMPLATE}
          getLabel={(item) => item.name || item.handle}
        />
      )}
    </SectionPage>
  );
}
