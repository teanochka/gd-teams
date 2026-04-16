import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'

export function useProjectsPage() {
  const route = useRoute()
  const projectsStore = useProjectsStore()
  const { activeSection, error, isLoading, projects, teamsWithCounts } = storeToRefs(projectsStore)

  const searchQuery = computed(() => {
    const search = route.query.search

    if (Array.isArray(search)) {
      return search[0] ?? ''
    }

    return search ?? ''
  })

  const activeTitle = computed(() => {
    if (activeSection.value === 'favorites') {
      return 'Избранное'
    }

    if (activeSection.value === 'trash') {
      return 'Корзина'
    }

    return (
      teamsWithCounts.value.find((team) => team.id === activeSection.value)?.name ?? 'Все проекты'
    )
  })

  const filteredProjects = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()

    return projects.value.filter((project) => {
      const matchesSection =
        activeSection.value === 'all'
          ? !project.isDeleted
          : activeSection.value === 'favorites'
            ? project.isFavorite && !project.isDeleted
            : activeSection.value === 'trash'
              ? project.isDeleted
              : project.teamId === activeSection.value && !project.isDeleted

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

  onMounted(() => {
    if (!projects.value.length) {
      void projectsStore.loadProjects()
    }
  })

  return {
    activeItem: activeSection,
    activeTitle,
    error,
    filteredProjects,
    isLoading,
    teams: teamsWithCounts,
    setActiveItem: projectsStore.setActiveSection,
  }
}
