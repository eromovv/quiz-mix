# Quiz Mix — инструкции для AI-агентов

Интерактивный квиз с категориями «Музыка», «Кино» и «Факты». Поддерживает локальный режим, совместные комнаты с кастомными карточками, RU/EN и деплой на Vercel или GitHub Pages.

## Стек

- **Frontend:** React 19, React Router 7, Vite 8
- **Backend (serverless):** Vercel Functions в `api/`
- **Хранилище:** Vercel Blob (комнаты, медиа); локально — `.vercel/room-cache/`
- **Язык:** JavaScript (ES modules), без TypeScript

## Команды

```bash
npm install
npm run dev      # http://localhost:4173, API через Vite middleware
npm run build    # dist/; base /quiz-mix/ для GitHub Pages, / для Vercel
npm run preview
```

## Структура проекта

```
api/                  # Serverless-обработчики и общая логика (*-core.js)
src/
  App.jsx             # Маршруты, UI квиза, настройки, комнаты
  main.jsx            # Точка входа, BrowserRouter с basename
  components/         # Модалки (AddCardModal, AddCategoryModal)
  config/             # Константы сборки (progressSession)
  data/
    quizData.js       # Встроенные карточки, CATEGORIES, getItems()
    customItems.js    # Пользовательские/комнатные карточки, overrides
    itemFactories.js  # Генерация placeholder-медиа (тональные треки)
  lib/
    i18n.js           # Переводы UI (ru/en)
    progress.js       # Прогресс в localStorage, сессии
    rooms.js          # Клиент API комнат
    appMode.js        # dev | preview
    theme.js          # Светлая/тёмная тема
```

## Ключевые концепции

### Категории

Три встроенных ключа: `music`, `movies`, `facts`. Метаданные — в `CATEGORIES` (`src/data/quizData.js`). Маршруты: `/music`, `/movies`, `/facts`, `/room/:roomId`.

### Карточки и источники данных

- **Встроенные** — массивы `musicItems`, `moviesItems`, `factsItems` в `quizData.js`; медиа через `VITE_MUSIC_AUDIO_*` / `VITE_MOVIE_VIDEO_*`.
- **Пользовательские (локально)** — `localStorage` (`quiz_custom_cards`), см. `customItems.js`.
- **Комната** — `activeCustomCardsStore` в `customItems.js`; данные с сервера через `/api/rooms`. Комната хранит `categories`, массивы карточек по категориям и `overrides` для правки встроенных.

При изменении числа карточек вызывай `alignProgressToItems()` из `progress.js`.

### Режимы приложения

- `preview` — обычный квиз.
- `dev` — редактор карточек (`APP_MODE` в `src/lib/appMode.js`).

### i18n

Новые строки UI добавляй в `TRANSLATIONS` (`src/lib/i18n.js`) для `ru` и `en`. Категории — в `CATEGORY_TRANSLATIONS`.

### API (dev и production)

| Endpoint | Назначение |
|----------|------------|
| `POST /api/blob-upload` | Загрузка аудио/видео в Blob |
| `GET /api/blob-media` | Прокси медиа из Blob (Range) |
| `GET /api/rooms?id&token` | Чтение комнаты (требует токен) |
| `POST /api/rooms` | Создание комнаты |
| `PUT /api/rooms` | Обновление карточек (owner token) |
| `PATCH /api/rooms` | Обновление ссылки доступа (owner token) |

### Аутентификация комнат

- **Ссылка приглашения** — `/room/:id` без токена; гости проходят квиз без регистрации. Ограничение по сроку жизни комнаты — в будущей доработке.
- **ownerToken** — для организатора (legacy и редактирование); также доступ через аккаунт.
- **accessToken** — legacy в `?t=...`; для новых ссылок не требуется.
- Сроки: `ROOM_OWNER_TOKEN_TTL_HOURS` (720) для прав редактирования. Логика TTL — `api/room-auth.js`.
- Комнаты v1 мигрируют в v2 при первом чтении (генерируется accessToken).
- Клиент: `src/lib/rooms.js` (`captureAccessTokenFromUrl`, `resolveRoomToken`, `rememberRoomCredentials`).

Логика в `*-core.js`; Vite подключает её в dev через middleware (`vite.config.js`). На Vercel — тонкие обёртки `api/*.js`.

Без `BLOB_READ_WRITE_TOKEN` комнаты пишутся в `.vercel/room-cache/` (только локально).

## Переменные окружения

См. `.env.example`. Важно:

- `BLOB_READ_WRITE_TOKEN` — **без** префикса `VITE_` (только сервер).
- `VITE_*` — попадают в клиентскую сборку.
- `VITE_QUIZ_SESSION_MS` / `VITE_QUIZ_SESSION_HOURS` — TTL прогресса.
- `ROOM_ACCESS_TOKEN_TTL_HOURS` / `ROOM_OWNER_TOKEN_TTL_HOURS` — TTL токенов комнаты (сервер).

## Деплой

- **Vercel:** `base: "/"`, rewrites в `vercel.json` для SPA.
- **GitHub Pages:** `base: "/quiz-mix/"`, копия `index.html` → `404.html` для client-side routing (workflow в `.github/workflows/github-pages.yml`).

При правках путей учитывай `import.meta.env.BASE_URL` и `basename` в `main.jsx`.

## Правила для агентов

1. **Минимальный diff** — не рефакторить `App.jsx` без запроса; файл большой, изменения точечные.
2. **Согласованность данных** — правки карточек затрагивают `quizData.js`, `customItems.js` и при необходимости `rooms-core.js` (нормализация store).
3. **Секреты** — не коммитить `.env`, не добавлять `VITE_` к серверным токенам.
4. **Стили** — глобальный `src/styles.css`; новые классы в том же файле, в духе существующих.
5. **Коммиты** — только по явной просьбе пользователя.
6. **Документация** — не создавать README/MD сверх запроса; этот файл — единственный ориентир для агентов.

## Типичные задачи

| Задача | Где править |
|--------|-------------|
| Новая строка интерфейса | `src/lib/i18n.js` |
| Встроенная карточка | `src/data/quizData.js` + `.env` |
| Логика комнаты | `api/rooms-core.js`, `src/lib/rooms.js`, `src/data/customItems.js` |
| Прогресс / сессия | `src/lib/progress.js`, `src/config/progressSession.js` |
| Загрузка медиа | `api/blob-upload-core.js`, модалки в `src/components/` |
