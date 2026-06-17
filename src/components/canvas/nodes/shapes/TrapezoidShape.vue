<script setup lang="ts">
import { computed } from "vue";
import {
  getSvgShadowId,
  hasSvgShadow,
} from "@/components/canvas/nodes/canvasNodeStyle";
import type { CanvasElement } from "@/types/canvas";

const props = defineProps<{
  element: CanvasElement;
}>();

const shadowId = computed(() =>
  getSvgShadowId(props.element, "trapezoid-shadow"),
);
const hasShadow = computed(() => hasSvgShadow(props.element));
const strokeWidth = computed(() => {
  if (!props.element.borderColor && !props.element.borderWidth) {
    return 0;
  }

  return props.element.borderWidth ?? 2;
});
</script>

<template>
  <div class="shape-node">
    <svg class="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs v-if="hasShadow">
        <filter :id="shadowId">
          <feDropShadow
            :dx="element.shadowOffsetX ?? 0"
            :dy="element.shadowOffsetY ?? 5"
            :stdDeviation="(element.shadowBlur ?? 10) / 2"
            :flood-color="element.shadowColor ?? '#00000040'"
          />
        </filter>
      </defs>
      <polygon
        points="30,10 70,10 90,90 10,90"
        :fill="element.backgroundColor || '#ef4444'"
        :stroke="element.borderColor"
        :stroke-width="strokeWidth"
        :filter="hasShadow ? `url(#${shadowId})` : undefined"
      />
    </svg>
  </div>
</template>

<style scoped>
.shape-node {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.shape-svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
