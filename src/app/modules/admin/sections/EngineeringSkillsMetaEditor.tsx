import {
  getEngineeringSkillsMeta,
  setEngineeringSkillsMeta,
  type EngineeringSkillsMeta,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';

export function EngineeringSkillsMetaEditor() {
  return (
    <ObjectSectionPage<EngineeringSkillsMeta>
      title="Skills & Technology Header"
      load={getEngineeringSkillsMeta}
      save={setEngineeringSkillsMeta}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
