import { getSocialLinks, setSocialLinks, type SocialLink } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';

const TEMPLATE: SocialLink = { name: '', icon: '', href: '', handle: '', color: '#6366f1' };






export function ContactEditor() {
  return (
    <SectionPage title="Social Links" load={getSocialLinks} save={setSocialLinks}>
      {(items, onChange) => (
        <JsonArrayEditor
          items={items}
          onChange={onChange}
          template={TEMPLATE}
          getLabel={(item) => item.name || item.handle}
        />
      )}
    </SectionPage>
  );
}
