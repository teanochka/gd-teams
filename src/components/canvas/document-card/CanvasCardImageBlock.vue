<script setup lang="ts">
import { computed } from "vue";
import type { LotionBlock } from "@/types/domain";

const props = defineProps<{
  block: LotionBlock;
}>();

const imageUrl = computed(() => {
  const value = props.block.details.imageUrl ?? props.block.details.value;

  return typeof value === "string" ? value : "";
});

const imageWidthPercent = computed(() => {
  const value = props.block.details.imageWidthPercent;

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 100;
  }

  return Math.min(100, Math.max(20, value));
});
</script>

<template>
  <figure v-if="imageUrl" class="canvas-card-image">
    <img
      :src="imageUrl"
      alt=""
      :style="{ width: `${imageWidthPercent}%` }"
      draggable="false"
    />
  </figure>
  <div v-else class="canvas-card-empty">Изображение не задано</div>
</template>

<style scoped>
.canvas-card-image {
  display: flex;
  justify-content: center;
  margin: 0;
}

.canvas-card-image img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  object-fit: cover;
}

.canvas-card-empty {
  display: grid;
  place-items: center;
  min-height: 72px;
  border: 1px dashed #cfd4dc;
  border-radius: 6px;
  color: #7a828e;
  font-size: 12px;
}
</style>
