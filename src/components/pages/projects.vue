<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import IconChevronRight from '~icons/carbon/chevron-right'
import IconFolder from '~icons/carbon/folder'
import ProjectCard from '@/components/ProjectCard.vue'
import ProjectsSidebar from '@/components/ProjectsSidebar.vue'

type Project = {
  id: string
  title: string
  description: string
  updatedAt: string
  owner: string
  teamId: string
  teamName: string
  isFavorite: boolean
  isDeleted: boolean
  filesCount: number
  imageUrl: string
}

const route = useRoute()
const activeItem = ref('all')

const teams = [
  { id: 'team-gameplay', name: 'Команда геймплея', count: 3 },
  { id: 'team-art', name: 'Команда арта', count: 2 },
]

const projects: Project[] = [
  {
    id: 'village-quest',
    title: 'Village Quest',
    description: 'Квесты, персонажи и логика поселения.',
    updatedAt: 'Сегодня, 14:20',
    owner: 'Анна',
    teamId: 'team-gameplay',
    teamName: 'Команда геймплея',
    isFavorite: true,
    isDeleted: false,
    filesCount: 42,
    imageUrl: 'https://picsum.photos/seed/village-quest/900/520',
  },
  {
    id: 'combat-prototype',
    title: 'Combat Prototype',
    description: 'Документы по балансу, атакам и состояниям врагов.',
    updatedAt: 'Вчера, 18:05',
    owner: 'Марк',
    teamId: 'team-gameplay',
    teamName: 'Команда геймплея',
    isFavorite: false,
    isDeleted: false,
    filesCount: 28,
    imageUrl: 'https://picsum.photos/seed/combat-prototype/900/520',
  },
  {
    id: 'ui-kit',
    title: 'UI Kit',
    description: 'Макеты экранов, компоненты интерфейса и состояния.',
    updatedAt: '12 апреля, 09:40',
    owner: 'Саша',
    teamId: 'team-art',
    teamName: 'Команда арта',
    isFavorite: true,
    isDeleted: false,
    filesCount: 36,
    imageUrl: 'https://picsum.photos/seed/ui-kit/900/520',
  },
  {
    id: 'world-bible',
    title: 'World Bible',
    description: 'Лор, регионы, фракции и черновики сюжетных веток.',
    updatedAt: '8 апреля, 16:10',
    owner: 'Анна',
    teamId: 'team-art',
    teamName: 'Команда арта',
    isFavorite: false,
    isDeleted: false,
    filesCount: 57,
    imageUrl: 'https://picsum.photos/seed/world-bible/900/520',
  },
  {
    id: 'old-arena',
    title: 'Old Arena',
    description: 'Архивный прототип арены для ранних тестов.',
    updatedAt: '1 апреля, 11:15',
    owner: 'Игорь',
    teamId: 'team-gameplay',
    teamName: 'Команда геймплея',
    isFavorite: false,
    isDeleted: true,
    filesCount: 13,
    imageUrl: 'https://picsum.photos/seed/old-arena/900/520',
  },
]

const searchQuery = computed(() => {
  const search = route.query.search

  if (Array.isArray(search)) {
    return search[0] ?? ''
  }

  return search ?? ''
})

const activeTitle = computed(() => {
  if (activeItem.value === 'favorites') {
    return 'Избранное'
  }

  if (activeItem.value === 'trash') {
    return 'Корзина'
  }

  return teams.find((team) => team.id === activeItem.value)?.name ?? 'Все проекты'
})

const filteredProjects = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return projects.filter((project) => {
    const matchesSection =
      activeItem.value === 'all'
        ? !project.isDeleted
        : activeItem.value === 'favorites'
          ? project.isFavorite && !project.isDeleted
          : activeItem.value === 'trash'
            ? project.isDeleted
            : project.teamId === activeItem.value && !project.isDeleted

    if (!matchesSection) {
      return false
    }

    if (!query) {
      return true
    }

    return [project.title, project.description, project.owner, project.teamName]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})
</script>

<template>
  <div class="projects-page">
    <div class="projects-shell">
      <ProjectsSidebar :active-item="activeItem" :teams="teams" @select="activeItem = $event" />

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

        <section v-if="filteredProjects.length" class="projects-grid" aria-label="Список проектов">
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
