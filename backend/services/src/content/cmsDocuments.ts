import { dbExec, dbQueryOne } from '../db.js';
import { parseFirestoreCollection } from './collectionKey.js';

type CmsRow = { payload: unknown };

async function readCmsPayload(
  portfolioId: string,
  collectionName: string,
): Promise<unknown> {
  const row = await dbQueryOne<CmsRow>(
    `select payload from public.cms_documents
      where portfolio_id = $1 and collection_name = $2 and document_id = 'data'
      limit 1`,
    [portfolioId, collectionName],
  );
  return row?.payload;
}

async function writeCmsPayload(
  portfolioId: string,
  collectionName: string,
  payload: unknown,
): Promise<void> {
  await dbExec(
    `insert into public.cms_documents (portfolio_id, collection_name, document_id, payload, updated_at)
     values ($1, $2, 'data', $3::jsonb, $4)
     on conflict (portfolio_id, collection_name, document_id)
     do update set payload = excluded.payload, updated_at = excluded.updated_at`,
    [portfolioId, collectionName, JSON.stringify(payload), new Date().toISOString()],
  );
}

export async function getCmsArray<T>(collectionKey: string, fallback: T[]): Promise<T[]> {
  const { portfolio_id, collection_name } = parseFirestoreCollection(collectionKey);
  const payload = await readCmsPayload(portfolio_id, collection_name);
  if (!payload || typeof payload !== 'object') return fallback;

  const items = (payload as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items as T[];
}

export async function setCmsArray(collectionKey: string, items: unknown[]): Promise<void> {
  const { portfolio_id, collection_name } = parseFirestoreCollection(collectionKey);
  await writeCmsPayload(portfolio_id, collection_name, { items });
}

export async function getCmsObject<T>(collectionKey: string, fallback: T): Promise<T> {
  const { portfolio_id, collection_name } = parseFirestoreCollection(collectionKey);
  const payload = await readCmsPayload(portfolio_id, collection_name);
  if (!payload || typeof payload !== 'object') return fallback;

  const record = payload as Record<string, unknown>;
  if (record.item !== undefined && record.item !== null) {
    return record.item as T;
  }

  const { item: _i, items: _a, ...legacy } = record;
  if (Object.keys(legacy).length > 0) {
    return legacy as T;
  }
  return fallback;
}

export async function setCmsObject(collectionKey: string, item: unknown): Promise<void> {
  const { portfolio_id, collection_name } = parseFirestoreCollection(collectionKey);
  await writeCmsPayload(portfolio_id, collection_name, { item });
}
