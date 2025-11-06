# Wiki Platform - внутренняя вики и мониторинг для команды арбитража

**Wiki Platform** - это внутренняя knowledge base и панель мониторинга эффективности для арбитражных команд. Клиент построен на **React + Vite**, сервер - на **Express + MySQL**. Проект поддерживает управление статьями, комментариями и полезными сервисами, а также содержит мониторинг кликов и апрувов. Дополнительно реализован помощник для привязки доменов через Cloudflare и Keitaro.

**English docs:** см. `README.md`  
**Разработка:** [BoostClicks - Евгений Леонтьев](https://t.me/boostclicks)  
**Сайт:** [https://boostclicks.ru/](https://boostclicks.ru/)

---

## Ключевые возможности

- **База знаний**
  - Редактор с поддержкой форматирования (rich text), таблиц, изображений.
  - Категории, теги, комментарии и избранные сервисы.
  - История публикаций и управление статусами.
- **Пользователи и роли**
  - Роли: owner, team lead, tech, buyer, junior.
  - Хранение паролей в MySQL в виде bcrypt-хэшей.
- **Мониторинг кликов и апрувов**
  - Ежедневные и ежемесячные задачи очистки данных на node-schedule.
  - Просмотр статистики с пагинацией, фильтрацией и экспортом.
  - Кэширование и счетчики на Redis.
- **Привязка доменов**
  - Создание A-записей в Cloudflare через API.
  - Добавление доменов в Keitaro по API с указанием IP трекера.
- **UI и Dev Experience**
  - Tailwind CSS, React Query, React Router DOM.
  - Логи на Winston, health-check `/healthz`.

---

## Структура репозитория

```
wiki-platform/
├── client/              # Клиентская часть (React + Vite)
│   ├── src/             # Компоненты, страницы, хуки, данные
│   ├── scripts/         # Утилиты и генераторы данных
│   ├── public/          # Статические файлы
│   └── .env.example     # Шаблон переменных среды для фронтенда
├── server/              # Серверная часть (Express)
│   ├── routes/          # REST API (статьи, апрувы, клики и т.д.)
│   ├── uploads/         # Папка для загружаемых файлов (игнорируется гитом)
│   └── .env.example     # Шаблон переменных среды для бэкенда
└── README.ru.md         # Русская документация
```

---

## Требования

- **Node.js** 20 LTS и npm 10+ (или pnpm / yarn).
- **MySQL** 8.x (локально или managed-хостинг).
- **Redis** 6+ для кэша и счетчиков.
- **Cloudflare** (необязательно) - если нужен автосозданный DNS.
- **Keitaro** (или другой трекер с API) - для помощника по доменам.

> ❗️ SQL-миграции не входят в репозиторий. Структуру таблиц можно восстановить по SQL-запросам из `server/routes/*`.

---

## Быстрый старт

1. **Клонирование**
   ```bash
   git clone https://github.com/<ваш-логин>/wiki-platform.git
   cd wiki-platform
   ```

2. **Установка зависимостей**
   ```bash
   # Сервер
   cd server
   npm install

   # Клиент
   cd ../client
   npm install
   ```

3. **Переменные окружения**
   - Скопируйте `server/.env.example` → `server/.env` и заполните данными БД, Redis, CORS.
   - Скопируйте `client/.env.example` → `client/.env` и пропишите адрес API и Keitaro.

4. **Создание схемы БД**
   - Разверните MySQL.
   - Создайте таблицы согласно запросам в `server/routes`.
   - При необходимости импортируйте стартовые данные.

5. **Redis (опционально)**
   ```bash
   docker run --name wiki-redis -p 6379:6379 -d redis:7
   ```

6. **Запуск dev-среды**
   ```bash
   # Терминал 1
   cd server
   npm run dev

   # Терминал 2
   cd client
   npm run dev
   ```

   - API слушает `http://localhost:10000`.
   - Vite dev-сервер по умолчанию `http://localhost:5173`.
   - Убедитесь, что `VITE_API_URL` указывает на `http://localhost:10000/api`.

---

## Переменные окружения

### server/.env

| Переменная                                                 | Описание                                      |
| ---------------------------------------------------------- | --------------------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`  | Настройки подключения к MySQL.                |
| `DB_CONNECTION_LIMIT`, `DB_CHARSET`                        | Опциональная настройка пула соединений.      |
| `CLIENT_URL`                                               | Origin фронтенда (для CORS).                  |
| `PORT`                                                     | Порт, на котором слушает Express (по умолч. 10000). |
| `REDIS_URL`                                                | Подключение к Redis (например, `redis://127.0.0.1:6379`). |

### client/.env

| Переменная               | Описание                                                         |
| ------------------------ | ---------------------------------------------------------------- |
| `VITE_API_URL`           | Базовый URL API (`https://ваш-домен/api`).                       |
| `VITE_KEITARO_API_URL`   | API трекера (Keitaro или аналог) для помощника по доменам.       |

---

## Продакшн-деплой

1. **Подготовка окружения**
   - Настройте `.env` с боевыми доступами.
   - Используйте управляемые MySQL и Redis либо свои сервера.

2. **Билд фронтенда**
   ```bash
   cd client
   npm run build
   ```
   Разверните `client/dist` на выбранном хостинге (Cloudflare Pages, Netlify, S3+CloudFront и т.д.).

3. **Бэкенд**
   - Скопируйте `server/` на прод-сервер (без `node_modules`).
   - Установите зависимости и запустите `npm run start` под процесс-менеджером (PM2, systemd, Docker).
   - Настройте reverse proxy (Nginx/Traefik) и HTTPS.

4. **Фоновые задачи**
   - Задачи очистки (клики/апрувы) работают внутри Node-процесса через node-schedule. Доп. cron не требуется.

5. **Привязка доменов**
   - Укажите `VITE_KEITARO_API_URL`, токен Cloudflare и API-ключ Keitaro.
   - Передавайте IP трекера и домены через форму DomainBinding.

---

## Полезные команды

```bash
# Создать bcrypt-хэш для нового пользователя
cd server
node hash.js "Пароль"

# Запустить сервер без nodemon
npm start

# Запустить линтер фронтенда
cd client
npm run lint
```

---

## Публикация на GitHub

1. Проверьте состояние:
   ```bash
   git status
   ```
2. Зафиксируйте изменения:
   ```bash
   git add .
   git commit -m "Initial open-source release"
   ```
3. Создайте публичный репозиторий (пример с GitHub CLI):
   ```bash
   gh repo create your-username/wiki-platform --public --source=. --remote=origin --push
   ```
   Или вручную добавьте remote:
   ```bash
   git remote add origin git@github.com:your-username/wiki-platform.git
   git push -u origin master
   ```

---

## Лицензия и вклад

Проект пока без лицензии. Перед открытием кода для внешних контрибьюторов добавьте файл `LICENSE` (например MIT). Pull-request’ы и issue приветствуются.

---

## Поддержка

Создавайте issue в GitHub с подробным описанием окружения, шагов воспроизведения и логами. Для приватных вопросов или уязвимостей пишите напрямую автору через [BoostClicks - Evgenii Leontev](https://t.me/boostclicks).
