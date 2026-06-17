<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import IconArrowLeft from "~icons/carbon/arrow-left";
import IconArrowRight from "~icons/carbon/arrow-right";
import IconChevronUp from "~icons/carbon/chevron-up";
import IconCheckmark from "~icons/carbon/checkmark";
import IconChevronDown from "~icons/carbon/chevron-down";
import IconFolder from "~icons/carbon/folder";
import IconGrid from "~icons/carbon/grid";
import IconList from "~icons/carbon/list";
import IconRenew from "~icons/carbon/renew";
import IconSearch from "~icons/carbon/search";
import IconSortAscending from "~icons/carbon/sort-ascending";
import IconView from "~icons/carbon/view";
import WorkspaceCard from "@/components/workspace/WorkspaceCard.vue";
import WorkspaceListItem from "@/components/workspace/WorkspaceListItem.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  canvasDocumentDragType,
  createCanvasDocumentDragPayload,
} from "@/utils/canvasDocumentDrag";
import type {
  Node,
  NodeId,
  NodeType,
  SortField,
  SortOrder,
  ViewMode,
  WorkspaceItem,
} from "@/types/domain";

type WorkspaceItemSelectPayload = {
  id: NodeId;
  event: MouseEvent;
};

const props = defineProps<{
  projectId: string;
  activeCanvasId?: string;
}>();

const emit = defineEmits<{
  (event: "open-node", node: Node): void;
}>();

const workspaceStore = useWorkspaceStore();
const {
  breadcrumbs,
  currentFolder,
  currentFolderError,
  currentItems,
  currentProject,
  isCurrentFolderLoading,
  nodesById,
  selectedNodeIds,
} = storeToRefs(workspaceStore);

const typeLabels: Record<NodeType, string> = {
  folder: "Папка",
  document: "Документ",
  canvas: "Холст",
  template: "Шаблон",
};

const sortField = ref<SortField>("updatedAt");
const sortOrder = ref<SortOrder>("desc");
const viewMode = ref<ViewMode>("grid");
const searchQuery = ref("");
const folderHistory = ref<NodeId[]>([]);
const historyIndex = ref(-1);

const compareText = (left: string, right: string) =>
  left.localeCompare(right, "ru");

const toWorkspaceItem = (node: Node): WorkspaceItem => ({
  id: node.id,
  name: node.title,
  type: node.type,
  tags: node.tags.map((tag) => tag.name),
  createdAt: node.createdAt,
  createdBy: node.createdBy,
  updatedAt: node.updatedAt,
  updatedBy: node.updatedBy,
  isFavorite: node.isFavorite,
});

const projectName = computed(() => currentProject.value?.title ?? "Проект");
const breadcrumbLabels = computed(() =>
  breadcrumbs.value.map((item) => item.title),
);
const selectedIdSet = computed(() => new Set(selectedNodeIds.value));
const viewModeLabel = computed(() =>
  viewMode.value === "grid" ? "Значки" : "Список",
);

const canGoBack = computed(() => historyIndex.value > 0);
const canGoForward = computed(
  () => historyIndex.value < folderHistory.value.length - 1,
);
const canGoUp = computed(() => Boolean(currentFolder.value?.parentId));

const visibleItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const direction = sortOrder.value === "asc" ? 1 : -1;

  return currentItems.value
    .filter((node) => {
      if (!query) {
        return true;
      }

      const haystack = [
        node.title,
        typeLabels[node.type],
        ...node.tags.map((tag) => tag.name),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    })
    .sort((left, right) => {
      if (sortField.value === "type") {
        return (
          compareText(typeLabels[left.type], typeLabels[right.type]) * direction
        );
      }

      return (
        compareText(left[sortField.value], right[sortField.value]) * direction
      );
    })
    .map(toWorkspaceItem);
});

const selectableItemIds = computed(() =>
  visibleItems.value.map((item) => item.id),
);

const isSelected = (item: WorkspaceItem) => {
  return selectedIdSet.value.has(item.id) || item.id === props.activeCanvasId;
};

const setSortField = (field: SortField) => {
  sortField.value = field;
};

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
};

const setViewMode = (mode: ViewMode) => {
  viewMode.value = mode;
};

const pushHistory = (folderId: NodeId) => {
  const currentHistoryId = folderHistory.value[historyIndex.value];

  if (currentHistoryId === folderId) {
    return;
  }

  folderHistory.value = [
    ...folderHistory.value.slice(0, historyIndex.value + 1),
    folderId,
  ];
  historyIndex.value = folderHistory.value.length - 1;
};

const openFolder = async (folderId: NodeId, shouldPushHistory = true) => {
  await workspaceStore.loadFolder(props.projectId, folderId);

  if (shouldPushHistory && workspaceStore.currentFolderId) {
    pushHistory(workspaceStore.currentFolderId);
  }
};

const goBack = async () => {
  if (!canGoBack.value) {
    return;
  }

  const nextIndex = historyIndex.value - 1;
  const folderId = folderHistory.value[nextIndex];

  if (!folderId) {
    return;
  }

  historyIndex.value = nextIndex;
  await openFolder(folderId, false);
};

const goForward = async () => {
  if (!canGoForward.value) {
    return;
  }

  const nextIndex = historyIndex.value + 1;
  const folderId = folderHistory.value[nextIndex];

  if (!folderId) {
    return;
  }

  historyIndex.value = nextIndex;
  await openFolder(folderId, false);
};

const goUp = async () => {
  const parentId = currentFolder.value?.parentId;

  if (!parentId) {
    return;
  }

  await openFolder(parentId);
};

const reloadCurrentFolder = async () => {
  if (!currentFolder.value) {
    return;
  }

  await workspaceStore.loadFolder(
    props.projectId,
    currentFolder.value.id,
    true,
  );
};

const handleItemSelect = ({ id, event }: WorkspaceItemSelectPayload) => {
  const isAdditive = event.ctrlKey || event.metaKey;

  if (event.shiftKey) {
    workspaceStore.selectRange(selectableItemIds.value, id, isAdditive);
    return;
  }

  if (isAdditive) {
    workspaceStore.toggleSelection(id);
    return;
  }

  workspaceStore.selectOne(id);
};

const openItem = (item: WorkspaceItem) => {
  const node = nodesById.value[item.id];

  if (!node) {
    return;
  }

  if (node.type === "folder") {
    void openFolder(node.id);
    return;
  }

  emit("open-node", node);
};

const handleItemDragStart = (item: WorkspaceItem, event: Event) => {
  const node = nodesById.value[item.id];

  if (
    !(event instanceof DragEvent) ||
    !node ||
    node.type !== "document" ||
    !event.dataTransfer
  ) {
    event.preventDefault();
    return;
  }

  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(
    canvasDocumentDragType,
    JSON.stringify(createCanvasDocumentDragPayload(node)),
  );
  event.dataTransfer.setData("text/plain", node.title);
};

watch(
  () => props.projectId,
  async (nextProjectId) => {
    if (!nextProjectId) {
      return;
    }

    folderHistory.value = [];
    historyIndex.value = -1;
    searchQuery.value = "";

    await workspaceStore.loadFolder(nextProjectId, null);

    if (workspaceStore.currentFolderId) {
      pushHistory(workspaceStore.currentFolderId);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="canvas-project-explorer">
    <header class="explorer-header">
      <div>
        <span>Проводник проекта</span>
        <strong>{{ projectName }}</strong>
      </div>
      <BButton
        variant="light"
        aria-label="Обновить"
        @click="reloadCurrentFolder"
      >
        <IconRenew aria-hidden="true" />
      </BButton>
    </header>

    <nav class="explorer-navigation" aria-label="Навигация по папкам">
      <div class="nav-buttons">
        <BButton
          variant="light"
          :disabled="!canGoBack"
          aria-label="Назад"
          @click="goBack"
        >
          <IconArrowLeft aria-hidden="true" />
        </BButton>
        <BButton
          variant="light"
          :disabled="!canGoForward"
          aria-label="Вперед"
          @click="goForward"
        >
          <IconArrowRight aria-hidden="true" />
        </BButton>
        <BButton
          variant="light"
          :disabled="!canGoUp"
          aria-label="На уровень выше"
          @click="goUp"
        >
          <IconChevronUp aria-hidden="true" />
        </BButton>
      </div>

      <div class="breadcrumb-line" :title="breadcrumbLabels.join(' / ')">
        <IconFolder aria-hidden="true" />
        <span>{{ breadcrumbLabels.join(" / ") || projectName }}</span>
      </div>
    </nav>

    <div class="explorer-search">
      <IconSearch aria-hidden="true" />
      <input v-model="searchQuery" type="search" placeholder="Поиск в папке" />
    </div>

    <section class="explorer-toolbar" aria-label="Отображение и сортировка">
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
        <BDropdownItem @click="setSortField('title')">По имени</BDropdownItem>
        <BDropdownItem @click="setSortField('createdAt')"
          >По дате создания</BDropdownItem
        >
        <BDropdownItem @click="setSortField('updatedAt')"
          >По дате изменения</BDropdownItem
        >
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

    <section
      v-if="isCurrentFolderLoading"
      class="explorer-state"
      aria-live="polite"
    >
      <IconFolder aria-hidden="true" />
      <h2>Загружаем папку</h2>
      <p>Получаем содержимое текущей директории.</p>
    </section>

    <section
      v-else-if="currentFolderError"
      class="explorer-state"
      aria-live="polite"
    >
      <IconFolder aria-hidden="true" />
      <h2>Не удалось открыть папку</h2>
      <p>{{ currentFolderError }}</p>
    </section>

    <section
      v-else-if="!visibleItems.length"
      class="explorer-state"
      aria-live="polite"
    >
      <IconFolder aria-hidden="true" />
      <h2>Здесь пока пусто</h2>
      <p>В текущей папке нет материалов.</p>
    </section>

    <section
      v-else
      class="explorer-content"
      :class="viewMode"
      aria-label="Содержимое папки"
    >
      <WorkspaceCard
        v-if="viewMode === 'grid'"
        v-for="item in visibleItems"
        :key="item.id"
        :data-node-id="item.id"
        :draggable="item.type === 'document'"
        :item="item"
        :selected="isSelected(item)"
        @dragstart="handleItemDragStart(item, $event)"
        @open="openItem"
        @select="handleItemSelect"
      />

      <WorkspaceListItem
        v-else
        v-for="item in visibleItems"
        :key="item.id"
        :data-node-id="item.id"
        :draggable="item.type === 'document'"
        :item="item"
        :selected="isSelected(item)"
        :type-label="typeLabels[item.type]"
        @dragstart="handleItemDragStart(item, $event)"
        @open="openItem"
        @select="handleItemSelect"
      />
    </section>
  </div>
</template>

<style scoped>
.canvas-project-explorer {
  display: grid;
  grid-template-rows: auto auto auto auto minmax(0, 1fr);
  gap: 12px;
  height: 100%;
  min-height: 0;
  padding: 16px;
  background: #ffffff;
  color: #171717;
}

.explorer-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #dddddd;
}

.explorer-header div {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.explorer-header span {
  color: #707070;
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0;
  text-transform: uppercase;
}

.explorer-header strong {
  min-width: 0;
  overflow: hidden;
  color: #171717;
  font-size: 20px;
  font-weight: 750;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.explorer-header .btn,
.nav-buttons .btn {
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

.explorer-header .btn:disabled,
.nav-buttons .btn:disabled {
  color: #999999;
  background: #f3f3f3;
  opacity: 1;
}

.explorer-navigation {
  display: grid;
  gap: 10px;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.breadcrumb-line,
.explorer-search {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid #dddddd;
  border-radius: 8px;
  background: #f8f8f8;
  color: #282828;
}

.breadcrumb-line span {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.explorer-search {
  background: #ffffff;
}

.explorer-search input {
  min-width: 0;
  height: 38px;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #171717;
  font: inherit;
  font-size: 14px;
}

.explorer-search input::placeholder {
  color: #858585;
}

.explorer-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 54px;
  padding: 8px;
  border: 1px solid #dddddd;
  border-radius: 8px;
  background: #f8f8f8;
}

.toolbar-dropdown :deep(.btn) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  border-radius: 8px;
  font-weight: 650;
}

.toolbar-dropdown :deep(.dropdown-toggle::after) {
  display: none;
}

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

.explorer-state {
  display: grid;
  place-items: center;
  align-self: stretch;
  min-height: 260px;
  padding: 34px;
  border: 1px dashed #cfcfcf;
  border-radius: 8px;
  background: #fafafa;
  color: #606060;
  text-align: center;
}

.explorer-state svg {
  width: 42px;
  height: 42px;
  margin-bottom: 10px;
  color: #2a2a2a;
}

.explorer-state h2 {
  margin: 0 0 6px;
  color: #191919;
  font-size: 18px;
  font-weight: 750;
}

.explorer-state p {
  margin: 0;
}

.explorer-content {
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}

.explorer-content.list {
  display: grid;
  align-content: start;
  gap: 8px;
}

.explorer-content.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(126px, 1fr));
  align-content: start;
  gap: 14px;
}

@media (max-width: 720px) {
  .canvas-project-explorer {
    padding: 12px;
  }

  .explorer-toolbar {
    align-items: stretch;
    flex-wrap: wrap;
  }
}
</style>
