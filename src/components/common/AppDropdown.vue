<script setup lang="ts">
interface DropdownOption {
  label: string
  value: string
}

defineProps<{
  options: DropdownOption[]
  title?: string
}>()

const emit = defineEmits<{
  select: [value: string]
}>()
</script>

<template>
  <div class="bg-white border rounded-3 shadow-sm p-2">
    <div v-if="title" class="small text-secondary px-2 pb-1">{{ title }}</div>
    <button
      v-for="option in options"
      :key="option.value"
      class="btn btn-sm btn-light w-100 text-start mb-1"
      @click="emit('select', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
