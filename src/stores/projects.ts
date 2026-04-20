import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createProject as apiCreateProject, getProjects } from '@/api/projects'
import type { CreateProjectPayload, Project, Team } from '@/types/domain'

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
    projects.value = [project, ...projects.value.filter((item) => item.id !== project.id)]

    if (!teams.value.some((team) => team.id === project.teamId)) {
      teams.value = [...teams.value, { id: project.teamId, name: project.teamName }]
    }

    return project
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
    setActiveSection,
  }
})
