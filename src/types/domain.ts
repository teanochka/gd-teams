export type ProjectId = string
export type NodeId = string
export type TeamId = string
export type UserId = string

export type NodeType = 'folder' | 'document' | 'canvas' | 'template'
export type SortField = 'title' | 'createdAt' | 'updatedAt' | 'type'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list'

export type LotionTableData = {
  rows: string[][]
  columnWidths: number[]
  rowHeights: number[]
}

export type LotionBlockDetails = Record<string, unknown> & {
  value?: unknown
  table?: LotionTableData
}

export type LotionBlock = {
  id: string
  type: string
  details: LotionBlockDetails
}

export type DocumentCard = {
  blockIds: string[]
}

export type LotionPage = {
  name: string
  coverUrl?: string
  blocks: LotionBlock[]
  card?: DocumentCard
}

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

export type DocumentPage = {
  id: NodeId
  nodeId: NodeId
  projectId: ProjectId
  page: LotionPage
  createdAt: string
  updatedAt: string
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

export type KanbanPriority = 'Low' | 'Medium' | 'High' | 'Critical'
export type KanbanTaskType = 'Task' | 'Bug' | 'Story' | 'Epic'
export type KanbanStatus = 'to-do' | 'in-progress' | 'in-review' | 'done'

export type KanbanMember = {
  id: UserId
  name: string
  role: string
  color: string
}

export type KanbanTask = {
  id: string
  key: string
  title: string
  description: string
  assigneeId: UserId
  authorId: UserId
  priority: KanbanPriority
  parentId: string | null
  dueDate: string | null
  startDate: string | null
  labels: string[]
  role: string | null
  type: KanbanTaskType
  status: KanbanStatus
  subtasks: string[]
  linkedTasks: string[]
  coverColor?: string
}

export type KanbanColumn = {
  id: string
  title: string
  status: KanbanStatus | string
  tasks: KanbanTask[]
}

export type KanbanBoard = {
  id: string
  projectId: ProjectId
  members: KanbanMember[]
  roles: string[]
  taskTypes: KanbanTaskType[]
  priorities: KanbanPriority[]
  statuses: KanbanStatus[]
  tags: string[]
  columns: KanbanColumn[]
  createdAt: string
  updatedAt: string
}
