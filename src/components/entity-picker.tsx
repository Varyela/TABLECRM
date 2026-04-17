import { ChevronRight, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { LookupItem } from '@/types/tablecrm';

interface EntityPickerProps {
  label: string;
  placeholder: string;
  items: LookupItem[];
  value?: string | number;
  onChange: (item: LookupItem) => void;
  helperText?: string;
}

export function EntityPicker({ label, placeholder, items, value, onChange, helperText }: EntityPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = items.find((item) => String(item.id) === String(value ?? ''));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.label} ${item.subtitle ?? ''}`.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-14 w-full items-center justify-between rounded-[22px] border bg-background px-4 text-left shadow-sm transition hover:bg-accent/40"
      >
        <div className="min-w-0">
          <div className={cn('truncate text-sm', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </div>
          {selected?.subtitle ? <div className="truncate text-xs text-muted-foreground">{selected.subtitle}</div> : null}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/35 backdrop-blur-[1px]">
          <button type="button" aria-label="close" className="flex-1" onClick={() => setOpen(false)} />
          <div className="max-h-[78vh] rounded-t-[32px] bg-background p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">{label}</h3>
                <p className="text-sm text-muted-foreground">Выберите значение из списка</p>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск" className="pl-9" />
            </div>

            <div className="space-y-2 overflow-y-auto pb-4">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Ничего не найдено</div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={String(item.id)}
                    type="button"
                    className={cn(
                      'w-full rounded-2xl border p-4 text-left transition hover:bg-accent/40',
                      String(item.id) === String(value ?? '') && 'border-primary bg-primary/5',
                    )}
                    onClick={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{item.label}</div>
                        {item.subtitle ? <div className="mt-1 truncate text-xs text-muted-foreground">{item.subtitle}</div> : null}
                      </div>
                      <Badge>#{item.id}</Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
