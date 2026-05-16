<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import CanvasConnectionHandles from "@/components/canvas/CanvasConnectionHandles.vue";
import CanvasConnectionLayer from "@/components/canvas/CanvasConnectionLayer.vue";
import CanvasElementFrame from "@/components/canvas/CanvasElementFrame.vue";
import CanvasElementPropertiesPanel from "@/components/canvas/panels/CanvasElementPropertiesPanel.vue";
import { canvasComponentRegistry } from "@/components/canvas/componentRegistry";
import {
  getElementHandlePoints,
  getHandlePoint,
} from "@/components/canvas/connectionRouting";
import CanvasLayersPanel from "@/components/canvas/workspace/CanvasLayersPanel.vue";
import CanvasPalettePanel from "@/components/canvas/workspace/CanvasPalettePanel.vue";
import {
  createCanvasElement,
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
const connectionSnapDistance = 28;
const pasteOffset = 24;

type DraftCanvasConnection = {
  sourceId: CanvasElementId;
  sourceHandle: CanvasHandlePosition;
  targetPoint: CanvasPoint;
  targetElementId?: CanvasElementId | null;
  targetHandle?: CanvasHandlePosition | null;
};

type SelectionBox = {
  start: CanvasPoint;
  current: CanvasPoint;
};

type SnapTarget = {
  element: CanvasElement;
  handle: CanvasHandlePosition;
  point: CanvasPoint;
  distance: number;
};

const props = defineProps<{
  data: CanvasData;
  projectId: string;
}>();

const emit = defineEmits<{
  (event: "update:data", data: CanvasData): void;
}>();

const workspaceRef = ref<HTMLElement | null>(null);
const selectedElementIds = ref<Set<CanvasElementId>>(new Set());
const isDocumentDropActive = ref(false);
const draftConnection = ref<DraftCanvasConnection | null>(null);
const selectionBox = ref<SelectionBox | null>(null);
const clipboardElements = ref<CanvasElement[]>([]);

const elements = computed(() => props.data.elements);
const connections = computed(() => props.data.connections);
const visibleElements = computed(() =>
  elements.value.filter((element) => !element.isHidden),
);
const visibleElementIds = computed(
  () => new Set(visibleElements.value.map((element) => element.id)),
);
const visibleConnections = computed(() =>
  connections.value.filter(
    (connection) =>
      visibleElementIds.value.has(connection.sourceId) &&
      (!connection.targetId ||
        visibleElementIds.value.has(connection.targetId)),
  ),
);
const selectedElements = computed(() =>
  elements.value.filter((element) => selectedElementIds.value.has(element.id)),
);
const selectedElement = computed(() =>
  selectedElements.value.length === 1 ? selectedElements.value[0] : null,
);
const layerElements = computed(() => [...elements.value].reverse());

const selectionBoxStyle = computed(() => {
  const box = selectionBox.value;

  if (!box) {
    return {};
  }

  const left = Math.min(box.start.x, box.current.x);
  const top = Math.min(box.start.y, box.current.y);
  const width = Math.abs(box.current.x - box.start.x);
  const height = Math.abs(box.current.y - box.start.y);

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  };
});

const styleMenuStyle = computed(() => {
  const element = selectedElement.value;

  if (!element) {
    return {};
  }

  return {
    left: `${element.x + element.width + 14}px`,
    top: `${element.y}px`,
  };
});

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

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const createLayerName = (
  type: string,
  sourceElements: CanvasElement[] = elements.value,
) => {
  const count = sourceElements.filter(
    (element) => element.type === type,
  ).length;
  return count === 0 ? type : `${type} ${count + 1}`;
};

const assignMissingLayerNames = (sourceElements: CanvasElement[]) => {
  const typeCounts: Record<string, number> = {};
  let changed = false;

  const nextElements = sourceElements.map((element) => {
    typeCounts[element.type] = (typeCounts[element.type] ?? 0) + 1;

    if (element.layerName) {
      return element;
    }

    changed = true;
    const count = typeCounts[element.type];

    return {
      ...element,
      layerName: count === 1 ? element.type : `${element.type} ${count}`,
    };
  });

  return changed ? nextElements : sourceElements;
};

const withLayerName = (element: CanvasElement) => ({
  ...element,
  layerName: element.layerName ?? createLayerName(element.type),
});

const addElement = (element: CanvasElement) => {
  const nextElement = withLayerName(element);
  setElements([...elements.value, nextElement]);
  selectedElementIds.value = new Set([nextElement.id]);
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

const moveSelectedElements = ({ dx, dy }: { dx: number; dy: number }) => {
  if (!selectedElementIds.value.size) {
    return;
  }

  const movingElements = elements.value.filter((element) =>
    selectedElementIds.value.has(element.id),
  );
  const minX = Math.min(...movingElements.map((element) => element.x));
  const minY = Math.min(...movingElements.map((element) => element.y));
  const adjustedDx = Math.round(minX + dx) < 0 ? -minX : Math.round(dx);
  const adjustedDy = Math.round(minY + dy) < 0 ? -minY : Math.round(dy);

  setElements(
    elements.value.map((element) =>
      selectedElementIds.value.has(element.id)
        ? {
            ...element,
            x: Math.max(0, Math.round(element.x + adjustedDx)),
            y: Math.max(0, Math.round(element.y + adjustedDy)),
          }
        : element,
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

const selectLayerElement = ({
  elementId,
  selectionEvent,
}: {
  elementId: CanvasElementId;
  selectionEvent: Pick<
    MouseEvent | KeyboardEvent,
    "shiftKey" | "ctrlKey" | "metaKey"
  >;
}) => {
  if (selectionEvent.shiftKey && selectedElementIds.value.size) {
    const firstSelectedIndex = layerElements.value.findIndex((element) =>
      selectedElementIds.value.has(element.id),
    );
    const clickedIndex = layerElements.value.findIndex(
      (element) => element.id === elementId,
    );

    if (firstSelectedIndex !== -1 && clickedIndex !== -1) {
      const [from, to] = [
        Math.min(firstSelectedIndex, clickedIndex),
        Math.max(firstSelectedIndex, clickedIndex),
      ];
      selectedElementIds.value = new Set(
        layerElements.value.slice(from, to + 1).map((element) => element.id),
      );
      return;
    }
  }

  if (selectionEvent.ctrlKey || selectionEvent.metaKey) {
    const nextSelection = new Set(selectedElementIds.value);

    if (nextSelection.has(elementId)) {
      nextSelection.delete(elementId);
    } else {
      nextSelection.add(elementId);
    }

    selectedElementIds.value = nextSelection;
    return;
  }

  selectedElementIds.value = new Set([elementId]);
};

const reorderSelectedLayers = ({
  targetId,
  position,
}: {
  targetId: CanvasElementId;
  position: "before" | "after";
}) => {
  if (
    !selectedElementIds.value.size ||
    selectedElementIds.value.has(targetId)
  ) {
    return;
  }

  const panelOrder = layerElements.value;
  const moving = panelOrder.filter((element) =>
    selectedElementIds.value.has(element.id),
  );
  const remaining = panelOrder.filter(
    (element) => !selectedElementIds.value.has(element.id),
  );
  const targetIndex = remaining.findIndex((element) => element.id === targetId);

  if (targetIndex === -1) {
    return;
  }

  const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
  const nextPanelOrder = [...remaining];
  nextPanelOrder.splice(insertIndex, 0, ...moving);
  setElements([...nextPanelOrder].reverse());
};

const toggleElementVisibility = (elementId: CanvasElementId) => {
  setElements(
    elements.value.map((element) =>
      element.id === elementId
        ? { ...element, isHidden: !element.isHidden }
        : element,
    ),
  );
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

const intersectsSelectionBox = (element: CanvasElement, box: SelectionBox) => {
  const left = Math.min(box.start.x, box.current.x);
  const right = Math.max(box.start.x, box.current.x);
  const top = Math.min(box.start.y, box.current.y);
  const bottom = Math.max(box.start.y, box.current.y);
  const elementRight = element.x + element.width;
  const elementBottom = element.y + element.height;

  return !(
    elementRight < left ||
    element.x > right ||
    elementBottom < top ||
    element.y > bottom
  );
};

const startAreaSelection = (event: MouseEvent) => {
  if (
    (event.target as HTMLElement).closest(
      ".canvas-element-frame, .canvas-style-menu",
    )
  ) {
    return;
  }

  event.preventDefault();
  const start = getWorkspacePoint(event);
  selectionBox.value = { start, current: start };

  const onMove = (moveEvent: MouseEvent) => {
    if (!selectionBox.value) {
      return;
    }

    selectionBox.value = {
      ...selectionBox.value,
      current: getWorkspacePoint(moveEvent),
    };
  };

  const onUp = () => {
    const box = selectionBox.value;
    selectionBox.value = null;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);

    if (!box) {
      return;
    }

    const width = Math.abs(box.current.x - box.start.x);
    const height = Math.abs(box.current.y - box.start.y);

    if (width < 4 && height < 4) {
      selectedElementIds.value = new Set();
      return;
    }

    selectedElementIds.value = new Set(
      visibleElements.value
        .filter((element) => intersectsSelectionBox(element, box))
        .map((element) => element.id),
    );
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
};

const copySelectedElements = () => {
  clipboardElements.value = selectedElements.value.map((element) =>
    JSON.parse(JSON.stringify(element)),
  ) as CanvasElement[];
};

const pasteElements = () => {
  if (!clipboardElements.value.length) {
    return;
  }

  const nextElements = [...elements.value];
  const pastedElements = clipboardElements.value.map((element) => {
    const nextElement = {
      ...element,
      id: createId("element"),
      x: element.x + pasteOffset,
      y: element.y + pasteOffset,
      layerName: createLayerName(element.type, nextElements),
      isHidden: false,
    };
    nextElements.push(nextElement);
    return nextElement;
  });

  setElements(nextElements);
  selectedElementIds.value = new Set(
    pastedElements.map((element) => element.id),
  );
};

const cutSelectedElements = () => {
  copySelectedElements();
  deleteSelectedElements();
};

const getPointDistance = (left: CanvasPoint, right: CanvasPoint) => {
  return Math.hypot(left.x - right.x, left.y - right.y);
};

const getNearestConnectionHandle = (
  point: CanvasPoint,
  sourceId: CanvasElementId,
): SnapTarget | null => {
  let nearest: SnapTarget | null = null;

  for (const element of visibleElements.value) {
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

const stopDraftConnection = () => {
  draftConnection.value = null;
  window.removeEventListener("mousemove", updateDraftConnection);
  window.removeEventListener("mouseup", finishDraftConnectionAtPoint);
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
  const hasElementTarget =
    target.targetElementId !== null &&
    target.targetElementId !== undefined &&
    target.targetHandle;

  addConnection({
    id: createId("connection"),
    sourceId: draft.sourceId,
    sourceHandle: draft.sourceHandle,
    targetId: hasElementTarget ? target.targetElementId : null,
    targetHandle: hasElementTarget ? target.targetHandle : null,
    targetPoint: hasElementTarget ? undefined : target.targetPoint,
    type: "orthogonal",
    markerEnd: "arrow",
  });

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
      id: createId("connection"),
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

const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;

  if (target.matches('input, textarea, [contenteditable="true"]')) {
    return;
  }

  const isModifier = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();

  if (isModifier && key === "a") {
    event.preventDefault();
    selectedElementIds.value = new Set(
      visibleElements.value.map((element) => element.id),
    );
    return;
  }

  if (isModifier && key === "c") {
    event.preventDefault();
    copySelectedElements();
    return;
  }

  if (isModifier && key === "x") {
    event.preventDefault();
    cutSelectedElements();
    return;
  }

  if (isModifier && key === "v") {
    event.preventDefault();
    pasteElements();
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

watch(
  elements,
  (nextElements) => {
    const namedElements = assignMissingLayerNames(nextElements);

    if (namedElements !== nextElements) {
      setElements(namedElements);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopDraftConnection();
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <section class="canvas-workspace-shell">
    <CanvasPalettePanel @element-drag-start="handlePaletteDragStart" />

    <main
      ref="workspaceRef"
      class="canvas-workspace"
      :class="{ 'document-drop-active': isDocumentDropActive }"
      aria-label="Холст"
      @mousedown="startAreaSelection"
      @dragover="handleWorkspaceDragOver"
      @dragleave="handleWorkspaceDragLeave"
      @drop="handleWorkspaceDrop"
    >
      <div class="canvas-grid" />
      <CanvasConnectionLayer
        :elements="visibleElements"
        :connections="visibleConnections"
        :draft-connection="draftConnection"
      />

      <CanvasElementFrame
        v-for="(element, index) in elements"
        v-show="!element.isHidden"
        :key="element.id"
        class="canvas-element-frame"
        :element="element"
        :selected="selectedElementIds.has(element.id)"
        :multi-selected="
          selectedElementIds.has(element.id) && selectedElementIds.size > 1
        "
        :z-index="index + 2"
        :workspace-element="workspaceRef"
        @select="selectElement"
        @move-selected="moveSelectedElements"
        @update:element="updateElement"
      />

      <CanvasConnectionHandles
        v-for="element in visibleElements.filter(
          (item) => draftConnection || selectedElementIds.has(item.id),
        )"
        :key="`handles-${element.id}`"
        :element="element"
        @connect-start="
          (handle, event) => startConnection({ element, handle, event })
        "
        @connect-end="(handle) => endConnection({ element, handle })"
      />

      <CanvasElementPropertiesPanel
        v-if="selectedElement && !selectedElement.isHidden"
        class="canvas-style-menu"
        :style="styleMenuStyle"
        :element="selectedElement"
        :element-name="selectedElement.layerName ?? selectedElement.type"
        @update:element="updateElement"
      />

      <div
        v-if="selectionBox"
        class="selection-box"
        :style="selectionBoxStyle"
      />

      <div v-if="isDocumentDropActive" class="drop-hint">
        Отпустите документ, чтобы добавить карточку на холст
      </div>
    </main>

    <CanvasLayersPanel
      :elements="elements"
      :selected-element-ids="selectedElementIds"
      @select-element="selectLayerElement"
      @reorder-selected="reorderSelectedLayers"
      @toggle-visibility="toggleElementVisibility"
      @delete-selected="deleteSelectedElements"
    />
  </section>
</template>

<style scoped>
.canvas-workspace-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 280px;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #ffffff;
  color: #171717;
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

.selection-box {
  position: absolute;
  z-index: 1000;
  border: 1px solid #202020;
  background: rgba(32, 32, 32, 0.08);
  pointer-events: none;
}

.canvas-style-menu {
  position: absolute;
  z-index: 1001;
  width: 280px;
  max-width: 280px;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
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

@media (max-width: 1100px) {
  .canvas-workspace-shell {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  :deep(.canvas-layers) {
    display: none;
  }
}
</style>
