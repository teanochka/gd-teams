<script setup lang="ts">
import { computed, ref } from "vue";
import IconCheckmark from "~icons/carbon/checkmark";
import IconChevronDown from "~icons/carbon/chevron-down";
import IconChevronRight from "~icons/carbon/chevron-right";
import IconFolder from "~icons/carbon/folder";
import IconGrid from "~icons/carbon/grid";
import IconList from "~icons/carbon/list";
import IconTrashCan from "~icons/carbon/trash-can";
import ProjectCard from "@/components/project/ProjectCard.vue";
import ProjectListItem from "@/components/project/ProjectListItem.vue";
import ProjectsSidebar from "@/components/project/ProjectsSidebar.vue";
import { useProjectsPage } from "@/composables/useProjectsPage";

type ProjectsViewMode = "grid" | "list";

const {
  activeItem,
  activeTitle,
  error,
  filteredProjects,
  isLoading,
  setActiveItem,
  teams,
  clearTrash,
} = useProjectsPage();

const viewMode = ref<ProjectsViewMode>("grid");

const handleClearTrash = async () => {
  if (
    confirm("Вы уверены, что хотите навсегда удалить все проекты из корзины?")
  ) {
    await clearTrash();
  }
};
const viewModeLabel = computed(() =>
  viewMode.value === "grid" ? "Сетка" : "Список",
);

const setViewMode = (mode: ProjectsViewMode) => {
  viewMode.value = mode;
};
</script>

<template>
  <div class="projects-page">
    <div class="projects-shell">
      <ProjectsSidebar
        :active-item="activeItem"
        :teams="teams"
        @select="setActiveItem"
      />

      <main class="projects-main">
        <section class="projects-toolbar" aria-labelledby="projects-title">
          <div>
            <div class="breadcrumbs">
              <span>Проекты</span>
              <IconChevronRight aria-hidden="true" />
              <span>{{ activeTitle }}</span>
            </div>
            <h1 id="projects-title">{{ activeTitle }}</h1>
          </div>

          <div class="toolbar-meta">
            <BButton
              v-if="activeItem === 'trash' && filteredProjects.length > 0"
              variant="outline-danger"
              class="clear-trash-btn"
              @click="handleClearTrash"
            >
              <IconTrashCan aria-hidden="true" />
              Очистить корзину
            </BButton>

            <span>{{ filteredProjects.length }} проектов</span>
            <BDropdown variant="outline-dark" class="view-dropdown">
              <template #button-content>
                <IconGrid v-if="viewMode === 'grid'" aria-hidden="true" />
                <IconList v-else aria-hidden="true" />
                <span>{{ viewModeLabel }}</span>
                <IconChevronDown aria-hidden="true" />
              </template>
              <BDropdownItem @click="setViewMode('list')">
                <IconList aria-hidden="true" />
                Список
                <IconCheckmark
                  v-if="viewMode === 'list'"
                  class="dropdown-check"
                  aria-hidden="true"
                />
              </BDropdownItem>
              <BDropdownItem @click="setViewMode('grid')">
                <IconGrid aria-hidden="true" />
                Сетка
                <IconCheckmark
                  v-if="viewMode === 'grid'"
                  class="dropdown-check"
                  aria-hidden="true"
                />
              </BDropdownItem>
            </BDropdown>
          </div>
        </section>

        <section v-if="isLoading" class="empty-state" aria-live="polite">
          <IconFolder aria-hidden="true" />
          <h2>Загружаем проекты</h2>
          <p>Собираем список проектов и команд.</p>
        </section>

        <section v-else-if="error" class="empty-state" aria-live="polite">
          <IconFolder aria-hidden="true" />
          <h2>Не удалось загрузить проекты</h2>
          <p>{{ error }}</p>
        </section>

        <section
          v-else-if="filteredProjects.length"
          class="projects-content"
          :class="viewMode"
          aria-label="Список проектов"
        >
          <template v-if="viewMode === 'grid'">
            <ProjectCard
              v-for="project in filteredProjects"
              :key="project.id"
              :project="project"
            />
          </template>
          <template v-else>
            <ProjectListItem
              v-for="project in filteredProjects"
              :key="project.id"
              :project="project"
            />
          </template>
        </section>

        <section v-else class="empty-state" aria-live="polite">
          <IconFolder aria-hidden="true" />
          <h2>Проекты не найдены</h2>
          <p>Попробуйте изменить поиск или выбрать другой раздел.</p>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.projects-page {
  min-height: calc(100vh - 80px);
  background: #ffffff;
  color: #171717;
}

.projects-shell {
  display: flex;
  min-height: calc(100vh - 80px);
}

.projects-main {
  width: 100%;
  min-width: 0;
  padding: 30px;
  background: #ffffff;
}

.projects-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.breadcrumbs,
.toolbar-meta {
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

.toolbar-meta {
  gap: 12px;
  color: #666666;
  font-size: 14px;
  white-space: nowrap;
}

.view-dropdown :deep(.btn) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  border-radius: 8px;
  background: #ffffff;
  font-weight: 650;
}

.view-dropdown :deep(.dropdown-toggle::after) {
  display: none;
}

.view-dropdown :deep(.dropdown-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
}

.dropdown-check {
  margin-left: auto;
}

.projects-content.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}

.projects-content.list {
  display: grid;
  gap: 8px;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 360px;
  padding: 44px;
  border: 1px dashed #cfcfcf;
  border-radius: 8px;
  background: #fafafa;
  color: #606060;
  text-align: center;
}

.empty-state svg {
  width: 46px;
  height: 46px;
  margin-bottom: 10px;
  color: #2a2a2a;
}

.empty-state h2 {
  margin: 0 0 6px;
  color: #191919;
  font-size: 20px;
  font-weight: 750;
}

.empty-state p {
  margin: 0;
}

@media (max-width: 900px) {
  .projects-shell {
    display: block;
  }

  .projects-main {
    padding: 22px 16px;
  }

  .projects-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-meta {
    justify-content: space-between;
    width: 100%;
  }
}

@media (max-width: 560px) {
  h1 {
    font-size: 26px;
  }

  .projects-content.grid {
    grid-template-columns: 1fr;
  }
}
</style>
