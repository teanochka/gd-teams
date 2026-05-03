export type ProjectId = string
export type NodeId = string
export type TeamId = string
export type UserId = string

export type NodeType = 'folder' | 'document' | 'canvas' | 'template'
export type SortField = 'title' | 'createdAt' | 'updatedAt' | 'type'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list'

export type Team = {
  id: TeamId
  name: string
}

export type Project = {
  id: ProjectId
  title: string
  description: string
  createdAt: string
  updatedAt: string
  owner: string
  teamId: TeamId
  teamName: string
  isFavorite: boolean
  isDeleted: boolean
  filesCount: number
  imageUrl: string
  rootFolderId: NodeId
}

export type Tag = {
  id: string
  projectId: ProjectId
  name: string
  color: string
}

export type Node = {
  id: NodeId
  projectId: ProjectId
  parentId: NodeId | null
  type: NodeType
  title: string
  icon?: string
  tags: Tag[]
  isFavorite: boolean
  isDeleted: boolean
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type PendingNodeDraft = {
  id: NodeId
  projectId: ProjectId
  parentId: NodeId
  type: NodeType
  title: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type WorkspaceItem = {
  id: NodeId
  name: string
  type: NodeType
  tags: string[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  isDraft?: boolean
}

export type FolderTreeNode = {
  id: NodeId
  name: string
  children?: FolderTreeNode[]
}

export type Breadcrumb = {
  id: NodeId
  title: string
}

export type FolderContentResponse = {
  project: Project
  currentFolder: Node
  breadcrumbs: Breadcrumb[]
  nodes: Node[]
  foldersTree: FolderTreeNode[]
  tags: Tag[]
}

export type ClipboardState = {
  type: 'copy' | 'cut'
  nodeIds: NodeId[]
}

export type CreateNodePayload = {
  projectId: ProjectId
  parentId: NodeId
  type: NodeType
  title: string
  icon?: string
  tagIds?: string[]
}

export type CreateProjectPayload = {
  title: string
  description: string
  imageUrl?: string
  teamId?: TeamId
  newTeamName?: string
}

export type UpdateProjectPayload = {
  title: string
  description: string
  imageUrl?: string
  teamId?: TeamId
  newTeamName?: string
}
