import {
  buildFolderTree,
  cloneNode,
  cloneProject,
  cloneTag,
  mockNodes,
  mockProjects,
  mockTags,
} from '@/api/mockData'
import type {
  Breadcrumb,
  CreateNodePayload,
  FolderContentResponse,
  Node,
  NodeId,
  ProjectId,
} from '@/types/domain'

const wait = async () => {
  await new Promise((resolve) => window.setTimeout(resolve, 120))
}

const findProject = (projectId: ProjectId) => {
  const project = mockProjects.find((item) => item.id === projectId)

  if (!project) {
    throw new Error('Project not found')
  }

  return project
}

const findNode = (nodeId: NodeId) => {
  const node = mockNodes.find((item) => item.id === nodeId)

  if (!node) {
    throw new Error('Node not found')
  }

  return node
}

const resolveFolderId = (projectId: ProjectId, folderId?: NodeId | null) => {
  const project = findProject(projectId)

  return folderId && folderId !== 'root' ? folderId : project.rootFolderId
}

const buildBreadcrumbs = (folder: Node): Breadcrumb[] => {
  const breadcrumbs: Breadcrumb[] = []
  let current: Node | undefined = folder

  while (current) {
    breadcrumbs.unshift({ id: current.id, title: current.title })
    current = current.parentId ? mockNodes.find((node) => node.id === current?.parentId) : undefined
  }

  return breadcrumbs
}

export const getFolderContent = async (
  projectId: ProjectId,
  folderId?: NodeId | null,
): Promise<FolderContentResponse> => {
  await wait()

  const project = findProject(projectId)
  const resolvedFolderId = resolveFolderId(projectId, folderId)
  const currentFolder = findNode(resolvedFolderId)

  if (currentFolder.projectId !== projectId || currentFolder.type !== 'folder') {
    throw new Error('Folder not found')
  }

  const nodes = mockNodes.filter(
    (node) => node.projectId === projectId && node.parentId === resolvedFolderId && !node.isDeleted,
  )
  const tags = mockTags.filter((tag) => tag.projectId === projectId)

  return {
    project: cloneProject(project),
    currentFolder: cloneNode(currentFolder),
    breadcrumbs: buildBreadcrumbs(currentFolder),
    nodes: nodes.map(cloneNode),
    foldersTree: buildFolderTree(projectId, project.rootFolderId),
    tags: tags.map(cloneTag),
  }
}

export const createNode = async (payload: CreateNodePayload): Promise<Node> => {
  await wait()

  const parent = findNode(payload.parentId)

  if (parent.type !== 'folder' || parent.projectId !== payload.projectId) {
    throw new Error('Parent folder not found')
  }

  const title = payload.title.trim()

  if (!title) {
    throw new Error('Node title is required')
  }

  const hasSameTitle = mockNodes.some(
    (node) =>
      node.projectId === payload.projectId &&
      node.parentId === payload.parentId &&
      !node.isDeleted &&
      node.title.toLowerCase() === title.toLowerCase(),
  )

  if (hasSameTitle) {
    throw new Error('Node title already exists')
  }

  const tags = mockTags.filter((tag) => payload.tagIds?.includes(tag.id))
  const node: Node = {
    id: `${payload.type}-${Date.now()}`,
    projectId: payload.projectId,
    parentId: payload.parentId,
    type: payload.type,
    title,
    icon: payload.icon,
    tags,
    isFavorite: false,
    isDeleted: false,
    createdAt: 'Только что',
    createdBy: 'Вы',
    updatedAt: 'Только что',
    updatedBy: 'Вы',
  }

  mockNodes.push(node)

  return cloneNode(node)
}

export const renameNode = async (nodeId: NodeId, title: string): Promise<Node> => {
  await wait()

  const node = findNode(nodeId)
  const nextTitle = title.trim()

  if (!nextTitle) {
    throw new Error('Node title is required')
  }

  node.title = nextTitle
  node.updatedAt = 'Только что'
  node.updatedBy = 'Вы'

  return cloneNode(node)
}

export const moveNodes = async (nodeIds: NodeId[], parentId: NodeId): Promise<Node[]> => {
  await wait()

  const parent = findNode(parentId)

  if (parent.type !== 'folder') {
    throw new Error('Target folder not found')
  }

  const movedNodes = nodeIds.map(findNode)

  for (const node of movedNodes) {
    if (node.id === parentId) {
      throw new Error('Cannot move a folder into itself')
    }

    node.parentId = parentId
    node.updatedAt = 'Только что'
    node.updatedBy = 'Вы'
  }

  return movedNodes.map(cloneNode)
}

export const copyNodes = async (nodeIds: NodeId[], parentId: NodeId): Promise<Node[]> => {
  await wait()

  const parent = findNode(parentId)

  if (parent.type !== 'folder') {
    throw new Error('Target folder not found')
  }

  const copiedNodes = nodeIds.map((nodeId, index) => {
    const source = findNode(nodeId)
    const copy: Node = {
      ...source,
      id: `${source.id}-copy-${Date.now()}-${index}`,
      parentId,
      title: `${source.title} копия`,
      isFavorite: false,
      createdAt: 'Только что',
      createdBy: 'Вы',
      updatedAt: 'Только что',
      updatedBy: 'Вы',
      tags: source.tags.map((tag) => ({ ...tag })),
    }

    mockNodes.push(copy)

    return copy
  })

  return copiedNodes.map(cloneNode)
}

export const deleteNodes = async (nodeIds: NodeId[]): Promise<NodeId[]> => {
  await wait()

  for (const nodeId of nodeIds) {
    const node = findNode(nodeId)
    node.isDeleted = true
    node.updatedAt = 'Только что'
    node.updatedBy = 'Вы'
  }

  return [...nodeIds]
}
