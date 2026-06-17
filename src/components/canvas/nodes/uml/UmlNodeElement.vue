<script setup lang="ts">
import { computed, ref } from "vue";
import {
  getSvgDropShadow,
  getTextStyle,
} from "@/components/canvas/nodes/canvasNodeStyle";
import type { CanvasElement } from "@/types/canvas";

const props = defineProps<{
  element: CanvasElement;
}>();

const emit = defineEmits<{
  (event: "update:element", element: CanvasElement): void;
}>();

const contentInput = ref<HTMLInputElement | null>(null);
const fillColor = computed(() => props.element.backgroundColor ?? "#ffffff");
const strokeColor = computed(() => props.element.borderColor ?? "#6b7280");
const strokeWidth = computed(() => (props.element.borderWidth ?? 1) * 0.8);
const sideFillColor = computed(() => {
  if (
    props.element.backgroundColor &&
    props.element.backgroundColor !== "#ffffff"
  ) {
    return props.element.backgroundColor;
  }

  return "#e5e7eb";
});
const topFillColor = computed(() => {
  if (
    props.element.backgroundColor &&
    props.element.backgroundColor !== "#ffffff"
  ) {
    return props.element.backgroundColor;
  }

  return "#f3f4f6";
});
const svgStyle = computed(() => getSvgDropShadow(props.element));
const textStyle = computed(() => getTextStyle(props.element));

const onInput = (event: Event) => {
  emit("update:element", {
    ...props.element,
    content: (event.target as HTMLInputElement).value,
  });
};
</script>

<template>
  <div class="uml-node-element">
    <svg
      class="uml-node-svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      :style="svgStyle"
    >
      <rect
        x="0"
        y="15"
        width="75"
        height="85"
        :fill="fillColor"
        :stroke="strokeColor"
        :stroke-width="strokeWidth"
      />
      <polygon
        points="75,15 100,0 100,85 75,100"
        :fill="sideFillColor"
        :stroke="strokeColor"
        :stroke-width="strokeWidth"
      />
      <polygon
        points="0,15 25,0 100,0 75,15"
        :fill="topFillColor"
        :stroke="strokeColor"
        :stroke-width="strokeWidth"
      />
    </svg>
    <div class="uml-node-content">
      <input
        ref="contentInput"
        class="uml-input"
        type="text"
        :style="textStyle"
        :value="element.content"
        @input="onInput"
      />
    </div>
  </div>
</template>

<style scoped>
.uml-node-element {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.uml-node-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.uml-node-content {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 0 24px 16px 0;
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
