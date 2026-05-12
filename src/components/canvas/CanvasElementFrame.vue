<script setup lang="ts">
import { computed, ref } from 'vue'
import CanvasElementRenderer from '@/components/canvas/CanvasElementRenderer.vue'
import type { CanvasElement } from '@/types/canvas'

const props = defineProps<{
  element: CanvasElement
  selected: boolean
  workspaceElement: HTMLElement | null
}>()

const emit = defineEmits<{
  (event: 'select', payload: { element: CanvasElement; event: MouseEvent }): void
  (event: 'update:element', element: CanvasElement): void
}>()

const isDragging = ref(false)
const isResizing = ref(false)

const frameStyle = computed(() => ({
  left: `${props.element.x}px`,
  top: `${props.element.y}px`,
  width: `${props.element.width}px`,
  height: `${props.element.height}px`,
  opacity: props.element.opacity !== undefined ? props.element.opacity / 100 : 1,
  ...(typeof props.element.style === 'object' && props.element.style ? props.element.style : {}),
}))

const clampPosition = (x: number, y: number) => {
  const rect = props.workspaceElement?.getBoundingClientRect()

  if (!rect) {
    return { x, y }
  }

  return {
    x: Math.max(0, Math.round(x)),
    y: Math.max(0, Math.round(y)),
  }
}

const updateElement = (nextElement: CanvasElement) => {
  emit('update:element', nextElement)
}

const selectElement = (event: MouseEvent) => {
  emit('select', { element: props.element, event })
}

const startDrag = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (target.closest('input, textarea, button, [contenteditable="true"], .resize-handle')) {
    selectElement(event)
    return
  }

  event.preventDefault()
  event.stopPropagation()
  selectElement(event)

  isDragging.value = true
  const startClientX = event.clientX
  const startClientY = event.clientY
  const startX = props.element.x
  const startY = props.element.y

  const onMove = (moveEvent: MouseEvent) => {
    const position = clampPosition(
      startX + moveEvent.clientX - startClientX,
      startY + moveEvent.clientY - startClientY,
    )

    updateElement({
      ...props.element,
      ...position,
    })
  }

  const onUp = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

const startResize = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  selectElement(event)

  isResizing.value = true
  const startClientX = event.clientX
  const startClientY = event.clientY
  const startWidth = props.element.width
  const startHeight = props.element.height

  const onMove = (moveEvent: MouseEvent) => {
    updateElement({
      ...props.element,
      width: Math.max(64, Math.round(startWidth + moveEvent.clientX - startClientX)),
      height: Math.max(48, Math.round(startHeight + moveEvent.clientY - startClientY)),
    })
  }

  const onUp = () => {
    isResizing.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<template>
  <div
    class="canvas-element-frame"
    :class="{ selected, dragging: isDragging, resizing: isResizing }"
    :style="frameStyle"
    @mousedown="startDrag"
  >
    <div class="element-content">
      <CanvasElementRenderer
        :element="element"
        @update:element="updateElement"
      />
    </div>
    <button
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
  z-index: 12;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
}

.element-content {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
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
