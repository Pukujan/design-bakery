import { getAdvocacyImages, setAdvocacyImages, type AdvocacyImage } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';

const TEMPLATE: AdvocacyImage = { id: 0, src: '', caption: '', color: '#6366f1' };

export function AdvocacyEditor() {
  return (
    <SectionPage title="Advocacy Images" load={getAdvocacyImages} save={setAdvocacyImages}>
      {(items, onChange) => (
        <JsonArrayEditor
          items={items}
          onChange={onChange}
          template={TEMPLATE}
          getLabel={(item) => item.caption || `Image ${item.id}`}
        />
      )}
    </SectionPage>
  );
}
