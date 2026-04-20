<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconChevronRight from '~icons/carbon/chevron-right'
import IconImage from '~icons/carbon/image'
import IconUpload from '~icons/carbon/upload'
import ProjectsSidebar from '@/components/ProjectsSidebar.vue'
import { useProjectsStore } from '@/stores/projects'

const router = useRouter()
const projectsStore = useProjectsStore()
const { activeSection, teamsWithCounts } = storeToRefs(projectsStore)

const title = ref('')
const description = ref('')
const selectedTeamId = ref('')
const teamMode = ref<'existing' | 'new'>('existing')
const newTeamName = ref('')
const coverDataUrl = ref('')
const fileName = ref('')
const isSubmitting = ref(false)
const error = ref('')

const teams = computed(() => teamsWithCounts.value)
const hasTeams = computed(() => teams.value.length > 0)
const previewImage = computed(
  () => coverDataUrl.value || 'https://picsum.photos/seed/new-project/900/520',
)

const canSubmit = computed(() => {
  const hasTeam = teamMode.value === 'new' ? newTeamName.value.trim() : selectedTeamId.value

  return Boolean(title.value.trim() && description.value.trim() && hasTeam && !isSubmitting.value)
})

onMounted(async () => {
  if (!projectsStore.projects.length) {
    await projectsStore.loadProjects()
  }

  selectedTeamId.value = teams.value[0]?.id ?? ''
  teamMode.value = selectedTeamId.value ? 'existing' : 'new'
})

const setActiveItem = (value: string) => {
  projectsStore.setActiveSection(value)
  void router.push({ name: 'projects' })
}

const readFileAsDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener('load', () => resolve(String(reader.result ?? '')))
    reader.addEventListener('error', () => reject(new Error('Не удалось прочитать файл')))
    reader.readAsDataURL(file)
  })
}

const handleCoverChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    error.value = 'Выберите файл изображения для обложки.'
    input.value = ''
    return
  }

  try {
    coverDataUrl.value = await readFileAsDataUrl(file)
    fileName.value = file.name
    error.value = ''
  } catch {
    error.value = 'Не удалось загрузить обложку.'
  }
}

const submitProject = async () => {
  if (!canSubmit.value) {
    error.value = 'Заполните название, описание и команду.'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const project = await projectsStore.createProject({
      title: title.value,
      description: description.value,
      imageUrl: coverDataUrl.value,
      teamId: teamMode.value === 'existing' ? selectedTeamId.value : undefined,
      newTeamName: teamMode.value === 'new' ? newTeamName.value : undefined,
    })

    await router.push({ name: 'project', params: { projectId: project.id } })
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : 'Не удалось создать проект. Проверьте json-server и попробуйте еще раз.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="project-create-page">
    <div class="projects-shell">
      <ProjectsSidebar :active-item="activeSection" :teams="teams" @select="setActiveItem" />

      <main class="project-create-main">
        <section class="project-create-toolbar" aria-labelledby="create-project-title">
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

        <BAlert v-if="error" variant="danger" show class="form-alert">
          {{ error }}
        </BAlert>

        <form class="project-form" @submit.prevent="submitProject">
          <section class="cover-panel" aria-labelledby="cover-title">
            <div class="cover-preview">
              <img :src="previewImage" alt="Обложка нового проекта" />
              <div class="cover-overlay">
                <IconImage aria-hidden="true" />
                <span>{{ fileName || 'Обложка проекта' }}</span>
              </div>
            </div>

            <div class="cover-copy">
              <span class="section-eyebrow">Обложка</span>
              <h2 id="cover-title">Добавьте изображение проекта</h2>
              <p>Загрузите картинку, которая поможет отличать проект в общей сетке.</p>

              <label class="upload-button">
                <IconUpload aria-hidden="true" />
                <span>Загрузить обложку</span>
                <input type="file" accept="image/*" @change="handleCoverChange" />
              </label>
            </div>
          </section>

          <section class="form-grid" aria-label="Данные проекта">
            <div class="form-field span-full">
              <label for="project-title">Название</label>
              <BFormInput
                id="project-title"
                v-model="title"
                placeholder="Например, Tactical Garden"
                required
              />
            </div>

            <div class="form-field span-full">
              <label for="project-description">Описание</label>
              <textarea
                id="project-description"
                v-model="description"
                class="form-control"
                rows="5"
                placeholder="Коротко опишите идею, контент и задачи проекта"
                required
              />
            </div>

            <fieldset class="team-panel span-full">
              <legend>Команда</legend>

              <div class="team-switch">
                <label class="team-choice" :class="{ active: teamMode === 'existing' && hasTeams }">
                  <input v-model="teamMode" type="radio" value="existing" :disabled="!hasTeams" />
                  <span>Выбрать из списка</span>
                </label>

                <label class="team-choice" :class="{ active: teamMode === 'new' }">
                  <input v-model="teamMode" type="radio" value="new" />
                  <span>Создать новую</span>
                </label>
              </div>

              <div v-if="teamMode === 'existing' && hasTeams" class="form-field">
                <label for="project-team">Список команд</label>
                <select id="project-team" v-model="selectedTeamId" class="form-select">
                  <option v-for="team in teams" :key="team.id" :value="team.id">
                    {{ team.name }}
                  </option>
                </select>
              </div>

              <div v-else class="form-field">
                <label for="new-team-name">Название новой команды</label>
                <BFormInput
                  id="new-team-name"
                  v-model="newTeamName"
                  placeholder="Например, Команда нарратива"
                  :required="teamMode === 'new'"
                />
              </div>
            </fieldset>

            <div class="form-actions span-full">
              <BButton
                type="button"
                variant="light"
                class="cancel-button"
                @click="router.push({ name: 'projects' })"
              >
                Отмена
              </BButton>
              <BButton type="submit" variant="dark" class="submit-button" :disabled="!canSubmit">
                {{ isSubmitting ? 'Создаем...' : 'Создать проект' }}
              </BButton>
            </div>
          </section>
        </form>
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
.back-button,
.upload-button,
.team-switch,
.team-choice,
.form-actions {
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

.back-button,
.cancel-button,
.submit-button {
  min-height: 40px;
  border-radius: 8px;
  font-weight: 650;
}

.form-alert {
  margin-bottom: 18px;
  border-radius: 8px;
}

.project-form {
  display: grid;
  gap: 18px;
  max-width: 1040px;
}

.cover-panel,
.form-grid {
  border: 1px solid #d8d8d8;
  border-radius: 8px;
  background: #ffffff;
}

.cover-panel {
  display: grid;
  grid-template-columns: minmax(280px, 44%) minmax(0, 1fr);
  overflow: hidden;
}

.cover-preview {
  position: relative;
  min-height: 280px;
  overflow: hidden;
  border-right: 1px solid #e2e2e2;
  background: #efefef;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  min-height: 280px;
  object-fit: cover;
  filter: grayscale(1);
}

.cover-overlay {
  position: absolute;
  right: 14px;
  bottom: 14px;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #191919;
  font-size: 13px;
  font-weight: 650;
}

.cover-overlay svg {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
}

.cover-copy {
  display: grid;
  align-content: center;
  gap: 10px;
  padding: 28px;
}

.section-eyebrow {
  color: #777777;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.cover-copy h2,
.team-panel legend {
  margin: 0;
  color: #171717;
  font-size: 22px;
  font-weight: 750;
  line-height: 1.25;
}

.cover-copy p {
  max-width: 480px;
  margin: 0;
  color: #5e5e5e;
  line-height: 1.55;
}

.upload-button {
  position: relative;
  justify-content: center;
  gap: 8px;
  width: max-content;
  min-height: 42px;
  margin-top: 8px;
  padding: 9px 14px;
  border: 1px solid #202020;
  border-radius: 8px;
  background: #202020;
  color: #ffffff;
  cursor: pointer;
  font-weight: 650;
}

.upload-button svg {
  width: 18px;
  height: 18px;
}

.upload-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding: 22px;
}

.span-full {
  grid-column: 1 / -1;
}

.form-field {
  display: grid;
  gap: 8px;
}

.form-field label,
.team-panel legend {
  color: #202020;
}

.form-field label {
  font-size: 14px;
  font-weight: 700;
}

.form-field :deep(.form-control),
.form-field .form-control,
.form-field .form-select {
  min-height: 42px;
  border-color: #d5d5d5;
  border-radius: 8px;
  color: #191919;
}

.form-field textarea.form-control {
  min-height: 130px;
  resize: vertical;
}

.form-field :deep(.form-control:focus),
.form-field .form-control:focus,
.form-field .form-select:focus {
  border-color: #7a7a7a;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
}

.team-panel {
  display: grid;
  gap: 16px;
  min-width: 0;
  margin: 0;
  padding: 18px;
  border: 1px solid #dedede;
  border-radius: 8px;
  background: #f8f8f8;
}

.team-panel legend {
  float: none;
  width: auto;
  padding: 0;
  font-size: 18px;
}

.team-switch {
  flex-wrap: wrap;
  gap: 10px;
}

.team-choice {
  gap: 8px;
  min-height: 40px;
  padding: 9px 12px;
  border: 1px solid #d5d5d5;
  border-radius: 8px;
  background: #ffffff;
  color: #313131;
  cursor: pointer;
  font-weight: 650;
}

.team-choice.active {
  border-color: #202020;
  background: #202020;
  color: #ffffff;
}

.team-choice:has(input:disabled) {
  color: #999999;
  cursor: not-allowed;
}

.form-actions {
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.cancel-button {
  border: 1px solid #d5d5d5;
  background: #ffffff;
  color: #191919;
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

  .cover-panel {
    grid-template-columns: 1fr;
  }

  .cover-preview {
    border-right: 0;
    border-bottom: 1px solid #e2e2e2;
  }
}

@media (max-width: 560px) {
  h1 {
    font-size: 26px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .cover-copy {
    padding: 20px;
  }

  .form-actions,
  .back-button,
  .upload-button {
    width: 100%;
  }

  .form-actions {
    display: grid;
  }
}
</style>
