<script setup lang="ts">
import { computed, ref } from 'vue'
import { getBlockStyle, getTextStyle } from '@/components/canvas/nodes/canvasNodeStyle'
import type { CanvasElement } from '@/types/canvas'

const props = defineProps<{
  element: CanvasElement
}>()

const emit = defineEmits<{
  (event: 'update:element', element: CanvasElement): void
}>()

const contentInput = ref<HTMLInputElement | null>(null)
const blockStyle = computed(() => getBlockStyle(props.element))
const borderColorValue = computed(() => props.element.borderColor ?? '#6b7280')
const textStyle = computed(() => getTextStyle(props.element))

const onInput = (event: Event) => {
  emit('update:element', {
    ...props.element,
    content: (event.target as HTMLInputElement).value,
  })
}
</script>

<template>
  <div class="uml-interface-node" :style="blockStyle">
    <div class="interface-title" :style="{ borderColor: borderColorValue }">
      <input
        ref="contentInput"
        class="uml-input"
        type="text"
        :style="textStyle"
        :value="element.content"
        @input="onInput"
      >
    </div>
    <div class="interface-methods">
      <div class="interface-method">+ method(): Type</div>
    </div>
  </div>
</template>

<style scoped>
.uml-interface-node {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  border-style: solid;
  overflow: hidden;
}

.interface-title {
  flex: 0 0 auto;
  padding: 8px;
  border-top: 1px solid;
  border-bottom: 1px solid;
}

.interface-methods {
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px;
  color: #4b5563;
  font-size: 13px;
}

.interface-method {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.uml-input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #202020;
  font: inherit;
  font-weight: 700;
}
</style>
