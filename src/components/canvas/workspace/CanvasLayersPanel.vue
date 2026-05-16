<script setup lang="ts">
import { computed } from "vue";
import IconChevronDown from "~icons/carbon/chevron-down";
import IconLayers from "~icons/carbon/layers";
import IconTrashCan from "~icons/carbon/trash-can";
import CanvasElementPropertiesPanel from "@/components/canvas/panels/CanvasElementPropertiesPanel.vue";
import { canvasComponentRegistry } from "@/components/canvas/componentRegistry";
import type { CanvasElement, CanvasElementId } from "@/types/canvas";

const props = defineProps<{
  elements: CanvasElement[];
  selectedElementIds: Set<CanvasElementId>;
}>();

const emit = defineEmits<{
  (event: "select-element", elementId: CanvasElementId): void;
  (event: "move-layer", elementId: CanvasElementId, direction: -1 | 1): void;
  (event: "delete-selected"): void;
  (event: "update:element", element: CanvasElement): void;
}>();

const selectedElements = computed(() => {
  return props.elements.filter((element) =>
    props.selectedElementIds.has(element.id),
  );
});

const selectedElement = computed(() => selectedElements.value[0] ?? null);

const getElementName = (element: CanvasElement | null) => {
  if (!element) {
    return undefined;
  }

  return canvasComponentRegistry.getType(element.type)?.name ?? element.type;
};
</script>

<template>
  <aside class="canvas-layers" aria-label="Слои холста">
    <section class="layers-panel">
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
          @click="emit('select-element', element.id)"
          @keydown.enter.prevent="emit('select-element', element.id)"
          @keydown.space.prevent="emit('select-element', element.id)"
        >
          <span>{{ getElementName(element) }}</span>
          <span class="layer-actions">
            <button
              type="button"
              aria-label="Поднять слой"
              @click.stop="emit('move-layer', element.id, 1)"
            >
              <IconChevronDown aria-hidden="true" class="up-icon" />
            </button>
            <button
              type="button"
              aria-label="Опустить слой"
              @click.stop="emit('move-layer', element.id, -1)"
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
        @click="emit('delete-selected')"
      >
        <IconTrashCan aria-hidden="true" />
        <span>Удалить</span>
      </button>
    </section>

    <CanvasElementPropertiesPanel
      :element="selectedElement"
      :element-name="getElementName(selectedElement)"
      @update:element="emit('update:element', $event)"
    />
  </aside>
</template>

<style scoped>
.canvas-layers {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  min-width: 0;
  border-left: 1px solid #dddddd;
  background: #f8f8f8;
}

.layers-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
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

.layer-item {
  justify-content: space-between;
  gap: 8px;
  min-height: 40px;
  padding: 0 8px 0 10px;
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
</style>
