import { apiRequest } from '@/api/http'
import type { CreateProjectPayload, Project, Team } from '@/types/domain'

type ProjectsResponse = {
  projects: Project[]
  teams: Team[]
}

type CurrentUserResponse = {
  name?: string
  displayName?: string
  username?: string
  user?: {
    name?: string
    displayName?: string
    username?: string
  }
}

const UNKNOWN_USER = 'unknown'

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

const createEntityId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const createDefaultCover = (projectId: string) => {
  return `https://picsum.photos/seed/${projectId}/900/520`
}

const getUserName = (user: CurrentUserResponse) => {
  return (
    user.name?.trim() ||
    user.displayName?.trim() ||
    user.username?.trim() ||
    user.user?.name?.trim() ||
    user.user?.displayName?.trim() ||
    user.user?.username?.trim() ||
    UNKNOWN_USER
  )
}

const getCurrentUserName = async () => {
  for (const endpoint of ['/currentUser', '/me']) {
    try {
      return getUserName(await apiRequest<CurrentUserResponse>(endpoint))
    } catch {
      continue
    }
  }

  return UNKNOWN_USER
}

const resolveProjectTeam = async (payload: CreateProjectPayload): Promise<Team> => {
  const teamName = payload.newTeamName?.trim()

  if (teamName) {
    return apiRequest<Team>('/teams', {
      method: 'POST',
      body: {
        id: createEntityId('team'),
        name: teamName,
      },
    })
  }

  if (!payload.teamId) {
    throw new Error('Team is required')
  }

  return apiRequest<Team>(`/teams/${payload.teamId}`)
}

export const createProject = async (payload: CreateProjectPayload): Promise<Project> => {
  const title = payload.title.trim()
  const description = payload.description.trim()
  const [team, currentUserName] = await Promise.all([
    resolveProjectTeam(payload),
    getCurrentUserName(),
  ])
  const projectId = createEntityId('project')
  const rootFolderId = createEntityId('root-folder')
  const savedAt = new Date().toISOString()

  const project = await apiRequest<Project>('/projects', {
    method: 'POST',
    body: {
      id: projectId,
      title,
      description,
      createdAt: savedAt,
      updatedAt: savedAt,
      owner: currentUserName,
      teamId: team.id,
      teamName: team.name,
      isFavorite: false,
      isDeleted: false,
      filesCount: 0,
      imageUrl: payload.imageUrl?.trim() || createDefaultCover(projectId),
      rootFolderId,
    },
  })

  await apiRequest('/nodes', {
    method: 'POST',
    body: {
      id: rootFolderId,
      projectId: project.id,
      parentId: null,
      type: 'folder',
      title,
      icon: null,
      tagIds: [],
      isFavorite: false,
      isDeleted: false,
      createdAt: savedAt,
      createdBy: currentUserName,
      updatedAt: savedAt,
      updatedBy: currentUserName,
    },
  })

  return project
}
