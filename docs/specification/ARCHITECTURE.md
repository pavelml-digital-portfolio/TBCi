# TBCi — архитектура v2.3

## Текущая поставка

Один Astro-проект apps/web → сборка HTML/JS/CSS/локальных изображений в apps/web/dist → Apache на tbci.pavelml.ru. Публичный HTML генерируется заранее; React гидратирует контролы. Кабинет монтируется React-компонентом на статических Astro-маршрутах. Все страницы доступны без аутентификации по прямому решению заказчика.

Браузер → Public.tsx (публичные шаблоны) либо Account.tsx → DemoContext.tsx → localStorage. Финансовые операции никогда не покидают браузер. Никаких /api/v1 запросов сейчас нет. Публичные графики — TradingView Lightweight Charts с локальными OHLCV 2018. Шрифты и изображения локальные. Subscribe валидирует email и сообщает, что данные не отправлены.

Маршруты и визуальное происхождение: SCREENS.csv, screens.json, REVIEW.html. 21 исходный экран не равен количеству HTML-файлов: один шаблон генерируется для нескольких монет, индексов и бирж. Дополнительные страницы Setting/FAQ не имеют отдельных исходных JPG.

## Проект следующего этапа

Браузер с прежними Astro/React шаблонами → session/API layer → модульное ядро. Предложение: NestJS, PostgreSQL (учёт/снимки/котировки/заказы), Redis (кэш/ограничение частоты), очередь и outbox workers (рыночные провайдеры, новости, custody). Это выбор реализации для оценки, не новый визуальный макет и не уже подключённый backend.

Модули: MarketData; Index/Basket; Content; Session/Profile; Wallet/Ledger; Quote/Execution; Redemption; Transfers; HolderSnapshots. Публичные чтения отделяются от команд по кошелькам. Клиент не вычисляет окончательный баланс и не определяет право вывода. Кэш не является источником учётной истины.

## Потоки исполнения

Buy/Sell: request quote → проверка курса/лимита/валюты → отображение подтверждения → execute с idempotency key → транзакционная проверка владельца/quote expiry/остатка → учёт → ответ. Неизвестный результат после timeout восстанавливается по orderId/idempotency key.

Compile: quote с полной версией BasketSnapshot → расчёт всех компонентов → пополнение недостающих → execute проверяет обеспеченность всего набора → атомарные проводки → выпуск. Запрещено выдавать полный токен после частичной сборки.

Unmake: quote → атомарное погашение токенов и создание Claims → вывод одной или всех оставшихся Claims → исполнение/подтверждение внешнего перевода. Сетевой повтор не создаёт новую эмиссию и не списывает токены повторно.

Рыночные данные: адаптер → валидация времени/аномалий/полноты → версия набора → расчёт индекса → публикация → кэш чтения. Ошибка источника не подменяется нулевой ценой. UI будущего API показывает loading/empty/stale/error в существующей области, сохраняя структуру JPG.

## Публикация

Git push main → Frontend checks (Python deploy tests, npm ci/check/build, Playwright) → Publish TBCi (штатный vps-release) → независимая проверка HTTPS и deployment.json. Публичный отчёт не загружается дополнительным artifact job после проверки: ранее этот шаг зависал после успешного GET. Секретный SSH-ключ доступен только workflow. Подробная команда и ограничения находятся в корневом DEPLOY.md.

Контроль выпуска отделён от сетевой диагностики. Timeout не доказывает HTTP-ошибку сервиса; откат допускается только для подтверждённой неисправности собственного выпуска с проверкой текущего идентификатора. Штатные noindex, HTTPS и резервирование сохраняются.


## Расширение v2.2

DemoState дополнен transfers, trustedAddresses, audit, security, preferences, sessions и kyc (уровень, purchaseTotalUsd, текущая заявка и история). transfer-engine.ts отвечает за идемпотентность, комиссии, подтверждения и возвраты; kyc.ts — за лимиты и состояния проверки. chart-bounds.ts ограничивает временной диапазон Lightweight Charts. WalletTransfer, AccountSettings, Verification и InteractiveDonut реализуют интерфейсы; подробности в [WALLET_KYC.md](../frontend/WALLET_KYC.md). Секреты аутентификатора остаются локальными, recovery codes хешируются, файлы KYC не сохраняются. Серверные схемы и OpenAPI ниже не являются реализованным API.


## Переработка v2.3

MyWallet и InternalWallet отделяют инвестиционный портфель от хранения/переводов. portfolio.ts агрегирует все tokenBalances, резервы, Claims и вложенные экспозиции; index-trading.ts проводит сделки по явному indexId и идемпотентные конвертации. IndexTrade — единый диалог Buy/Sell. PortfolioCharts — состав, месячные столбцы и treemap; TradingChart принимает агрегированный ряд. Operation дополнен indexId, requestId, paymentSymbol, receivedSymbol/receivedAmount. hideZeroBalances/hideBalances и валюта сохраняются в Preferences. balances.TBCi служит только совместимости, в общие суммы не входит. См. [PORTFOLIO_WALLET.md](../frontend/PORTFOLIO_WALLET.md).
