# TBCi

Лендинг и личный кабинет в едином проекте **Astro + React + TypeScript**. Публичные страницы собираются в HTML, React добавляет интерактивные элементы и экраны кабинета.

Текущая версия — демонстрационный фронтенд. Кнопка «Войти» сразу открывает `/app/`. Балансы, операции и настройки сохраняются только в localStorage браузера; реальные переводы, платежи, авторизация и серверное API не подключены. Форма подписки не отправляет email.

```sh
npm ci
npm run dev
```

Node.js: версия из `.node-version`. Приложение находится в `apps/web`, сборка — в `apps/web/dist`.

```sh
npm run check
npm run build
cd apps/web
npx playwright install chromium
cd ../..
npm run test:e2e
```

Для браузерных тестов также нужен Python 3: он запускает локальный сервер готовой сборки. Можно использовать установленный Chromium, задав `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

- [Реализованные экраны и проверка фронтенда](docs/frontend/README.md)
- [Публикация и состояние доступа к VPS](docs/frontend/DEPLOYMENT.md): `tbci.pavelml.ru`, Masterhost, GitHub Secret `VPS_DEPLOY_SSH_KEY`.

Документация и материалы:

- [Техническое задание на разработку](docs/specification/README.md)
- [Комплект документации](docs/README.md)
- [Брендбук PDF](docs/brand/TBCI-Brandbook.pdf)
- [Описание сервиса и макеты PDF](docs/TBCI-Service-and-Mockups.pdf)
- [Каталог макетов HTML](docs/MOCKUPS.html)

ТЗ описывает целевой сервис. Статическая демоверсия кабинета — текущий этап разработки; серверные ограничения доступа и операции с реальными средствами относятся к следующим этапам.
