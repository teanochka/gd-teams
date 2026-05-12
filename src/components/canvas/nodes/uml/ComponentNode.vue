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
  <div class="uml-component-node">
    <div class="component-body" :style="blockStyle">
      <input
        ref="contentInput"
        class="uml-input"
        type="text"
        :style="textStyle"
        :value="element.content"
        @input="onInput"
      >
    </div>
    <div class="component-ports">
      <div class="component-port" :style="{ borderColor: borderColorValue }" />
      <div class="component-port" :style="{ borderColor: borderColorValue }" />
    </div>
  </div>
</template>

<style scoped>
.uml-component-node {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.component-body {
  position: absolute;
  left: 15%;
  top: 0;
  display: grid;
  place-items: center;
  width: 85%;
  height: 100%;
  min-width: 0;
  padding: 16px;
  border-style: solid;
  overflow: hidden;
}

.component-ports {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10%;
  width: 30%;
  height: 100%;
}

.component-port {
  width: 100%;
  height: 20px;
  border: 1px solid #6b7280;
  background: #ffffff;
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
