import { getWebProjects, setWebProjects, getAiProjects, setAiProjects, type ShowcaseProject } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

const TEMPLATE: ShowcaseProject = {
  id: 0,
  title: '',
  description: '',
  image: '',
  color: '#6366f1',
  link: '',
  type: 'web',
};

export function WebShowcaseEditor() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Web Design Showcase</h1>
      <Tabs defaultValue="web">
        <TabsList className="mb-4">
          <TabsTrigger value="web">Web Projects</TabsTrigger>
          <TabsTrigger value="ai">AI Projects</TabsTrigger>
        </TabsList>
        <TabsContent value="web">
          <SectionPage title="" load={getWebProjects} save={setWebProjects}>
            {(items, onChange) => (
              <JsonArrayEditor
                items={items}
                onChange={onChange}
                template={{ ...TEMPLATE, type: 'web' }}
                getLabel={(item) => item.title}
              />
            )}
          </SectionPage>
        </TabsContent>
        <TabsContent value="ai">
          <SectionPage title="" load={getAiProjects} save={setAiProjects}>
            {(items, onChange) => (
              <JsonArrayEditor
                items={items}
                onChange={onChange}
                template={{ ...TEMPLATE, type: 'ai' }}
                getLabel={(item) => item.title}
              />
            )}
          </SectionPage>
        </TabsContent>
      </Tabs>
    </div>
  );
}
