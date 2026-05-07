<script setup lang="ts">
import { computed, ref } from 'vue'
import Draggable from 'vuedraggable'
import IconAdd from '~icons/carbon/add'
import IconCheckmark from '~icons/carbon/checkmark'
import IconChevronDown from '~icons/carbon/chevron-down'
import IconClose from '~icons/carbon/close'
import IconFilter from '~icons/carbon/filter'
import IconSearch from '~icons/carbon/search'
import IconUserAvatarFilled from '~icons/carbon/user-avatar-filled'
import KanbanCard from '@/components/KanbanCard.vue'
import type {
  KanbanColumn,
  KanbanMember,
  KanbanPriority,
  KanbanStatus,
  KanbanTask,
  KanbanTaskType,
} from '@/types/domain'

type FilterKey = 'assignee' | 'role' | 'type' | 'tag' | 'status' | 'priority'
type DetailFieldKey = 'assigneeId' | 'priority' | 'parentId' | 'dueDate' | 'labels' | 'role' | 'startDate' | 'authorId'

const members: KanbanMember[] = [
  { id: 'user-1', name: 'Мятный уголок', role: 'Game Designer', color: '#0f8f72' },
  { id: 'user-2', name: 'Светлая башня', role: 'Developer', color: '#4263eb' },
  { id: 'user-3', name: 'Тихий контур', role: 'QA', color: '#9b5de5' },
  { id: 'user-4', name: 'Новый игрок', role: 'Narrative', color: '#c47f17' },
]

const coverColors = [
  { name: 'Мята', value: '#51cf66' },
  { name: 'Лайм', value: '#94d82d' },
  { name: 'Небо', value: '#4dabf7' },
  { name: 'Индиго', value: '#5c7cfa' },
  { name: 'Сирень', value: '#9775fa' },
  { name: 'Роза', value: '#f783ac' },
  { name: 'Коралл', value: '#ff8787' },
  { name: 'Мандарин', value: '#ffa94d' },
  { name: 'Графит', value: '#495057' },
  { name: 'Сталь', value: '#adb5bd' },
]

const roles = ['Game Designer', 'Developer', 'QA', 'Narrative']
const taskTypes: KanbanTaskType[] = ['Task', 'Bug', 'Story', 'Epic']
const priorities: KanbanPriority[] = ['Low', 'Medium', 'High', 'Critical']
const statuses: KanbanStatus[] = ['to-do', 'in-progress', 'in-review', 'done']
const tags = ['combat', 'economy', 'ux', 'level', 'balance']

const initialTasks: KanbanTask[] = [
  {
    id: 'task-1',
    key: 'KAN-6',
    title: 'Настроить быстрый поиск по игровым задачам',
    description: 'Поиск должен работать по названию, ключу и описанию карточки.',
    assigneeId: 'user-1',
    authorId: 'user-1',
    priority: 'Medium',
    parentId: null,
    dueDate: null,
    startDate: null,
    labels: ['ux'],
    role: 'Game Designer',
    type: 'Task',
    status: 'to-do',
    subtasks: ['Собрать состояния поиска', 'Проверить пустой результат'],
    linkedTasks: ['KAN-2'],
  },
  {
    id: 'task-2',
    key: 'KAN-7',
    title: 'Описать сценарии онбординга команды',
    description: 'Нужен компактный флоу для новых участников проекта.',
    assigneeId: 'user-4',
    authorId: 'user-1',
    priority: 'High',
    parentId: null,
    dueDate: '17 мая',
    startDate: '10 мая',
    labels: ['ux', 'level'],
    role: 'Narrative',
    type: 'Story',
    status: 'to-do',
    subtasks: [],
    linkedTasks: ['KAN-6'],
    coverColor: '#9775fa',
  },
  {
    id: 'task-3',
    key: 'KAN-8',
    title: 'Сверстать карточку баланса оружия',
    description: 'Карточка должна помещать ключевые параметры без горизонтального скролла.',
    assigneeId: 'user-2',
    authorId: 'user-1',
    priority: 'Critical',
    parentId: null,
    dueDate: '20 мая',
    startDate: null,
    labels: ['combat', 'balance'],
    role: 'Developer',
    type: 'Bug',
    status: 'in-progress',
    subtasks: ['Состояние ошибки', 'Состояние загрузки'],
    linkedTasks: [],
    coverColor: '#ff8787',
  },
  {
    id: 'task-4',
    key: 'KAN-9',
    title: 'Проверить доску на коротких названиях колонок',
    description: 'Убедиться, что перенос и hover-состояния не ломают сетку.',
    assigneeId: 'user-3',
    authorId: 'user-2',
    priority: 'Low',
    parentId: null,
    dueDate: null,
    startDate: null,
    labels: ['qa'],
    role: 'QA',
    type: 'Task',
    status: 'in-review',
    subtasks: ['Desktop', 'Mobile'],
    linkedTasks: ['KAN-8'],
  },
  {
    id: 'task-5',
    key: 'KAN-10',
    title: 'Согласовать список ролей',
    description: 'Роли нужны для фильтров и будущих прав доступа.',
    assigneeId: 'user-1',
    authorId: 'user-1',
    priority: 'Medium',
    parentId: null,
    dueDate: null,
    startDate: '6 мая',
    labels: ['economy'],
    role: 'Game Designer',
    type: 'Epic',
    status: 'done',
    subtasks: [],
    linkedTasks: [],
    coverColor: '#51cf66',
  },
]

const columns = ref<KanbanColumn[]>([
  { id: 'column-1', title: 'To do', status: 'to-do', tasks: initialTasks.filter((task) => task.status === 'to-do') },
  {
    id: 'column-2',
    title: 'In progress',
    status: 'in-progress',
    tasks: initialTasks.filter((task) => task.status === 'in-progress'),
  },
  {
    id: 'column-3',
    title: 'In review',
    status: 'in-review',
    tasks: initialTasks.filter((task) => task.status === 'in-review'),
  },
  { id: 'column-4', title: 'Done', status: 'done', tasks: initialTasks.filter((task) => task.status === 'done') },
])

const searchQuery = ref('')
const selectedTaskId = ref<string | null>(null)
const isAddingColumn = ref(false)
const newColumnTitle = ref('')
const activeFilters = ref<Record<FilterKey, string[]>>({
  assignee: [],
  role: [],
  type: [],
  tag: [],
  status: [],
  priority: [],
})

const filterGroups = computed(() => [
  { key: 'assignee' as const, title: 'Исполнитель', options: members.map((member) => ({ label: member.name, value: member.id })) },
  { key: 'role' as const, title: 'Роль', options: roles.map((role) => ({ label: role, value: role })) },
  { key: 'type' as const, title: 'Тип задачи', options: taskTypes.map((type) => ({ label: type, value: type })) },
  { key: 'tag' as const, title: 'Тэги', options: tags.map((tag) => ({ label: tag, value: tag })) },
  {
    key: 'status' as const,
    title: 'Статус',
    options: statuses.map((status) => ({ label: getStatusLabel(status), value: status })),
  },
  { key: 'priority' as const, title: 'Приоритет', options: priorities.map((priority) => ({ label: priority, value: priority })) },
])

const allTasks = computed(() => columns.value.flatMap((column) => column.tasks))
const selectedTask = computed(() => allTasks.value.find((task) => task.id === selectedTaskId.value) ?? null)

const visibleColumns = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return columns.value.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => {
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.key.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)

      const matchesFilters =
        matchesFilter('assignee', task.assigneeId) &&
        matchesFilter('role', task.role ?? '') &&
        matchesFilter('type', task.type) &&
        matchesFilter('status', task.status) &&
        matchesFilter('priority', task.priority) &&
        (!activeFilters.value.tag.length || task.labels.some((label) => activeFilters.value.tag.includes(label)))

      return matchesQuery && matchesFilters
    }),
  }))
})

const activeFilterCount = computed(() => {
  return Object.values(activeFilters.value).reduce((count, values) => count + values.length, 0)
})

const selectedTaskAssignee = computed(() => {
  return selectedTask.value ? getMember(selectedTask.value.assigneeId) : null
})

const detailFields = computed(() => {
  const task = selectedTask.value

  if (!task) {
    return []
  }

  return [
    { key: 'assigneeId' as const, label: 'Исполнитель', value: getMember(task.assigneeId)?.name ?? 'Нет', options: members.map((member) => ({ label: member.name, value: member.id })) },
    { key: 'priority' as const, label: 'Приоритет', value: task.priority, options: priorities.map((priority) => ({ label: priority, value: priority })) },
    { key: 'parentId' as const, label: 'Родитель', value: task.parentId ?? 'Нет', options: [{ label: 'Нет', value: '' }, ...allTasks.value.filter((item) => item.id !== task.id).map((item) => ({ label: item.key, value: item.key }))] },
    { key: 'dueDate' as const, label: 'Срок исполнения', value: task.dueDate ?? 'Нет', options: ['Нет', 'Сегодня', 'Завтра', '17 мая', '20 мая'].map((value) => ({ label: value, value })) },
    { key: 'labels' as const, label: 'Метки', value: task.labels.length ? task.labels.join(', ') : 'Нет', options: tags.map((tag) => ({ label: tag, value: tag })) },
    { key: 'role' as const, label: 'Роль', value: task.role ?? 'Нет', options: roles.map((role) => ({ label: role, value: role })) },
    { key: 'startDate' as const, label: 'Start date', value: task.startDate ?? 'Нет', options: ['Нет', '6 мая', '10 мая', 'Сегодня', 'Завтра'].map((value) => ({ label: value, value })) },
    { key: 'authorId' as const, label: 'Автор', value: getMember(task.authorId)?.name ?? 'Нет', options: members.map((member) => ({ label: member.name, value: member.id })) },
  ]
})

function getMember(memberId: string) {
  return members.find((member) => member.id === memberId) ?? null
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    'to-do': 'To do',
    'in-progress': 'In progress',
    'in-review': 'In review',
    done: 'Done',
  }

  return labels[status] ?? status
}

function matchesFilter(key: FilterKey, value: string) {
  return !activeFilters.value[key].length || activeFilters.value[key].includes(value)
}

function toggleFilter(key: FilterKey, value: string) {
  const values = activeFilters.value[key]
  const index = values.indexOf(value)

  if (index >= 0) {
    values.splice(index, 1)
    return
  }

  values.push(value)
}

function clearFilters() {
  Object.keys(activeFilters.value).forEach((key) => {
    activeFilters.value[key as FilterKey] = []
  })
}

function startAddColumn() {
  isAddingColumn.value = true
  newColumnTitle.value = ''
}

function finishAddColumn() {
  const title = newColumnTitle.value.trim()

  if (!title) {
    cancelAddColumn()
    return
  }

  columns.value.push({
    id: `column-${Date.now()}`,
    title,
    status: title.toLowerCase().replace(/\s+/g, '-'),
    tasks: [],
  })
  cancelAddColumn()
}

function cancelAddColumn() {
  isAddingColumn.value = false
  newColumnTitle.value = ''
}

function createTask(columnId: string) {
  const column = columns.value.find((item) => item.id === columnId)

  if (!column) {
    return
  }

  const nextIndex = allTasks.value.length + 1
  const defaultMember = members[0]

  if (!defaultMember) {
    return
  }

  column.tasks.unshift({
    id: `task-${Date.now()}`,
    key: `KAN-${nextIndex + 5}`,
    title: 'Новая задача',
    description: 'Добавьте описание задачи.',
    assigneeId: defaultMember.id,
    authorId: defaultMember.id,
    priority: 'Medium',
    parentId: null,
    dueDate: null,
    startDate: null,
    labels: [],
    role: null,
    type: 'Task',
    status: column.status as KanbanStatus,
    subtasks: [],
    linkedTasks: [],
  })
  syncStatuses()
}

function syncStatuses() {
  columns.value.forEach((column) => {
    column.tasks.forEach((task) => {
      task.status = column.status as KanbanStatus
    })
  })
}

function renameTask(taskId: string, title: string) {
  const task = allTasks.value.find((item) => item.id === taskId)

  if (task) {
    task.title = title
  }
}

function deleteTask(taskId: string) {
  columns.value.forEach((column) => {
    column.tasks = column.tasks.filter((task) => task.id !== taskId)
  })

  if (selectedTaskId.value === taskId) {
    selectedTaskId.value = null
  }
}

function copyTaskLink(taskId: string) {
  const task = allTasks.value.find((item) => item.id === taskId)
  const link = `${window.location.origin}${window.location.pathname}#${task?.key ?? taskId}`

  void navigator.clipboard?.writeText(link)
}

function setTaskCover(taskId: string, color: string) {
  const task = allTasks.value.find((item) => item.id === taskId)

  if (task) {
    task.coverColor = color
  }
}

function selectDetailValue(field: DetailFieldKey, value: string) {
  const task = selectedTask.value

  if (!task) {
    return
  }

  if (field === 'labels') {
    const index = task.labels.indexOf(value)

    if (index >= 0) {
      task.labels.splice(index, 1)
      return
    }

    task.labels.push(value)
    return
  }

  if (field === 'parentId') {
    task.parentId = value || null
    return
  }

  if (field === 'dueDate' || field === 'startDate') {
    task[field] = value === 'Нет' ? null : value
    return
  }

  task[field] = value as never
}

function isDetailOptionSelected(field: DetailFieldKey, value: string) {
  const task = selectedTask.value

  if (!task) {
    return false
  }

  if (field === 'labels') {
    return task.labels.includes(value)
  }

  if (field === 'parentId') {
    return (task.parentId ?? '') === value
  }

  if (field === 'dueDate' || field === 'startDate') {
    return (task[field] ?? 'Нет') === value
  }

  return String(task[field]) === value
}
</script>

<template>
  <main class="kanban-page">
    <section class="kanban-toolbar" aria-label="Фильтры доски">
      <label class="board-search">
        <IconSearch aria-hidden="true" />
        <input v-model="searchQuery" type="search" placeholder="Поиск на доске" />
      </label>

      <BDropdown variant="outline-dark" class="filter-dropdown" auto-close="outside">
        <template #button-content>
          <IconFilter aria-hidden="true" />
          <span>Фильтр</span>
          <BBadge v-if="activeFilterCount" variant="dark">{{ activeFilterCount }}</BBadge>
          <IconChevronDown aria-hidden="true" />
        </template>

        <div class="filter-panel">
          <div class="filter-panel-header">
            <strong>Настройки фильтрации</strong>
            <button type="button" @click="clearFilters">Сбросить</button>
          </div>

          <div v-for="group in filterGroups" :key="group.key" class="filter-group">
            <p>{{ group.title }}</p>
            <label v-for="option in group.options" :key="option.value" class="filter-option">
              <input
                type="checkbox"
                :checked="activeFilters[group.key].includes(option.value)"
                @change="toggleFilter(group.key, option.value)"
              />
              <span>{{ option.label }}</span>
            </label>
          </div>
        </div>
      </BDropdown>
    </section>

    <section class="columns-toolbar" aria-label="Колонки доски">
      <Draggable
        v-model="columns"
        item-key="id"
        tag="div"
        class="column-tabs"
        handle=".column-title-handle"
        ghost-class="column-tab-ghost"
      >
        <template #item="{ element }">
          <button class="column-title-handle" type="button">
            {{ element.title }}
          </button>
        </template>
      </Draggable>

      <form v-if="isAddingColumn" class="new-column-form" @submit.prevent="finishAddColumn">
        <input v-model="newColumnTitle" type="text" placeholder="Название колонки" autofocus />
        <button class="icon-button" type="submit" aria-label="Добавить колонку">
          <IconCheckmark aria-hidden="true" />
        </button>
        <button class="icon-button" type="button" aria-label="Отменить" @click="cancelAddColumn">
          <IconClose aria-hidden="true" />
        </button>
      </form>

      <button v-else class="add-column-button" type="button" aria-label="Добавить колонку" @click="startAddColumn">
        <IconAdd aria-hidden="true" />
      </button>
    </section>

    <Draggable
      v-model="columns"
      item-key="id"
      tag="section"
      class="kanban-board"
      handle=".column-title-handle"
      ghost-class="column-ghost"
    >
      <template #item="{ element: column }">
        <article class="kanban-column">
          <header class="column-header">
            <button class="column-title-handle" type="button">
              <span>{{ column.title }}</span>
              <BBadge variant="light">{{ column.tasks.length }}</BBadge>
            </button>
            <button class="create-task-button" type="button" @click="createTask(column.id)">
              <IconAdd aria-hidden="true" />
              <span>Создать</span>
            </button>
          </header>

          <Draggable
            v-model="column.tasks"
            item-key="id"
            tag="div"
            class="task-list"
            group="kanban-tasks"
            ghost-class="task-ghost"
            drag-class="task-drag"
            @change="syncStatuses"
          >
            <template #item="{ element: task }">
              <KanbanCard
                v-show="visibleColumns.find((item) => item.id === column.id)?.tasks.some((item) => item.id === task.id)"
                :task="task"
                :assignee="getMember(task.assigneeId)"
                :done="column.status === 'done'"
                :cover-colors="coverColors"
                @open="selectedTaskId = $event"
                @rename="renameTask"
                @delete="deleteTask"
                @copy-link="copyTaskLink"
                @set-cover="setTaskCover"
              />
            </template>
          </Draggable>
        </article>
      </template>
    </Draggable>

    <div v-if="selectedTask" class="task-details-backdrop" @click.self="selectedTaskId = null">
      <aside class="task-details" aria-label="Карточка задачи">
        <button class="details-close" type="button" aria-label="Закрыть" @click="selectedTaskId = null">
          <IconClose aria-hidden="true" />
        </button>

        <section class="details-main">
          <p class="details-key">{{ selectedTask.key }}</p>
          <h2>{{ selectedTask.title }}</h2>

          <section class="details-section">
            <h3>Описание</h3>
            <p>{{ selectedTask.description }}</p>
            <button type="button">Редактировать описание</button>
          </section>

          <section class="details-section">
            <h3>Подзадачи</h3>
            <ul v-if="selectedTask.subtasks.length">
              <li v-for="subtask in selectedTask.subtasks" :key="subtask">{{ subtask }}</li>
            </ul>
            <button type="button">Добавить подзадачу</button>
          </section>

          <section class="details-section">
            <h3>Привязанные задачи</h3>
            <ul v-if="selectedTask.linkedTasks.length">
              <li v-for="taskKey in selectedTask.linkedTasks" :key="taskKey">{{ taskKey }}</li>
            </ul>
            <button type="button">Добавить связанную задачу</button>
          </section>
        </section>

        <section class="details-sidebar">
          <h3>Сведения</h3>
          <div v-if="selectedTaskAssignee" class="details-assignee">
            <span :style="{ backgroundColor: selectedTaskAssignee.color }">
              <IconUserAvatarFilled aria-hidden="true" />
            </span>
            {{ selectedTaskAssignee.name }}
          </div>

          <div v-for="field in detailFields" :key="field.key" class="detail-field">
            <span>{{ field.label }}</span>
            <BDropdown variant="link" toggle-class="detail-field-toggle" auto-close="outside" no-caret>
              <template #button-content>
                {{ field.value }}
                <IconChevronDown aria-hidden="true" />
              </template>
              <BDropdownItem
                v-for="option in field.options"
                :key="option.value"
                @click="selectDetailValue(field.key, option.value)"
              >
                <input type="checkbox" :checked="isDetailOptionSelected(field.key, option.value)" readonly />
                <span>{{ option.label }}</span>
              </BDropdownItem>
            </BDropdown>
          </div>
        </section>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.kanban-page {
  min-height: 100vh;
  padding: 18px;
  background: #ffffff;
  color: #171717;
}

.kanban-toolbar,
.columns-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border: 1px solid #dddddd;
  border-radius: 8px;
  background: #f8f8f8;
}

.kanban-toolbar {
  margin-bottom: 12px;
}

.board-search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(420px, 100%);
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  background: #ffffff;
  color: #6f7682;
}

.board-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  color: #171717;
  font: inherit;
  font-size: 14px;
}

.filter-dropdown :deep(.btn) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  border-radius: 8px;
  font-weight: 650;
}

.filter-dropdown :deep(.dropdown-toggle::after) {
  display: none;
}

.filter-dropdown :deep(.dropdown-menu) {
  width: 320px;
  padding: 0;
  border-color: #d9dde3;
  border-radius: 8px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.14);
}

.filter-panel {
  max-height: 520px;
  overflow: auto;
  padding: 14px;
}

.filter-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.filter-panel-header button,
.details-section button {
  border: 0;
  background: transparent;
  color: #315fbd;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
}

.filter-group {
  padding: 10px 0;
  border-top: 1px solid #eceff3;
}

.filter-group p {
  margin: 0 0 8px;
  color: #4b5563;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  color: #252b36;
  font-size: 14px;
}

.columns-toolbar {
  justify-content: space-between;
  margin-bottom: 14px;
}

.column-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: auto;
}

.column-title-handle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  background: #ffffff;
  color: #252b36;
  font: inherit;
  font-size: 13px;
  font-weight: 750;
  cursor: grab;
  white-space: nowrap;
}

.column-title-handle:active {
  cursor: grabbing;
}

.add-column-button,
.icon-button,
.details-close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2328;
}

.new-column-form {
  display: flex;
  align-items: center;
  gap: 6px;
}

.new-column-form input {
  width: 190px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  outline: 0;
  font: inherit;
  font-size: 14px;
}

.kanban-board {
  display: grid;
  grid-auto-columns: minmax(270px, 1fr);
  grid-auto-flow: column;
  gap: 14px;
  min-height: calc(100vh - 166px);
  overflow-x: auto;
  padding-bottom: 10px;
}

.kanban-column {
  min-width: 270px;
  border: 1px solid #d9dde3;
  border-radius: 8px;
  background: #f5f6f8;
}

.column-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px;
  border-bottom: 1px solid #dfe3e8;
  background: #f5f6f8;
}

.column-header .column-title-handle {
  min-width: 0;
  flex: 1;
  justify-content: space-between;
}

.create-task-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  background: #ffffff;
  color: #252b36;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  opacity: 0;
  transition: opacity 0.14s ease;
}

.kanban-column:hover .create-task-button {
  opacity: 1;
}

.task-list {
  display: grid;
  align-content: start;
  gap: 10px;
  min-height: 180px;
  padding: 10px;
}

.task-ghost,
.column-ghost,
.column-tab-ghost {
  opacity: 0.48;
}

.task-drag {
  transform: rotate(1deg);
}

.task-details-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  justify-content: flex-end;
  background: rgba(15, 23, 42, 0.28);
}

.task-details {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 28px;
  width: min(920px, calc(100vw - 32px));
  height: 100%;
  overflow: auto;
  padding: 32px;
  border-left: 1px solid #d9dde3;
  background: #ffffff;
  box-shadow: -18px 0 44px rgba(15, 23, 42, 0.18);
}

.details-close {
  position: absolute;
  top: 18px;
  right: 18px;
}

.details-key {
  margin: 0 0 8px;
  color: #707782;
  font-size: 13px;
  font-weight: 800;
}

.details-main h2 {
  margin: 0 48px 28px 0;
  color: #111827;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.18;
}

.details-section {
  padding: 20px 0;
  border-top: 1px solid #edf0f3;
}

.details-section h3,
.details-sidebar h3 {
  margin: 0 0 10px;
  color: #202733;
  font-size: 15px;
  font-weight: 800;
}

.details-section p,
.details-section ul {
  margin: 0 0 10px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.55;
}

.details-sidebar {
  align-self: start;
  padding: 18px;
  border: 1px solid #d9dde3;
  border-radius: 8px;
  background: #fafbfc;
}

.details-assignee {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: #252b36;
  font-size: 14px;
  font-weight: 700;
}

.details-assignee span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #ffffff;
}

.detail-field {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 42px;
  border-top: 1px solid #e7eaee;
}

.detail-field > span {
  color: #6b7280;
  font-size: 13px;
  font-weight: 650;
}

.detail-field :deep(.detail-field-toggle) {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  min-height: 32px;
  padding: 0 8px !important;
  border: 1px solid transparent !important;
  border-radius: 7px !important;
  background: transparent !important;
  color: #202733 !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  text-align: left;
  text-decoration: none !important;
}

.detail-field :deep(.detail-field-toggle:hover) {
  border-color: #d7dce3 !important;
  background: #ffffff !important;
}

.detail-field :deep(.dropdown-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
}

@media (max-width: 900px) {
  .kanban-toolbar,
  .columns-toolbar {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .task-details {
    grid-template-columns: 1fr;
    width: min(720px, calc(100vw - 20px));
    padding: 26px 18px;
  }
}
</style>
