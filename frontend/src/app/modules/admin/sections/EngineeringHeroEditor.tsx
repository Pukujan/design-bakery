import {
  getEngineeringHeroContent,
  setEngineeringHeroContent,
  type EngineeringHeroContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';
import { useAdminPortfolio } from '../AdminPortfolioContext';

export function EngineeringHeroEditor() {
  const portfolioId = useAdminPortfolio();

  return (
    <ObjectSectionPage<EngineeringHeroContent>
      title="Engineering Hero Banner"
      reloadKey={portfolioId}
      load={() => getEngineeringHeroContent(portfolioId)}
      save={(item) => setEngineeringHeroContent(portfolioId, item)}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
