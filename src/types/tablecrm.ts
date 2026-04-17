export type RawRecord = Record<string, unknown>;

export type LookupItem = {
  id: number | string;
  label: string;
  subtitle?: string;
  raw: RawRecord;
};

export type GoodsItem = LookupItem & {
  price: number;
  quantity: number;
  total: number;
};

export type ReferenceBundle = {
  pboxes: LookupItem[];
  organizations: LookupItem[];
  warehouses: LookupItem[];
  priceTypes: LookupItem[];
};

export type CreateMode = 'draft' | 'conduct';

export type SubmitResult = {
  ok: boolean;
  payload: Record<string, unknown>;
  response?: unknown;
};
