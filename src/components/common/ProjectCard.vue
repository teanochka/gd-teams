<script setup lang="ts">
import type { Project } from '@/types/models'

defineProps<{
  project: Project
}>()
</script>

<template>
  <div class="card h-100 shadow-sm project-card">
    <div class="card-body">
      <div class="project-banner rounded-3 text-white p-2 mb-3">{{ project.banner }}</div>
      <h5 class="card-title mb-1">{{ project.name }}</h5>
      <p class="card-text text-secondary small">Изменено: {{ project.updatedAt }}</p>
    </div>
  </div>
</template>
