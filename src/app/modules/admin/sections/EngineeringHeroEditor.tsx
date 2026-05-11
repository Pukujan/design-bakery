import {
  getEngineeringHeroContent,
  setEngineeringHeroContent,
  type EngineeringHeroContent,
} from '../../../lib/adminContentService';
import { ObjectSectionPage } from '../components/ObjectSectionPage';
import { JsonObjectEditor } from '../components/JsonObjectEditor';

export function EngineeringHeroEditor() {
  return (
    <ObjectSectionPage<EngineeringHeroContent>
      title="Engineering Hero Banner"
      load={getEngineeringHeroContent}
      save={setEngineeringHeroContent}
    >
      {(item, onChange) => <JsonObjectEditor item={item} onChange={onChange} />}
    </ObjectSectionPage>
  );
}
