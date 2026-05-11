import {
  getEngineeringAboutContent,
  setEngineeringAboutContent,
  type EngineeringAboutContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';

export function EngineeringAboutEditor() {
  return (
    <ObjectSectionPage<EngineeringAboutContent>
      title="About Me Content"
      load={getEngineeringAboutContent}
      save={setEngineeringAboutContent}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
