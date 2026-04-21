<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import IconOverflowMenuHorizontal from '~icons/carbon/overflow-menu-horizontal'
import IconStar from '~icons/carbon/star'
import IconTime from '~icons/carbon/time'
import { useProjectsStore } from '@/stores/projects'
import { formatDateTime } from '@/utils/formatDate'

const dropdownMenu = useTemplateRef('dropdownMenu')
const titleInput = ref<HTMLInputElement | null>(null)
const router = useRouter()
const projectsStore = useProjectsStore()

const hide = () => dropdownMenu.value?.hide()
const toggle = () => dropdownMenu.value?.toggle()

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
  isDeleted: boolean
}

const props = defineProps<{
  project: ProjectCardData
}>()

const renamingProjectId = ref<string | null>(null)
const draftTitle = ref('')
const isSavingTitle = ref(false)
const isRenaming = computed(() => renamingProjectId.value === props.project.id)
const projectLinkProps = computed(() => {
  if (isRenaming.value) {
    return {
      class: 'project-link',
      'aria-label': props.project.title,
    }
  }

  return {
    class: 'project-link',
    to: { name: 'project', params: { projectId: props.project.id } },
    'aria-label': props.project.title,
  }
})

watch(
  () => props.project.title,
  (title) => {
    if (!isRenaming.value) {
      draftTitle.value = title
    }
  },
  { immediate: true },
)

const focusTitleInput = async () => {
  await nextTick()
  titleInput.value?.focus()
  titleInput.value?.select()
}

const openEditPage = () => {
  hide()
  void router.push({ name: 'project-edit', params: { projectId: props.project.id } })
}

const startRename = () => {
  hide()
  renamingProjectId.value = props.project.id
  draftTitle.value = props.project.title
  void focusTitleInput()
}

const finishRename = async () => {
  if (!isRenaming.value || isSavingTitle.value) {
    return
  }

  const nextTitle = draftTitle.value.trim()

  if (!nextTitle) {
    draftTitle.value = props.project.title
    renamingProjectId.value = null
    return
  }

  if (nextTitle === props.project.title) {
    renamingProjectId.value = null
    return
  }

  isSavingTitle.value = true

  try {
    await projectsStore.renameProject(props.project.id, nextTitle)
  } finally {
    isSavingTitle.value = false
    renamingProjectId.value = null
  }
}

const cancelRename = () => {
  draftTitle.value = props.project.title
  renamingProjectId.value = null
}

const addToFavorites = () => {
  hide()
  void projectsStore.toggleFavoriteProject(props.project.id, true)
}

const removeFromFavorites = () => {
  hide()
  void projectsStore.toggleFavoriteProject(props.project.id, false)
}

const moveToTrash = () => {
  hide()
  void projectsStore.softDeleteProject(props.project.id)
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (!isRenaming.value || isSavingTitle.value) {
    return
  }

  const target = event.target

  if (!(target instanceof Node)) {
    return
  }

  if (titleInput.value?.contains(target)) {
    return
  }

  void finishRename()
}

watch(isRenaming, (value) => {
  if (value) {
    document.addEventListener('pointerdown', handleDocumentPointerDown)
    return
  }

  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<template>
  <article class="project-card" @contextmenu.prevent="toggle">
    <component :is="isRenaming ? 'div' : RouterLink" v-bind="projectLinkProps">
      <div class="project-banner">
        <img :src="project.imageUrl" :alt="`Баннер проекта ${project.title}`" />
      </div>

      <div class="project-body">
        <div class="project-title-row">
          <input
            v-if="isRenaming"
            ref="titleInput"
            v-model="draftTitle"
            class="form-control title-input"
            :disabled="isSavingTitle"
            @click.stop
            @keydown.enter.prevent="finishRename"
            @keydown.esc.prevent="cancelRename"
          />
          <h2 v-else>{{ project.title }}</h2>
          <IconStar v-if="project.isFavorite" class="favorite-icon" aria-label="В избранном" />
        </div>

        <p>{{ project.description }}</p>

        <div class="project-footer">
          <span class="project-date">
            <IconTime aria-hidden="true" />
            {{ formatDateTime(project.updatedAt) }}
          </span>
          <span>{{ project.filesCount }} файлов</span>
        </div>

        <div class="project-meta">
          <BBadge variant="light">{{ project.teamName }}</BBadge>
          <span>Владелец: {{ project.owner }}</span>
        </div>
      </div>
    </component>

    <BDropdown
      ref="dropdownMenu"
      variant="link"
      toggle-class="card-menu-toggle"
      class="card-menu"
      no-caret
    >
      <template #button-content>
        <IconOverflowMenuHorizontal aria-hidden="true" style="color: black" />
      </template>
      <BDropdownItem @click="startRename">Переименовать</BDropdownItem>
      <BDropdownItem @click="openEditPage">Изменить</BDropdownItem>
      <BDropdownItem v-if="!project.isFavorite" @click="addToFavorites">
        В избранное
      </BDropdownItem>
      <BDropdownItem v-if="project.isFavorite" @click="removeFromFavorites">
        Убрать из избранного
      </BDropdownItem>
      <BDropdownItem v-if="!project.isDeleted" @click="moveToTrash">
        В корзину
      </BDropdownItem>
    </BDropdown>
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
  padding: 0;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  background: white;
}

.card-menu-toggle {
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px !important;
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
  min-height: 28px;
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

.title-input {
  min-width: 0;
  height: 28px;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 750;
  line-height: 1.25;
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
