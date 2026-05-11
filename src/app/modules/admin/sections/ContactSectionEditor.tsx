import {
  getContactSectionContent,
  setContactSectionContent,
  type ContactSectionContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';

export function ContactSectionEditor() {
  return (
    <ObjectSectionPage<ContactSectionContent>
      title="Let's Connect Section"
      load={getContactSectionContent}
      save={setContactSectionContent}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
