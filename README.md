# gd teams

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

### 1. База данных (MongoDB)
Для работы бэкенда необходим запущенный сервер MongoDB на `localhost:27017`.
- **Вариант А (Docker):** Выполните `docker-compose up -d` в корне проекта.
- **Вариант Б (Локально):** Установите и запустите [MongoDB Community Server](https://www.mongodb.com/try/download/community).

### 2. Установка зависимостей
```sh
# Фронтенд
npm install

# Бэкенд (Python)
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install django djangorestframework django-cors-headers mongoengine python-dateutil
```

### 3. Перенос данных (из db.json)
Если вы хотите перенести существующие проекты в новую базу данных:
```sh
cd backend
.\venv\Scripts\python.exe migrate_data.py
```

### 4. Запуск приложения
```sh
npm run dev:all
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
