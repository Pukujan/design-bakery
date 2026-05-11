import { getTimeline, setTimeline, type TimelineEntry } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';

const TEMPLATE: TimelineEntry = { org: '', role: '', color: '#6366f1' };

export function AboutEditor() {
  return (
    <SectionPage title="About Timeline" load={getTimeline} save={setTimeline}>
      {(items, onChange) => (
        <JsonArrayEditor
          items={items}
          onChange={onChange}
          template={TEMPLATE}
          getLabel={(item) => `${item.role} @ ${item.org}`}
        />
      )}
    </SectionPage>
  );
}
