import { supabaseAdmin } from '../supabaseClient.js';
import { parseFirestoreCollection } from './collectionKey.js';

export async function getCmsArray<T>(collectionKey: string, fallback: T[]): Promise<T[]> {
  const { portfolio_id, collection_name } = parseFirestoreCollection(collectionKey);
  const { data, error } = await supabaseAdmin()
    .from('cms_documents')
    .select('payload')
    .eq('portfolio_id', portfolio_id)
    .eq('collection_name', collection_name)
    .eq('document_id', 'data')
    .maybeSingle();

  if (error) throw new Error(`CMS read failed: ${error.message}`);
  if (!data?.payload || typeof data.payload !== 'object') return fallback;

  const payload = data.payload as { items?: unknown };
  const items = payload.items;
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items as T[];
}

export async function setCmsArray(collectionKey: string, items: unknown[]): Promise<void> {
  const { portfolio_id, collection_name } = parseFirestoreCollection(collectionKey);
  const { error } = await supabaseAdmin()
    .from('cms_documents')
    .upsert(
      {
        portfolio_id,
        collection_name,
        document_id: 'data',
        payload: { items },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'portfolio_id,collection_name,document_id' },
    );

  if (error) throw new Error(`CMS write failed: ${error.message}`);
}

export async function getCmsObject<T>(collectionKey: string, fallback: T): Promise<T> {
  const { portfolio_id, collection_name } = parseFirestoreCollection(collectionKey);
  const { data, error } = await supabaseAdmin()
    .from('cms_documents')
    .select('payload')
    .eq('portfolio_id', portfolio_id)
    .eq('collection_name', collection_name)
    .eq('document_id', 'data')
    .maybeSingle();

  if (error) throw new Error(`CMS read failed: ${error.message}`);
  if (!data?.payload || typeof data.payload !== 'object') return fallback;

  const payload = data.payload as { item?: unknown };
  if (payload.item !== undefined && payload.item !== null) {
    return payload.item as T;
  }

  const { item: _i, items: _a, ...legacy } = payload as Record<string, unknown>;
  if (Object.keys(legacy).length > 0) {
    return legacy as T;
  }
  return fallback;
}

export async function setCmsObject(collectionKey: string, item: unknown): Promise<void> {
  const { portfolio_id, collection_name } = parseFirestoreCollection(collectionKey);
  const { error } = await supabaseAdmin()
    .from('cms_documents')
    .upsert(
      {
        portfolio_id,
        collection_name,
        document_id: 'data',
        payload: { item },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'portfolio_id,collection_name,document_id' },
    );

  if (error) throw new Error(`CMS write failed: ${error.message}`);
}
