import { getEngineeringSkills, setEngineeringSkills, type SkillCategory } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';
import { useAdminPortfolio } from '../AdminPortfolioContext';

const TEMPLATE: SkillCategory = { title: '', icon: '', color: '#6366f1', skills: [] };

export function EngineeringSkillsEditor() {
  const portfolioId = useAdminPortfolio();

  return (
    <SectionPage
      title="Engineering Skills"
      reloadKey={portfolioId}
      load={() => getEngineeringSkills(portfolioId)}
      save={(items) => setEngineeringSkills(portfolioId, items)}
    >
      {(items, onChange) => (
        <JsonArrayEditor
          items={items}
          onChange={onChange}
          template={TEMPLATE}
          getLabel={(item) => item.title}
        />
      )}
    </SectionPage>
  );
}
