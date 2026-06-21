<script setup lang="ts">
import { computed } from "vue";
import type { CanvasElement } from "@/types/canvas";

const props = defineProps<{
  element: CanvasElement;
}>();

const emit = defineEmits<{
  (event: "update:element", element: CanvasElement): void;
}>();

const elementStyle = computed(() => ({
  backgroundColor: props.element.backgroundColor ?? "transparent",
}));

const textStyle = computed(() => ({
  color: props.element.textColor ?? "#202020",
  fontSize: `${props.element.fontSize ?? 16}px`,
  fontWeight: String(props.element.fontWeight ?? 400),
  textAlign: props.element.textAlign ?? "left",
}));

const updateContent = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;

  emit("update:element", {
    ...props.element,
    content: target.value,
  });
};
</script>

<template>
  <div class="canvas-text-element" :style="elementStyle">
    <textarea
      class="text-input"
      :value="element.content ?? element.title ?? ''"
      :style="textStyle"
      spellcheck="false"
      @input="updateContent"
    />
  </div>
</template>

<style scoped>
.canvas-text-element {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.text-input {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 6px 8px;
  border: 0;
  outline: 0;
  resize: none;
  background: transparent;
  font: inherit;
  line-height: 1.35;
  overflow: hidden;
}
</style>
