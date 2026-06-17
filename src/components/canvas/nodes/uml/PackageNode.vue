<script setup lang="ts">
import { computed, ref } from "vue";
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

const contentInput = ref<HTMLInputElement | null>(null);
const blockStyle = computed(() => getBlockStyle(props.element));
const borderColorValue = computed(() => props.element.borderColor ?? "#6b7280");
const backgroundColorValue = computed(
  () => props.element.backgroundColor ?? "#ffffff",
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
  <div class="uml-package-node">
    <div
      class="package-tab"
      :style="{
        borderColor: borderColorValue,
        backgroundColor: backgroundColorValue,
      }"
    />
    <div class="package-body" :style="blockStyle">
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
.uml-package-node {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.package-tab {
  position: absolute;
  top: 0;
  left: 0;
  width: 30%;
  height: 20%;
  border: 1px solid;
  border-bottom: 0;
}

.package-body {
  position: absolute;
  top: 20%;
  left: 0;
  display: grid;
  align-items: start;
  justify-items: center;
  width: 100%;
  height: 80%;
  min-width: 0;
  padding: 24px 12px 12px;
  border-style: solid;
  overflow: hidden;
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
