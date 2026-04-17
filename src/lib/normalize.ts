import type { GoodsItem, LookupItem, RawRecord } from '@/types/tablecrm';

const ID_KEYS = ['id', 'idx', 'value'];
const TITLE_KEYS = ['title', 'name', 'label', 'full_name'];
const SUBTITLE_KEYS = ['phone', 'article', 'code', 'email', 'comment'];
const PRICE_KEYS = ['price', 'sale_price', 'retail_price', 'base_price'];
const ARRAY_KEYS = ['results', 'items', 'data', 'rows', 'list'];

function readFirst(raw: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return undefined;
}

export function pickArray(input: unknown): RawRecord[] {
  if (Array.isArray(input)) return input as RawRecord[];
  if (!input || typeof input !== 'object') return [];

  const record = input as RawRecord;

  for (const key of ARRAY_KEYS) {
    const value = record[key];
    if (Array.isArray(value)) return value as RawRecord[];
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) return value as RawRecord[];
  }

  return [];
}

export function mapLookupItem(raw: RawRecord): LookupItem {
  const id = readFirst(raw, ID_KEYS) ?? crypto.randomUUID();
  const label = String(readFirst(raw, TITLE_KEYS) ?? `#${String(id)}`);
  const subtitleValue = readFirst(raw, SUBTITLE_KEYS);

  return {
    id: typeof id === 'number' || typeof id === 'string' ? id : String(id),
    label,
    subtitle: subtitleValue ? String(subtitleValue) : undefined,
    raw,
  };
}

export function mapGoodsItem(raw: RawRecord): GoodsItem {
  const lookup = mapLookupItem(raw);
  const priceValue = Number(readFirst(raw, PRICE_KEYS) ?? 0);

  return {
    ...lookup,
    price: Number.isFinite(priceValue) ? priceValue : 0,
    quantity: 1,
    total: Number.isFinite(priceValue) ? priceValue : 0,
  };
}

export function uniqueById<T extends { id: string | number }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = String(item.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
