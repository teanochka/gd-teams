<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import IconChevronRight from "~icons/carbon/chevron-right";
import ProjectForm from "@/components/project/ProjectForm.vue";
import ProjectsSidebar from "@/components/project/ProjectsSidebar.vue";
import { useProjectsStore } from "@/stores/projects";
import type { UpdateProjectPayload } from "@/types/domain";

const route = useRoute();
const router = useRouter();
const projectsStore = useProjectsStore();
const { activeSection, teamsWithCounts } = storeToRefs(projectsStore);

const isLoadingProject = ref(true);
const isSubmitting = ref(false);
const error = ref("");

const projectId = computed(() => String(route.params.projectId ?? ""));
const teams = computed(() => teamsWithCounts.value);
const project = computed(() => projectsStore.getProjectById(projectId.value));
const initialValues = computed(() => {
  if (!project.value) {
    return null;
  }

  return {
    title: project.value.title,
    description: project.value.description,
    imageUrl: project.value.imageUrl,
    teamId: project.value.teamId,
  };
});

onMounted(async () => {
  if (!projectsStore.projects.length) {
    await projectsStore.loadProjects();
  }

  if (!project.value) {
    error.value = "Проект не найден.";
  }

  isLoadingProject.value = false;
});

const setActiveItem = (value: string) => {
  projectsStore.setActiveSection(value);
  void router.push({ name: "projects" });
};

const submitProject = async (payload: UpdateProjectPayload) => {
  if (!project.value) {
    error.value = "Проект не найден.";
    return;
  }

  isSubmitting.value = true;
  error.value = "";

  try {
    const updatedProject = await projectsStore.updateProject(
      project.value.id,
      payload,
    );
    await router.push({
      name: "project",
      params: { projectId: updatedProject.id },
    });
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Не удалось обновить проект. Проверьте json-server и попробуйте еще раз.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="project-edit-page">
    <div class="projects-shell">
      <ProjectsSidebar
        :active-item="activeSection"
        :teams="teams"
        @select="setActiveItem"
      />

      <main class="project-edit-main">
        <section
          class="project-edit-toolbar"
          aria-labelledby="edit-project-title"
        >
          <div>
            <div class="breadcrumbs">
              <RouterLink :to="{ name: 'projects' }">Проекты</RouterLink>
              <IconChevronRight aria-hidden="true" />
              <span>Редактирование проекта</span>
            </div>
            <h1 id="edit-project-title">Изменить проект</h1>
          </div>

          <BButton
            type="button"
            variant="outline-dark"
            class="back-button"
            @click="router.push({ name: 'project', params: { projectId } })"
          >
            К проекту
          </BButton>
        </section>

        <BAlert v-if="error" variant="danger" show class="page-alert">
          {{ error }}
        </BAlert>

        <BSpinner v-if="isLoadingProject" label="Загрузка проекта" />

        <ProjectForm
          v-else-if="project"
          :teams="teams"
          :initial-values="initialValues"
          :is-submitting="isSubmitting"
          submit-label="Сохранить изменения"
          submitting-label="Сохраняем..."
          @submit="submitProject"
          @cancel="router.push({ name: 'project', params: { projectId } })"
        />
      </main>
    </div>
  </div>
</template>

<style scoped>
.project-edit-page {
  min-height: calc(100vh - 80px);
  background: #ffffff;
  color: #171717;
}

.projects-shell {
  display: flex;
  min-height: calc(100vh - 80px);
}

.project-edit-main {
  width: 100%;
  min-width: 0;
  padding: 30px;
  background: #ffffff;
}

.project-edit-toolbar {
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

  .project-edit-main {
    padding: 22px 16px;
  }

  .project-edit-toolbar {
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
