<script setup lang="ts">
import { computed, ref } from 'vue'
import IconAdd from '~icons/carbon/add'
import IconChevronDown from '~icons/carbon/chevron-down'
import IconCopy from '~icons/carbon/copy'
import IconCut from '~icons/carbon/cut'
import IconDocument from '~icons/carbon/document'
import IconEdit from '~icons/carbon/edit'
import IconFolder from '~icons/carbon/folder'
import IconGrid from '~icons/carbon/grid'
import IconList from '~icons/carbon/list'
import IconPaintBrush from '~icons/carbon/paint-brush'
import IconPaste from '~icons/carbon/paste'
import IconSortAscending from '~icons/carbon/sort-ascending'
import IconTag from '~icons/carbon/tag'
import IconTemplate from '~icons/carbon/template'
import IconTrashCan from '~icons/carbon/trash-can'
import IconView from '~icons/carbon/view'
import WorkspaceHeader from '@/components/WorkspaceHeader.vue'
import WorkspaceLeftSidebar from '@/components/WorkspaceLeftSidebar.vue'
import WorkspaceRightSidebar from '@/components/WorkspaceRightSidebar.vue'

type WorkspaceItemType = 'folder' | 'document' | 'canvas' | 'template'

type WorkspaceItem = {
  id: string
  name: string
  type: WorkspaceItemType
  tags: string[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

const projectName = 'Village Quest'
const breadcrumbs = ['Village Quest', 'Документы', 'Системы']
const selectedId = ref<string | null>(null)
const clipboardHasContent = ref(true)

const folders = [
  {
    id: 'docs',
    name: 'Документы',
    children: [
      { id: 'systems', name: 'Системы' },
      { id: 'quests', name: 'Квесты' },
    ],
  },
  {
    id: 'art',
    name: 'Арт',
    children: [
      { id: 'characters', name: 'Персонажи' },
      { id: 'locations', name: 'Локации' },
    ],
  },
  { id: 'prototypes', name: 'Прототипы' },
]

const tags = [
  { id: 'core', name: 'core' },
  { id: 'draft', name: 'draft' },
  { id: 'art', name: 'art' },
  { id: 'balance', name: 'balance' },
]

const currentDirectory: WorkspaceItem = {
  id: 'systems',
  name: 'Системы',
  type: 'folder',
  tags: ['core', 'balance'],
  createdAt: '10 апреля 2026',
  createdBy: 'Анна',
  updatedAt: 'Сегодня, 14:20',
  updatedBy: 'Марк',
}

const items: WorkspaceItem[] = [
  {
    id: 'combat-folder',
    name: 'Боевая система',
    type: 'folder',
    tags: ['core', 'balance'],
    createdAt: '11 апреля 2026',
    createdBy: 'Анна',
    updatedAt: 'Сегодня, 13:42',
    updatedBy: 'Марк',
  },
  {
    id: 'dialogue-doc',
    name: 'Диалоги жителей',
    type: 'document',
    tags: ['draft'],
    createdAt: '12 апреля 2026',
    createdBy: 'Саша',
    updatedAt: 'Вчера, 18:05',
    updatedBy: 'Анна',
  },
  {
    id: 'world-map',
    name: 'Карта поселения',
    type: 'canvas',
    tags: ['art'],
    createdAt: '13 апреля 2026',
    createdBy: 'Игорь',
    updatedAt: 'Вчера, 12:30',
    updatedBy: 'Игорь',
  },
  {
    id: 'quest-template',
    name: 'Шаблон квеста',
    type: 'template',
    tags: ['draft'],
    createdAt: '14 апреля 2026',
    createdBy: 'Анна',
    updatedAt: '14 апреля, 16:10',
    updatedBy: 'Анна',
  },
  {
    id: 'economy-doc',
    name: 'Экономика деревни',
    type: 'document',
    tags: ['balance'],
    createdAt: '15 апреля 2026',
    createdBy: 'Марк',
    updatedAt: 'Сегодня, 09:15',
    updatedBy: 'Марк',
  },
]

const selectedItem = computed(() => items.find((item) => item.id === selectedId.value) ?? null)
const hasSelection = computed(() => selectedItem.value !== null)

const typeLabels: Record<WorkspaceItemType, string> = {
  folder: 'Папка',
  document: 'Документ',
  canvas: 'Холст',
  template: 'Шаблон',
}

const selectItem = (id: string) => {
  selectedId.value = selectedId.value === id ? null : id
}
</script>

<template>
  <div class="workspace-page">
    <WorkspaceHeader :breadcrumbs="breadcrumbs" />

    <div class="workspace-shell">
      <WorkspaceLeftSidebar :project-name="projectName" :folders="folders" :tags="tags" />

      <main class="workspace-main">
        <section class="workspace-toolbar" aria-label="Инструменты файлового менеджера">
          <BDropdown variant="dark" class="create-dropdown">
            <template #button-content>
              <IconAdd aria-hidden="true" />
              <span>Создать</span>
            </template>
            <BDropdownItem>
              <IconFolder aria-hidden="true" />
              Папка
            </BDropdownItem>
            <BDropdownItem>
              <IconDocument aria-hidden="true" />
              Документ
            </BDropdownItem>
            <BDropdownItem>
              <IconPaintBrush aria-hidden="true" />
              Холст
            </BDropdownItem>
            <BDropdownItem>
              <IconTemplate aria-hidden="true" />
              Шаблон
            </BDropdownItem>
          </BDropdown>

          <div class="tool-group" aria-label="Действия">
            <BButton variant="light" :disabled="!hasSelection" aria-label="Вырезать">
              <IconCut aria-hidden="true" />
            </BButton>
            <BButton variant="light" :disabled="!hasSelection" aria-label="Копировать">
              <IconCopy aria-hidden="true" />
            </BButton>
            <BButton variant="light" :disabled="!clipboardHasContent" aria-label="Вставить">
              <IconPaste aria-hidden="true" />
            </BButton>
            <BButton variant="light" :disabled="!hasSelection" aria-label="Переименовать">
              <IconEdit aria-hidden="true" />
            </BButton>
            <BButton variant="light" :disabled="!hasSelection" aria-label="Удалить">
              <IconTrashCan aria-hidden="true" />
            </BButton>
          </div>

          <BDropdown variant="outline-dark" class="toolbar-dropdown">
            <template #button-content>
              <IconSortAscending aria-hidden="true" />
              <span>Сортировать</span>
              <IconChevronDown aria-hidden="true" />
            </template>
            <BDropdownItem>По имени</BDropdownItem>
            <BDropdownItem>По дате создания</BDropdownItem>
            <BDropdownItem>По дате изменения</BDropdownItem>
            <BDropdownItem>По типу</BDropdownItem>
          </BDropdown>

          <BDropdown variant="outline-dark" class="toolbar-dropdown">
            <template #button-content>
              <IconView aria-hidden="true" />
              <span>Вид</span>
              <IconChevronDown aria-hidden="true" />
            </template>
            <BDropdownItem>
              <IconGrid aria-hidden="true" />
              Значки
            </BDropdownItem>
            <BDropdownItem>
              <IconList aria-hidden="true" />
              Список
            </BDropdownItem>
          </BDropdown>
        </section>

        <section class="content-list" aria-label="Содержимое папки">
          <button
            v-for="item in items"
            :key="item.id"
            class="content-item"
            :class="{ selected: selectedId === item.id }"
            type="button"
            @click="selectItem(item.id)"
          >
            <span class="item-icon" :class="item.type">
              <IconFolder v-if="item.type === 'folder'" aria-hidden="true" />
              <IconDocument v-else-if="item.type === 'document'" aria-hidden="true" />
              <IconPaintBrush v-else-if="item.type === 'canvas'" aria-hidden="true" />
              <IconTemplate v-else aria-hidden="true" />
            </span>

            <span class="item-main">
              <strong>{{ item.name }}</strong>
              <span>{{ typeLabels[item.type] }}</span>
            </span>

            <span class="item-tags">
              <BBadge v-for="tag in item.tags" :key="tag" variant="light">
                <IconTag aria-hidden="true" />
                {{ tag }}
              </BBadge>
            </span>

            <span class="item-date">{{ item.updatedAt }}</span>
          </button>
        </section>
      </main>

      <WorkspaceRightSidebar :item="selectedItem" :current-directory="currentDirectory" />
    </div>
  </div>
</template>

<style scoped>
.workspace-page {
  min-height: 100vh;
  background: #ffffff;
  color: #171717;
}

.workspace-shell {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: calc(100vh - 72px);
}

.workspace-main {
  min-width: 0;
  padding: 18px;
  background: #ffffff;
}

.workspace-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  margin-bottom: 16px;
  padding: 8px;
  border: 1px solid #dddddd;
  border-radius: 8px;
  background: #f8f8f8;
}

.create-dropdown :deep(.btn),
.toolbar-dropdown :deep(.btn) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  border-radius: 8px;
  font-weight: 650;
}

.toolbar-dropdown :deep(.dropdown-toggle::after),
.create-dropdown :deep(.dropdown-toggle::after) {
  display: none;
}

.create-dropdown :deep(.dropdown-item),
.toolbar-dropdown :deep(.dropdown-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  border-right: 1px solid #d8d8d8;
  border-left: 1px solid #d8d8d8;
}

.tool-group .btn {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid #d7d7d7;
  border-radius: 8px;
  background: #ffffff;
  color: #1f1f1f;
}

.tool-group .btn:disabled {
  color: #999999;
  background: #f3f3f3;
  opacity: 1;
}

.content-list {
  display: grid;
  gap: 8px;
}

.content-item {
  display: grid;
  grid-template-columns: 42px minmax(170px, 1.2fr) minmax(120px, 1fr) minmax(120px, auto);
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 62px;
  padding: 10px 12px;
  border: 1px solid #dddddd;
  border-radius: 8px;
  background: #ffffff;
  color: #222222;
  font: inherit;
  text-align: left;
}

.content-item:hover {
  border-color: #b7b7b7;
  background: #fafafa;
}

.content-item.selected {
  border-color: #1f1f1f;
  background: #f1f1f1;
  box-shadow: inset 0 0 0 1px #1f1f1f;
}

.item-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  background: #f7f7f7;
  color: #191919;
}

.item-icon svg {
  width: 23px;
  height: 23px;
}

.item-main {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.item-main strong {
  min-width: 0;
  overflow: hidden;
  color: #161616;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-main span,
.item-date {
  color: #707070;
  font-size: 13px;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.item-tags :deep(.badge) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #d8d8d8;
  color: #343434;
  font-weight: 650;
}

.item-tags svg {
  width: 12px;
  height: 12px;
}

.item-date {
  justify-self: end;
  white-space: nowrap;
}

@media (max-width: 1180px) {
  .workspace-shell {
    grid-template-columns: auto minmax(0, 1fr);
  }
}

@media (max-width: 980px) {
  .workspace-shell {
    display: block;
  }

  .workspace-toolbar {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .tool-group {
    border: 0;
    padding: 0;
  }
}

@media (max-width: 720px) {
  .content-item {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .item-tags,
  .item-date {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
