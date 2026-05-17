import { getProjects, setProjects, type Project } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';
import { useAdminPortfolio } from '../AdminPortfolioContext';

const TEMPLATE: Project = {
  id: 0,
  title: '',
  tagline: '',
  description: '',
  tech: [],
  color: '#6366f1',
  accentColor: '#818cf8',
  stats: [],
  links: [],
};

export function ProjectsEditor() {
  const portfolioId = useAdminPortfolio();

  return (
    <SectionPage
      title="Engineering Projects"
      reloadKey={portfolioId}
      load={() => getProjects(portfolioId)}
      save={(items) => setProjects(portfolioId, items)}
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
