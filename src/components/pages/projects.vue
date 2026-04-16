<script setup lang="ts">
import { computed, ref } from 'vue'
import IconChevronRight from '~icons/carbon/chevron-right'
import IconFolder from '~icons/carbon/folder'
import IconOverflowMenuHorizontal from '~icons/carbon/overflow-menu-horizontal'
import IconStar from '~icons/carbon/star'
import IconTime from '~icons/carbon/time'
import ProjectsHeader from '@/components/ProjectsHeader.vue'
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

const searchQuery = ref('')
const activeItem = ref('all')
const createNotice = ref('')
const showCreateNotice = ref(false)

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

const handleCreateProject = () => {
  createNotice.value = 'Создание проекта пока в разработке.'
  showCreateNotice.value = true
}
</script>

<template>
  <div class="projects-page">
    <ProjectsHeader v-model="searchQuery" @create="handleCreateProject" />

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

        <BAlert v-model="showCreateNotice" variant="secondary" dismissible class="create-alert">
          {{ createNotice }}
        </BAlert>

        <section v-if="filteredProjects.length" class="projects-grid" aria-label="Список проектов">
          <article v-for="project in filteredProjects" :key="project.id" class="project-card">
            <a class="project-link" :href="`/projects/${project.id}`" :aria-label="project.title">
              <div class="project-banner">
                <img :src="project.imageUrl" :alt="`Баннер проекта ${project.title}`" />
                <BButton
                  variant="light"
                  class="card-menu"
                  aria-label="Действия проекта"
                  @click.prevent
                >
                  <IconOverflowMenuHorizontal aria-hidden="true" />
                </BButton>
              </div>

              <div class="project-body">
                <div class="project-title-row">
                  <h2>{{ project.title }}</h2>
                  <IconStar v-if="project.isFavorite" class="favorite-icon" aria-label="В избранном" />
                </div>

                <p>{{ project.description }}</p>

                <div class="project-footer">
                  <span class="project-date">
                    <IconTime aria-hidden="true" />
                    {{ project.updatedAt }}
                  </span>
                  <span>{{ project.filesCount }} файлов</span>
                </div>

                <div class="project-meta">
                  <BBadge variant="light">{{ project.teamName }}</BBadge>
                  <span>Владелец: {{ project.owner }}</span>
                </div>
              </div>
            </a>
          </article>
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
  min-height: 100vh;
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
.view-button,
.project-date,
.project-title-row,
.project-footer,
.project-meta {
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

.create-alert {
  border-radius: 8px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}

.project-card {
  overflow: hidden;
  border: 1px solid #d8d8d8;
  border-radius: 8px;
  background: #ffffff;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.project-card:hover {
  border-color: #9e9e9e;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.project-link {
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.project-banner {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-bottom: 1px solid #e2e2e2;
  background: #efefef;
}

.project-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1);
}

.card-menu {
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  color: #191919;
}

.project-body {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.project-title-row {
  justify-content: space-between;
  gap: 12px;
}

.project-title-row h2 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #171717;
  font-size: 18px;
  font-weight: 750;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  color: #1c1c1c;
}

.project-body p {
  min-height: 44px;
  margin: 0;
  color: #5e5e5e;
  font-size: 14px;
  line-height: 1.55;
}

.project-footer {
  justify-content: space-between;
  gap: 12px;
  color: #6a6a6a;
  font-size: 13px;
}

.project-date {
  gap: 6px;
  min-width: 0;
}

.project-date svg {
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
}

.project-meta {
  justify-content: space-between;
  gap: 10px;
  padding-top: 4px;
  color: #777777;
  font-size: 12px;
}

.project-meta :deep(.badge) {
  border: 1px solid #d8d8d8;
  color: #3f3f3f;
  font-weight: 600;
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
