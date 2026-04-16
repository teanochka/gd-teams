<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProjectsHeader from '@/components/ProjectsHeader.vue'

const route = useRoute()
const router = useRouter()
const createNotice = ref('')
const showCreateNotice = ref(false)

const searchQuery = computed({
  get: () => {
    const search = route.query.search

    if (Array.isArray(search)) {
      return search[0] ?? ''
    }

    return search ?? ''
  },
  set: (value: string) => {
    const nextQuery = { ...route.query }

    if (value.trim()) {
      nextQuery.search = value
    } else {
      delete nextQuery.search
    }

    void router.replace({ query: nextQuery })
  },
})

const handleCreateProject = () => {
  createNotice.value = 'Создание проекта пока в разработке.'
  showCreateNotice.value = true
}
</script>

<template>
  <div class="projects-layout">
    <ProjectsHeader v-model="searchQuery" @create="handleCreateProject" />

    <BAlert v-model="showCreateNotice" variant="secondary" dismissible class="projects-layout-alert">
      {{ createNotice }}
    </BAlert>

    <RouterView />
  </div>
</template>

<style scoped>
.projects-layout {
  min-height: 100vh;
  background: #ffffff;
}

.projects-layout-alert {
  margin: 16px 30px 0;
  border-radius: 8px;
}

@media (max-width: 900px) {
  .projects-layout-alert {
    margin: 12px 16px 0;
  }
}
</style>
