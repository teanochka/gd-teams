import { apiRequest } from '@/api/http'
import type {
  CreateProjectPayload,
  Project,
  ProjectMember,
  ProjectRole,
  Team,
  UpdateProjectPayload,
  User,
} from '@/types/domain'

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

export const toggleFavoriteProject = async (projectId: string, isFavorite: boolean): Promise<Project> => {
  return apiRequest<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: { isFavorite },
  })
}

export const softDeleteProject = async (projectId: string): Promise<Project> => {
  return apiRequest<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: { isDeleted: true },
  })
}

export const restoreProject = async (projectId: string): Promise<Project> => {
  return apiRequest<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: { isDeleted: false },
  })
}

export const permanentlyDeleteProject = async (projectId: string): Promise<void> => {
  await apiRequest(`/projects/${projectId}`, {
    method: 'DELETE',
  })
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

export const updateProject = async (
  projectId: string,
  payload: UpdateProjectPayload,
): Promise<Project> => {
  const existingProject = await getProject(projectId)
  const title = payload.title.trim()
  const description = payload.description.trim()
  const team = await resolveProjectTeam(payload)
  const updatedAt = new Date().toISOString()

  return apiRequest<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: {
      title,
      description,
      updatedAt,
      teamId: team.id,
      teamName: team.name,
      imageUrl: payload.imageUrl?.trim() || existingProject.imageUrl,
    },
  })
}

export const renameProject = async (projectId: string, title: string): Promise<Project> => {
  const normalizedTitle = title.trim()

  if (!normalizedTitle) {
    throw new Error('Название проекта не может быть пустым')
  }

  return apiRequest<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: {
      title: normalizedTitle,
      updatedAt: new Date().toISOString(),
    },
  })
}

// Members
export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  return apiRequest<ProjectMember[]>(`/projects/${projectId}/members`)
}

export const addProjectMember = async (projectId: string, userId: string): Promise<ProjectMember> => {
  return apiRequest<ProjectMember>(`/projects/${projectId}/members`, {
    method: 'POST',
    body: { user_id: userId },
  })
}

export const updateProjectMember = async (
  projectId: string,
  memberId: string,
  payload: { roleIds?: string[]; accessLevel?: string },
): Promise<ProjectMember> => {
  return apiRequest<ProjectMember>(`/projects/${projectId}/members/${memberId}`, {
    method: 'PATCH',
    body: payload,
  })
}

export const removeProjectMember = async (projectId: string, memberId: string): Promise<void> => {
  await apiRequest(`/projects/${projectId}/members/${memberId}`, {
    method: 'DELETE',
  })
}

// Roles
export const getProjectRoles = async (projectId: string): Promise<ProjectRole[]> => {
  return apiRequest<ProjectRole[]>(`/projects/${projectId}/roles`)
}

export const createProjectRole = async (
  projectId: string,
  payload: Partial<ProjectRole>,
): Promise<ProjectRole> => {
  return apiRequest<ProjectRole>(`/projects/${projectId}/roles`, {
    method: 'POST',
    body: payload,
  })
}

export const updateProjectRole = async (
  projectId: string,
  roleId: string,
  payload: Partial<ProjectRole>,
): Promise<ProjectRole> => {
  return apiRequest<ProjectRole>(`/projects/${projectId}/roles/${roleId}`, {
    method: 'PATCH',
    body: payload,
  })
}

export const deleteProjectRole = async (projectId: string, roleId: string): Promise<void> => {
  await apiRequest(`/projects/${projectId}/roles/${roleId}`, {
    method: 'DELETE',
  })
}

export const searchUsers = async (query: string): Promise<User[]> => {
  return apiRequest<User[]>(`/users/search?query=${encodeURIComponent(query)}`)
}
