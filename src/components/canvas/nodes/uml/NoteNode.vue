<script setup lang="ts">
import { computed, ref } from 'vue'
import { getTextStyle } from '@/components/canvas/nodes/canvasNodeStyle'
import type { CanvasElement } from '@/types/canvas'

const props = defineProps<{
  element: CanvasElement
}>()

const emit = defineEmits<{
  (event: 'update:element', element: CanvasElement): void
}>()

const contentInput = ref<HTMLTextAreaElement | null>(null)
const notePath = 'M 0,0 L 85,0 L 85,15 L 100,15 L 100,100 L 0,100 Z'
const fillColor = computed(() => props.element.backgroundColor ?? '#fffacd')
const strokeColor = computed(() => props.element.borderColor ?? '#6b7280')
const strokeWidth = computed(() => (props.element.borderWidth ?? 1) * 0.8)
const textStyle = computed(() => ({
  ...getTextStyle(props.element, 'left'),
  fontSize: props.element.fontSize ? `${props.element.fontSize}px` : '14px',
}))

const onInput = (event: Event) => {
  emit('update:element', {
    ...props.element,
    content: (event.target as HTMLTextAreaElement).value,
  })
}
</script>

<template>
  <div class="uml-note-node">
    <svg class="note-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        :d="notePath"
        :fill="fillColor"
        :stroke="strokeColor"
        :stroke-width="strokeWidth"
      />
      <path
        d="M 85,0 L 100,15 L 85,15 Z"
        :fill="fillColor"
        :stroke="strokeColor"
        :stroke-width="strokeWidth"
      />
      <line
        x1="85"
        y1="0"
        x2="100"
        y2="15"
        :stroke="strokeColor"
        :stroke-width="strokeWidth"
      />
    </svg>
    <div class="note-content">
      <textarea
        ref="contentInput"
        class="note-textarea"
        :style="textStyle"
        :value="element.content"
        @input="onInput"
      />
    </div>
  </div>
</template>

<style scoped>
.uml-note-node {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.note-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.note-content {
  position: absolute;
  inset: 0;
  padding: 12px;
}

.note-textarea {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #202020;
  font: inherit;
  resize: none;
}
</style>
