import { getBlogCategories, setBlogCategories, type BlogCategory } from '@/lib/adminContentService';
import { SectionPage } from '@/modules/admin/components/SectionPage';
import { JsonArrayEditor } from '@/modules/admin/components/JsonArrayEditor';

const TEMPLATE: BlogCategory = { id: '', label: '', color: '#6366f1' };

export function BlogCategoriesEditor() {
  return (
    <SectionPage title="Blog Categories" load={getBlogCategories} save={setBlogCategories}>
      {(items, onChange) => (
        <JsonArrayEditor
          items={items}
          onChange={onChange}
          template={TEMPLATE}
          getLabel={(item) => item.label || item.id}
        />
      )}
    </SectionPage>
  );
}
