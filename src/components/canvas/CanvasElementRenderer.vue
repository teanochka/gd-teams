<script setup lang="ts">
import { computed } from 'vue'
import { canvasComponentRegistry } from '@/components/canvas/componentRegistry'
import type { CanvasElement } from '@/types/canvas'

const props = defineProps<{
  element: CanvasElement
}>()

const emit = defineEmits<{
  (event: 'update:element', element: CanvasElement): void
}>()

const renderer = computed(() => canvasComponentRegistry.getComponent(props.element.type))

const updateElement = (element: CanvasElement) => {
  emit('update:element', element)
}
</script>

<template>
  <component
    :is="renderer"
    :element="element"
    @update:element="updateElement"
  />
</template>
