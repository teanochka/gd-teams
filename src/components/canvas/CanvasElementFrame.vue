<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import CanvasElementRenderer from "@/components/canvas/CanvasElementRenderer.vue";
import type { CanvasElement } from "@/types/canvas";

const props = defineProps<{
  element: CanvasElement;
  selected: boolean;
  multiSelected: boolean;
  zIndex: number;
  workspaceElement: HTMLElement | null;
}>();

const emit = defineEmits<{
  (
    event: "select",
    payload: { element: CanvasElement; event: MouseEvent },
  ): void;
  (event: "update:element", element: CanvasElement): void;
  (event: "move-selected", delta: { dx: number; dy: number }): void;
}>();

const frameRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const isResizing = ref(false);
const isEditing = ref(false);

const frameStyle = computed(() => ({
  left: `${props.element.x}px`,
  top: `${props.element.y}px`,
  width: `${props.element.width}px`,
  height: `${props.element.height}px`,
  zIndex: props.zIndex,
  opacity:
    props.element.opacity !== undefined ? props.element.opacity / 100 : 1,
  ...(typeof props.element.style === "object" && props.element.style
    ? props.element.style
    : {}),
}));

watch(
  () => props.selected,
  (selected) => {
    if (!selected) {
      isEditing.value = false;
    }
  },
);

const clampPosition = (x: number, y: number) => {
  const rect = props.workspaceElement?.getBoundingClientRect();

  if (!rect) {
    return { x, y };
  }

  return {
    x: Math.max(0, Math.round(x)),
    y: Math.max(0, Math.round(y)),
  };
};

const updateElement = (nextElement: CanvasElement) => {
  emit("update:element", nextElement);
};

const selectElement = (event: MouseEvent) => {
  emit("select", { element: props.element, event });
};

const startEditing = async (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  selectElement(event);
  isEditing.value = true;

  await nextTick();
  const editable = frameRef.value?.querySelector<
    HTMLInputElement | HTMLTextAreaElement
  >("input, textarea, [contenteditable='true']");
  editable?.focus();
  if ("select" in (editable ?? {})) {
    editable?.select();
  }
};

const startDrag = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  if (
    isEditing.value &&
    target.closest('input, textarea, button, [contenteditable="true"]')
  ) {
    selectElement(event);
    return;
  }

  if (target.closest("button, .resize-handle")) {
    selectElement(event);
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  selectElement(event);

  isDragging.value = true;

  if (props.multiSelected) {
    let previousClientX = event.clientX;
    let previousClientY = event.clientY;

    const onMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - previousClientX;
      const dy = moveEvent.clientY - previousClientY;
      previousClientX = moveEvent.clientX;
      previousClientY = moveEvent.clientY;
      emit("move-selected", { dx, dy });
    };

    const onUp = () => {
      isDragging.value = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return;
  }

  const startClientX = event.clientX;
  const startClientY = event.clientY;
  const startX = props.element.x;
  const startY = props.element.y;

  const onMove = (moveEvent: MouseEvent) => {
    const position = clampPosition(
      startX + moveEvent.clientX - startClientX,
      startY + moveEvent.clientY - startClientY,
    );

    updateElement({
      ...props.element,
      ...position,
    });
  };

  const onUp = () => {
    isDragging.value = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
};

const startResize = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  selectElement(event);

  isResizing.value = true;
  const startClientX = event.clientX;
  const startClientY = event.clientY;
  const startWidth = props.element.width;
  const startHeight = props.element.height;

  const onMove = (moveEvent: MouseEvent) => {
    updateElement({
      ...props.element,
      width: Math.max(
        64,
        Math.round(startWidth + moveEvent.clientX - startClientX),
      ),
      height: Math.max(
        48,
        Math.round(startHeight + moveEvent.clientY - startClientY),
      ),
    });
  };

  const onUp = () => {
    isResizing.value = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
};
</script>

<template>
  <div
    ref="frameRef"
    class="canvas-element-frame"
    :class="{
      selected,
      editing: isEditing,
      dragging: isDragging,
      resizing: isResizing,
    }"
    :style="frameStyle"
    @mousedown="startDrag"
    @dblclick="startEditing"
  >
    <div class="element-content">
      <CanvasElementRenderer
        :element="element"
        @update:element="updateElement"
      />
    </div>
    <button
      v-if="selected && !multiSelected"
      class="resize-handle"
      type="button"
      aria-label="Изменить размер"
      @mousedown="startResize"
    />
  </div>
</template>

<style scoped>
.canvas-element-frame {
  position: absolute;
  min-width: 64px;
  min-height: 48px;
  border-radius: 8px;
  cursor: move;
  user-select: none;
}

.canvas-element-frame.selected {
  outline: 2px solid #202020;
  outline-offset: 2px;
}

.canvas-element-frame.dragging,
.canvas-element-frame.resizing {
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
}

.element-content {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.canvas-element-frame:not(.editing) .element-content :deep(input),
.canvas-element-frame:not(.editing) .element-content :deep(textarea),
.canvas-element-frame:not(.editing)
  .element-content
  :deep([contenteditable="true"]) {
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  right: -7px;
  bottom: -7px;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1px solid #ffffff;
  border-radius: 4px;
  background: #202020;
  opacity: 0;
  cursor: se-resize;
  transition: opacity 0.14s ease;
}

.canvas-element-frame:hover .resize-handle,
.canvas-element-frame.selected .resize-handle {
  opacity: 1;
}
</style>
