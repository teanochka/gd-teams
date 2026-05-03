import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  copyNodes as apiCopyNodes,
  createNode as apiCreateNode,
  deleteNodes as apiDeleteNodes,
  getFolderContent,
  moveNodes as apiMoveNodes,
  renameNode as apiRenameNode,
} from '@/api/nodes'
import type {
  Breadcrumb,
  ClipboardState,
  CreateNodePayload,
  FolderTreeNode,
  Node,
  NodeId,
  Project,
  ProjectId,
  Tag,
} from '@/types/domain'

export const useWorkspaceStore = defineStore('workspace', () => {
  const projectId = ref<ProjectId | null>(null)
  const currentFolderId = ref<NodeId | null>(null)
  const currentProject = ref<Project | null>(null)

  const nodesById = ref<Record<NodeId, Node>>({})
  const childrenByFolderId = ref<Record<NodeId, NodeId[]>>({})
  const breadcrumbsByFolderId = ref<Record<NodeId, Breadcrumb[]>>({})
  const tagsById = ref<Record<string, Tag>>({})
  const foldersTree = ref<FolderTreeNode[]>([])

  const selectedNodeIds = ref<NodeId[]>([])
  const selectionAnchorId = ref<NodeId | null>(null)
  const clipboard = ref<ClipboardState | null>(null)

  const isLoading = ref(false)
  const loadingByFolderId = ref<Record<NodeId, boolean>>({})
  const errorByFolderId = ref<Record<NodeId, string | null>>({})
  const loadedFolderIds = ref<Record<NodeId, boolean>>({})

  const currentFolder = computed(() => {
    if (!currentFolderId.value) {
      return null
    }

    return nodesById.value[currentFolderId.value] ?? null
  })

  const currentItems = computed(() => {
    if (!currentFolderId.value) {
      return []
    }

    const ids = childrenByFolderId.value[currentFolderId.value] ?? []

    return ids
      .map((id) => nodesById.value[id])
      .filter((node): node is Node => node !== undefined && !node.isDeleted)
  })

  const breadcrumbs = computed(() => {
    if (!currentFolderId.value) {
      return []
    }

    return breadcrumbsByFolderId.value[currentFolderId.value] ?? []
  })

  const tags = computed(() => Object.values(tagsById.value))

  const selectedItems = computed(() => {
    return selectedNodeIds.value
      .map((id) => nodesById.value[id])
      .filter((node): node is Node => node !== undefined && !node.isDeleted)
  })

  const isCurrentFolderLoading = computed(() => {
    if (isLoading.value) {
      return true
    }

    if (!currentFolderId.value) {
      return false
    }

    return loadingByFolderId.value[currentFolderId.value] ?? false
  })

  const currentFolderError = computed(() => {
    if (!currentFolderId.value) {
      return null
    }

    return errorByFolderId.value[currentFolderId.value] ?? null
  })

  function cacheNodes(nodes: Node[]) {
    for (const node of nodes) {
      nodesById.value[node.id] = node
    }
  }

  function cacheTags(nextTags: Tag[]) {
    for (const tag of nextTags) {
      tagsById.value[tag.id] = tag
    }
  }

  function rebuildFoldersTree() {
    const rootFolderId = currentProject.value?.rootFolderId

    if (!rootFolderId) {
      foldersTree.value = []
      return
    }

    const nodes = Object.values(nodesById.value)

    const buildTree = (parentId: NodeId): FolderTreeNode[] => {
      return nodes
        .filter((node) => node.parentId === parentId && node.type === 'folder' && !node.isDeleted)
        .map((node) => {
          const children = buildTree(node.id)

          return {
            id: node.id,
            name: node.title,
            ...(children.length ? { children } : {}),
          }
        })
    }

    foldersTree.value = buildTree(rootFolderId)
  }

  function removeFromParentChildren(nodeIds: NodeId[]) {
    for (const folderId of Object.keys(childrenByFolderId.value)) {
      const children = childrenByFolderId.value[folderId] ?? []
      childrenByFolderId.value[folderId] = children.filter((id) => !nodeIds.includes(id))
    }
  }

  function normalizeSelectedNodeIds(nodeIds: NodeId[]) {
    return [...new Set(nodeIds)].filter((nodeId) => {
      const node = nodesById.value[nodeId]

      return node !== undefined && !node.isDeleted
    })
  }

  function findFolderTreeNode(targetId: NodeId, tree = foldersTree.value): FolderTreeNode | null {
    for (const node of tree) {
      if (node.id === targetId) {
        return node
      }

      const nestedNode = node.children?.length ? findFolderTreeNode(targetId, node.children) : null

      if (nestedNode) {
        return nestedNode
      }
    }

    return null
  }

  function collectFolderDescendantIds(folderId: NodeId) {
    const folderNode = findFolderTreeNode(folderId)
    const descendantIds = new Set<NodeId>()

    const walk = (tree: FolderTreeNode[] = []) => {
      for (const node of tree) {
        descendantIds.add(node.id)
        walk(node.children)
      }
    }

    walk(folderNode?.children)

    return descendantIds
  }

  function canMoveNodeIdsToFolder(nodeIds: NodeId[], targetFolderId: NodeId) {
    return nodeIds.every((nodeId) => {
      if (nodeId === targetFolderId) {
        return false
      }

      const node = nodesById.value[nodeId]

      if (!node || node.type !== 'folder') {
        return true
      }

      return !collectFolderDescendantIds(nodeId).has(targetFolderId)
    })
  }

  async function loadFolder(nextProjectId: ProjectId, folderId?: NodeId | null, force = false) {
    projectId.value = nextProjectId

    if (folderId && folderId !== 'root' && loadedFolderIds.value[folderId] && !force) {
      currentFolderId.value = folderId
      selectedNodeIds.value = []
      selectionAnchorId.value = null
      return
    }

    const loadingKey = folderId && folderId !== 'root' ? folderId : 'root'
    isLoading.value = true
    loadingByFolderId.value[loadingKey] = true
    errorByFolderId.value[loadingKey] = null

    try {
      const data = await getFolderContent(nextProjectId, folderId)
      const resolvedFolderId = data.currentFolder.id

      currentProject.value = data.project
      currentFolderId.value = resolvedFolderId

      cacheNodes([data.currentFolder, ...data.nodes])
      cacheTags(data.tags)

      childrenByFolderId.value[resolvedFolderId] = data.nodes.map((node) => node.id)
      breadcrumbsByFolderId.value[resolvedFolderId] = data.breadcrumbs
      foldersTree.value = data.foldersTree
      loadedFolderIds.value[resolvedFolderId] = true
      loadingByFolderId.value[resolvedFolderId] = false
      errorByFolderId.value[resolvedFolderId] = null
      selectedNodeIds.value = []
      selectionAnchorId.value = null
    } catch {
      errorByFolderId.value[loadingKey] = 'Не удалось загрузить папку'
    } finally {
      isLoading.value = false
      loadingByFolderId.value[loadingKey] = false
    }
  }

  async function reloadCurrentFolder() {
    if (!projectId.value || !currentFolderId.value) {
      return
    }

    await loadFolder(projectId.value, currentFolderId.value, true)
  }

  function setSelection(nodeIds: NodeId[], anchorId?: NodeId | null) {
    selectedNodeIds.value = normalizeSelectedNodeIds(nodeIds)
    const fallbackAnchorId = selectedNodeIds.value[selectedNodeIds.value.length - 1] ?? null

    selectionAnchorId.value =
      selectedNodeIds.value.length > 0 ? (anchorId ?? selectionAnchorId.value ?? fallbackAnchorId) : null
  }

  function selectOne(nodeId: NodeId) {
    selectedNodeIds.value = [nodeId]
    selectionAnchorId.value = nodeId
  }

  function toggleSelection(nodeId: NodeId) {
    if (selectedNodeIds.value.includes(nodeId)) {
      const remainingIds = selectedNodeIds.value.filter((id) => id !== nodeId)

      setSelection(
        remainingIds,
        remainingIds.length
          ? selectionAnchorId.value === nodeId
            ? remainingIds[remainingIds.length - 1]
            : selectionAnchorId.value
          : null,
      )
      return
    }

    setSelection([...selectedNodeIds.value, nodeId], nodeId)
  }

  function selectRange(nodeIdsInOrder: NodeId[], targetNodeId: NodeId, additive = false) {
    const anchorId = selectionAnchorId.value
    const targetIndex = nodeIdsInOrder.indexOf(targetNodeId)

    if (targetIndex === -1) {
      return
    }

    const anchorIndex = anchorId ? nodeIdsInOrder.indexOf(anchorId) : -1

    if (anchorIndex === -1) {
      selectOne(targetNodeId)
      return
    }

    const [startIndex, endIndex] =
      anchorIndex <= targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex]
    const rangeIds = nodeIdsInOrder.slice(startIndex, endIndex + 1)

    setSelection(additive ? [...selectedNodeIds.value, ...rangeIds] : rangeIds, anchorId)
  }

  function clearSelection() {
    selectedNodeIds.value = []
    selectionAnchorId.value = null
  }

  function copySelected() {
    if (!selectedNodeIds.value.length) {
      return
    }

    clipboard.value = { type: 'copy', nodeIds: [...selectedNodeIds.value] }
  }

  function cutSelected() {
    if (!selectedNodeIds.value.length) {
      return
    }

    clipboard.value = { type: 'cut', nodeIds: [...selectedNodeIds.value] }
  }

  async function createNode(payload: Omit<CreateNodePayload, 'projectId'>) {
    if (!projectId.value) {
      return null
    }

    const node = await apiCreateNode({
      ...payload,
      projectId: projectId.value,
    })

    cacheNodes([node])
    childrenByFolderId.value[payload.parentId] = [
      ...(childrenByFolderId.value[payload.parentId] ?? []),
      node.id,
    ]
    rebuildFoldersTree()

    if (currentProject.value) {
      currentProject.value = {
        ...currentProject.value,
        filesCount: currentProject.value.filesCount + 1,
        updatedAt: node.updatedAt,
      }
    }

    return node
  }

  async function renameSelected(title: string) {
    const nodeId = selectedNodeIds.value[0]

    if (!nodeId || selectedNodeIds.value.length !== 1) {
      return null
    }

    const node = await apiRenameNode(nodeId, title)
    cacheNodes([node])
    rebuildFoldersTree()

    return node
  }

  async function moveSelected(parentId: NodeId) {
    if (!selectedNodeIds.value.length) {
      return []
    }

    if (!canMoveNodeIdsToFolder(selectedNodeIds.value, parentId)) {
      return []
    }

    const movedNodes = await apiMoveNodes(selectedNodeIds.value, parentId)
    cacheNodes(movedNodes)
    removeFromParentChildren(movedNodes.map((node) => node.id))

    childrenByFolderId.value[parentId] = [
      ...(childrenByFolderId.value[parentId] ?? []),
      ...movedNodes.map((node) => node.id),
    ]
    rebuildFoldersTree()
    selectedNodeIds.value = []
    selectionAnchorId.value = null

    return movedNodes
  }

  async function pasteClipboard() {
    if (!clipboard.value || !currentFolderId.value) {
      return []
    }

    const targetFolderId = currentFolderId.value

    if (clipboard.value.type === 'copy') {
      const copiedNodes = await apiCopyNodes(clipboard.value.nodeIds, targetFolderId)
      cacheNodes(copiedNodes)
      childrenByFolderId.value[targetFolderId] = [
        ...(childrenByFolderId.value[targetFolderId] ?? []),
        ...copiedNodes.map((node) => node.id),
      ]
      rebuildFoldersTree()

      return copiedNodes
    }

    if (!canMoveNodeIdsToFolder(clipboard.value.nodeIds, targetFolderId)) {
      return []
    }

    const movedNodes = await apiMoveNodes(clipboard.value.nodeIds, targetFolderId)
    cacheNodes(movedNodes)
    removeFromParentChildren(movedNodes.map((node) => node.id))
    childrenByFolderId.value[targetFolderId] = [
      ...(childrenByFolderId.value[targetFolderId] ?? []),
      ...movedNodes.map((node) => node.id),
    ]
    rebuildFoldersTree()
    clipboard.value = null
    selectedNodeIds.value = []
    selectionAnchorId.value = null

    return movedNodes
  }

  async function deleteSelected() {
    if (!selectedNodeIds.value.length) {
      return []
    }

    const deletedIds = await apiDeleteNodes(selectedNodeIds.value)

    for (const nodeId of deletedIds) {
      const node = nodesById.value[nodeId]

      if (node) {
        nodesById.value[nodeId] = { ...node, isDeleted: true }
      }
    }

    removeFromParentChildren(deletedIds)
    rebuildFoldersTree()
    selectedNodeIds.value = []
    selectionAnchorId.value = null

    return deletedIds
  }

  return {
    projectId,
    currentFolderId,
    currentProject,
    nodesById,
    childrenByFolderId,
    breadcrumbsByFolderId,
    tagsById,
    foldersTree,
    selectedNodeIds,
    selectionAnchorId,
    clipboard,
    isLoading,
    loadingByFolderId,
    errorByFolderId,
    currentFolder,
    currentItems,
    breadcrumbs,
    tags,
    selectedItems,
    isCurrentFolderLoading,
    currentFolderError,
    loadFolder,
    reloadCurrentFolder,
    setSelection,
    selectOne,
    toggleSelection,
    selectRange,
    clearSelection,
    copySelected,
    cutSelected,
    createNode,
    renameSelected,
    moveSelected,
    pasteClipboard,
    deleteSelected,
  }
})
