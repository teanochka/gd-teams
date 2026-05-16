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
const blockStyle = computed(() =>
  getBlockStyle(props.element, { borderRadius: '50%' }),
)
const textStyle = computed(() => getTextStyle(props.element))

const onInput = (event: Event) => {
  emit('update:element', {
    ...props.element,
    content: (event.target as HTMLInputElement).value,
  })
}
</script>

<template>
  <div class="uml-use-case-node" :style="blockStyle">
    <input
      ref="contentInput"
      class="uml-input"
      type="text"
      :style="textStyle"
      :value="element.content"
      @input="onInput"
    >
  </div>
</template>

<style scoped>
.uml-use-case-node {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: 16px;
  border-style: solid;
  overflow: hidden;
}

.uml-input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #202020;
  font: inherit;
}
</style>
