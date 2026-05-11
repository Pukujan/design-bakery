import {
  getFooterContent,
  setFooterContent,
  type FooterContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';

export function FooterEditor() {
  return (
    <ObjectSectionPage<FooterContent>
      title="Footer"
      load={getFooterContent}
      save={setFooterContent}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
