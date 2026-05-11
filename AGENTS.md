# GD Teams Project Notes

GD Teams - Vue-приложение для базы знаний, проектных файлов и управления командной работой. Сейчас приложение работает поверх mock DB (`db.json`) через `json-server`; основная логика клиента разделена на API-слой, Pinia stores, page composables и Vue-компоненты.

Документ рассчитан как быстрый onboarding для разработчиков и агентов, которые будут продолжать проект.

## Стек и запуск

- Vue 3 + Vite + TypeScript.
- Pinia для клиентского состояния.
- Vue Router для маршрутов.
- Bootstrap + bootstrap-vue-next для базовых UI-компонентов.
- Carbon icons через `unplugin-icons`, а также `oh-vue-icons` для иконок Lotion.
- `@dashibase/lotion` как блочный редактор документов.
- `vuedraggable` для drag-and-drop kanban-колонок и задач.
- `json-server` как mock API поверх `db.json`.

Основные команды:

```sh
npm run dev:all
npm run dev
npm run api
npm run build
npm run type-check
npm run format
```

`npm run dev:all` запускает frontend и mock API вместе. API по умолчанию ожидается на `http://localhost:3000`, если не задан `VITE_API_BASE_URL`.

## Структура проекта

- `src/main.ts` - точка входа: подключает стили, Pinia, router, Bootstrap/Vue app, регистрирует иконки и кастомные Lotion-блоки.
- `src/App.vue` - корневой компонент, оборачивает приложение в `BApp`, подключает динамический layout и глобальный toast.
- `src/router.ts` - все маршруты страниц.
- `src/api/` - функции запросов к mock API.
- `src/stores/` - Pinia stores с состоянием и бизнес-операциями.
- `src/components/pages/` - основные страницы приложения.
- `src/components/` - UI-компоненты страниц, карточки, сайдбары, формы.
- `src/components/lotion/` - кастомные блоки редактора Lotion.
- `src/composables/` - сценарии UI-страниц и переиспользуемая клиентская логика.
- `src/types/domain.ts` - доменные типы проекта.
- `src/utils/formatDate.ts` - форматирование дат в UI.
- `src/assets/` - базовые стили и переопределения Lotion.
- `db.json` - текущая mock DB.

## Данные mock DB

`db.json` сейчас содержит коллекции:

- `teams` - команды.
- `projects` - проекты и метаданные проекта.
- `tags` - теги проекта.
- `nodes` - дерево файлов проекта: папки, документы, холсты и шаблоны.
- `documentPages` - содержимое документов Lotion.
- `kanbanBoards` - kanban-доски по проектам.
- `$schema` - служебная схема json-server.

Важная модель:

- `Project.rootFolderId` указывает на корневую папку проекта в `nodes`.
- `Node.parentId` строит дерево файлов.
- `Node.type` может быть `folder`, `document`, `canvas`, `template`.
- В API сырой node хранит `tagIds`, а клиентская модель `Node` получает полноценный массив `tags`.
- Документ состоит из `DocumentPage`, где `nodeId` связывает запись с node-документом, а `page` хранит Lotion-страницу.
- Kanban-доска хранится целиком одной записью `KanbanBoard` с колонками и задачами внутри.

## Маршруты

Маршруты объявлены в `src/router.ts`.

- `/` -> редирект на `/projects`.
- `/projects` - список проектов.
- `/projects/new` - создание проекта.
- `/projects/:projectId/edit` - редактирование проекта.
- `/projects/:id` -> редирект на `/project/:projectId`.
- `/project/:projectId` - workspace проекта.
- `/project/:projectId/folder/:folderId` - workspace конкретной папки.
- `/project/:projectId/document/:documentId` - редактор документа.
- `/project/:projectId/kanban` - kanban-доска проекта.
- `/project/:projectId/canvas/:canvasId` - пока ведет на workspace.
- `/project/:projectId/template/:templateId` - пока ведет на workspace.

Для страниц проектов используется layout `projects`, остальные страницы по умолчанию используют `default`.

## API-слой

`src/api/http.ts` содержит общий `apiRequest<T>()`:

- собирает URL относительно `VITE_API_BASE_URL` или `http://localhost:3000`;
- поддерживает `GET`, `POST`, `PATCH`, `DELETE`;
- сериализует JSON body;
- пробрасывает читаемую ошибку из ответа.

Модули API:

- `projects.ts` - загрузка проектов и команд, создание/редактирование проекта, избранное, корзина, удаление, переименование.
- `nodes.ts` - загрузка содержимого папки, построение breadcrumbs/tree, создание/переименование/перемещение/копирование/soft-delete nodes.
- `documents.ts` - создание, загрузка, копирование и сохранение Lotion-страниц, очистка служебных ProseMirror артефактов, клонирование блоков.
- `kanban.ts` - загрузка или создание дефолтной доски, сохранение всей доски.

## Stores

### `useProjectsStore`

Хранит:

- список `projects`;
- список `teams`;
- активный раздел: все проекты, избранное, корзина или команда;
- loading/error.

Основные операции:

- загрузка проектов и команд;
- создание и редактирование проекта;
- inline-переименование проекта;
- добавление/удаление из избранного;
- soft-delete в корзину;
- восстановление из корзины;
- окончательное удаление проекта.

### `useWorkspaceStore`

Отвечает за файловый workspace проекта.

Хранит:

- текущий `projectId`, `currentFolderId`, `currentProject`;
- кэш nodes по id;
- список children для каждой папки;
- breadcrumbs по папкам;
- теги;
- дерево папок для левого сайдбара;
- выделение, anchor для shift-select и clipboard для copy/cut;
- loading/error по папкам.

Основные операции:

- загрузить папку и закэшировать ее содержимое;
- создать node в текущей папке;
- переименовать выбранный node;
- выделение одного, нескольких и диапазона элементов;
- copy/cut/paste;
- перемещение с защитой от переноса папки внутрь самой себя или дочерней папки;
- soft-delete выбранных nodes.

### `useDocumentsStore`

Отвечает за документы Lotion.

Хранит:

- `pagesById` - редактируемые Lotion-страницы по `documentId`;
- `recordsById` - исходные записи `DocumentPage`;
- loading/saving/dirty/error по документам.

Особенности:

- изменения сохраняются debounce-ом через `scheduleSave()` с задержкой 700 мс;
- при уходе со страницы документ сбрасывает pending save через `flushDocument()`;
- при сохранении обновляется title соответствующего node в workspace store;
- есть поддержка `page.card.blockIds` - набора блоков документа для карточки/превью;
- данные блоков санитизируются от лишних ProseMirror trailing break артефактов.

### `useKanbanStore`

Отвечает за kanban-доски.

Хранит:

- `boardsByProjectId`;
- loading/saving/dirty/error по проектам.

Основные операции:

- загрузка доски или создание дефолтной доски проекта;
- debounce-сохранение с задержкой 450 мс;
- синхронизация `task.status` со статусом колонки;
- добавление колонок;
- создание, переименование и удаление задач;
- изменение полей задачи;
- изменение цвета обложки задачи;
- перестановка колонок и задач;
- flush перед уходом со страницы.

### `useCounterStore`

Шаблонный/demo store из стандартного старта Pinia. В текущей архитектуре, похоже, не участвует.

## Основные страницы

### Projects

`src/components/pages/projects.vue` + `useProjectsPage()`.

Функции:

- загрузка списка проектов;
- фильтрация по активному разделу: все, избранное, корзина, команда;
- поиск по query-параметру `search`;
- отображение карточек `ProjectCard`;
- переход к workspace проекта;
- контекстное меню карточки проекта: переименовать, редактировать, избранное, корзина.

Создание и редактирование проекта вынесены в `project-create.vue`, `project-edit.vue` и общий `ProjectForm.vue`.

### Workspace

`src/components/pages/workspace.vue` + `useWorkspacePage()`.

Функции:

- отображение содержимого текущей папки в grid/list режимах;
- поиск по текущей папке через query `search`;
- фильтрация по тегам через query `tag`;
- сортировка через query `sort` и `order`;
- переключение вида через query `view`;
- breadcrumbs и дерево папок;
- создание папки/документа/холста/шаблона через временный draft;
- inline-переименование;
- одиночное, множественное, shift- и drag-выделение;
- copy/cut/paste;
- soft-delete;
- открытие папок и документов.

Canvas и template как типы уже присутствуют в модели и UI создания, но отдельные страницы для них пока не реализованы.

### Document

`src/components/pages/document.vue`.

Функции:

- загрузка Lotion-страницы по `documentId`;
- автосохранение изменений;
- отображение статуса сохранения;
- обложка документа через `DocumentCover`;
- prompt шаблона для пустого документа;
- отдельная "карточка документа", куда можно добавить блоки из основного документа drag-and-drop;
- блокировка редактирования внутри панели карточки, чтобы она работала как curated preview.

### Kanban

`src/components/pages/kanban.vue`.

Функции:

- загрузка или создание kanban-доски проекта;
- поиск по задачам;
- фильтры по исполнителю, роли, типу, тегу, статусу и приоритету;
- drag-and-drop колонок;
- drag-and-drop задач между колонками;
- добавление колонок;
- создание задач;
- карточка задачи с меню: переименовать, скопировать ссылку, цвет обложки, удалить;
- панель деталей выбранной задачи;
- debounce autosave и flush при уходе.

## Lotion

Lotion подключается в `main.ts`, там же регистрируются кастомные блоки:

- `TODO` -> `src/components/lotion/TodoBlock.vue`;
- `TABLE` -> `src/components/lotion/TableBlock.vue`;
- `IMAGE` -> `src/components/lotion/ImageBlock.vue`.

Кастомные блоки должны реализовывать ожидаемые Lotion lifecycle/metods через `defineExpose()`:

- `onSet`;
- `onUnset`;
- `getTextContent`;
- `getHtmlContent`;
- `moveToStart`;
- `moveToEnd`.

Особенности блоков:

- `TodoBlock` хранит `details.checked` и текст в `details.value`.
- `TableBlock` хранит таблицу в `details.table`: строки, ширины колонок, высоты строк.
- `ImageBlock` хранит `details.imageUrl` и `details.imageWidthPercent`; из-за лимитов mock DB ограничивает загрузку локальной картинки и советует внешние URL.

## UI composables

- `useProjectsPage()` - состояние страницы проектов: активный раздел, поиск, фильтрация, заголовок.
- `useWorkspacePage()` - большая orchestration-логика workspace: route query, фильтры, сортировки, selection, drafts, drag-select, переходы.
- `useInlineTitleEdit()` - переиспользуемый inline edit: фокус input, commit по клику снаружи, cleanup event listener.
- `useAppToast()` - глобальный toast с одним сообщением и таймером скрытия.

## Что важно учитывать при разработке

- Клиентская модель и mock DB не всегда совпадают один к одному: например, node в DB хранит `tagIds`, а UI работает с `tags`.
- Большие data URL быстро ломают `json-server` payload, поэтому изображения лучше держать небольшими или ссылками.
- В workspace есть кэш папок; если данные меняются вне текущих операций store, может понадобиться `reloadCurrentFolder()`.
- Документы и kanban сохраняются отложенно. Перед уходом со страницы используется `flushDocument()` / `flushBoard()`.
- Удаление nodes сейчас soft-delete через `isDeleted`; проекты тоже сначала уходят в корзину.
- `filesCount` проекта обновляется при создании node, но операции copy/delete/move требуют проверки счетчика, если счетчик должен быть строгим.

## Предложения по рефакторингу

1. Вынести общие debounce-save паттерны.
   `useDocumentsStore` и `useKanbanStore` используют похожую схему `dirty/saving/timers/flush`. Можно сделать общий composable или маленький helper для autosave-ресурсов.

2. Разделить `useWorkspacePage()`.
   Сейчас composable отвечает сразу за route query, сортировку, фильтры, selection, drag-select, создание draft и навигацию. Его можно разрезать на `useWorkspaceQueryState`, `useWorkspaceSelection`, `useWorkspaceDraftNode`, `useDragSelection`.

3. Уточнить модель node-счетчиков.
   `filesCount` стоит либо вычислять из `nodes`, либо централизованно обновлять при create/copy/delete/restore/permanent delete, чтобы карточки проектов не расходились с деревом.

4. Добавить отдельные страницы для canvas и template.
   Типы и маршруты уже заведены, но оба маршрута пока рендерят workspace. Лучше либо реализовать страницы, либо временно скрыть создание этих типов в UI.

5. Нормализовать операции копирования папок.
   `copyNodes()` копирует выбранные nodes поверхностно. Если папка должна копироваться вместе с вложенными файлами, нужна рекурсивная копия дерева и связанных `documentPages`.

6. Добавить слой адаптеров для backend.
   Сейчас API-функции знают особенности `json-server`. Перед переходом на реальный backend стоит отделить доменные операции от mock-специфики: генерация id, `tagIds`, дефолтные доски, создание root folder.

7. Проверить кодировку русских строк.
   В ряде файлов русские UI-строки выглядят как mojibake (`Рќ...`). Если это не артефакт терминала, стоит восстановить UTF-8 строки, иначе UI будет показывать битый текст.

8. Добавить тесты на stores/API helpers.
   Самые полезные первые тесты: `getFolderContent()`, защита move от циклов, copy document page, autosave flush, kanban status sync.

9. Удалить или использовать `counter.ts`.
   Если demo store не нужен, лучше убрать его, чтобы структура stores отражала реальные домены.
