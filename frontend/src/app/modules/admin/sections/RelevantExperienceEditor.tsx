import {
  getRelevantExperienceContent,
  setRelevantExperienceContent,
  type RelevantExperienceContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';
import { useAdminPortfolio } from '../AdminPortfolioContext';

export function RelevantExperienceEditor() {
  const portfolioId = useAdminPortfolio();

  return (
    <ObjectSectionPage<RelevantExperienceContent>
      title="Relevant Experience"
      reloadKey={portfolioId}
      load={() => getRelevantExperienceContent(portfolioId)}
      save={(item) => setRelevantExperienceContent(portfolioId, item)}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
