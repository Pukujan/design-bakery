import {
  getEngineeringAboutContent,
  setEngineeringAboutContent,
  type EngineeringAboutContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';
import { useAdminPortfolio } from '../AdminPortfolioContext';

export function EngineeringAboutEditor() {
  const portfolioId = useAdminPortfolio();

  return (
    <ObjectSectionPage<EngineeringAboutContent>
      title="About Me Content"
      reloadKey={portfolioId}
      load={() => getEngineeringAboutContent(portfolioId)}
      save={(item) => setEngineeringAboutContent(portfolioId, item)}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
