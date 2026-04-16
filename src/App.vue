<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ProjectsLayout from '@/layouts/ProjectsLayout.vue'
import WorkspaceLayout from '@/layouts/WorkspaceLayout.vue'

const route = useRoute()

const currentLayout = computed(() => {
  return route.meta.layout === 'workspace' ? WorkspaceLayout : ProjectsLayout
})
</script>

<template>
  <component :is="currentLayout">
    <template #topbar>
      <div class="d-flex justify-content-between align-items-center">
        <div class="fw-semibold">Файловый менеджер</div>
        <RouterLink to="/projects" class="btn btn-outline-secondary btn-sm">К проектам</RouterLink>
      </div>
    </template>
    <RouterView />
  </component>
</template>
