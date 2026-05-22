import {
  getContactSectionContent,
  setContactSectionContent,
  type ContactSectionContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';
import { useAdminPortfolio } from '../AdminPortfolioContext';

export function ContactSectionEditor() {
  const portfolioId = useAdminPortfolio();

  return (
    <ObjectSectionPage<ContactSectionContent>
      title="Let's Connect"
      reloadKey={portfolioId}
      load={() => getContactSectionContent(portfolioId)}
      save={(item) => setContactSectionContent(portfolioId, item)}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
