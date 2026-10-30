# Публикация TBCi

Адрес: `https://tbci.pavelml.ru/`. Сервер Masterhost:
`vps-deploy@87.242.65.97`, SSH-порт `22`.
Repository secret `VPS_DEPLOY_SSH_KEY` — прежний общий ключ публикации.
Адрес и пользователь уже заданы в `deploy/vps-publish.sh`;
дополнительные GitHub Variables с ними не нужны.

На VPS подготовлены отдельный Apache vhost, HTTPS Let's Encrypt
с автопродлением, каталог выпусков и резервирование с двумя последними
копиями. Сборка Astro находится в `apps/web/dist`.

## Подключение сборки

Workflow `.github/workflows/deploy.yml` на `push` в `main` вызывает
общий CI: установку зависимостей, проверку TypeScript/Astro, сборку и
браузерные тесты. Затем публикует проверенную сборку и проверяет
публичный идентификатор выпуска, лендинг и кабинет.
В pull request публикация не выполняется. Шаг публикации:

```yaml
- name: Publish
  env:
    VPS_DEPLOY_SSH_KEY: ${{ secrets.VPS_DEPLOY_SSH_KEY }}
  run: bash deploy/vps-publish.sh publish tbci.pavelml.ru apps/web/dist static
```

`apps/web/public/.htaccess` и `robots.txt` входят в сборку Astro.
Скрипт использует
`GITHUB_SHA`, `GITHUB_RUN_ID` и `GITHUB_RUN_ATTEMPT` из GitHub Actions,
проверяет SHA-256 и содержимое архива, переключает выпуск атомарно
и проверяет HTTPS. При ошибке восстанавливает предыдущий выпуск.

DocumentRoot `/srv/sites/tbci.pavelml.ru/www` ссылается на `current/www`.
Заливать файлы прямо в этот каталог через rsync/scp не нужно.
Откат с тем же секретом:

```bash
bash deploy/vps-publish.sh rollback tbci.pavelml.ru
```

## Правило поддоменов портфолио

`tbci.pavelml.ru` закрыт от индексации. Сохранить в HTML приложения:

```html
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
```

Заголовок `X-Robots-Tag` дополнительно задан в Apache. `/robots.txt`
выдаётся постоянным серверным Alias независимо от нового выпуска.
Метрику и другие счётчики на поддомене не устанавливать.

Astro использует `build.format=directory`: каждый маршрут имеет свой
каталог с `index.html`. Прямое открытие страниц кабинета работает
без общего SPA fallback; неизвестный путь возвращает HTTP 404.

Текущий способ публикации предназначен для статики. Серверный процесс
Node.js, API и база данных потребуют отдельной настройки, если приложение
будет их использовать. Алиас `www.tbci.pavelml.ru` не создавался.

Административная конфигурация хранится в
`pavelml-digital-portfolio/digital-portfolio`: `docs/tbci-vps.md` и
`deploy/vps/add-tbci.sh`. Workflow `vps-migration.yml`, операции
`tbci-setup` и `tbci-verify`, проверяет сертификат и общий ключ.
