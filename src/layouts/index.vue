<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import DefaultLayout from "./default.vue";
import ProjectsLayout from "./projects.vue";

const layouts = {
  default: DefaultLayout,
  projects: ProjectsLayout,
} as const;

type LayoutName = keyof typeof layouts;

const route = useRoute();

const isLayoutName = (value: unknown): value is LayoutName => {
  return typeof value === "string" && value in layouts;
};

const layoutComponent = computed(() => {
  const requestedLayout = route.meta.layout;

  if (isLayoutName(requestedLayout)) {
    return layouts[requestedLayout];
  }

  return layouts.default;
});
</script>

<template>
  <component :is="layoutComponent" />
</template>
