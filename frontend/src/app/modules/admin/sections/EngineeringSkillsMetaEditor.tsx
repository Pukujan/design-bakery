import {
  getEngineeringSkillsMeta,
  setEngineeringSkillsMeta,
  type EngineeringSkillsMeta,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';
import { useAdminPortfolio } from '../AdminPortfolioContext';

export function EngineeringSkillsMetaEditor() {
  const portfolioId = useAdminPortfolio();

  return (
    <ObjectSectionPage<EngineeringSkillsMeta>
      title="Skills Header"
      reloadKey={portfolioId}
      load={() => getEngineeringSkillsMeta(portfolioId)}
      save={(item) => setEngineeringSkillsMeta(portfolioId, item)}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
