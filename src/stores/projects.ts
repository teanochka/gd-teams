import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getProjects } from '@/api/projects'
import type { Project, Team } from '@/types/domain'

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
      count: projects.value.filter((project) => project.teamId === team.id && !project.isDeleted).length,
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

  return {
    projects,
    teams,
    teamsWithCounts,
    activeSection,
    isLoading,
    error,
    loadProjects,
    setActiveSection,
  }
})
