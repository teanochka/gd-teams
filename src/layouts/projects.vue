<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import ProjectsHeader from "@/components/project/ProjectsHeader.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const userName = computed(() => auth.user?.display_name || auth.user?.username || 'Гость');

const searchQuery = computed({
  get: () => {
    const search = route.query.search;

    if (Array.isArray(search)) {
      return search[0] ?? "";
    }

    return search ?? "";
  },
  set: (value: string) => {
    const nextQuery = { ...route.query };

    if (value.trim()) {
      nextQuery.search = value;
    } else {
      delete nextQuery.search;
    }

    void router.replace({ query: nextQuery });
  },
});

const handleCreateProject = () => {
  void router.push({ name: "project-create" });
};
</script>

<template>
  <div class="projects-layout">
    <ProjectsHeader v-model="searchQuery" :user-name="userName" @create="handleCreateProject" />

    <RouterView />
  </div>
</template>

<style scoped>
.projects-layout {
  min-height: 100vh;
  background: #ffffff;
}
</style>
