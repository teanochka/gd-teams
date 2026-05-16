<script setup lang="ts">
import { ref } from "vue";
import IconChevronDown from "~icons/carbon/chevron-down";
import IconDocument from "~icons/carbon/document";
import { canvasComponentRegistry } from "@/components/canvas/componentRegistry";

const emit = defineEmits<{
  (event: "element-drag-start", typeId: string, dragEvent: DragEvent): void;
}>();

const collapsedCategoryIds = ref<Record<string, boolean>>({});

const toggleCategory = (categoryId: string) => {
  collapsedCategoryIds.value = {
    ...collapsedCategoryIds.value,
    [categoryId]: !collapsedCategoryIds.value[categoryId],
  };
};
</script>

<template>
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
            :class="{ collapsed: collapsedCategoryIds[category.id] }"
          />
        </button>

        <div v-show="!collapsedCategoryIds[category.id]" class="palette-items">
          <button
            v-for="type in category.types"
            :key="type.id"
            class="palette-item"
            type="button"
            draggable="true"
            @dragstart="emit('element-drag-start', type.id, $event)"
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
</template>

<style scoped>
.canvas-palette {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  border-right: 1px solid #dddddd;
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

.panel-header strong {
  font-size: 16px;
  font-weight: 750;
}

.palette-scroll {
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
.palette-item {
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
.palette-item:hover {
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
</style>
