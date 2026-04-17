import { mapGoodsItem, mapLookupItem, pickArray, uniqueById } from '@/lib/normalize';
import { normalizePhone } from '@/lib/utils';
import type { CreateMode, GoodsItem, LookupItem, RawRecord, ReferenceBundle } from '@/types/tablecrm';

const API_ROOT = 'https://app.tablecrm.com/api/v1';

const PHONE_SEARCH_PARAMS = ['phone', 'search', 'q'];
const NOMENCLATURE_PARAMS = ['search', 'q', 'title', 'name'];

function createUrl(path: string, token: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${API_ROOT}${path}`);
  url.searchParams.set('token', token);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

async function requestJson(url: URL, init?: RequestInit) {
  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = text ? safeParse(text) : undefined;

  if (!response.ok) {
    const errorMessage =
      typeof data === 'object' && data && 'detail' in data
        ? String((data as RawRecord).detail)
        : `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function loadReferences(token: string): Promise<ReferenceBundle> {
  const [pboxes, organizations, warehouses, priceTypes] = await Promise.all([
    fetchLookup('/pboxes/meta', token),
    fetchLookup('/organizations', token),
    fetchLookup('/warehouses/', token),
    fetchLookup('/price_types/', token),
  ]);

  return {
    pboxes,
    organizations,
    warehouses,
    priceTypes,
  };
}

async function fetchLookup(path: string, token: string, params?: Record<string, string | number | undefined>) {
  const data = await requestJson(createUrl(path, token, params));
  return uniqueById(pickArray(data).map(mapLookupItem));
}

export async function searchClientsByPhone(token: string, phone: string) {
  const cleaned = normalizePhone(phone);

  if (!cleaned) return [] as LookupItem[];

  for (const paramName of PHONE_SEARCH_PARAMS) {
    try {
      const data = await requestJson(
        createUrl('/contragents/meta', token, {
          [paramName]: cleaned,
          limit: 20,
          offset: 0,
        }),
      );
      const items = uniqueById(pickArray(data).map(mapLookupItem));
      if (items.length > 0) return items;
    } catch {
      // try next query strategy
    }
  }

  return [] as LookupItem[];
}

export async function searchNomenclature(token: string, query: string) {
  const cleaned = query.trim();
  if (cleaned.length < 2) return [] as GoodsItem[];

  for (const paramName of NOMENCLATURE_PARAMS) {
    try {
      const data = await requestJson(
        createUrl('/nomenclature/', token, {
          [paramName]: cleaned,
          limit: 30,
          offset: 0,
        }),
      );
      const items = uniqueById(pickArray(data).map(mapGoodsItem));
      if (items.length > 0) return items;
    } catch {
      // try next query strategy
    }
  }

  const fallback = await requestJson(createUrl('/nomenclature/', token, { limit: 30, offset: 0 }));
  const items = uniqueById(pickArray(fallback).map(mapGoodsItem));
  return items.filter((item) => {
    const haystack = `${item.label} ${item.subtitle ?? ''}`.toLowerCase();
    return haystack.includes(cleaned.toLowerCase());
  });
}

export function buildDocSalesPayload(input: {
  client?: LookupItem | null;
  phone: string;
  pbox?: string | number;
  organization?: string | number;
  warehouse?: string | number;
  priceType?: string | number;
  goods: GoodsItem[];
  comment?: string;
  mode: CreateMode;
}) {
  const payload: Record<string, unknown> = {
    contragent: input.client?.id ?? null,
    phone: normalizePhone(input.phone),
    pbox: input.pbox ? numericOrRaw(input.pbox) : null,
    organization: input.organization ? numericOrRaw(input.organization) : null,
    warehouse: input.warehouse ? numericOrRaw(input.warehouse) : null,
    price_type: input.priceType ? numericOrRaw(input.priceType) : null,
    goods: input.goods.map((item) => ({
      nomenclature: numericOrRaw(item.id),
      count: item.quantity,
      quantity: item.quantity,
      price: item.price,
      total_price: Number((item.quantity * item.price).toFixed(2)),
      sum: Number((item.quantity * item.price).toFixed(2)),
    })),
    comment: input.comment || undefined,
  };

  /**
   * В открытой документации из задания нельзя надёжно вытащить точное поле для "провести".
   * Поэтому сюда заложены самые частые варианты. Если реальный API ожидает другое поле,
   * скорректировать нужно только этот блок.
   */
  if (input.mode === 'conduct') {
    payload.is_posted = true;
    payload.posted = true;
    payload.conduct = true;
  }

  return payload;
}

function numericOrRaw(value: string | number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}

export async function createDocSale(token: string, payload: Record<string, unknown>) {
  return requestJson(createUrl('/docs_sales/', token), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
