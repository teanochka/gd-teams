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

const shadowId = computed(() => getSvgShadowId(props.element, "star-shadow"));
const hasShadow = computed(() => hasSvgShadow(props.element));
const strokeWidth = computed(() => {
  if (!props.element.borderColor && !props.element.borderWidth) {
    return 0;
  }

  return props.element.borderWidth ?? 2;
});
const starPoints = computed(() => {
  const points: string[] = [];
  const numPoints = 5;
  const innerRadius = 30;
  const outerRadius = 50;

  for (let index = 0; index < numPoints * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / numPoints) * index - Math.PI / 2;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);

    points.push(`${x},${y}`);
  }

  return points.join(" ");
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
        :points="starPoints"
        :fill="element.backgroundColor || '#fbbf24'"
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
