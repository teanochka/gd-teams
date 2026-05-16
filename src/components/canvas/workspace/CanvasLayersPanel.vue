<script setup lang="ts">
import { computed, ref } from "vue";
import IconLayers from "~icons/carbon/layers";
import IconTrashCan from "~icons/carbon/trash-can";
import IconView from "~icons/carbon/view";
import IconViewOff from "~icons/carbon/view-off";
import type { CanvasElement, CanvasElementId } from "@/types/canvas";

const props = defineProps<{
  elements: CanvasElement[];
  selectedElementIds: Set<CanvasElementId>;
}>();

type LayerSelectionEvent = Pick<
  MouseEvent | KeyboardEvent,
  "shiftKey" | "ctrlKey" | "metaKey"
>;

const emit = defineEmits<{
  (
    event: "select-element",
    payload: {
      elementId: CanvasElementId;
      selectionEvent: LayerSelectionEvent;
    },
  ): void;
  (
    event: "reorder-selected",
    payload: { targetId: CanvasElementId; position: "before" | "after" },
  ): void;
  (event: "toggle-visibility", elementId: CanvasElementId): void;
  (event: "delete-selected"): void;
}>();

const dragTarget = ref<{
  id: CanvasElementId;
  position: "before" | "after";
} | null>(null);

const layerElements = computed(() => [...props.elements].reverse());
const selectedCount = computed(() => props.selectedElementIds.size);

const onLayerSelect = (
  elementId: CanvasElementId,
  selectionEvent: LayerSelectionEvent,
) => {
  emit("select-element", { elementId, selectionEvent });
};

const onDragStart = (element: CanvasElement, event: DragEvent) => {
  if (!props.selectedElementIds.has(element.id)) {
    emit("select-element", {
      elementId: element.id,
      selectionEvent: event,
    });
  }

  event.dataTransfer?.setData(
    "application/x-gdteams-layer",
    String(element.id),
  );
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
};

const onDragOver = (elementId: CanvasElementId, event: DragEvent) => {
  event.preventDefault();
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const position =
    event.clientY < rect.top + rect.height / 2 ? "before" : "after";
  dragTarget.value = { id: elementId, position };

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();

  if (dragTarget.value) {
    emit("reorder-selected", {
      targetId: dragTarget.value.id,
      position: dragTarget.value.position,
    });
  }

  dragTarget.value = null;
};
</script>

<template>
  <aside class="canvas-layers" aria-label="Слои холста">
    <header class="panel-header">
      <IconLayers aria-hidden="true" />
      <strong>Слои</strong>
    </header>

    <div v-if="!elements.length" class="empty-layers">Нет слоев</div>
    <div
      v-else
      class="layers-list"
      @dragleave.self="dragTarget = null"
      @drop="onDrop"
    >
      <div
        v-for="element in layerElements"
        :key="element.id"
        class="layer-item"
        :class="{
          selected: selectedElementIds.has(element.id),
          hidden: element.isHidden,
          'drop-before':
            dragTarget?.id === element.id && dragTarget.position === 'before',
          'drop-after':
            dragTarget?.id === element.id && dragTarget.position === 'after',
        }"
        role="button"
        tabindex="0"
        draggable="true"
        @click="onLayerSelect(element.id, $event)"
        @keydown.enter.prevent="onLayerSelect(element.id, $event)"
        @keydown.space.prevent="onLayerSelect(element.id, $event)"
        @dragstart="onDragStart(element, $event)"
        @dragover="onDragOver(element.id, $event)"
      >
        <span class="layer-name">{{ element.layerName ?? element.type }}</span>
        <button
          class="visibility-button"
          type="button"
          :aria-label="element.isHidden ? 'Показать слой' : 'Скрыть слой'"
          @click.stop="emit('toggle-visibility', element.id)"
        >
          <IconViewOff v-if="element.isHidden" aria-hidden="true" />
          <IconView v-else aria-hidden="true" />
        </button>
      </div>
    </div>

    <footer class="layers-footer">
      <span>{{
        selectedCount ? `Выбрано: ${selectedCount}` : "Нет выбора"
      }}</span>
      <button
        class="delete-button"
        type="button"
        :disabled="!selectedCount"
        @click="emit('delete-selected')"
      >
        <IconTrashCan aria-hidden="true" />
      </button>
    </footer>
  </aside>
</template>

<style scoped>
.canvas-layers {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-width: 0;
  border-left: 1px solid #dddddd;
  background: #f8f8f8;
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

.layers-list {
  display: grid;
  align-content: start;
  gap: 4px;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}

.empty-layers {
  display: grid;
  place-items: center;
  min-height: 160px;
  color: #777777;
  font-size: 14px;
}

.layer-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 30px;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 6px 0 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #242424;
  cursor: grab;
  font: inherit;
  text-align: left;
}

.layer-item:hover {
  border-color: #dddddd;
  background: #ffffff;
}

.layer-item.selected {
  border-color: #202020;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #202020;
}

.layer-item.hidden {
  color: #9a9a9a;
}

.layer-item.drop-before::before,
.layer-item.drop-after::after {
  position: absolute;
  right: 4px;
  left: 4px;
  height: 2px;
  border-radius: 999px;
  background: #202020;
  content: "";
}

.layer-item.drop-before::before {
  top: -4px;
}

.layer-item.drop-after::after {
  bottom: -4px;
}

.layer-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visibility-button,
.delete-button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #d7d7d7;
  border-radius: 7px;
  background: #ffffff;
  color: #444444;
}

.visibility-button svg,
.delete-button svg {
  width: 16px;
  height: 16px;
}

.layers-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #dddddd;
  color: #777777;
  font-size: 13px;
}

.delete-button {
  color: #b42318;
}

.delete-button:disabled {
  color: #999999;
  background: #eeeeee;
  opacity: 1;
}
</style>
