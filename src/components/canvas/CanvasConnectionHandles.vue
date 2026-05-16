<script setup lang="ts">
import type { CanvasElement, CanvasHandlePosition } from "@/types/canvas";

defineProps<{
  element: CanvasElement;
}>();

defineEmits<{
  (
    event: "connect-start",
    handle: CanvasHandlePosition,
    pointerEvent: MouseEvent,
  ): void;
  (event: "connect-end", handle: CanvasHandlePosition): void;
}>();

const handles: CanvasHandlePosition[] = ["top", "right", "bottom", "left"];
</script>

<template>
  <div
    class="connection-handles"
    :style="{
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
    }"
    aria-hidden="true"
  >
    <button
      v-for="handle in handles"
      :key="handle"
      class="connection-handle"
      :class="handle"
      type="button"
      tabindex="-1"
      @mousedown.stop="$emit('connect-start', handle, $event)"
      @mouseup.stop="$emit('connect-end', handle)"
    />
  </div>
</template>

<style scoped>
.connection-handles {
  position: absolute;
  z-index: 1002;
  pointer-events: none;
}

.connection-handle {
  position: absolute;
  display: block;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 1px solid #202020;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.16);
  cursor: crosshair;
  pointer-events: auto;
  transition:
    background 0.14s ease,
    border-color 0.14s ease,
    transform 0.14s ease;
}

.connection-handle:hover {
  border-color: #0f62fe;
  background: #edf5ff;
  transform: scale(1.12);
}

.connection-handle.top {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.connection-handle.top:hover {
  transform: translateX(-50%) scale(1.12);
}

.connection-handle.right {
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
}

.connection-handle.right:hover {
  transform: translateY(-50%) scale(1.12);
}

.connection-handle.bottom {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.connection-handle.bottom:hover {
  transform: translateX(-50%) scale(1.12);
}

.connection-handle.left {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
}

.connection-handle.left:hover {
  transform: translateY(-50%) scale(1.12);
}
</style>
