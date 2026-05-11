import {
  getRelevantExperienceContent,
  setRelevantExperienceContent,
  type RelevantExperienceContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';

export function RelevantExperienceEditor() {
  return (
    <ObjectSectionPage<RelevantExperienceContent>
      title="Relevant Experience"
      load={getRelevantExperienceContent}
      save={setRelevantExperienceContent}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
