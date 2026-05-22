import {
  getEngineeringCommunityContent,
  setEngineeringCommunityContent,
  type EngineeringCommunityContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';
import { useAdminPortfolio } from '../AdminPortfolioContext';

export function EngineeringCommunityEditor() {
  const portfolioId = useAdminPortfolio();

  return (
    <ObjectSectionPage<EngineeringCommunityContent>
      title="Community & Advisory"
      reloadKey={portfolioId}
      load={() => getEngineeringCommunityContent(portfolioId)}
      save={(item) => setEngineeringCommunityContent(portfolioId, item)}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
