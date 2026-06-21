<script setup lang="ts">
import { computed } from "vue";
import CanvasCardImageBlock from "@/components/canvas/document-card/CanvasCardImageBlock.vue";
import CanvasCardTableBlock from "@/components/canvas/document-card/CanvasCardTableBlock.vue";
import CanvasCardTodoBlock from "@/components/canvas/document-card/CanvasCardTodoBlock.vue";
import type { LotionBlock } from "@/types/domain";

const props = defineProps<{
  block: LotionBlock;
}>();

const htmlValue = computed(() => {
  const value = props.block.details.value;

  return typeof value === "string" ? value : "";
});

const headingTag = computed(() => {
  if (props.block.type === "H1") {
    return "h1";
  }

  if (props.block.type === "H2") {
    return "h2";
  }

  return "h3";
});
</script>

<template>
  <div class="canvas-card-block" :class="`type-${block.type.toLowerCase()}`">
    <p v-if="block.type === 'TEXT'" class="card-text" v-html="htmlValue" />

    <component
      :is="headingTag"
      v-else-if="['H1', 'H2', 'H3'].includes(block.type)"
      class="card-heading"
      v-html="htmlValue"
    />

    <blockquote
      v-else-if="block.type === 'QUOTE'"
      class="card-quote"
      v-html="htmlValue"
    />

    <hr v-else-if="block.type === 'DIVIDER'" class="card-divider" />

    <CanvasCardTodoBlock v-else-if="block.type === 'TODO'" :block="block" />

    <p v-else-if="block.type === 'BULLET'" class="card-bullet" v-html="htmlValue" />

    <CanvasCardImageBlock v-else-if="block.type === 'IMAGE'" :block="block" />

    <CanvasCardTableBlock v-else-if="block.type === 'TABLE'" :block="block" />

    <div v-else class="card-unknown">
      <span>{{ block.type }}</span>
      <p v-if="htmlValue" v-html="htmlValue" />
      <p v-else>Нет данных для отображения</p>
    </div>
  </div>
</template>

<style scoped>
.canvas-card-block {
  min-width: 0;
}

.card-text,
.card-heading,
.card-quote,
.card-unknown p {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.card-text {
  color: #242424;
  font-size: 13px;
  line-height: 1.45;
}

.card-heading {
  color: #111111;
  font-weight: 850;
  letter-spacing: 0;
  line-height: 1.05;
}

h1.card-heading {
  font-size: 28px;
}

h2.card-heading {
  font-size: 21px;
}

h3.card-heading {
  font-size: 16px;
  line-height: 1.15;
}

.card-quote {
  padding: 8px 10px;
  border-left: 3px solid #202020;
  border-radius: 0 6px 6px 0;
  background: #f5f6f8;
  color: #3b3f46;
  font-size: 13px;
  line-height: 1.45;
}

.card-divider {
  height: 1px;
  margin: 4px 0;
  border: 0;
  background: #d9dde3;
}

.card-bullet {
  position: relative;
  min-width: 0;
  margin: 0;
  padding-left: 18px;
  color: #242424;
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.card-bullet::before {
  position: absolute;
  top: 0.62em;
  left: 4px;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: currentColor;
  content: "";
}

.card-unknown {
  display: grid;
  gap: 4px;
  padding: 8px;
  border: 1px dashed #cfd4dc;
  border-radius: 6px;
  color: #666d78;
  font-size: 12px;
}

.card-unknown span {
  color: #343a43;
  font-weight: 750;
}
</style>
