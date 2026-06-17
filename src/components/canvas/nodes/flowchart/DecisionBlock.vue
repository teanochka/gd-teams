<script setup lang="ts">
import { computed } from "vue";
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

const diamondPoints = "50,0 100,50 50,100 0,50";
const fillColor = computed(() => props.element.backgroundColor ?? "#ffffff");
const strokeColor = computed(() => props.element.borderColor ?? "#6b7280");
const strokeWidth = computed(() => (props.element.borderWidth ?? 1) * 0.5);
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
  <div class="flowchart-svg-node">
    <svg
      class="flowchart-svg"
      :style="svgStyle"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polygon
        :points="diamondPoints"
        :fill="fillColor"
        :stroke="strokeColor"
        :stroke-width="strokeWidth"
      />
    </svg>
    <div class="flowchart-svg-content">
      <input
        class="flowchart-input"
        type="text"
        :style="textStyle"
        :value="element.content"
        @input="onInput"
      />
    </div>
  </div>
</template>

<style scoped>
.flowchart-svg-node {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.flowchart-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.flowchart-svg-content {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 0 24px;
}

.flowchart-input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
}
</style>
