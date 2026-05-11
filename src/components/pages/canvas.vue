<script setup lang="ts">
import "canvas-drawing-editor";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import IconArrowDown from "~icons/carbon/arrow-down";
import IconArrowLeft from "~icons/carbon/arrow-left";
import IconArrowUp from "~icons/carbon/arrow-up";
import CanvasDocumentCard from "@/components/CanvasDocumentCard.vue";
import CanvasProjectExplorer from "@/components/CanvasProjectExplorer.vue";
import { cloneCanvasData, createDefaultCanvasData } from "@/api/canvas";
import { useCanvasesStore } from "@/stores/canvases";
import {
  hasCanvasDocumentDragPayload,
  parseCanvasDocumentDragPayload,
} from "@/utils/canvasDocumentDrag";
import type {
  CanvasData,
  CanvasDocumentCard as CanvasDocumentCardData,
  CanvasObject,
  Node,
  NodeType,
} from "@/types/domain";

type EditorChangeEvent = CustomEvent<{
  objects?: CanvasObject[];
}>;

type MovingCardState = {
  cardId: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

const route = useRoute();
const router = useRouter();
const canvasesStore = useCanvasesStore();

const currentCanvasData = ref<CanvasData>(createDefaultCanvasData());
const initialDataJson = ref(
  JSON.stringify({ objects: currentCanvasData.value.objects }),
);
const editorRenderKey = ref("canvas-editor-empty");
const canScheduleSave = ref(false);
const isExplorerOpen = ref(false);
const isDocumentDropActive = ref(false);
const canvasPageRef = ref<HTMLElement | null>(null);

const cardDefaultWidth = 360;
const cardDefaultHeight = 260;
const cardViewportPadding = 16;

let movingCardState: MovingCardState | null = null;

const projectId = computed(() => {
  const value = route.params.projectId;

  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
});

const canvasId = computed(() => {
  const value = route.params.canvasId;

  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
});

const isLoading = computed(() => {
  return canvasId.value
    ? Boolean(canvasesStore.isLoadingById[canvasId.value])
    : false;
});

const isSaving = computed(() => {
  return canvasId.value
    ? Boolean(canvasesStore.isSavingById[canvasId.value])
    : false;
});

const isDirty = computed(() => {
  return canvasId.value
    ? Boolean(canvasesStore.isDirtyById[canvasId.value])
    : false;
});

const error = computed(() => {
  return canvasId.value ? canvasesStore.errorById[canvasId.value] : null;
});

const saveStatusLabel = computed(() => {
  if (isSaving.value) {
    return "Сохранение...";
  }

  if (isDirty.value) {
    return "Есть несохраненные изменения";
  }

  return "Сохранено";
});

const canvasDocumentCards = computed(
  () => currentCanvasData.value.documentCards,
);

const createCanvasDocumentCardId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `document-card-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const clamp = (value: number, min: number, max: number) => {
  if (max < min) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
};

const setInitialData = async (data: CanvasData | null | undefined) => {
  const nextData = cloneCanvasData(data ?? createDefaultCanvasData());

  currentCanvasData.value = nextData;
  initialDataJson.value = JSON.stringify({ objects: nextData.objects });
  editorRenderKey.value = `${canvasId.value}-${Date.now()}`;

  await nextTick();
  canScheduleSave.value = true;
};

const scheduleCanvasSave = (data: CanvasData) => {
  if (!canvasId.value) {
    return;
  }

  const nextData = cloneCanvasData(data);

  currentCanvasData.value = nextData;
  canvasesStore.scheduleSave(canvasId.value, nextData);
};

const handleEditorChange = (event: Event) => {
  if (!canScheduleSave.value || !canvasId.value) {
    return;
  }

  const objects = (event as EditorChangeEvent).detail?.objects;

  scheduleCanvasSave({
    ...currentCanvasData.value,
    objects: Array.isArray(objects) ? objects : [],
  });
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  void router.push({
    name: "project",
    params: { projectId: projectId.value },
  });
};

const toggleExplorer = () => {
  isExplorerOpen.value = !isExplorerOpen.value;
};

const nodeRouteParams: Partial<Record<NodeType, string>> = {
  document: "documentId",
  canvas: "canvasId",
  template: "templateId",
};

const openExplorerNode = (node: Node) => {
  if (node.type === "folder") {
    return;
  }

  const paramName = nodeRouteParams[node.type];

  if (!paramName) {
    return;
  }

  void router.push({
    name: `project-${node.type}`,
    params: {
      projectId: projectId.value,
      [paramName]: node.id,
    },
  });
};

const getSafeCardPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const rect = canvasPageRef.value?.getBoundingClientRect();

  if (!rect) {
    return { x, y };
  }

  return {
    x: clamp(x, cardViewportPadding, rect.width - width - cardViewportPadding),
    y: clamp(
      y,
      cardViewportPadding,
      rect.height - height - cardViewportPadding,
    ),
  };
};

const addDocumentCard = (event: DragEvent) => {
  const payload = parseCanvasDocumentDragPayload(event.dataTransfer);
  const rect = canvasPageRef.value?.getBoundingClientRect();

  if (!payload || !rect || !canvasId.value) {
    return;
  }

  const position = getSafeCardPosition(
    event.clientX - rect.left - cardDefaultWidth / 2,
    event.clientY - rect.top - 24,
    cardDefaultWidth,
    cardDefaultHeight,
  );

  const card: CanvasDocumentCardData = {
    id: createCanvasDocumentCardId(),
    type: "document-card",
    documentId: payload.nodeId,
    projectId: payload.projectId,
    title: payload.title,
    x: position.x,
    y: position.y,
    width: cardDefaultWidth,
    height: cardDefaultHeight,
  };

  scheduleCanvasSave({
    ...currentCanvasData.value,
    documentCards: [...currentCanvasData.value.documentCards, card],
  });
};

const handleCanvasDragEnter = (event: DragEvent) => {
  if (!hasCanvasDocumentDragPayload(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  isDocumentDropActive.value = true;

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
};

const handleCanvasDragOver = (event: DragEvent) => {
  if (!hasCanvasDocumentDragPayload(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  isDocumentDropActive.value = true;

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
};

const handleCanvasDragLeave = (event: DragEvent) => {
  if (event.currentTarget === event.target) {
    isDocumentDropActive.value = false;
  }
};

const handleCanvasDrop = (event: DragEvent) => {
  if (!hasCanvasDocumentDragPayload(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  isDocumentDropActive.value = false;
  addDocumentCard(event);
};

const setDocumentCards = (
  cards: CanvasDocumentCardData[],
  shouldSave = false,
) => {
  const nextData = cloneCanvasData({
    ...currentCanvasData.value,
    documentCards: cards,
  });

  currentCanvasData.value = nextData;

  if (shouldSave) {
    scheduleCanvasSave(nextData);
  }
};

const updateMovingCard = (event: PointerEvent) => {
  if (!movingCardState) {
    return;
  }

  const card = currentCanvasData.value.documentCards.find(
    (item) => item.id === movingCardState?.cardId,
  );

  if (!card) {
    return;
  }

  const position = getSafeCardPosition(
    movingCardState.startX + event.clientX - movingCardState.startClientX,
    movingCardState.startY + event.clientY - movingCardState.startClientY,
    card.width,
    card.height,
  );

  setDocumentCards(
    currentCanvasData.value.documentCards.map((item) =>
      item.id === card.id ? { ...item, ...position } : item,
    ),
  );
};

const stopMovingCard = () => {
  if (movingCardState) {
    scheduleCanvasSave(currentCanvasData.value);
  }

  movingCardState = null;
  window.removeEventListener("pointermove", updateMovingCard);
  window.removeEventListener("pointerup", stopMovingCard);
};

const startDocumentCardMove = ({
  card,
  event,
}: {
  card: CanvasDocumentCardData;
  event: PointerEvent;
}) => {
  event.preventDefault();
  event.stopPropagation();

  movingCardState = {
    cardId: card.id,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: card.x,
    startY: card.y,
  };

  window.addEventListener("pointermove", updateMovingCard);
  window.addEventListener("pointerup", stopMovingCard);
};

watch(
  [projectId, canvasId],
  async ([nextProjectId, nextCanvasId], previousValues) => {
    const previousCanvasId = previousValues?.[1];

    canScheduleSave.value = false;

    if (previousCanvasId) {
      await canvasesStore.flushCanvas(previousCanvasId);
    }

    if (!nextProjectId || !nextCanvasId) {
      await setInitialData(null);
      return;
    }

    const data = await canvasesStore.loadCanvas(nextCanvasId, nextProjectId);

    await setInitialData(data);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  canScheduleSave.value = false;
  stopMovingCard();

  if (canvasId.value) {
    void canvasesStore.flushCanvas(canvasId.value);
  }
});
</script>

<template>
  <main
    ref="canvasPageRef"
    class="canvas-page"
    :class="{
      'explorer-open': isExplorerOpen,
      'document-drop-active': isDocumentDropActive,
    }"
    @dragenter.capture="handleCanvasDragEnter"
    @dragover.capture="handleCanvasDragOver"
    @dragleave.capture="handleCanvasDragLeave"
    @drop.capture="handleCanvasDrop"
  >
    <button
      class="explorer-handle"
      type="button"
      :aria-expanded="isExplorerOpen"
      aria-controls="canvas-project-explorer"
      @click="toggleExplorer"
    >
      <span class="handle-content">
        <span>{{ isExplorerOpen ? "Спрятать" : "Проводник" }}</span>
        <IconArrowDown v-if="isExplorerOpen" aria-hidden="true" />
        <IconArrowUp v-else aria-hidden="true" />
      </span>
    </button>

    <aside
      id="canvas-project-explorer"
      class="canvas-explorer"
      :aria-hidden="!isExplorerOpen"
      aria-label="Проводник проекта"
    >
      <CanvasProjectExplorer
        v-if="projectId"
        :project-id="projectId"
        :active-canvas-id="canvasId"
        @open-node="openExplorerNode"
      />
    </aside>

    <p v-if="isLoading" class="canvas-state">Загрузка холста...</p>
    <p v-else-if="error" class="canvas-state canvas-state-error">{{ error }}</p>
    <template v-else>
      <div class="canvas-save-state" aria-live="polite">
        {{ saveStatusLabel }}
      </div>
      <canvas-drawing-editor
        :key="editorRenderKey"
        class="canvas-editor"
        title="Canvas Editor"
        lang="en"
        theme-color="#202020"
        max-image-size="500kb"
        :initial-data="initialDataJson"
        @editor-change="handleEditorChange"
      />

      <div
        class="canvas-document-layer"
        aria-label="Карточки документов на холсте"
      >
        <CanvasDocumentCard
          v-for="card in canvasDocumentCards"
          :key="card.id"
          :card="card"
          @start-move="startDocumentCardMove"
        />
        <div v-if="isDocumentDropActive" class="canvas-drop-hint">
          Отпустите документ, чтобы добавить карточку на холст
        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
.canvas-page {
  --explorer-width: clamp(420px, 48vw, 760px);

  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  background: #ffffff;
  color: #171717;
}

.canvas-editor {
  display: block;
  width: 100%;
  height: 100%;
}

.canvas-back-button {
  position: fixed;
  top: 76px;
  left: 18px;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2328;
  font: inherit;
  font-size: 14px;
  font-weight: 650;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.canvas-back-button:hover {
  border-color: #b7bec8;
  background: #f8f9fb;
}

.canvas-back-button svg {
  width: 18px;
  height: 18px;
}

.explorer-handle {
  position: fixed;
  top: 50%;
  right: 0;
  z-index: 36;
  display: grid;
  place-items: center;
  width: 42px;
  height: 150px;
  padding: 0;
  border: 1px solid #d7dce3;
  border-right: 0;
  border-radius: 8px 0 0 8px;
  background: #202020;
  color: #ffffff;
  box-shadow: -8px 12px 28px rgba(15, 23, 42, 0.16);
  transition:
    right 0.2s ease,
    background 0.16s ease;
  transform: translateY(-50%);
}

.explorer-handle:hover {
  background: #343434;
}

.explorer-open .explorer-handle {
  right: var(--explorer-width);
}

.handle-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: 0;
  white-space: nowrap;
  transform: rotate(-90deg);
}

.handle-content svg {
  width: 15px;
  height: 15px;
}

.canvas-explorer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 34;
  width: var(--explorer-width);
  height: 100vh;
  overflow: hidden;
  border-left: 1px solid #dcdcdc;
  background: #ffffff;
  box-shadow: -18px 0 44px rgba(15, 23, 42, 0.16);
  transform: translateX(100%);
  transition: transform 0.2s ease;
}

.explorer-open .canvas-explorer {
  transform: translateX(0);
}

.canvas-document-layer {
  position: fixed;
  inset: 0;
  z-index: 23;
  pointer-events: none;
}

.canvas-drop-hint {
  position: fixed;
  left: 50%;
  bottom: 28px;
  z-index: 28;
  padding: 10px 14px;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  background: #ffffff;
  color: #202020;
  font-size: 14px;
  font-weight: 650;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
  transform: translateX(-50%);
}

.document-drop-active::after {
  position: fixed;
  inset: 12px;
  z-index: 21;
  border: 2px dashed rgba(32, 32, 32, 0.32);
  border-radius: 12px;
  content: "";
  pointer-events: none;
}

.canvas-save-state {
  position: fixed;
  right: 24px;
  bottom: 20px;
  z-index: 20;
  color: #7a828e;
  font-size: 13px;
  line-height: 1;
  pointer-events: none;
  transition: right 0.2s ease;
}

.explorer-open .canvas-save-state {
  right: calc(var(--explorer-width) + 24px);
}

.canvas-state {
  margin: 0;
  padding: 48px;
  color: #6f7682;
}

.canvas-state-error {
  color: #b42318;
}

@media (max-width: 720px) {
  .canvas-page {
    --explorer-width: calc(100vw - 52px);
  }

  .canvas-back-button {
    top: 72px;
    left: 12px;
  }

  .canvas-save-state,
  .explorer-open .canvas-save-state {
    right: 16px;
  }

  .explorer-handle {
    height: 132px;
  }
}
</style>
