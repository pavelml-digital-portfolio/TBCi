# Актуальная поставка TBCi

**Frontend v0.2.0 и ТЗ v2.0** — воспроизведение 21 макета из последнего TBCI.rar. Основной визуальный источник: 12 JPG публичного сайта и 9 JPG личного кабинета. Реестр, SHA-256 и маршруты: [SCREENS.csv](specification/SCREENS.csv).

Техническое задание: [PDF](specification/TBCi-Technical-Specification.pdf), [Word](specification/TBCi-Technical-Specification.docx), [HTML](specification/TECHNICAL_SPEC.html). 184 экранных требования, 50 критериев приёмки. [Сравнение макетов и реализации](specification/REVIEW.html).

Единый Astro/React-проект в apps/web. Login/Register сразу открывают /app/. Операции демонстрационные, сохраняются локально; авторизация, API и реальные переводы не подключены. Развёртывание на https://tbci.pavelml.ru/ через Apache/vps-release, noindex сохранён. Идентификатор активного выпуска — deployment.json и GitHub Actions Publish TBCi.

Брендбук v2.1 и сводное описание/атлас ранее собранных материалов сохранены как исторические документы. Они не заменяют исходные макеты текущего интерфейса. Старое ТЗ и предложенный landing v1 заменены. Полная актуальная сборка — TBCi-current.zip.
