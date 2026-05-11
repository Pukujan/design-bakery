import { getSkills, setSkills, type Skill } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';

const TEMPLATE: Skill = { name: '', color: '#6366f1' };

export function SkillsEditor() {
  return (
    <SectionPage title="Design Skills" load={getSkills} save={setSkills}>
      {(items, onChange) => (
        <JsonArrayEditor
          items={items}
          onChange={onChange}
          template={TEMPLATE}
          getLabel={(item) => item.name}
        />
      )}
    </SectionPage>
  );
}
