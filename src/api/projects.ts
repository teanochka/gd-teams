import { cloneProject, mockProjects, mockTeams } from '@/api/mockData'
import type { Project, Team } from '@/types/domain'

type ProjectsResponse = {
  projects: Project[]
  teams: Team[]
}

const wait = async () => {
  await new Promise((resolve) => window.setTimeout(resolve, 120))
}

export const getProjects = async (): Promise<ProjectsResponse> => {
  await wait()

  return {
    projects: mockProjects.map(cloneProject),
    teams: mockTeams.map((team) => ({ ...team })),
  }
}

export const getProject = async (projectId: string): Promise<Project> => {
  await wait()

  const project = mockProjects.find((item) => item.id === projectId)

  if (!project) {
    throw new Error('Project not found')
  }

  return cloneProject(project)
}
