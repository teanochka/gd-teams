<script setup lang="ts">
import IconDashboard from '~icons/carbon/dashboard'
import IconFolder from '~icons/carbon/folder'
import IconGroup from '~icons/carbon/group'
import IconStar from '~icons/carbon/star'
import IconTrashCan from '~icons/carbon/trash-can'

type Team = {
  id: string
  name: string
  count: number
}

withDefaults(
  defineProps<{
    activeItem: string
    teams?: Team[]
  }>(),
  {
    teams: () => [],
  },
)

const emit = defineEmits<{
  (event: 'select', value: string): void
}>()
</script>

<template>
  <aside class="projects-sidebar" aria-label="Навигация по проектам">
    <nav class="sidebar-section">
      <button
        class="sidebar-link"
        :class="{ active: activeItem === 'all' }"
        type="button"
        @click="emit('select', 'all')"
      >
        <IconDashboard aria-hidden="true" />
        <span>Все проекты</span>
      </button>

      <button
        class="sidebar-link"
        :class="{ active: activeItem === 'favorites' }"
        type="button"
        @click="emit('select', 'favorites')"
      >
        <IconStar aria-hidden="true" />
        <span>Избранное</span>
      </button>

      <button
        class="sidebar-link"
        :class="{ active: activeItem === 'trash' }"
        type="button"
        @click="emit('select', 'trash')"
      >
        <IconTrashCan aria-hidden="true" />
        <span>Корзина</span>
      </button>
    </nav>

    <div v-if="teams.length" class="sidebar-section teams-section">
      <div class="section-title">
        <IconGroup aria-hidden="true" />
        <span>Команды</span>
      </div>

      <button
        v-for="team in teams"
        :key="team.id"
        class="sidebar-link team-link"
        :class="{ active: activeItem === team.id }"
        type="button"
        @click="emit('select', team.id)"
      >
        <IconFolder aria-hidden="true" />
        <span>{{ team.name }}</span>
        <BBadge variant="light" class="team-count">{{ team.count }}</BBadge>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.projects-sidebar {
  width: 264px;
  min-width: 264px;
  min-height: calc(100vh - 80px);
  padding: 24px 14px;
  border-right: 1px solid #dedede;
  background: #f7f7f7;
}

.sidebar-section {
  display: grid;
  gap: 6px;
}

.teams-section {
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid #dfdfdf;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px 8px;
  color: #737373;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.sidebar-link {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 42px;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #313131;
  font: inherit;
  text-align: left;
}

.sidebar-link svg,
.section-title svg {
  width: 18px;
  height: 18px;
}

.sidebar-link span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-link:hover {
  border-color: #dddddd;
  background: #ffffff;
}

.sidebar-link.active {
  border-color: #202020;
  background: #202020;
  color: #ffffff;
}

.team-count {
  border: 1px solid #d8d8d8;
  color: #494949;
  font-weight: 600;
}

.sidebar-link.active .team-count {
  border-color: #ffffff;
  background: #ffffff !important;
  color: #202020;
}

@media (max-width: 900px) {
  .projects-sidebar {
    display: flex;
    gap: 10px;
    width: 100%;
    min-width: 0;
    min-height: auto;
    overflow-x: auto;
    padding: 12px 16px;
    border-right: 0;
    border-bottom: 1px solid #dedede;
  }

  .sidebar-section {
    display: flex;
    gap: 8px;
  }

  .teams-section {
    margin-top: 0;
    padding-top: 0;
    padding-left: 12px;
    border-top: 0;
    border-left: 1px solid #dfdfdf;
  }

  .section-title {
    display: none;
  }

  .sidebar-link {
    width: max-content;
    min-width: max-content;
  }
}
</style>
