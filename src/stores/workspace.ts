import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createNode as apiCreateNode,
  copyNodes as apiCopyNodes,
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

  function removeFromParentChildren(nodeIds: NodeId[]) {
    for (const folderId of Object.keys(childrenByFolderId.value)) {
      const children = childrenByFolderId.value[folderId] ?? []
      childrenByFolderId.value[folderId] = children.filter((id) => !nodeIds.includes(id))
    }
  }

  async function loadFolder(nextProjectId: ProjectId, folderId?: NodeId | null, force = false) {
    projectId.value = nextProjectId

    if (folderId && folderId !== 'root' && loadedFolderIds.value[folderId] && !force) {
      currentFolderId.value = folderId
      selectedNodeIds.value = []
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
      foldersTree.value = data.foldersTree

      cacheNodes([data.currentFolder, ...data.nodes])
      cacheTags(data.tags)

      childrenByFolderId.value[resolvedFolderId] = data.nodes.map((node) => node.id)
      breadcrumbsByFolderId.value[resolvedFolderId] = data.breadcrumbs
      loadedFolderIds.value[resolvedFolderId] = true
      loadingByFolderId.value[resolvedFolderId] = false
      errorByFolderId.value[resolvedFolderId] = null
      selectedNodeIds.value = []
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

  function selectOne(nodeId: NodeId) {
    selectedNodeIds.value = selectedNodeIds.value[0] === nodeId ? [] : [nodeId]
  }

  function clearSelection() {
    selectedNodeIds.value = []
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

  async function createNode(payload: Omit<CreateNodePayload, 'projectId' | 'parentId'>) {
    if (!projectId.value || !currentFolderId.value) {
      return null
    }

    const node = await apiCreateNode({
      ...payload,
      projectId: projectId.value,
      parentId: currentFolderId.value,
    })

    cacheNodes([node])
    childrenByFolderId.value[currentFolderId.value] = [
      ...(childrenByFolderId.value[currentFolderId.value] ?? []),
      node.id,
    ]

    return node
  }

  async function renameSelected(title: string) {
    const nodeId = selectedNodeIds.value[0]

    if (!nodeId || selectedNodeIds.value.length !== 1) {
      return null
    }

    const node = await apiRenameNode(nodeId, title)
    cacheNodes([node])

    return node
  }

  async function moveSelected(parentId: NodeId) {
    if (!selectedNodeIds.value.length) {
      return []
    }

    const movedNodes = await apiMoveNodes(selectedNodeIds.value, parentId)
    cacheNodes(movedNodes)
    removeFromParentChildren(movedNodes.map((node) => node.id))

    childrenByFolderId.value[parentId] = [
      ...(childrenByFolderId.value[parentId] ?? []),
      ...movedNodes.map((node) => node.id),
    ]
    selectedNodeIds.value = []

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

      return copiedNodes
    }

    const movedNodes = await apiMoveNodes(clipboard.value.nodeIds, targetFolderId)
    cacheNodes(movedNodes)
    removeFromParentChildren(movedNodes.map((node) => node.id))
    childrenByFolderId.value[targetFolderId] = [
      ...(childrenByFolderId.value[targetFolderId] ?? []),
      ...movedNodes.map((node) => node.id),
    ]
    clipboard.value = null
    selectedNodeIds.value = []

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
    selectedNodeIds.value = []

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
    selectOne,
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
