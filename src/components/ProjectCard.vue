<script setup lang="ts">
import IconOverflowMenuHorizontal from '~icons/carbon/overflow-menu-horizontal'
import IconStar from '~icons/carbon/star'
import IconTime from '~icons/carbon/time'

type ProjectCardData = {
  id: string
  title: string
  description: string
  updatedAt: string
  owner: string
  teamName: string
  isFavorite: boolean
  filesCount: number
  imageUrl: string
}

defineProps<{
  project: ProjectCardData
}>()
</script>

<template>
  <article class="project-card">
    <RouterLink
      class="project-link"
      :to="{ name: 'workspace', params: { id: project.id } }"
      :aria-label="project.title"
    >
      <div class="project-banner">
        <img :src="project.imageUrl" :alt="`Баннер проекта ${project.title}`" />
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
    </RouterLink>

    <BButton variant="light" class="card-menu" aria-label="Действия проекта" @click.stop>
      <IconOverflowMenuHorizontal aria-hidden="true" />
    </BButton>
  </article>
</template>

<style scoped>
.project-card {
  position: relative;
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

.project-title-row,
.project-footer,
.project-meta,
.project-date {
  display: flex;
  align-items: center;
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
</style>
