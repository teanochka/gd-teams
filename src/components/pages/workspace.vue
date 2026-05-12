<script setup lang="ts">
import { ref } from "vue";
import IconAdd from "~icons/carbon/add";
import IconCheckmark from "~icons/carbon/checkmark";
import IconChevronDown from "~icons/carbon/chevron-down";
import IconCopy from "~icons/carbon/copy";
import IconCut from "~icons/carbon/cut";
import IconDocument from "~icons/carbon/document";
import IconEdit from "~icons/carbon/edit";
import IconFolder from "~icons/carbon/folder";
import IconGrid from "~icons/carbon/grid";
import IconList from "~icons/carbon/list";
import IconPaintBrush from "~icons/carbon/paint-brush";
import IconPaste from "~icons/carbon/paste";
import IconSortAscending from "~icons/carbon/sort-ascending";
import IconTemplate from "~icons/carbon/template";
import IconTrashCan from "~icons/carbon/trash-can";
import IconView from "~icons/carbon/view";
import IconStar from "~icons/carbon/star";
import IconOpenPanelTop from "~icons/carbon/open-panel-top";
import IconTag from "~icons/carbon/tag";
import IconArrowLeft from "~icons/carbon/arrow-left";
import IconRenew from "~icons/carbon/renew";
import WorkspaceCard from "@/components/workspace/WorkspaceCard.vue";
import WorkspaceHeader from "@/components/workspace/WorkspaceHeader.vue";
import WorkspaceLeftSidebar from "@/components/workspace/WorkspaceLeftSidebar.vue";
import WorkspaceListItem from "@/components/workspace/WorkspaceListItem.vue";
import WorkspaceRightSidebar from "@/components/workspace/WorkspaceRightSidebar.vue";
import ContextMenu from "@/components/ContextMenu.vue";
import { useWorkspacePage } from "@/composables/useWorkspacePage";

const {
  breadcrumbLabels,
  cancelItemName,
  canRenameSelection,
  clipboardHasContent,
  contentRef,
  copySelected,
  currentDirectory,
  cutSelected,
  deleteSelected,
  draftItemName,
  editingItemId,
  emptyStateDescription,
  emptyStateTitle,
  error,
  finishItemName,
  folders,
  handleContentPointerDown,
  handleItemSelect,
  hasSelection,
  isDragSelecting,
  isLoading,
  isSavingItemName,
  items,
  openFolder,
  openItem,
  parentUrl,
  pasteClipboard,
  projectId,
  projectName,
  reloadCurrentFolder,
  searchQuery,
  selectedIdSet,
  selectedItem,
  selectionBoxStyle,
  sortOrder,
  selectedTagIds,
  setSortField,
  setViewMode,
  startRenameSelected,
  startCreateNode,
  tags,
  users,
  toggleTagId,
  toggleSortOrder,
  toggleFavorite,
  typeLabels,
  viewMode,
  viewModeLabel,
  specialView,
  specialViewItems,
  specialViewLoading,
  loadTrash,
  loadFavorites,
  exitSpecialView,
  restoreSelected,
  restoreAll,
  permanentDeleteSelected,
  emptyTrash,
  createTag,
  updateTag,
  deleteTag,
} = useWorkspacePage();

const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null);
const contextMenuOptions = ref<any[]>([]);

const handleContextMenu = (e: MouseEvent, item: any) => {
  e.preventDefault();

  if (!selectedIdSet.value.has(item.id)) {
    handleItemSelect({ id: item.id, event: e as any });
  }

  contextMenuOptions.value = [
    { label: "Открыть", action: () => openItem(item), icon: IconOpenPanelTop },
    {
      label: "Переименовать",
      action: () => startRenameSelected(),
      icon: IconEdit,
      disabled: !canRenameSelection.value,
    },
    {
      label: "Дублировать",
      action: () => {
        copySelected();
        pasteClipboard();
      },
      icon: IconCopy,
    },
    { label: "Переместить", action: () => cutSelected(), icon: IconCut },
    {
      label: item.isFavorite ? "Убрать из избранного" : "Добавить в избранное",
      action: () => toggleFavorite(item.id, !item.isFavorite),
      icon: IconStar,
    },
    {
      label: "Редактировать теги",
      action: () => console.log("Edit tags"),
      icon: IconTag,
    },
    { divider: true },
    { label: "Удалить", action: () => deleteSelected(), icon: IconTrashCan },
  ];

  contextMenuRef.value?.show(e);
};

const handleEmptyContextMenu = (e: MouseEvent) => {
  e.preventDefault();
  contextMenuOptions.value = [
    {
      label: "Создать папку",
      action: () => startCreateNode("folder"),
      icon: IconFolder,
    },
    {
      label: "Создать документ",
      action: () => startCreateNode("document"),
      icon: IconDocument,
    },
    {
      label: "Создать холст",
      action: () => startCreateNode("canvas"),
      icon: IconPaintBrush,
    },
    { divider: true },
    {
      label: "Вставить",
      action: () => pasteClipboard(),
      icon: IconPaste,
      disabled: !clipboardHasContent.value,
    },
  ];
  contextMenuRef.value?.show(e);
};
</script>

<template>
  <div class="workspace-page">
    <WorkspaceHeader
      v-model="searchQuery"
      :breadcrumbs="breadcrumbLabels"
      :tags="tags"
      :users="users"
      :parent-url="parentUrl"
      @reload="reloadCurrentFolder"
    />

    <div class="workspace-shell">
      <WorkspaceLeftSidebar
        :project-id="projectId"
        :project-name="projectName"
        :folders="folders"
        :tags="tags"
        :active-tag-ids="selectedTagIds"
        :special-view="specialView"
        @open-folder="
          (id) => {
            exitSpecialView();
            openFolder(id);
          }
        "
        @toggle-tag="toggleTagId"
        @create-tag="createTag($event.name, $event.color)"
        @update-tag="updateTag($event.id, $event.name, $event.color)"
        @delete-tag="deleteTag"
        @open-favorites="loadFavorites"
        @open-trash="loadTrash"
      />

      <main class="workspace-main">
        <section
          class="workspace-toolbar"
          aria-label="Инструменты файлового менеджера"
        >
          <BDropdown variant="dark" class="create-dropdown">
            <template #button-content>
              <IconAdd aria-hidden="true" />
              <span>Создать</span>
            </template>
            <BDropdownItem @click="startCreateNode('folder')">
              <IconFolder aria-hidden="true" />
              Папка
            </BDropdownItem>
            <BDropdownItem @click="startCreateNode('document')">
              <IconDocument aria-hidden="true" />
              Документ
            </BDropdownItem>
            <BDropdownItem @click="startCreateNode('canvas')">
              <IconPaintBrush aria-hidden="true" />
              Холст
            </BDropdownItem>
            <BDropdownItem @click="startCreateNode('template')">
              <IconTemplate aria-hidden="true" />
              Шаблон
            </BDropdownItem>
          </BDropdown>

          <div class="tool-group" aria-label="Действия">
            <BButton
              variant="light"
              :disabled="!hasSelection"
              aria-label="Вырезать"
              @click="cutSelected"
            >
              <IconCut aria-hidden="true" />
            </BButton>
            <BButton
              variant="light"
              :disabled="!hasSelection"
              aria-label="Копировать"
              @click="copySelected"
            >
              <IconCopy aria-hidden="true" />
            </BButton>
            <BButton
              variant="light"
              :disabled="!clipboardHasContent"
              aria-label="Вставить"
              @click="pasteClipboard"
            >
              <IconPaste aria-hidden="true" />
            </BButton>
            <BButton
              variant="light"
              :disabled="!canRenameSelection"
              aria-label="Переименовать"
              @click="startRenameSelected"
            >
              <IconEdit aria-hidden="true" />
            </BButton>
            <BButton
              variant="light"
              :disabled="!hasSelection"
              aria-label="Удалить"
              @click="deleteSelected"
            >
              <IconTrashCan aria-hidden="true" />
            </BButton>
          </div>

          <BDropdown variant="outline-dark" class="toolbar-dropdown">
            <template #button-content>
              <IconSortAscending
                aria-hidden="true"
                class="sort-icon"
                :class="{ desc: sortOrder === 'desc' }"
                @click.stop="toggleSortOrder"
              />
              <span>Сортировать</span>
              <IconChevronDown aria-hidden="true" />
            </template>
            <BDropdownItem @click="setSortField('title')"
              >По имени</BDropdownItem
            >
            <BDropdownItem @click="setSortField('createdAt')"
              >По дате создания</BDropdownItem
            >
            <BDropdownItem @click="setSortField('updatedAt')"
              >По дате изменения</BDropdownItem
            >
            <BDropdownItem @click="setSortField('type')">По типу</BDropdownItem>
          </BDropdown>

          <BDropdown
            variant="outline-dark"
            class="toolbar-dropdown view-dropdown"
          >
            <template #button-content>
              <IconView aria-hidden="true" />
              <span>{{ viewModeLabel }}</span>
              <IconChevronDown aria-hidden="true" />
            </template>
            <BDropdownItem @click="setViewMode('grid')">
              <IconGrid aria-hidden="true" />
              Значки
              <IconCheckmark
                v-if="viewMode === 'grid'"
                class="dropdown-check"
                aria-hidden="true"
              />
            </BDropdownItem>
            <BDropdownItem @click="setViewMode('list')">
              <IconList aria-hidden="true" />
              Список
              <IconCheckmark
                v-if="viewMode === 'list'"
                class="dropdown-check"
                aria-hidden="true"
              />
            </BDropdownItem>
          </BDropdown>
        </section>

        <!-- Special view: Trash / Favorites -->
        <template v-if="specialView">
          <section class="special-view-header">
            <button class="special-view-back" @click="exitSpecialView">
              <IconArrowLeft aria-hidden="true" />
              <span>Назад к файлам</span>
            </button>
            <h2 v-if="specialView === 'trash'">
              <IconTrashCan aria-hidden="true" />
              Корзина
            </h2>
            <h2 v-else>
              <IconStar aria-hidden="true" />
              Избранное
            </h2>
            <div v-if="specialView === 'trash'" class="special-view-actions">
              <template v-if="hasSelection">
                <BButton
                  variant="outline-dark"
                  size="sm"
                  @click="restoreSelected"
                >
                  <IconReset aria-hidden="true" />
                  Восстановить выбранные
                </BButton>
                <BButton
                  variant="danger"
                  size="sm"
                  @click="permanentDeleteSelected"
                >
                  <IconTrashCan aria-hidden="true" />
                  Удалить навсегда
                </BButton>
              </template>
              <template v-else>
                <BButton
                  variant="outline-dark"
                  size="sm"
                  :disabled="!specialViewItems.length"
                  @click="restoreAll"
                >
                  <IconReset aria-hidden="true" />
                  Восстановить все
                </BButton>
                <BButton
                  variant="danger"
                  size="sm"
                  :disabled="!specialViewItems.length"
                  @click="emptyTrash"
                >
                  <IconTrashCan aria-hidden="true" />
                  Очистить корзину
                </BButton>
              </template>
            </div>
          </section>

          <section
            v-if="specialViewLoading"
            class="workspace-state"
            aria-live="polite"
          >
            <IconFolder aria-hidden="true" />
            <h2>Загружаем...</h2>
          </section>

          <section
            v-else-if="!specialViewItems.length"
            class="workspace-state"
            aria-live="polite"
          >
            <IconFolder aria-hidden="true" />
            <h2 v-if="specialView === 'trash'">Корзина пуста</h2>
            <h2 v-else>Нет избранных элементов</h2>
            <p v-if="specialView === 'trash'">
              Удалённые элементы будут отображаться здесь.
            </p>
            <p v-else>Добавьте элементы в избранное, нажав на звёздочку.</p>
          </section>

          <section v-else class="workspace-content" :class="[viewMode]">
            <WorkspaceCard
              v-if="viewMode === 'grid'"
              v-for="node in specialViewItems"
              :key="node.id"
              :item="{
                id: node.id,
                name: node.title,
                type: node.type,
                tags: node.tags.map((t) => t.name),
                createdAt: node.createdAt,
                createdBy: node.createdBy,
                updatedAt: node.updatedAt,
                updatedBy: node.updatedBy,
                isFavorite: node.isFavorite,
              }"
              :selected="selectedIdSet.has(node.id)"
              @select="handleItemSelect"
              @open="openItem"
              @toggle-favorite="toggleFavorite($event.id, !$event.isFavorite)"
            />

            <WorkspaceListItem
              v-else
              v-for="node in specialViewItems"
              :key="node.id"
              :item="{
                id: node.id,
                name: node.title,
                type: node.type,
                tags: node.tags.map((t) => t.name),
                createdAt: node.createdAt,
                createdBy: node.createdBy,
                updatedAt: node.updatedAt,
                updatedBy: node.updatedBy,
                isFavorite: node.isFavorite,
              }"
              :selected="selectedIdSet.has(node.id)"
              :type-label="typeLabels[node.type]"
              @select="handleItemSelect"
              @open="openItem"
              @toggle-favorite="toggleFavorite($event.id, !$event.isFavorite)"
            />
          </section>
        </template>

        <!-- Normal folder view -->
        <template v-else>
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

          <section
            v-else-if="!items.length"
            class="workspace-state"
            aria-live="polite"
          >
            <IconFolder aria-hidden="true" />
            <h2>{{ emptyStateTitle }}</h2>
            <p>{{ emptyStateDescription }}</p>
          </section>

          <section
            v-else
            ref="contentRef"
            class="workspace-content"
            :class="[viewMode, { selecting: isDragSelecting }]"
            aria-label="Содержимое папки"
            @pointerdown="handleContentPointerDown"
            @contextmenu="handleEmptyContextMenu"
          >
            <WorkspaceCard
              v-if="viewMode === 'grid'"
              v-for="item in items"
              :key="item.id"
              :data-node-id="item.id"
              :item="item"
              :selected="selectedIdSet.has(item.id)"
              :editing="editingItemId === item.id"
              :draft-name="draftItemName"
              :is-saving-name="isSavingItemName"
              @contextmenu.stop="handleContextMenu($event, item)"
              @open="openItem"
              @select="handleItemSelect"
              @toggle-favorite="toggleFavorite($event.id, !$event.isFavorite)"
              @update:draft-name="draftItemName = $event"
              @finish-name="finishItemName"
              @cancel-name="cancelItemName"
            />

            <WorkspaceListItem
              v-else
              v-for="item in items"
              :key="item.id"
              :data-node-id="item.id"
              :item="item"
              :selected="selectedIdSet.has(item.id)"
              :type-label="typeLabels[item.type]"
              :editing="editingItemId === item.id"
              :draft-name="draftItemName"
              :is-saving-name="isSavingItemName"
              @contextmenu.stop="handleContextMenu($event, item)"
              @open="openItem"
              @select="handleItemSelect"
              @toggle-favorite="toggleFavorite($event.id, !$event.isFavorite)"
              @update:draft-name="draftItemName = $event"
              @finish-name="finishItemName"
              @cancel-name="cancelItemName"
            />

            <div
              v-if="selectionBoxStyle"
              class="selection-box"
              :style="selectionBoxStyle"
            />
          </section> </template
        ><!-- end normal folder view -->
      </main>

      <WorkspaceRightSidebar
        :item="selectedItem"
        :current-directory="currentDirectory"
      />
    </div>

    <ContextMenu ref="contextMenuRef" :options="contextMenuOptions" />
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

.sort-icon {
  transition: transform 0.16s ease;
}

.sort-icon.desc {
  transform: rotate(180deg);
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

.workspace-content {
  position: relative;
}

.workspace-content.selecting {
  user-select: none;
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

.selection-box {
  position: absolute;
  z-index: 2;
  border: 1px solid rgba(25, 25, 25, 0.55);
  border-radius: 8px;
  background: rgba(31, 31, 31, 0.08);
  pointer-events: none;
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

.special-view-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
}

.special-view-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 750;
  color: #1a1a1a;
}

.special-view-header h2 svg {
  width: 20px;
  height: 20px;
}

.special-view-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.special-view-back:hover {
  background: #f0f0f0;
  border-color: #999;
}

.special-view-back svg {
  width: 14px;
  height: 14px;
}

.special-view-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.special-view-actions .btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.special-view-actions svg {
  width: 14px;
  height: 14px;
}
</style>
