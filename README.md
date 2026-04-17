# TABLECRM Mobile Order

Мобильная webapp-форма оформления заказа для тестового задания TABLECRM.

## Что внутри

- Vite + React + TypeScript
- Tailwind + shadcn-style UI components
- Мобильный интерфейс в духе shadcn dashboard
- Ввод токена кассы
- Поиск клиента по телефону
- Загрузка счетов, организаций, складов и типов цен
- Поиск и выбор товаров
- Расчёт итоговой суммы
- Кнопки **«Создать продажу»** и **«Создать и провести»**

## Быстрый старт

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
```

## Где править интеграцию, если API вернёт немного другую схему

Основная интеграция лежит здесь:

- `src/api/tablecrm.ts`

Ключевые места:

1. `loadReferences()` — загрузка справочников
2. `searchClientsByPhone()` — стратегия поиска клиента по телефону
3. `searchNomenclature()` — стратегия поиска товаров
4. `buildDocSalesPayload()` — финальный payload для `POST /docs_sales/`

## Важная заметка по payload

Из открытого задания удалось достоверно подтвердить наличие OpenAPI и метода создания продаж,
но не получилось надёжно извлечь точную схему поля для кнопки **«создать и провести»** из примера payload.
Поэтому в `buildDocSalesPayload()` заложены самые частые варианты:

- `is_posted: true`
- `posted: true`
- `conduct: true`

Если live API TABLECRM ожидает другое поле, нужно поправить только этот блок.

## Деплой на Vercel

1. Создать репозиторий и залить проект.
2. Импортировать его в Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`

## Что можно улучшить перед отправкой

- Снять реальные network payload/response в браузере TABLECRM и уточнить схему `docs_sales`
- Добавить toast-уведомления
- Добавить форматтер телефона
- Добавить skeleton-loading для списков
- Добавить e2e smoke test
