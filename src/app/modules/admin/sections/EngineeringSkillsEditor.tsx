import { getEngineeringSkills, setEngineeringSkills, type SkillCategory } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';

const TEMPLATE: SkillCategory = { title: '', icon: '', color: '#6366f1', skills: [] };





export function EngineeringSkillsEditor() {
  return (
    <SectionPage title="Engineering Skills" load={getEngineeringSkills} save={setEngineeringSkills}>
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
