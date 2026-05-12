<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import IconChevronDown from "~icons/carbon/chevron-down";
import IconDocument from "~icons/carbon/document";
import IconLayers from "~icons/carbon/layers";
import IconTrashCan from "~icons/carbon/trash-can";
import CanvasConnectionHandles from "@/components/canvas/CanvasConnectionHandles.vue";
import CanvasConnectionLayer from "@/components/canvas/CanvasConnectionLayer.vue";
import CanvasElementFrame from "@/components/canvas/CanvasElementFrame.vue";
import {
  getElementHandlePoints,
  getHandlePoint,
} from "@/components/canvas/connectionRouting";
import { canvasComponentRegistry } from "@/components/canvas/componentRegistry";
import {
  createCanvasElement,
  getRootCanvasElements,
  type CanvasConnection,
  type CanvasData,
  type CanvasElement,
  type CanvasElementId,
  type CanvasHandlePosition,
  type CanvasPoint,
} from "@/types/canvas";
import {
  hasCanvasDocumentDragPayload,
  parseCanvasDocumentDragPayload,
} from "@/utils/canvasDocumentDrag";

const canvasElementDragType = "application/x-gdteams-canvas-element";

type DraftCanvasConnection = {
  sourceId: CanvasElementId;
  sourceHandle: CanvasHandlePosition;
  targetPoint: CanvasPoint;
  targetElementId?: CanvasElementId | null;
  targetHandle?: CanvasHandlePosition | null;
};

type SnapTarget = {
  element: CanvasElement;
  handle: CanvasHandlePosition;
  point: CanvasPoint;
  distance: number;
};

const connectionSnapDistance = 28;

const props = defineProps<{
  data: CanvasData;
  projectId: string;
}>();

const emit = defineEmits<{
  (event: "update:data", data: CanvasData): void;
}>();

const workspaceRef = ref<HTMLElement | null>(null);
const selectedElementIds = ref<Set<CanvasElementId>>(new Set());
const collapsedCategories = ref<Record<string, boolean>>({});
const isDocumentDropActive = ref(false);
const draftConnection = ref<DraftCanvasConnection | null>(null);

const elements = computed(() => props.data.elements);
const connections = computed(() => props.data.connections);
const rootElements = computed(() => getRootCanvasElements(elements.value));
const selectedElements = computed(() =>
  elements.value.filter((element) => selectedElementIds.value.has(element.id)),
);

const emitData = (nextData: CanvasData) => {
  emit("update:data", {
    elements: nextData.elements.map((element) => ({ ...element })),
    connections: nextData.connections.map((connection) => ({ ...connection })),
  });
};

const setElements = (nextElements: CanvasElement[]) => {
  emitData({
    ...props.data,
    elements: nextElements,
  });
};

const addElement = (element: CanvasElement) => {
  setElements([...elements.value, element]);
  selectedElementIds.value = new Set([element.id]);
};

const createConnectionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `connection-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const addConnection = (connection: CanvasConnection) => {
  emitData({
    ...props.data,
    connections: [...connections.value, connection],
  });
};

const updateElement = (nextElement: CanvasElement) => {
  setElements(
    elements.value.map((element) =>
      element.id === nextElement.id ? { ...element, ...nextElement } : element,
    ),
  );
};

const deleteSelectedElements = () => {
  if (!selectedElementIds.value.size) {
    return;
  }

  const nextElementIds = new Set(
    elements.value
      .filter((element) => !selectedElementIds.value.has(element.id))
      .map((element) => element.id),
  );

  emitData({
    elements: elements.value.filter(
      (element) => !selectedElementIds.value.has(element.id),
    ),
    connections: connections.value.filter(
      (connection) =>
        nextElementIds.has(connection.sourceId) &&
        (!connection.targetId || nextElementIds.has(connection.targetId)),
    ),
  });
  selectedElementIds.value = new Set();
};

const selectElement = ({
  element,
  event,
}: {
  element: CanvasElement;
  event: MouseEvent;
}) => {
  const isAdditive = event.ctrlKey || event.metaKey;

  if (isAdditive) {
    const nextSelection = new Set(selectedElementIds.value);

    if (nextSelection.has(element.id)) {
      nextSelection.delete(element.id);
    } else {
      nextSelection.add(element.id);
    }

    selectedElementIds.value = nextSelection;
    return;
  }

  selectedElementIds.value = new Set([element.id]);
};

const clearSelection = (event: MouseEvent) => {
  if ((event.target as HTMLElement).closest(".canvas-element-frame")) {
    return;
  }

  selectedElementIds.value = new Set();
};

const toggleCategory = (categoryId: string) => {
  collapsedCategories.value = {
    ...collapsedCategories.value,
    [categoryId]: !collapsedCategories.value[categoryId],
  };
};

const handlePaletteDragStart = (typeId: string, event: DragEvent) => {
  if (!event.dataTransfer) {
    return;
  }

  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(canvasElementDragType, typeId);
};

const getWorkspacePoint = (event: MouseEvent | DragEvent): CanvasPoint => {
  const rect = workspaceRef.value?.getBoundingClientRect();

  if (!rect || !workspaceRef.value) {
    return { x: 0, y: 0 };
  }

  return {
    x: event.clientX - rect.left + workspaceRef.value.scrollLeft,
    y: event.clientY - rect.top + workspaceRef.value.scrollTop,
  };
};

const addRegistryElementFromDrop = (typeId: string, event: DragEvent) => {
  const defaults = canvasComponentRegistry.getDefaults(typeId);

  if (!defaults) {
    return;
  }

  const point = getWorkspacePoint(event);
  const width = defaults.width ?? 140;
  const height = defaults.height ?? 100;

  addElement(
    createCanvasElement(
      typeId,
      {
        x: Math.max(0, Math.round(point.x - width / 2)),
        y: Math.max(0, Math.round(point.y - height / 2)),
      },
      defaults,
    ),
  );
};

const addDocumentCardFromDrop = (event: DragEvent) => {
  const payload = parseCanvasDocumentDragPayload(event.dataTransfer);
  const defaults = canvasComponentRegistry.getDefaults("document-card");

  if (!payload || !defaults) {
    return;
  }

  const point = getWorkspacePoint(event);
  const width = defaults.width ?? 360;
  const height = defaults.height ?? 260;

  addElement(
    createCanvasElement(
      "document-card",
      {
        x: Math.max(0, Math.round(point.x - width / 2)),
        y: Math.max(0, Math.round(point.y - 24)),
        documentId: payload.nodeId,
        projectId: payload.projectId,
        title: payload.title,
      },
      defaults,
    ),
  );
};

const handleWorkspaceDragOver = (event: DragEvent) => {
  const hasPaletteElement = event.dataTransfer?.types.includes(
    canvasElementDragType,
  );
  const hasDocument = hasCanvasDocumentDragPayload(event.dataTransfer);

  if (!hasPaletteElement && !hasDocument) {
    return;
  }

  event.preventDefault();
  isDocumentDropActive.value = hasDocument;

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
};

const handleWorkspaceDragLeave = (event: DragEvent) => {
  if (event.currentTarget === event.target) {
    isDocumentDropActive.value = false;
  }
};

const handleWorkspaceDrop = (event: DragEvent) => {
  const typeId = event.dataTransfer?.getData(canvasElementDragType);
  const hasDocument = hasCanvasDocumentDragPayload(event.dataTransfer);

  if (!typeId && !hasDocument) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  isDocumentDropActive.value = false;

  if (hasDocument) {
    addDocumentCardFromDrop(event);
    return;
  }

  if (typeId) {
    addRegistryElementFromDrop(typeId, event);
  }
};

const stopDraftConnection = () => {
  draftConnection.value = null;
  window.removeEventListener("mousemove", updateDraftConnection);
  window.removeEventListener("mouseup", finishDraftConnectionAtPoint);
};

const updateDraftConnection = (event: MouseEvent) => {
  const draft = draftConnection.value;

  if (!draft) {
    return;
  }

  const target = resolveConnectionTarget(
    getWorkspacePoint(event),
    draft.sourceId,
  );

  draftConnection.value = {
    ...draft,
    ...target,
  };
};

const getPointDistance = (left: CanvasPoint, right: CanvasPoint) => {
  return Math.hypot(left.x - right.x, left.y - right.y);
};

const getNearestConnectionHandle = (
  point: CanvasPoint,
  sourceId: CanvasElementId,
): SnapTarget | null => {
  let nearest: SnapTarget | null = null;

  for (const element of elements.value) {
    if (element.id === sourceId) {
      continue;
    }

    for (const handleTarget of getElementHandlePoints(element)) {
      const distance = getPointDistance(point, handleTarget.point);

      if (distance > connectionSnapDistance) {
        continue;
      }

      if (!nearest || distance < nearest.distance) {
        nearest = {
          element,
          handle: handleTarget.handle,
          point: handleTarget.point,
          distance,
        };
      }
    }
  }

  return nearest;
};

const resolveConnectionTarget = (
  point: CanvasPoint,
  sourceId: CanvasElementId,
) => {
  const snapTarget = getNearestConnectionHandle(point, sourceId);

  if (!snapTarget) {
    return {
      targetPoint: point,
      targetElementId: null,
      targetHandle: null,
    };
  }

  return {
    targetPoint: snapTarget.point,
    targetElementId: snapTarget.element.id,
    targetHandle: snapTarget.handle,
  };
};

const finishDraftConnectionAtPoint = (event: MouseEvent) => {
  const draft = draftConnection.value;

  if (!draft) {
    return;
  }

  event.preventDefault();

  const target = resolveConnectionTarget(
    getWorkspacePoint(event),
    draft.sourceId,
  );

  if (target.targetElementId !== null && target.targetElementId !== undefined && target.targetHandle) {
    addConnection({
      id: createConnectionId(),
      sourceId: draft.sourceId,
      sourceHandle: draft.sourceHandle,
      targetId: target.targetElementId,
      targetHandle: target.targetHandle,
      type: "orthogonal",
      markerEnd: "arrow",
    });
  } else {
    addConnection({
      id: createConnectionId(),
      sourceId: draft.sourceId,
      sourceHandle: draft.sourceHandle,
      targetId: null,
      targetHandle: null,
      targetPoint: target.targetPoint,
      type: "orthogonal",
      markerEnd: "arrow",
    });
  }

  stopDraftConnection();
};

const startConnection = ({
  element,
  handle,
  event,
}: {
  element: CanvasElement;
  handle: CanvasHandlePosition;
  event: MouseEvent;
}) => {
  event.preventDefault();
  event.stopPropagation();

  selectedElementIds.value = new Set([element.id]);
  draftConnection.value = {
    sourceId: element.id,
    sourceHandle: handle,
    targetPoint: getHandlePoint(element, handle),
    targetElementId: null,
    targetHandle: null,
  };

  window.addEventListener("mousemove", updateDraftConnection);
  window.addEventListener("mouseup", finishDraftConnectionAtPoint);
};

const endConnection = ({
  element,
  handle,
}: {
  element: CanvasElement;
  handle: CanvasHandlePosition;
}) => {
  const draft = draftConnection.value;

  if (!draft) {
    return;
  }

  if (draft.sourceId === element.id && draft.sourceHandle === handle) {
    stopDraftConnection();
    return;
  }

  const hasSameConnection = connections.value.some((connection) => {
    return (
      connection.sourceId === draft.sourceId &&
      connection.sourceHandle === draft.sourceHandle &&
      connection.targetId === element.id &&
      connection.targetHandle === handle
    );
  });

  if (!hasSameConnection) {
    addConnection({
      id: createConnectionId(),
      sourceId: draft.sourceId,
      targetId: element.id,
      sourceHandle: draft.sourceHandle,
      targetHandle: handle,
      type: "orthogonal",
      markerEnd: "arrow",
    });
  }

  stopDraftConnection();
};

const moveLayer = (elementId: CanvasElementId, direction: -1 | 1) => {
  const index = elements.value.findIndex((element) => element.id === elementId);
  const nextIndex = index + direction;

  if (index === -1 || nextIndex < 0 || nextIndex >= elements.value.length) {
    return;
  }

  const nextElements = [...elements.value];
  const [element] = nextElements.splice(index, 1);

  if (!element) {
    return;
  }

  nextElements.splice(nextIndex, 0, element);
  setElements(nextElements);
};

const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;

  if (target.matches('input, textarea, [contenteditable="true"]')) {
    return;
  }

  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteSelectedElements();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  stopDraftConnection();
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <section class="canvas-workspace-shell">
    <aside class="canvas-palette" aria-label="Компоненты холста">
      <header class="panel-header">
        <strong>Компоненты</strong>
      </header>

      <div class="palette-scroll">
        <section
          v-for="category in canvasComponentRegistry.categories"
          :key="category.id"
          class="palette-category"
        >
          <button
            class="category-button"
            type="button"
            @click="toggleCategory(category.id)"
          >
            <span>{{ category.name }}</span>
            <IconChevronDown
              aria-hidden="true"
              :class="{ collapsed: collapsedCategories[category.id] }"
            />
          </button>

          <div v-show="!collapsedCategories[category.id]" class="palette-items">
            <button
              v-for="type in category.types"
              :key="type.id"
              class="palette-item"
              type="button"
              draggable="true"
              @dragstart="handlePaletteDragStart(type.id, $event)"
            >
              <span
                class="palette-preview"
                :style="{
                  backgroundColor: type.previewBg ?? '#f3f3f3',
                  borderColor: type.previewBorder ?? '#d7dce3',
                }"
              >
                <IconDocument
                  v-if="type.id === 'document-card'"
                  aria-hidden="true"
                />
                <span v-else>{{ type.name.slice(0, 2) }}</span>
              </span>
              <span>{{ type.name }}</span>
            </button>
          </div>
        </section>
      </div>
    </aside>

    <main
      ref="workspaceRef"
      class="canvas-workspace"
      :class="{ 'document-drop-active': isDocumentDropActive }"
      aria-label="Холст"
      @mousedown="clearSelection"
      @dragover="handleWorkspaceDragOver"
      @dragleave="handleWorkspaceDragLeave"
      @drop="handleWorkspaceDrop"
    >
      <div class="canvas-grid" />
      <CanvasConnectionLayer
        :elements="elements"
        :connections="connections"
        :draft-connection="draftConnection"
      />

      <CanvasElementFrame
        v-for="element in rootElements"
        :key="element.id"
        class="canvas-element-frame"
        :element="element"
        :selected="selectedElementIds.has(element.id)"
        :workspace-element="workspaceRef"
        @select="selectElement"
        @update:element="updateElement"
      />

      <CanvasConnectionHandles
        v-for="element in rootElements.filter((item) => draftConnection || selectedElementIds.has(item.id))"
        :key="`handles-${element.id}`"
        :element="element"
        @connect-start="
          (handle, event) => startConnection({ element, handle, event })
        "
        @connect-end="(handle) => endConnection({ element, handle })"
      />

      <div v-if="isDocumentDropActive" class="drop-hint">
        Отпустите документ, чтобы добавить карточку на холст
      </div>
    </main>

    <aside class="canvas-layers" aria-label="Слои холста">
      <header class="panel-header">
        <IconLayers aria-hidden="true" />
        <strong>Слои</strong>
      </header>

      <div v-if="!elements.length" class="empty-layers">Нет слоев</div>
      <div v-else class="layers-list">
        <div
          v-for="element in [...elements].reverse()"
          :key="element.id"
          class="layer-item"
          :class="{ selected: selectedElementIds.has(element.id) }"
          role="button"
          tabindex="0"
          @click="selectedElementIds = new Set([element.id])"
          @keydown.enter.prevent="selectedElementIds = new Set([element.id])"
          @keydown.space.prevent="selectedElementIds = new Set([element.id])"
        >
          <span>{{
            canvasComponentRegistry.getType(element.type)?.name ?? element.type
          }}</span>
          <span class="layer-actions">
            <button
              type="button"
              aria-label="Поднять слой"
              @click.stop="moveLayer(element.id, 1)"
            >
              <IconChevronDown aria-hidden="true" class="up-icon" />
            </button>
            <button
              type="button"
              aria-label="Опустить слой"
              @click.stop="moveLayer(element.id, -1)"
            >
              <IconChevronDown aria-hidden="true" />
            </button>
          </span>
        </div>
      </div>

      <button
        class="delete-button"
        type="button"
        :disabled="!selectedElements.length"
        @click="deleteSelectedElements"
      >
        <IconTrashCan aria-hidden="true" />
        <span>Удалить</span>
      </button>
    </aside>
  </section>
</template>

<style scoped>
.canvas-workspace-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 260px;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #ffffff;
  color: #171717;
}

.canvas-palette,
.canvas-layers {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-width: 0;
  border-color: #dddddd;
  background: #f8f8f8;
}

.canvas-palette {
  border-right: 1px solid #dddddd;
}

.canvas-layers {
  border-left: 1px solid #dddddd;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid #dddddd;
  color: #202020;
}

.panel-header svg {
  width: 18px;
  height: 18px;
}

.panel-header strong {
  font-size: 16px;
  font-weight: 750;
}

.palette-scroll,
.layers-list {
  min-height: 0;
  overflow: auto;
  padding: 12px;
}

.palette-category {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
}

.category-button,
.palette-item,
.layer-item,
.delete-button {
  display: flex;
  align-items: center;
  width: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #242424;
  font: inherit;
}

.category-button {
  justify-content: space-between;
  min-height: 36px;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 750;
}

.category-button:hover,
.palette-item:hover,
.layer-item:hover {
  border-color: #dddddd;
  background: #ffffff;
}

.category-button svg {
  width: 16px;
  height: 16px;
  transition: transform 0.14s ease;
}

.category-button svg.collapsed {
  transform: rotate(-90deg);
}

.palette-items {
  display: grid;
  gap: 4px;
}

.palette-item {
  gap: 10px;
  min-height: 46px;
  padding: 6px 8px;
  cursor: grab;
  text-align: left;
}

.palette-item:active {
  cursor: grabbing;
}

.palette-preview {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border: 1px solid #d7dce3;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 750;
}

.palette-preview svg {
  width: 18px;
  height: 18px;
}

.canvas-workspace {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: #ffffff;
}

.canvas-grid {
  position: absolute;
  inset: 0;
  min-width: 2200px;
  min-height: 1400px;
  background-image: radial-gradient(#d8d8d8 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.6;
  pointer-events: none;
}

.canvas-element-frame {
  z-index: 2;
}

.drop-hint {
  position: sticky;
  left: 50%;
  bottom: 24px;
  z-index: 20;
  width: max-content;
  max-width: calc(100% - 48px);
  margin: 0 auto 24px;
  padding: 10px 14px;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  background: #ffffff;
  color: #202020;
  font-size: 14px;
  font-weight: 650;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
}

.canvas-workspace.document-drop-active::after {
  position: absolute;
  inset: 14px;
  z-index: 3;
  border: 2px dashed rgba(32, 32, 32, 0.32);
  border-radius: 12px;
  content: "";
  pointer-events: none;
}

.empty-layers {
  display: grid;
  place-items: center;
  min-height: 160px;
  color: #777777;
  font-size: 14px;
}

.layers-list {
  display: grid;
  align-content: start;
  gap: 4px;
}

.layer-item {
  justify-content: space-between;
  gap: 8px;
  min-height: 40px;
  padding: 0 8px 0 10px;
  text-align: left;
}

.layer-item.selected {
  border-color: #202020;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #202020;
}

.layer-item > span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-actions {
  display: inline-flex;
  gap: 2px;
}

.layer-actions button,
.delete-button {
  border: 1px solid #d7d7d7;
  border-radius: 7px;
  background: #ffffff;
}

.layer-actions button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #444444;
}

.layer-actions svg {
  width: 14px;
  height: 14px;
}

.up-icon {
  transform: rotate(180deg);
}

.delete-button {
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  margin: 12px;
  color: #b42318;
  font-weight: 650;
}

.delete-button:disabled {
  color: #999999;
  background: #eeeeee;
  opacity: 1;
}

.delete-button svg {
  width: 17px;
  height: 17px;
}

@media (max-width: 1100px) {
  .canvas-workspace-shell {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .canvas-layers {
    display: none;
  }
}
</style>
