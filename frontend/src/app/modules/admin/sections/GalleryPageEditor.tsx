import { getGallery, setGallery, type GalleryItem, type GalleryKey } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

const TEMPLATE: GalleryItem = {
  id: 0,
  image: '',
  title: '',
  description: '',
  date: '',
};

const GALLERY_KEYS: { key: GalleryKey; label: string }[] = [
  { key: 'abstract_collage', label: 'Abstract Collage' },
  { key: 'community_events', label: 'Community Events' },
  { key: 'community_workshops', label: 'Community Workshops' },
  { key: 'mixed_media', label: 'Mixed Media' },
  { key: 'poster_art', label: 'Poster Art' },
  { key: 'pride_community', label: 'Pride Community' },
  { key: 'pride_month', label: 'Pride Month' },
];

export function GalleryPageEditor() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Gallery Page</h1>
      <Tabs defaultValue={GALLERY_KEYS[0].key}>
        <TabsList className="mb-4 flex flex-wrap gap-1 h-auto">
          {GALLERY_KEYS.map(({ key, label }) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>
        {GALLERY_KEYS.map(({ key, label }) => (
          <TabsContent key={key} value={key}>
            <SectionPage
              title=""
              load={() => getGallery(key)}
              save={(items) => setGallery(key, items)}
            >
              {(items, onChange) => (
                <JsonArrayEditor
                  items={items}
                  onChange={onChange}
                  template={TEMPLATE}
                  getLabel={(item) => item.title || `Item ${item.id}`}
                />
              )}
            </SectionPage>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
