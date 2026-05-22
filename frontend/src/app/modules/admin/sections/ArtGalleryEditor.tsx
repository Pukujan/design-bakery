import { getArtPieces, setArtPieces, type ArtPiece } from '../../../lib/adminContentService';
import { SectionPage } from '../components/SectionPage';
import { JsonArrayEditor } from '../components/JsonArrayEditor';

const TEMPLATE: ArtPiece = { id: 0, src: '', caption: '', color: '#6366f1' };

export function ArtGalleryEditor() {
  return (
    <SectionPage title="Art Gallery" load={getArtPieces} save={setArtPieces}>
      {(items, onChange) => (
        <JsonArrayEditor
          items={items}
          onChange={onChange}
          template={TEMPLATE}
          getLabel={(item) => item.caption || `Piece ${item.id}`}
        />
      )}
    </SectionPage>
  );
}
