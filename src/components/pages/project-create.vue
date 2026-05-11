<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import IconChevronRight from "~icons/carbon/chevron-right";
import ProjectForm from "@/components/project/ProjectForm.vue";
import ProjectsSidebar from "@/components/project/ProjectsSidebar.vue";
import { useProjectsStore } from "@/stores/projects";
import type { CreateProjectPayload } from "@/types/domain";

const router = useRouter();
const projectsStore = useProjectsStore();
const { activeSection, teamsWithCounts } = storeToRefs(projectsStore);

const isSubmitting = ref(false);
const error = ref("");

const teams = computed(() => teamsWithCounts.value);

onMounted(async () => {
  if (!projectsStore.projects.length) {
    await projectsStore.loadProjects();
  }
});

const setActiveItem = (value: string) => {
  projectsStore.setActiveSection(value);
  void router.push({ name: "projects" });
};

const submitProject = async (payload: CreateProjectPayload) => {
  isSubmitting.value = true;
  error.value = "";

  try {
    const project = await projectsStore.createProject(payload);
    await router.push({ name: "project", params: { projectId: project.id } });
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Не удалось создать проект. Проверьте json-server и попробуйте еще раз.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="project-create-page">
    <div class="projects-shell">
      <ProjectsSidebar
        :active-item="activeSection"
        :teams="teams"
        @select="setActiveItem"
      />

      <main class="project-create-main">
        <section
          class="project-create-toolbar"
          aria-labelledby="create-project-title"
        >
          <div>
            <div class="breadcrumbs">
              <RouterLink :to="{ name: 'projects' }">Проекты</RouterLink>
              <IconChevronRight aria-hidden="true" />
              <span>Новый проект</span>
            </div>
            <h1 id="create-project-title">Создать проект</h1>
          </div>

          <BButton
            type="button"
            variant="outline-dark"
            class="back-button"
            @click="router.push({ name: 'projects' })"
          >
            К списку
          </BButton>
        </section>

        <BAlert v-if="error" variant="danger" show class="page-alert">
          {{ error }}
        </BAlert>

        <ProjectForm
          :teams="teams"
          :is-submitting="isSubmitting"
          submit-label="Создать проект"
          submitting-label="Создаем..."
          @submit="submitProject"
          @cancel="router.push({ name: 'projects' })"
        />
      </main>
    </div>
  </div>
</template>

<style scoped>
.project-create-page {
  min-height: calc(100vh - 80px);
  background: #ffffff;
  color: #171717;
}

.projects-shell {
  display: flex;
  min-height: calc(100vh - 80px);
}

.project-create-main {
  width: 100%;
  min-width: 0;
  padding: 30px;
  background: #ffffff;
}

.project-create-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.breadcrumbs,
.back-button {
  display: flex;
  align-items: center;
}

.breadcrumbs {
  gap: 6px;
  margin-bottom: 8px;
  color: #767676;
  font-size: 13px;
}

.breadcrumbs svg {
  width: 14px;
  height: 14px;
}

h1 {
  margin: 0;
  color: #141414;
  font-size: 32px;
  font-weight: 750;
  line-height: 1.15;
}

.back-button {
  min-height: 40px;
  border-radius: 8px;
  font-weight: 650;
}

.page-alert {
  margin-bottom: 18px;
  border-radius: 8px;
}

@media (max-width: 900px) {
  .projects-shell {
    display: block;
  }

  .project-create-main {
    padding: 22px 16px;
  }

  .project-create-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  h1 {
    font-size: 26px;
  }

  .back-button {
    width: 100%;
  }
}
</style>
