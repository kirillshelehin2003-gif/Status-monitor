# Status Monitor MVP

Production-ready MVP мониторинга популярных сервисов: Steam, ВКонтакте, MAX, Telegram, Discord, YouTube, Roblox, Google, Twitch и других.

Проект не является статичным макетом. Внутри есть Next.js frontend, API, Prisma/PostgreSQL, Redis-кеш и SSE real-time поток, отдельный worker для регулярных проверок, seed-данные и тесты логики статусов.

## Стек

- Next.js 15, React, TypeScript
- Prisma ORM и PostgreSQL для истории проверок, инцидентов и жалоб
- Redis для кеша текущего состояния и real-time pub/sub
- Server-Sent Events для обновлений без перезагрузки
- Recharts для графиков
- `node:test` + `tsx` для базовой доменной логики

## Быстрый запуск

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Откройте `http://localhost:3000`.

Админ-панель: `http://localhost:3000/admin`.

## Скрипты

```bash
npm run dev          # web + monitoring worker
npm run dev:web      # только Next.js
npm run worker       # только регулярные проверки
npm run test         # тесты расчета статусов
npm run db:seed      # seed популярных сервисов и истории
```

## Источники данных

Архитектура разделена на адаптеры:

- `http-health`: проверка публичного URL через HTTP
- `official-status`: каркас для официальных status page
- `trend-dev`: dev/mock поисковые тренды, детерминированные и помеченные как mock
- `user-report`: пользовательские жалобы из БД
- `manual-override`: ручные админские отметки
- `rss-social`: каркас для RSS/социальных сигналов

Dev mock не меняет статусы случайно. Он нужен только для локальной разработки и демонстрации структуры данных, когда внешние API недоступны. Для подключения настоящего источника добавьте адаптер в `src/server/adapters` и зарегистрируйте его в `src/server/monitors/source-registry.ts`.

## Принцип определения статуса

Расчет находится в `src/server/services/status-engine.ts`.

- мало данных: `unknown`
- ручная отметка администратора имеет наивысший приоритет
- HTTP/API ошибки, жалобы, тренды и социальные сигналы суммируются в problem score
- статус зависит от score и доступности
- длительность деградации считается по истории последних проверок

## Структура

```text
src/
  app/                  Next.js routes и API
  components/           dashboard, admin, charts, shared UI
  hooks/                SSE и client data hooks
  lib/                  shared helpers
  server/
    adapters/           источники сигналов
    database/           Prisma singleton
    monitors/           scheduler и orchestration
    services/           status engine, analytics, cache
    realtime/           Redis/SSE helpers
  types/                общие типы
tests/                  Vitest
prisma/                 schema и seed
```

## Production notes

- Запускайте worker отдельным процессом рядом с Next.js.
- Включите Redis, чтобы SSE получал push-события между процессами.
- Настройте настоящие endpoints в админке или seed-файле.
- Для Google Trends/RSS/status page добавьте реальные credentials/API URL в соответствующие адаптеры.
