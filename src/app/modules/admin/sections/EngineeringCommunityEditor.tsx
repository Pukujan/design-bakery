import {
  getEngineeringCommunityContent,
  setEngineeringCommunityContent,
  type EngineeringCommunityContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';

export function EngineeringCommunityEditor() {
  return (
    <ObjectSectionPage<EngineeringCommunityContent>
      title="Community & Advisory"
      load={getEngineeringCommunityContent}
      save={setEngineeringCommunityContent}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
