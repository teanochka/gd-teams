<script setup lang="ts">
import IconAdd from '~icons/carbon/add'
import IconCheckmark from '~icons/carbon/checkmark'
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
import IconTemplate from '~icons/carbon/template'
import IconTrashCan from '~icons/carbon/trash-can'
import IconView from '~icons/carbon/view'
import WorkspaceCard from '@/components/WorkspaceCard.vue'
import WorkspaceHeader from '@/components/WorkspaceHeader.vue'
import WorkspaceLeftSidebar from '@/components/WorkspaceLeftSidebar.vue'
import WorkspaceListItem from '@/components/WorkspaceListItem.vue'
import WorkspaceRightSidebar from '@/components/WorkspaceRightSidebar.vue'
import { useWorkspacePage } from '@/composables/useWorkspacePage'

const {
  breadcrumbLabels,
  clipboardHasContent,
  copySelected,
  currentDirectory,
  cutSelected,
  deleteSelected,
  error,
  folders,
  hasSelection,
  isLoading,
  items,
  openFolder,
  openItem,
  pasteClipboard,
  projectName,
  reloadCurrentFolder,
  searchQuery,
  selectedId,
  selectedItem,
  selectItem,
  setSortField,
  setViewMode,
  tags,
  toggleSortOrder,
  typeLabels,
  viewMode,
  viewModeLabel,
} = useWorkspacePage()
</script>

<template>
  <div class="workspace-page">
    <WorkspaceHeader
      v-model="searchQuery"
      :breadcrumbs="breadcrumbLabels"
      @reload="reloadCurrentFolder"
    />

    <div class="workspace-shell">
      <WorkspaceLeftSidebar
        :project-name="projectName"
        :folders="folders"
        :tags="tags"
        @open-folder="openFolder"
      />

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
            <BButton variant="light" :disabled="!hasSelection" aria-label="Вырезать" @click="cutSelected">
              <IconCut aria-hidden="true" />
            </BButton>
            <BButton variant="light" :disabled="!hasSelection" aria-label="Копировать" @click="copySelected">
              <IconCopy aria-hidden="true" />
            </BButton>
            <BButton variant="light" :disabled="!clipboardHasContent" aria-label="Вставить" @click="pasteClipboard">
              <IconPaste aria-hidden="true" />
            </BButton>
            <BButton variant="light" :disabled="!hasSelection" aria-label="Переименовать">
              <IconEdit aria-hidden="true" />
            </BButton>
            <BButton variant="light" :disabled="!hasSelection" aria-label="Удалить" @click="deleteSelected">
              <IconTrashCan aria-hidden="true" />
            </BButton>
          </div>

          <BDropdown variant="outline-dark" class="toolbar-dropdown">
            <template #button-content>
              <IconSortAscending aria-hidden="true" />
              <span>Сортировать</span>
              <IconChevronDown aria-hidden="true" @click.stop="toggleSortOrder" />
            </template>
            <BDropdownItem @click="setSortField('title')">По имени</BDropdownItem>
            <BDropdownItem @click="setSortField('createdAt')">По дате создания</BDropdownItem>
            <BDropdownItem @click="setSortField('updatedAt')">По дате изменения</BDropdownItem>
            <BDropdownItem @click="setSortField('type')">По типу</BDropdownItem>
          </BDropdown>

          <BDropdown variant="outline-dark" class="toolbar-dropdown view-dropdown">
            <template #button-content>
              <IconView aria-hidden="true" />
              <span>{{ viewModeLabel }}</span>
              <IconChevronDown aria-hidden="true" />
            </template>
            <BDropdownItem @click="setViewMode('grid')">
              <IconGrid aria-hidden="true" />
              Значки
              <IconCheckmark v-if="viewMode === 'grid'" class="dropdown-check" aria-hidden="true" />
            </BDropdownItem>
            <BDropdownItem @click="setViewMode('list')">
              <IconList aria-hidden="true" />
              Список
              <IconCheckmark v-if="viewMode === 'list'" class="dropdown-check" aria-hidden="true" />
            </BDropdownItem>
          </BDropdown>
        </section>

        <section v-if="isLoading" class="workspace-state" aria-live="polite">
          <IconFolder aria-hidden="true" />
          <h2>Загружаем папку</h2>
          <p>Получаем содержимое текущей директории.</p>
        </section>

        <section v-else-if="error" class="workspace-state" aria-live="polite">
          <IconFolder aria-hidden="true" />
          <h2>Не удалось открыть папку</h2>
          <p>{{ error }}</p>
        </section>

        <section v-else-if="!items.length" class="workspace-state" aria-live="polite">
          <IconFolder aria-hidden="true" />
          <h2>Здесь пока пусто</h2>
          <p>Создайте папку, документ или холст.</p>
        </section>

        <section v-else class="workspace-content" :class="viewMode" aria-label="Содержимое папки">
          <WorkspaceCard
            v-if="viewMode === 'grid'"
            v-for="item in items"
            :key="item.id"
            :item="item"
            :selected="selectedId === item.id"
            @open="openItem"
            @select="selectItem"
          />

          <WorkspaceListItem
            v-else
            v-for="item in items"
            :key="item.id"
            :item="item"
            :selected="selectedId === item.id"
            :type-label="typeLabels[item.type]"
            @open="openItem"
            @select="selectItem"
          />
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

.dropdown-check {
  margin-left: auto;
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

.workspace-state {
  display: grid;
  place-items: center;
  min-height: 360px;
  padding: 44px;
  border: 1px dashed #cfcfcf;
  border-radius: 8px;
  background: #fafafa;
  color: #606060;
  text-align: center;
}

.workspace-state svg {
  width: 46px;
  height: 46px;
  margin-bottom: 10px;
  color: #2a2a2a;
}

.workspace-state h2 {
  margin: 0 0 6px;
  color: #191919;
  font-size: 20px;
  font-weight: 750;
}

.workspace-state p {
  margin: 0;
}

.workspace-content.list {
  display: grid;
  gap: 8px;
}

.workspace-content.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  align-items: start;
  gap: 14px;
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

@media (max-width: 560px) {
  .workspace-content.grid {
    grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
  }
}
</style>
