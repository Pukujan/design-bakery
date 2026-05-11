import { getProjects, setProjects, type Project } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';

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
  return (
    <SectionPage title="Engineering Projects" load={getProjects} save={setProjects}>
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
