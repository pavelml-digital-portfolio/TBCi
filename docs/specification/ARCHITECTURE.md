# TBCi — архитектурные схемы

Приложение к ТЗ v1.1. Схемы задают базовый дизайн, а не текущую инфраструктуру.

## 1. Модули и границы доверия

```mermaid
flowchart LR
  U[Единый Astro / публичные страницы SSG] --> CDN[CDN / статические файлы]
  APP[Тот же Astro / приватные страницы + React] --> WEB[Astro on-demand adapter / session gate]
  U --> EDGE[HTTPS / WAF / API gateway]
  WEB --> EDGE
  APP --> EDGE
  P[Партнёр] --> EDGE
  EDGE --> API[Identity / market / portfolio API]
  API --> Q[Quote engine]
  API --> O[Operation orchestrator]
  Q --> M[Market / index engine]
  M --> MP[Провайдер рыночных данных]
  O --> L[Ledger / reservations]
  L --> DB[(PostgreSQL / outbox)]
  O --> W[Workers / inbox]
  W --> C[Custody / liquidity adapters]
  W --> SG[Независимый policy / signing gateway]
  SG --> K[HSM / MPC / KMS]
  C --> CH[Сети / провайдеры]
  SG --> CH
  CH --> R[Наблюдение событий / reconciliation]
  R --> DB
  DB --> N[Notifications / webhooks]
  A[Backoffice + MFA] --> API
```

Signing-контур — отдельная граница доверия. Он не принимает произвольные методы/назначения от API без проверки. Постоянный финансовый журнал находится в PostgreSQL; Redis и очереди не являются единственным источником балансов или финансовых намерений.

## 2. Принятие операции

```mermaid
sequenceDiagram
  participant U as Пользователь
  participant API as API
  participant DB as DB / ledger
  participant W as Worker
  participant E as Провайдер / сеть
  U->>API: POST quote
  API-->>U: terms / fees / expires_at
  U->>API: POST operation + Idempotency-Key
  API->>DB: Транзакция: validate + reserve + operation + outbox
  DB-->>API: commit
  API-->>U: 202 operation_id
  W->>DB: Получить шаг с lease/version
  W->>E: Выполнить с business_request_id
  E-->>W: provider_ref / tx_hash / unknown
  W->>E: Проверка статуса и финальности
  W->>DB: Ledger settlement + state + outbox
  U->>API: GET operation
  API-->>U: completed / pending / manual_review
```

Если требуется MFA и подтверждение не передано, операция создаётся в awaiting_approval без резерва. После challenge/confirm заново проверяются quote TTL, право и ресурсы; только затем выполняется транзакция резервирования.

## 3. Погашение и сохранение обязательств

```mermaid
flowchart TD
  A[Есть токены в custody / escrow] --> B[Reserve q и зафиксировать версию K]
  B --> C[Burn request_id]
  C --> D{Финальность установлена?}
  D -- нет --> E[awaiting_network / резерв сохранён]
  D -- да --> F[Supply уменьшается]
  F --> G[Backing liability переносится в redemption claims]
  G --> H[Зачисление компонентов во внутренние кошельки]
  H --> I{Все компоненты учтены и сверены?}
  I -- да --> J[completed]
  I -- нет --> K[partial / manual_review; задолженность сохранена]
```

Непогашенные claims не превращаются в свободный резерв. Внешний вывод компонентов — отдельная операция. Диаграмма не обещает атомарного завершения нескольких блокчейнов.

## 4. Ребалансировка

Draft → расчёт состава/затрат → независимое одобрение → планирование → остановка новых Compile/Unmake → завершение/урегулирование старых операций → реальное перемещение обеспечения → сверка → активация K и делителя → публикация истории → возобновление. При неопределённом обеспечении новая версия не активируется.

## 5. Фронтенд

Публичная часть: Astro + TypeScript, SSG, React-островки для графиков и интерактива. Кабинет: приватные страницы того же Astro-проекта под /app, on-demand session gate и интерактивные React-компоненты. Отдельного SPA/Vite-проекта нет. Backend: NestJS, отдельный API/worker-контур. Текущие данные приходят из API без пересборки статики. Общие UI/tokens/api-client пакеты; Next.js не используется; приватные маршруты обслуживает on-demand адаптер Astro, а финансовую логику — NestJS API.
