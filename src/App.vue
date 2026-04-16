<script setup lang="ts">
import ProjectCard from "@/components/ProjectCard.vue";
import { BApp } from "bootstrap-vue-next";
import IconAccessibility from '~icons/carbon/accessibility';
</script>

<template>
  <BApp>
    <ProjectCard
      :title="'Card 1'"
      :date="'2023-10-01'"
      :imageUrl="'https://picsum.photos/600/300/?image=25'"
    />
    <icon-accessibility/>
  </BApp>
</template>