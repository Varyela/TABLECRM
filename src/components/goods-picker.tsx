import { Minus, PackageSearch, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { debounce, formatCurrency } from '@/lib/utils';
import type { GoodsItem } from '@/types/tablecrm';

interface GoodsPickerProps {
  token: string;
  value: GoodsItem[];
  onChange: (items: GoodsItem[]) => void;
  onSearch: (query: string) => Promise<GoodsItem[]>;
}

export function GoodsPicker({ token, value, onChange, onSearch }: GoodsPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GoodsItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => value.reduce((sum, item) => sum + item.total, 0), [value]);

  const runSearch = useMemo(
    () =>
      debounce(async (nextQuery: string) => {
        if (!token || nextQuery.trim().length < 2) {
          setResults([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError(null);
          const data = await onSearch(nextQuery);
          setResults(data);
        } catch (searchError) {
          setError(searchError instanceof Error ? searchError.message : 'Не удалось загрузить товары');
        } finally {
          setLoading(false);
        }
      }, 350),
    [onSearch, token],
  );

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  const addItem = (item: GoodsItem) => {
    const exists = value.find((current) => String(current.id) === String(item.id));
    if (exists) {
      onChange(
        value.map((current) =>
          String(current.id) === String(item.id)
            ? {
                ...current,
                quantity: current.quantity + 1,
                total: Number(((current.quantity + 1) * current.price).toFixed(2)),
              }
            : current,
        ),
      );
      return;
    }

    onChange([...value, { ...item, quantity: 1, total: Number(item.price.toFixed(2)) }]);
  };

  const updateQuantity = (id: string | number, diff: number) => {
    onChange(
      value
        .map((item) => {
          if (String(item.id) !== String(id)) return item;
          const nextQuantity = item.quantity + diff;
          if (nextQuantity <= 0) return null;
          return {
            ...item,
            quantity: nextQuantity,
            total: Number((nextQuantity * item.price).toFixed(2)),
          };
        })
        .filter(Boolean) as GoodsItem[],
    );
  };

  const updatePrice = (id: string | number, nextPrice: number) => {
    onChange(
      value.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              price: nextPrice,
              total: Number((nextPrice * item.quantity).toFixed(2)),
            }
          : item,
      ),
    );
  };

  const removeItem = (id: string | number) => onChange(value.filter((item) => String(item.id) !== String(id)));

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Товары</Label>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-14 w-full items-center justify-between rounded-[22px] border bg-background px-4 text-left shadow-sm transition hover:bg-accent/40"
        >
          <div>
            <div className="text-sm font-medium">Добавить товар</div>
            <div className="text-xs text-muted-foreground">Номенклатура и количество</div>
          </div>
          <Badge>{value.length}</Badge>
        </button>
      </div>

      {value.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <PackageSearch className="h-5 w-5" />
            Выберите хотя бы один товар
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {value.map((item) => (
            <Card key={String(item.id)}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{item.label}</div>
                    <div className="truncate text-xs text-muted-foreground">{item.subtitle || `#${item.id}`}</div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-[auto,1fr] items-center gap-3">
                  <div className="flex items-center rounded-2xl border">
                    <Button type="button" variant="ghost" size="icon" onClick={() => updateQuantity(item.id, -1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[40px] text-center text-sm font-medium">{item.quantity}</div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => updateQuantity(item.id, 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.price}
                    onChange={(e) => updatePrice(item.id, Number(e.target.value || 0))}
                    placeholder="Цена"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Сумма</span>
                  <span className="font-semibold">{formatCurrency(item.total)}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm">Итого</span>
              <span className="text-lg font-semibold">{formatCurrency(total)}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/35 backdrop-blur-[1px]">
          <button type="button" aria-label="close" className="flex-1" onClick={() => setOpen(false)} />
          <div className="max-h-[82vh] rounded-t-[32px] bg-background p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Выбор товара</h3>
                <p className="text-sm text-muted-foreground">Введите название или артикул</p>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Например, футболка" className="pl-9" />
            </div>

            <div className="space-y-2 overflow-y-auto pb-4">
              {loading ? <div className="rounded-2xl border p-4 text-sm">Загрузка...</div> : null}
              {error ? <div className="rounded-2xl border border-destructive/30 p-4 text-sm text-destructive">{error}</div> : null}
              {!loading && !error && query.trim().length < 2 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Введите минимум 2 символа</div>
              ) : null}
              {!loading && !error && query.trim().length >= 2 && results.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Товары не найдены</div>
              ) : null}
              {results.map((item) => (
                <button
                  key={String(item.id)}
                  type="button"
                  onClick={() => addItem(item)}
                  className="w-full rounded-2xl border p-4 text-left transition hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{item.label}</div>
                      <div className="truncate text-xs text-muted-foreground">{item.subtitle || `#${item.id}`}</div>
                    </div>
                    <Badge>{formatCurrency(item.price)}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
