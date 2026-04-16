export type NodeType = 'folder' | 'document' | 'canvas'

export interface Project {
  id: string
  name: string
  banner: string
  updatedAt: string
}

export interface FileNode {
  id: string
  parentId: string | null
  projectId: string
  title: string
  type: NodeType
  icon: string
  tags: string[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  isFavorite: boolean
}

export interface Tag {
  id: string
  name: string
  color: string
}
