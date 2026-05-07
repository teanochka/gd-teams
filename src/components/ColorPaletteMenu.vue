<script setup lang="ts">
type PaletteColor = {
  name: string
  value: string
}

defineProps<{
  colors: PaletteColor[]
  selectedColor?: string
}>()

const emit = defineEmits<{
  select: [color: string]
}>()
</script>

<template>
  <div class="color-palette" role="group" aria-label="Выбор цвета обложки">
    <button
      v-for="color in colors"
      :key="color.value"
      class="color-swatch"
      :class="{ active: selectedColor === color.value }"
      :style="{ backgroundColor: color.value }"
      type="button"
      :aria-label="color.name"
      @click.stop="emit('select', color.value)"
    />
  </div>
</template>

<style scoped>
.color-palette {
  display: grid;
  grid-template-columns: repeat(5, 24px);
  gap: 8px;
  padding: 6px 2px;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.42);
}

.color-swatch.active {
  outline: 2px solid #171717;
  outline-offset: 2px;
}
</style>
