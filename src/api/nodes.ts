import { apiRequest } from '@/api/http'
import type {
  Breadcrumb,
  CreateNodePayload,
  FolderContentResponse,
  FolderTreeNode,
  Node,
  NodeId,
  NodeType,
  Project,
  ProjectId,
  Tag,
} from '@/types/domain'

type RawNode = Omit<Node, 'tags'> & {
  tagIds: string[]
  icon?: string | null
}

const mapNode = (node: RawNode, tags: Tag[]): Node => ({
  ...node,
  icon: node.icon ?? undefined,
  tags: tags.filter((tag) => node.tagIds.includes(tag.id)),
})

const buildFolderTree = (nodes: Node[], parentId: NodeId | null): FolderTreeNode[] => {
  return nodes
    .filter((node) => node.parentId === parentId && node.type === 'folder' && !node.isDeleted)
    .map((node) => {
      const children = buildFolderTree(nodes, node.id)

      return {
        id: node.id,
        name: node.title,
        ...(children.length ? { children } : {}),
      }
    })
}

const buildBreadcrumbs = (folder: Node, nodes: Node[]): Breadcrumb[] => {
  const breadcrumbs: Breadcrumb[] = []
  let current: Node | undefined = folder

  while (current) {
    breadcrumbs.unshift({ id: current.id, title: current.title })
    current = current.parentId ? nodes.find((node) => node.id === current?.parentId) : undefined
  }

  return breadcrumbs
}

const resolveFolderId = (project: Project, folderId?: NodeId | null) => {
  return folderId && folderId !== 'root' ? folderId : project.rootFolderId
}

const createNodeId = (type: NodeType) => `${type}-${Date.now()}`

const getCurrentDate = () => new Date().toISOString()

const updateProjectNodeCount = async (projectId: ProjectId, delta: number, updatedAt: string) => {
  const project = await apiRequest<Project>(`/projects/${projectId}`)

  await apiRequest<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: {
      filesCount: Math.max(0, project.filesCount + delta),
      updatedAt,
    },
  })
}

export const getFolderContent = async (
  projectId: ProjectId,
  folderId?: NodeId | null,
): Promise<FolderContentResponse> => {
  const project = await apiRequest<Project>(`/projects/${projectId}`)
  const resolvedFolderId = resolveFolderId(project, folderId)

  const [rawNodes, tags] = await Promise.all([
    apiRequest<RawNode[]>('/nodes', { query: { projectId } }),
    apiRequest<Tag[]>('/tags', { query: { projectId } }),
  ])

  const projectNodes = rawNodes.map((node) => mapNode(node, tags))
  const currentFolder = projectNodes.find((node) => node.id === resolvedFolderId)

  if (!currentFolder || currentFolder.type !== 'folder') {
    throw new Error('Folder not found')
  }

  const nodes = projectNodes.filter((node) => node.parentId === resolvedFolderId && !node.isDeleted)

  return {
    project,
    currentFolder,
    breadcrumbs: buildBreadcrumbs(currentFolder, projectNodes),
    nodes,
    foldersTree: buildFolderTree(projectNodes, project.rootFolderId),
    tags,
  }
}

export const createNode = async (payload: CreateNodePayload): Promise<Node> => {
  const tags = await apiRequest<Tag[]>('/tags', { query: { projectId: payload.projectId } })
  const savedAt = getCurrentDate()
  const node = await apiRequest<RawNode>('/nodes', {
    method: 'POST',
    body: {
      id: createNodeId(payload.type),
      projectId: payload.projectId,
      parentId: payload.parentId,
      type: payload.type,
      title: payload.title.trim(),
      icon: payload.icon ?? null,
      tagIds: payload.tagIds ?? [],
      isFavorite: false,
      isDeleted: false,
      createdAt: savedAt,
      createdBy: 'Вы',
      updatedAt: savedAt,
      updatedBy: 'Вы',
    },
  })

  await updateProjectNodeCount(payload.projectId, 1, savedAt)

  return mapNode(node, tags)
}

export const renameNode = async (nodeId: NodeId, title: string): Promise<Node> => {
  const savedAt = getCurrentDate()
  const node = await apiRequest<RawNode>(`/nodes/${nodeId}`, {
    method: 'PATCH',
    body: {
      title: title.trim(),
      updatedAt: savedAt,
      updatedBy: 'Вы',
    },
  })
  const tags = await apiRequest<Tag[]>('/tags', { query: { projectId: node.projectId } })

  return mapNode(node, tags)
}

export const moveNodes = async (nodeIds: NodeId[], parentId: NodeId): Promise<Node[]> => {
  const savedAt = getCurrentDate()
  const movedNodes = await Promise.all(
    nodeIds.map((nodeId) =>
      apiRequest<RawNode>(`/nodes/${nodeId}`, {
        method: 'PATCH',
        body: {
          parentId,
          updatedAt: savedAt,
          updatedBy: 'Вы',
        },
      }),
    ),
  )
  const projectId = movedNodes[0]?.projectId
  const tags = projectId ? await apiRequest<Tag[]>('/tags', { query: { projectId } }) : []

  return movedNodes.map((node) => mapNode(node, tags))
}

export const copyNodes = async (nodeIds: NodeId[], parentId: NodeId): Promise<Node[]> => {
  const sourceNodes = await Promise.all(
    nodeIds.map((nodeId) => apiRequest<RawNode>(`/nodes/${nodeId}`)),
  )
  const savedAt = getCurrentDate()
  const copiedNodes = await Promise.all(
    sourceNodes.map((source, index) =>
      apiRequest<RawNode>('/nodes', {
        method: 'POST',
        body: {
          ...source,
          id: `${source.id}-copy-${Date.now()}-${index}`,
          parentId,
          title: `${source.title} копия`,
          isFavorite: false,
          createdAt: savedAt,
          createdBy: 'Вы',
          updatedAt: savedAt,
          updatedBy: 'Вы',
        },
      }),
    ),
  )
  const projectId = copiedNodes[0]?.projectId
  const tags = projectId ? await apiRequest<Tag[]>('/tags', { query: { projectId } }) : []

  return copiedNodes.map((node) => mapNode(node, tags))
}

export const deleteNodes = async (nodeIds: NodeId[]): Promise<NodeId[]> => {
  const savedAt = getCurrentDate()
  await Promise.all(
    nodeIds.map((nodeId) =>
      apiRequest<RawNode>(`/nodes/${nodeId}`, {
        method: 'PATCH',
        body: {
          isDeleted: true,
          updatedAt: savedAt,
          updatedBy: 'Вы',
        },
      }),
    ),
  )

  return [...nodeIds]
}
