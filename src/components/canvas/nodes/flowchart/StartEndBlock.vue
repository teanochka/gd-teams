<script setup lang="ts">
import { computed } from "vue";
import {
  getBlockStyle,
  getTextStyle,
} from "@/components/canvas/nodes/canvasNodeStyle";
import type { CanvasElement } from "@/types/canvas";

const props = defineProps<{
  element: CanvasElement;
}>();

const emit = defineEmits<{
  (event: "update:element", element: CanvasElement): void;
}>();

const blockStyle = computed(() =>
  getBlockStyle(props.element, { borderRadius: 100 }),
);
const textStyle = computed(() => getTextStyle(props.element));

const onInput = (event: Event) => {
  emit("update:element", {
    ...props.element,
    content: (event.target as HTMLInputElement).value,
  });
};
</script>

<template>
  <div class="flowchart-start-end" :style="blockStyle">
    <input
      class="flowchart-input"
      type="text"
      :style="textStyle"
      :value="element.content"
      @input="onInput"
    />
  </div>
</template>

<style scoped>
.flowchart-start-end {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: 8px;
  border-style: solid;
  overflow: hidden;
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
