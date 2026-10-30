# Актуальная поставка TBCi

**Frontend v0.4.0 и ТЗ v2.2** — воспроизведение 21 макета из последнего TBCI.rar. Основной визуальный источник: 12 JPG публичного сайта и 9 JPG личного кабинета. Реестр, SHA-256 и маршруты: [SCREENS.csv](specification/SCREENS.csv).

Расширение по новому поручению: интерактивные графики, 32 статьи, календарь 48 ICO 2018, 21 SVG и адаптивные суммы/формы. [Анализ изменений](frontend/CONTENT_AUDIT.md).

Техническое задание: [PDF](specification/TBCi-Technical-Specification.pdf), [Word](specification/TBCi-Technical-Specification.docx), [HTML](specification/TECHNICAL_SPEC.html). 213 требований, 79 критериев приёмки. [Сравнение макетов и реализации](specification/REVIEW.html).

Единый Astro/React-проект в apps/web. Login/Register сразу открывают /app/. Операции демонстрационные, сохраняются локально; авторизация, API и реальные переводы не подключены. Развёртывание на https://tbci.pavelml.ru/ через Apache/vps-release, noindex сохранён. Идентификатор активного выпуска — deployment.json и GitHub Actions Publish TBCi.

Брендбук v2.1 и сводное описание/атлас ранее собранных материалов сохранены как исторические документы. Они не заменяют исходные макеты текущего интерфейса. Старое ТЗ и предложенный landing v1 заменены. Полная актуальная сборка — TBCi-current.zip.

Последующее расширение 0.4.0: [KYC, кошелёк, 2FA, whitelist и FAQ](frontend/WALLET_KYC.md), [галерея](frontend/FLOWS.html). По умолчанию Level 2; переход на Level 3 через полный демонстрационный KYC. 31 сценарий и 9 тестов деплоя; 224 проверки вёрстки 320–2560 px.
