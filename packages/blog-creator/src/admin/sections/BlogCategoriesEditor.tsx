import { getBlogCategories, setBlogCategories, type BlogCategory } from '@design-bakery/blog-core/admin';
import { SectionPage } from '../components/SectionPage.js';
import { JsonArrayEditor } from '../components/JsonArrayEditor.js';

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
