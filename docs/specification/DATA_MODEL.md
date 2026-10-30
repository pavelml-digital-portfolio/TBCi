# TBCi — модель данных v2.0

Модель соответствует 21 экрану TBCI.rar и ТЗ v2.0. Текущий фронтенд использует локальную демонстрационную структуру; таблицы БД ниже — проект серверного этапа.

## Локальное состояние текущей реализации

| Поле | Смысл и ограничения |
|---|---|
| name, email | Локальный демонстрационный профиль; не учётная запись для аутентификации |
| selectedIndex | Выбранный ID индекса, общий для Overview/Buy/Sell/Compile/Unmake/History/Holders |
| balances | Количество каждого актива; конечное неотрицательное число; TBCi — псевдоним баланса выбранного индекса |
| tokenBalances | Независимое количество токенов по indexId |
| operations | До 500 локальных событий buy/sell/compile/unmake/claim/deposit/withdraw |
| addedWallets | Уникальные символы дополнительных видимых кошельков |
| redemption | null либо indexId, amount и remaining по каждому компоненту; неисполненные требования Unmake |

Ключ: tbci-reference-demo-v2. Отдельно tbci-watchlist для избранных монет. Реальные приватные ключи, пароли и session token не сохраняются. Начальные данные определены в apps/web/src/data/demo.ts. Браузер может изменить localStorage — это не доверенный финансовый учёт.

## Проект серверных сущностей

| Сущность | Основные поля | Экран/назначение |
|---|---|---|
| Asset | id, symbol, name, slug, precision, networkId, icon, metadata | Каталоги, справочник, кошельки; символ не глобальный идентификатор |
| Index | id, slug, name, methodology, baseDate, baseValue, divisor | PUB-01/PUB-03/CAB-02/CAB-03 |
| IndexPoint | indexId, timestamp, value, sourceVersion, publishedAt | Графики; индекс в пунктах отдельно от цены токена |
| BasketSnapshot | id, indexId, effectiveAt, status, divisor | Версионированный состав |
| BasketComponent | snapshotId, assetId, unitsPerToken, referencePrice, weight | UNIQUE(snapshotId, assetId); сумма референсных весов 100% |
| MarketQuote/OHLC | assetId, currencyId, timestamp, price, open/high/low/close, volume, source | PUB-06…PUB-10, без смешения времени события и публикации |
| Exchange/Pair | id, slug, metadata; exchangeId, baseId, quoteId, volume, price, status | PUB-04/PUB-05/PUB-10 |
| NewsArticle | id, slug, title, source, licensedBody, category, image, publishedAt | PUB-11/PUB-13/PUB-14; источник и права контента обязательны |
| User | id, displayName, email, sessionVersion | Только серверный этап, текущего входа нет |
| Wallet | id, userId, assetId, available, reserved | CAB-01; UNIQUE(userId, assetId), остатки ≥ 0 |
| TokenHolding | userId, indexId, available, reserved | Остатки токенов каждого индекса |
| FinancialQuote | id, userId, indexId, kind, amount, paymentAssetId, basketSnapshotId, prices, feePolicyVersion, expiresAt | Котировка до подтверждения без списания |
| Order | id, userId, quoteId, kind, state, idempotencyKey, createdAt | Buy/Sell/Compile/Unmake; UNIQUE(userId, idempotencyKey) |
| RedemptionClaim | orderId, assetId, amount, fulfilled, transferId | CAB-07; защита от повторного вывода компонента |
| LedgerEntry | transactionId, accountId, assetId, signedAmount, reason | Двойная запись; сумма проводок по активу равна нулю |
| Transfer | id, walletId, providerId, externalId, network, address, amount, status | Внешние пополнения/выводы только в следующем этапе |
| HolderSnapshot | indexId, network, contract, blockHeight, address, quantity | CAB-09; контракт TBCi должен быть подтверждён |
| Watchlist | userId, targetType, targetId | Избранное монет/бирж; UNIQUE(userId, targetType, targetId) |
| Outbox/AuditEvent | id, aggregateId, type, payloadHash, createdAt, deliveredAt | Надёжная внешняя отправка и расследование |

## Инварианты и транзакции

Все денежные величины — decimal в БД и строки в JSON; не floating point. Точность актива хранится в Asset. Цены и комиссии исполнения фиксируются в Order. Поле weight не заменяет unitsPerToken при переоценке рынка. Исторический BasketSnapshot неизменяем после публикации; исправление создаёт новую версию.

Buy/Sell атомарно проверяют владение и доступный остаток, резервируют/списывают и зачисляют. Compile проверяет каждую строку полного состава и создаёт токены только после обеспеченности всех компонентов. Unmake один раз списывает токены и создаёт полный набор Claims; каждое Claim может быть исполнено только один раз. Транзакция БД защищает от гонки двух вкладок. Демо проверяет эти правила в одном браузере и не заменяет серверные блокировки.

Времена — UTC ISO 8601. Денежная история не удаляется при закрытии кошелька; личные данные и учётные записи имеют отдельные правила хранения после выбора юрисдикции. Резервная копия проверяется восстановлением, а не только наличием файла.
