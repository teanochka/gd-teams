<script setup lang="ts">
import { computed } from 'vue'
import type { LotionBlock } from '@/types/domain'

const props = defineProps<{
  block: LotionBlock
}>()

const checked = computed(() => Boolean(props.block.details.checked))
const htmlValue = computed(() => {
  const value = props.block.details.value

  return typeof value === 'string' ? value : ''
})
</script>

<template>
  <div class="canvas-card-todo" :class="{ checked }">
    <span class="todo-check" aria-hidden="true" />
    <span v-if="htmlValue" class="todo-text" v-html="htmlValue" />
    <span v-else class="todo-placeholder">Пустой пункт</span>
  </div>
</template>

<style scoped>
.canvas-card-todo {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  min-width: 0;
  color: #242424;
  font-size: 13px;
  line-height: 1.4;
}

.todo-check {
  position: relative;
  width: 14px;
  height: 14px;
  margin-top: 2px;
  border: 1.5px solid #69707d;
  border-radius: 4px;
  background: #ffffff;
}

.canvas-card-todo.checked .todo-check {
  border-color: #202020;
  background: #202020;
}

.canvas-card-todo.checked .todo-check::after {
  position: absolute;
  top: -1px;
  left: 3px;
  color: #ffffff;
  content: "✓";
  font-size: 10px;
  font-weight: 750;
  line-height: 1;
}

.todo-text {
  min-width: 0;
  overflow-wrap: anywhere;
}

.canvas-card-todo.checked .todo-text {
  color: #737373;
  text-decoration: line-through;
}

.todo-placeholder {
  color: #8a8f98;
  font-style: italic;
}
</style>
