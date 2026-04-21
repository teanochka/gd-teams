import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createProject as apiCreateProject,
  getProjects,
  softDeleteProject as apiSoftDeleteProject,
  toggleFavoriteProject as apiToggleFavoriteProject,
  restoreProject as apiRestoreProject,
  permanentlyDeleteProject as apiPermanentlyDeleteProject,
  renameProject as apiRenameProject,
  updateProject as apiUpdateProject,
} from '@/api/projects'
import type { CreateProjectPayload, Project, Team, UpdateProjectPayload } from '@/types/domain'

export type ProjectsSection = 'all' | 'favorites' | 'trash' | string

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const teams = ref<Team[]>([])
  const activeSection = ref<ProjectsSection>('all')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const teamsWithCounts = computed(() => {
    return teams.value.map((team) => ({
      ...team,
      count: projects.value.filter((project) => project.teamId === team.id && !project.isDeleted)
        .length,
    }))
  })

  function upsertProject(project: Project) {
    const index = projects.value.findIndex((item) => item.id === project.id)

    if (index === -1) {
      projects.value = [project, ...projects.value]
      return
    }

    projects.value[index] = project
  }

  function ensureProjectTeam(project: Project) {
    if (!teams.value.some((team) => team.id === project.teamId)) {
      teams.value = [...teams.value, { id: project.teamId, name: project.teamName }]
    }
  }

  async function loadProjects() {
    isLoading.value = true
    error.value = null

    try {
      const data = await getProjects()
      projects.value = data.projects
      teams.value = data.teams
    } catch {
      error.value = 'Не удалось загрузить проекты'
    } finally {
      isLoading.value = false
    }
  }

  function setActiveSection(section: ProjectsSection) {
    activeSection.value = section
  }

  async function createProject(payload: CreateProjectPayload) {
    error.value = null

    const project = await apiCreateProject(payload)
    upsertProject(project)
    ensureProjectTeam(project)

    return project
  }

  async function updateProject(projectId: string, payload: UpdateProjectPayload) {
    error.value = null

    const project = await apiUpdateProject(projectId, payload)
    upsertProject(project)
    ensureProjectTeam(project)

    return project
  }

  async function renameProject(projectId: string, title: string) {
    error.value = null

    const project = await apiRenameProject(projectId, title)
    upsertProject(project)

    return project
  }

  function getProjectById(projectId: string) {
    return projects.value.find((project) => project.id === projectId) ?? null
  }

  async function softDeleteProject(projectId: string) {
    error.value = null
    try {
      const updatedProject = await apiSoftDeleteProject(projectId)
      const index = projects.value.findIndex((p) => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
    } catch {
      error.value = 'Не удалось удалить проект'
    }
  }

  async function toggleFavoriteProject(projectId: string, isFavorite: boolean) {
    error.value = null
    try {
      const project = projects.value.find((p) => p.id === projectId)
      if (!project) throw new Error('Проект не найден')
      if (project.isDeleted) throw new Error('Нельзя добавить удалённый проект в избранное')

      const updatedProject = await apiToggleFavoriteProject(projectId, isFavorite)
      const index = projects.value.findIndex((p) => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось обновить избранное'
    }
  }

  async function restoreProject(projectId: string) {
    error.value = null
    try {
      const project = projects.value.find((p) => p.id === projectId)
      if (!project) throw new Error('Проект не найден')
      if (!project.isDeleted) throw new Error('Проект не в корзине')

      const updatedProject = await apiRestoreProject(projectId)
      const index = projects.value.findIndex((p) => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось восстановить проект'
    }
  }

  async function permanentlyDeleteProject(projectId: string) {
    error.value = null
    try {
      const project = projects.value.find((p) => p.id === projectId)
      if (!project) throw new Error('Проект не найден')

      await apiPermanentlyDeleteProject(projectId)
      projects.value = projects.value.filter((p) => p.id !== projectId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось удалить проект'
    }
  }

  return {
    projects,
    teams,
    teamsWithCounts,
    activeSection,
    isLoading,
    error,
    loadProjects,
    createProject,
    renameProject,
    updateProject,
    softDeleteProject,
    restoreProject,
    toggleFavoriteProject,
    permanentlyDeleteProject,
    setActiveSection,
    getProjectById,
  }
})
