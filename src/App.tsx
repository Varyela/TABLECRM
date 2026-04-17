import { Building2, CreditCard, Package2, Phone, RefreshCcw, Store, Wallet } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { createDocSale, buildDocSalesPayload, loadReferences, searchClientsByPhone, searchNomenclature } from '@/api/tablecrm';
import { EntityPicker } from '@/components/entity-picker';
import { GoodsPicker } from '@/components/goods-picker';
import { StateBlock } from '@/components/state-block';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, normalizePhone } from '@/lib/utils';
import type { CreateMode, GoodsItem, LookupItem, ReferenceBundle } from '@/types/tablecrm';

const TOKEN_STORAGE_KEY = 'tablecrm-mobile-order-token';

const emptyRefs: ReferenceBundle = {
  pboxes: [],
  organizations: [],
  warehouses: [],
  priceTypes: [],
};

export default function App() {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? '');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [refs, setRefs] = useState<ReferenceBundle>(emptyRefs);
  const [clientResults, setClientResults] = useState<LookupItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<LookupItem | null>(null);
  const [pbox, setPbox] = useState<string | number>('');
  const [organization, setOrganization] = useState<string | number>('');
  const [warehouse, setWarehouse] = useState<string | number>('');
  const [priceType, setPriceType] = useState<string | number>('');
  const [goods, setGoods] = useState<GoodsItem[]>([]);

  const [refsState, setRefsState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [clientState, setClientState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }, [token]);

  const total = useMemo(() => goods.reduce((sum, item) => sum + item.total, 0), [goods]);

  const bootstrap = async () => {
    if (!token.trim()) {
      setRefsState('error');
      return;
    }

    try {
      setRefsState('loading');
      const data = await loadReferences(token.trim());
      setRefs(data);
      setPbox((prev) => prev || data.pboxes[0]?.id || '');
      setOrganization((prev) => prev || data.organizations[0]?.id || '');
      setWarehouse((prev) => prev || data.warehouses[0]?.id || '');
      setPriceType((prev) => prev || data.priceTypes[0]?.id || '');
      setRefsState('success');
    } catch (error) {
      setRefsState('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Не удалось загрузить справочники');
    }
  };

  useEffect(() => {
    if (token.trim()) {
      void bootstrap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findClient = async () => {
    if (!token.trim()) {
      setClientState('error');
      return;
    }

    try {
      setClientState('loading');
      const data = await searchClientsByPhone(token.trim(), phone);
      setClientResults(data);
      setSelectedClient(data[0] ?? null);
      setClientState(data.length > 0 ? 'success' : 'error');
    } catch (error) {
      setClientState('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Не удалось найти клиента');
    }
  };

  const submit = async (mode: CreateMode) => {
    if (!token.trim()) {
      setSubmitState('error');
      setSubmitMessage('Введите токен кассы');
      return;
    }

    if (!phone.trim()) {
      setSubmitState('error');
      setSubmitMessage('Введите телефон клиента');
      return;
    }

    if (goods.length === 0) {
      setSubmitState('error');
      setSubmitMessage('Добавьте хотя бы один товар');
      return;
    }

    const payload = buildDocSalesPayload({
      client: selectedClient,
      phone,
      pbox,
      organization,
      warehouse,
      priceType,
      goods,
      comment,
      mode,
    });

    try {
      setSubmitState('loading');
      const response = await createDocSale(token.trim(), payload);
      setSubmitState('success');
      setSubmitMessage(`Продажа успешно создана${mode === 'conduct' ? ' и отправлена на проведение' : ''}.`);
      console.info('TABLECRM response:', response);
    } catch (error) {
      setSubmitState('error');
      const message = error instanceof Error ? error.message : 'Не удалось создать продажу';
      setSubmitMessage(`${message}. Проверьте mapping в buildDocSalesPayload().`);
      console.error('TABLECRM payload error', payload);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-3 pb-28 pt-4">
      <Card className="overflow-hidden border-primary/10 bg-white/95 backdrop-blur">
        <CardHeader className="pb-4">
          <div className="mb-3 flex items-center justify-between">
            <Badge className="bg-primary/10 text-primary">TABLECRM</Badge>
            <Badge>{normalizePhone(phone).length || 0} цифр</Badge>
          </div>
          <CardTitle className="text-2xl">Мобильное оформление заказа</CardTitle>
          <CardDescription>WebApp-форма для создания продажи с загрузкой справочников и выбором товаров.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Токен кассы</Label>
            <div className="flex gap-2">
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Введите token"
                autoComplete="off"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => void bootstrap()}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">После ввода токена подтягиваются счета, организации, склады и типы цен.</p>
          </div>
          <StateBlock
            state={refsState}
            text={
              refsState === 'loading'
                ? 'Загружаю справочники TABLECRM...'
                : refsState === 'success'
                  ? 'Справочники загружены.'
                  : 'Проверьте токен или доступность API.'
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5" /> Клиент
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
              />
              <Button type="button" variant="outline" onClick={() => void findClient()}>
                Найти
              </Button>
            </div>
          </div>

          <StateBlock
            state={clientState}
            text={
              clientState === 'loading'
                ? 'Ищу клиента по телефону...'
                : clientState === 'success'
                  ? 'Клиент найден. Можно выбрать другого из результатов ниже.'
                  : clientState === 'error'
                    ? 'Клиент не найден или поиск не поддерживает выбранный параметр.'
                    : ''
            }
          />

          {clientResults.length > 0 ? (
            <div className="space-y-2">
              <Label>Результаты поиска</Label>
              <div className="space-y-2">
                {clientResults.map((client) => (
                  <button
                    key={String(client.id)}
                    type="button"
                    onClick={() => setSelectedClient(client)}
                    className={`w-full rounded-2xl border p-4 text-left transition hover:bg-accent/40 ${
                      String(selectedClient?.id ?? '') === String(client.id) ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="text-sm font-medium">{client.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{client.subtitle || `#${client.id}`}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Параметры продажи</CardTitle>
          <CardDescription>Выводятся так же, как в модальном окне оформления продажи.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <EntityPicker
              label="Счёт"
              placeholder="Выберите счёт"
              items={refs.pboxes}
              value={pbox}
              onChange={(item) => setPbox(item.id)}
              helperText={`${refs.pboxes.length} значений`}
            />
            <EntityPicker
              label="Организация"
              placeholder="Выберите организацию"
              items={refs.organizations}
              value={organization}
              onChange={(item) => setOrganization(item.id)}
              helperText={`${refs.organizations.length} значений`}
            />
            <EntityPicker
              label="Склад"
              placeholder="Выберите склад"
              items={refs.warehouses}
              value={warehouse}
              onChange={(item) => setWarehouse(item.id)}
              helperText={`${refs.warehouses.length} значений`}
            />
            <EntityPicker
              label="Тип цен"
              placeholder="Выберите тип цен"
              items={refs.priceTypes}
              value={priceType}
              onChange={(item) => setPriceType(item.id)}
              helperText={`${refs.priceTypes.length} значений`}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий</Label>
            <Input id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Необязательно" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package2 className="h-5 w-5" /> Позиции заказа
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GoodsPicker token={token.trim()} value={goods} onChange={setGoods} onSearch={(query) => searchNomenclature(token.trim(), query)} />
        </CardContent>
      </Card>

      <Card className="bg-slate-950 text-slate-50">
        <CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <SummaryStat icon={<Wallet className="h-4 w-4" />} label="Счёт" value={refs.pboxes.find((item) => String(item.id) === String(pbox))?.label || '—'} />
            <SummaryStat icon={<Building2 className="h-4 w-4" />} label="Орг." value={refs.organizations.find((item) => String(item.id) === String(organization))?.label || '—'} />
            <SummaryStat icon={<Store className="h-4 w-4" />} label="Склад" value={refs.warehouses.find((item) => String(item.id) === String(warehouse))?.label || '—'} />
            <SummaryStat icon={<CreditCard className="h-4 w-4" />} label="Тип цен" value={refs.priceTypes.find((item) => String(item.id) === String(priceType))?.label || '—'} />
          </div>
          <Separator className="bg-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Итого к оплате</span>
            <span className="text-2xl font-semibold">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t bg-background/95 p-3 backdrop-blur">
        <div className="space-y-3">
          <StateBlock state={submitState} text={submitMessage || 'Готово'} />
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="w-full" onClick={() => void submit('draft')}>
              Создать продажу
            </Button>
            <Button type="button" className="w-full" onClick={() => void submit('conduct')}>
              Создать и провести
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  );
}
