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
  backgroundColor: props.element.backgroundColor ?? "#ffffff",
  borderColor: props.element.borderColor ?? "#d7dce3",
  borderWidth: `${props.element.borderWidth ?? 1}px`,
  borderRadius:
    props.element.borderRadius === undefined
      ? "8px"
      : typeof props.element.borderRadius === "number"
        ? `${props.element.borderRadius}px`
        : props.element.borderRadius,
  boxShadow:
    props.element.shadowColor || props.element.shadowBlur
      ? `${props.element.shadowOffsetX ?? 0}px ${props.element.shadowOffsetY ?? 5}px ${props.element.shadowBlur ?? 10}px ${props.element.shadowColor ?? "#00000024"}`
      : undefined,
}));

const textStyle = computed(() => ({
  color: props.element.textColor ?? "#202020",
  fontSize: props.element.fontSize ? `${props.element.fontSize}px` : undefined,
  fontWeight: props.element.fontWeight
    ? String(props.element.fontWeight)
    : undefined,
  textAlign: props.element.textAlign ?? "center",
}));

const updateContent = (event: Event) => {
  const target = event.target as HTMLInputElement;

  emit("update:element", {
    ...props.element,
    content: target.value,
  });
};
</script>

<template>
  <div class="canvas-basic-element" :style="elementStyle">
    <input
      class="basic-input"
      type="text"
      :value="element.content ?? element.title ?? ''"
      :style="textStyle"
      @input="updateContent"
    />
  </div>
</template>

<style scoped>
.canvas-basic-element {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  border-style: solid;
  overflow: hidden;
}

.basic-input {
  width: 100%;
  min-width: 0;
  padding: 8px;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
}
</style>
