# Приёмная — система учёта заказов Госфильмофонда

Веб-приложение для приёма, отслеживания и управления заказами на обработку плёнок. Поддерживает несколько ролей сотрудников, пошаговое движение заказов по статусам, автоматическую фиксацию задержек и генерацию PDF-квитанции.

## Стек

| Слой | Технология |
|---|---|
| Фреймворк | Next.js 16.2.4 (App Router, Turbopack) |
| База данных | PostgreSQL + Prisma 7 |
| Аутентификация | Auth.js v5 (`next-auth@beta`), JWT-стратегия, Credentials provider |
| UI | Tailwind CSS v4, shadcn/ui |
| PDF | `@react-pdf/renderer` v4.5.1, шрифт Geist (кириллица + латиница) |
| Контейнеризация | Docker + docker-compose |

## Быстрый старт

### Локальная разработка

1. Создайте файл `.env.local`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/priemplenok
   AUTH_SECRET=<случайная строка, минимум 32 символа>
   NEXT_PUBLIC_BASE_URL=http://ваш_адрес

   # Заполните для рассылки уведомление
   SMTP_HOST=smtp.gff-rf.ru
   SMTP_PORT=465
   SMTP_USER=gff@gff-rf.ru
   SMTP_PASS=пароль
   SMTP_FROM=gff@gff-rf.ru
   ```

2. Установите зависимости и примените схему БД:
   ```bash
   npm install
   npx prisma db push
   ```

3. Запустите сервер разработки:
   ```bash
   npm run dev
   ```

Приложение доступно по адресу `http://localhost:3000`.

### Production (Docker)

```bash
# Заполните DATABASE_URL и AUTH_SECRET в .env.local
docker-compose up -d --build
```

Приложение поднимается на порту **80**, dnsmasq на **53** (DNS для локальной сети), Portainer на **9443**.

## Структура проекта

```
config/
  delays.json        — пороги автозадержки по статусам (часы)
  roles.json         — роли и их права
prisma/
  schema.prisma      — схема БД
public/
  fonts/             — шрифт для PDF (Geist, поддержка кириллицы)
src/
  app/
    admin/           — интерфейс сотрудников
      order/[id]/    — просмотр и редактирование заказа
      order/new/     — создание нового заказа
      super/         — раздел только для admin
        users/       — управление пользователями
        logs/        — журнал всех событий
        backup/      — резервное копирование
    order/[id]/      — публичная страница статуса заказа
    api/
      auth/          — обработчики Auth.js
      orders/        — CRUD заказов, PDF
      admin/users/   — управление пользователями
      admin/backup/  — экспорт/импорт данных
  lib/
    db.ts            — запросы к БД
    auth.ts          — получение сессии
    roles.ts         — утилиты ролей (читает roles.json)
    delays.ts        — логика автозадержки (читает delays.json)
```

## Схема базы данных

| Таблица | Назначение |
|---|---|
| `orders` | Заказы (номер коробки, клиент, статус, флаг задержки) |
| `order_items` | Позиции заказа (название плёнки, описание) |
| `status_history` | История смен статусов |
| `order_counters` | Счётчик номеров заказов по годам |
| `order_statuses` | Справочник статусов (код, метка, цвет) |
| `users` | Пользователи системы (логин, хэш пароля, роль) |

Номер заказа генерируется автоматически в формате `ГГГГ-NNNN` (например, `2026-0042`).

## Статусы заказов

Статусы хранятся в таблице `order_statuses`. Стандартный набор:

| Код | Название |
|---|---|
| `coordinating` | Согласование |
| `accepted` | Принят |
| `in_lab` | В лаборатории |
| `developing` | Проявка |
| `inspection` | Контроль |
| `defect_report` | Дефектовка |
| `ultrasonic` | УЗО |
| `order_desk` | Стол заказов |
| `scanning` | Оцифровка |
| `ready_download` | Готов к скачиванию |
| `ready_pickup` | Готов к выдаче |
| `completed` | Завершён |

## Роли

Роли описаны в `config/roles.json` и читаются при каждом запросе — изменения применяются без перезапуска приложения.

```json
[
  {
    "code": "admin",
    "label": "Администратор",
    "can_create_orders": true,
    "statuses": ["*"]
  },
  {
    "code": "coordinator",
    "label": "Координатор",
    "can_create_orders": true,
    "statuses": ["coordinating", "accepted", "ready_pickup", "completed"]
  },
  {
    "code": "lab",
    "label": "Лаборатория",
    "can_create_orders": false,
    "statuses": ["in_lab", "developing", "inspection", "defect_report", "ultrasonic", "order_desk"]
  },
  {
    "code": "scanner",
    "label": "Сканирование",
    "can_create_orders": false,
    "statuses": ["scanning", "ready_download"]
  }
]
```

Поля:
- `statuses` — список кодов статусов, на которые роль может переключать заказ. `["*"]` означает все статусы.
- `can_create_orders` — разрешено ли создавать новые заказы.

Доступ в раздел «Система» (`/admin/super`) — только роль `admin`.

## Автозадержка

При каждом открытии журнала заказов система проверяет, не завис ли заказ на текущем статусе дольше допустимого порога. Пороги задаются в `config/delays.json`:

```json
{
  "default_hours": 48,
  "statuses": {
    "coordinating":  24,
    "accepted":      48,
    "in_lab":        72,
    "developing":   120,
    "inspection":    72,
    "defect_report": 48,
    "ultrasonic":    72,
    "order_desk":    48,
    "scanning":      96,
    "ready_download": 72,
    "ready_pickup":  168,
    "completed":    null
  }
}
```

- Значение — количество часов бездействия до установки флага `is_delayed = true`.
- `null` или отсутствие кода в списке — задержка для этого статуса не отслеживается.
- Флаг сбрасывается при следующей смене статуса.
- В журнале заказы с задержкой отмечены значком ⚠.

## API

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/api/orders` | Список всех заказов |
| `POST` | `/api/orders` | Создать заказ (требует `can_create_orders`) |
| `GET` | `/api/orders/[id]` | Один заказ |
| `PATCH` | `/api/orders/[id]` | Изменить статус/данные (проверяет роль) |
| `DELETE` | `/api/orders/[id]` | Удалить заказ |
| `GET` | `/api/orders/[id]/pdf` | Скачать PDF-квитанцию |
| `GET/POST/DELETE` | `/api/orders/[id]/items` | Позиции заказа |
| `GET` | `/api/admin/users` | Список пользователей (только admin) |
| `PATCH` | `/api/admin/users/[id]` | Изменить роль пользователя (только admin) |
| `GET` | `/api/admin/backup` | Экспорт данных |
| `POST` | `/api/admin/import` | Импорт данных |

## Переменные окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | Строка подключения к PostgreSQL |
| `AUTH_SECRET` | Секрет для подписи JWT (минимум 32 символа) |
| `SMTP_HOST` | SMTP-сервер для уведомлений (опционально) |
| `SMTP_PORT` | Порт SMTP (опционально) |
| `SMTP_USER` | Логин SMTP (опционально) |
| `SMTP_PASS` | Пароль SMTP (опционально) |
| `SMTP_FROM` | Адрес отправителя (опционально) |

## Сборка и деплой

```bash
# Первый запуск
docker-compose up -d --build

# Обновление приложения
docker-compose up -d --build priemplenok

# Просмотр логов
docker logs priemplenok -f

# Остановка
docker-compose down
```

БД при пересборке образа не затрагивается — данные хранятся в PostgreSQL на хосте.
