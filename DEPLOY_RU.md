# FreelanceKit 3.1.0 — публикация и запуск

## Важно
GitHub остаётся репозиторием исходников, но рабочий публичный сайт лучше публиковать через Cloudflare Pages, а не GitHub Pages. GitHub прямо указывает, что Pages не предназначен для запуска онлайн-бизнеса.

## Один раз до ухода
1. Загрузите содержимое этой папки **в корень** публичного репозитория `freelancekit`.
2. Создайте бесплатный аккаунт Cloudflare: https://dash.cloudflare.com/sign-up
3. **Workers & Pages → Create application → Pages → Import an existing Git repository**. Подключите GitHub и выберите `freelancekit`. Cloudflare поддерживает автоматический deploy из GitHub.
4. Название проекта: `freelancekit-tools` (если свободно).
5. Production branch: `main`; Build command: `exit 0`; Build output directory: `.`.
6. После deploy сайт будет на `https://freelancekit-b1n.pages.dev`.
7. Один раз добавьте сайт в Google Search Console и отправьте `https://freelancekit-b1n.pages.dev/sitemap.xml`.

## После этого
Mac можно выключить. Cloudflare продолжит раздавать сайт, а GitHub Actions будут запускать месячный автопилот и еженедельную проверку.

Если выбранное имя Pages занято, сообщите новый `pages.dev` URL — canonical, robots и sitemap можно заменить одной правкой.
