<script setup lang="ts">
import IconChevronRight from '~icons/carbon/chevron-right'
import IconFolder from '~icons/carbon/folder'
import ProjectCard from '@/components/ProjectCard.vue'
import ProjectsSidebar from '@/components/ProjectsSidebar.vue'
import { useProjectsPage } from '@/composables/useProjectsPage'

const {
  activeItem,
  activeTitle,
  error,
  filteredProjects,
  isLoading,
  setActiveItem,
  teams,
} = useProjectsPage()
</script>

<template>
  <div class="projects-page">
    <div class="projects-shell">
      <ProjectsSidebar :active-item="activeItem" :teams="teams" @select="setActiveItem" />

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
            <span>{{ filteredProjects.length }} проектов</span>
            <BButton variant="outline-dark" class="view-button">
              <IconFolder aria-hidden="true" />
              <span>Сетка</span>
            </BButton>
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

        <section v-else-if="filteredProjects.length" class="projects-grid" aria-label="Список проектов">
          <ProjectCard v-for="project in filteredProjects" :key="project.id" :project="project" />
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
.toolbar-meta,
.view-button {
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

.view-button {
  gap: 8px;
  min-height: 40px;
  border-radius: 8px;
  background: #ffffff;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
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

  .projects-grid {
    grid-template-columns: 1fr;
  }
}
</style>
