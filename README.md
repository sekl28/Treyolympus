# treolympus — комплект сайта для GitHub и Vercel

Исходник: `Stake-Canada-Landing(1).zip`. Главная страница `index.html` сохранена побайтно: дизайн, тексты, языки и партнёрская ссылка не переписывались.

## Состояние этой поставки

**Проект подготовлен для репозитория `sekl28/Treyolympus` и существующего проекта Vercel `treolympus`.**

Целевой проект Vercel — `treolympus`, не `treyolympus`. Идентификаторы из ранее проверенного кабинета записаны в `deployment-target.json`; это настройки назначения, а не подтверждение текущего доступа. GitHub-репозиторий: `sekl28/Treyolympus`.

## Содержимое

- `index.html` — исходный самодостаточный сайт EN/FR.
- `404.html`, `robots.txt` — публичные вспомогательные файлы.
- `vercel.json` — явная конфигурация сборки и HTTP-заголовки.
- `package.json`, `package-lock.json`, `.nvmrc` — воспроизводимая сборка на Node.js 22, без зависимостей приложения.
- `scripts/check.mjs`, `build.mjs`, `serve.mjs` — проверки, сборка и локальный HTTP-просмотр.
- `.github/workflows/check.yml` — конфигурация проверки в GitHub Actions.
- `.gitignore`, `.vercelignore`, `.gitattributes` — исключения и нормализация файлов.
- `DEPLOY.sh`, `DEPLOY-RU.md` — сценарий публикации с проверкой аккаунта и точного проекта.
- `docs/QA-RU.md`, `docs/test-results.json` — фактические результаты проверки.
- `docs/original/` — исходная документация из архива.

## Локальная сборка

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm start
```

Адрес локального сервера: `http://127.0.0.1:3000`. В `dist/` копируются только `index.html`, `robots.txt`, `404.html`.

## Vercel

Используется корень репозитория (`./`). Остальные параметры зафиксированы в `vercel.json`: Framework = Other; Build Command = `npm run build`; Output Directory = `dist`.
