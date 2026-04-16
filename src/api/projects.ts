import { apiRequest } from '@/api/http'
import type { Project, Team } from '@/types/domain'

type ProjectsResponse = {
  projects: Project[]
  teams: Team[]
}

export const getProjects = async (): Promise<ProjectsResponse> => {
  const [projects, teams] = await Promise.all([
    apiRequest<Project[]>('/projects'),
    apiRequest<Team[]>('/teams'),
  ])

  return { projects, teams }
}

export const getProject = async (projectId: string): Promise<Project> => {
  return apiRequest<Project>(`/projects/${projectId}`)
}
