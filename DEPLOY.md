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
и проверяет HTTPS. В Actions `VPS_DEFER_PUBLIC_CHECK=1` отделяет
подтверждённое переключение от внешней GET-проверки: следующий обязательный
job на отдельном runner запускает `deploy/verify-public.py` и проверяет точный commit и release, главную,
`/app/`, кошельки, настройки, noindex, robots.txt и ответ 404.

Проверка повторяет только GET-запросы: до пяти попыток в пределах трёх
минут, с тайм-аутом каждого соединения. Проверка TLS остаётся включённой.
Успех возможен только после прохождения всех проверок. Результат сохранён
в artifact `public-verification` и сводке workflow.

Откат выполняется, если GET подтвердил идентификатор этого выпуска,
а затем обнаружил неверный HTTP-статус или содержимое. Сетевой/TLS-сбой
оставляет workflow красным со статусом `inconclusive` и не вызывает
автоматический откат работающего сайта. Несовпадение идентификатора также
не откатывает чужой/уже восстановленный выпуск. Повторять `publish` или
`rollback` вслепую после обрыва SSH нельзя: команда могла уже выполниться.

DocumentRoot `/srv/sites/tbci.pavelml.ru/www` ссылается на `current/www`.
Заливать файлы прямо в этот каталог через rsync/scp не нужно.
Откат с тем же секретом:

```bash
bash deploy/vps-publish.sh rollback tbci.pavelml.ru
```

Проверки самой логики HTTPS-проверки (локальные HTTP-ответы и имитация
тайм-аута) запускаются в CI и отдельно:

```bash
python3 -m unittest discover -s deploy/tests -v
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
