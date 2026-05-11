import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useWorkspaceStore } from '@/stores/workspace'
import type {
  Node,
  NodeId,
  NodeType,
  PendingNodeDraft,
  SortField,
  SortOrder,
  ViewMode,
  WorkspaceItem,
} from '@/types/domain'

type WorkspaceItemSelectPayload = {
  id: NodeId
  event: MouseEvent
}

type SelectionBox = {
  left: number
  top: number
  width: number
  height: number
}

type DragSelectionState = {
  pointerId: number
  startX: number
  startY: number
  additive: boolean
  baseSelection: NodeId[]
}

const typeLabels: Record<NodeType, string> = {
  folder: 'Папка',
  document: 'Документ',
  canvas: 'Холст',
  template: 'Шаблон',
}

const defaultNodeTitles: Record<NodeType, string> = {
  folder: 'Новая папка',
  document: 'Новый документ',
  canvas: 'Новый холст',
  template: 'Новый шаблон',
}

const sortFields = new Set<SortField>(['title', 'createdAt', 'updatedAt', 'type'])
const sortOrders = new Set<SortOrder>(['asc', 'desc'])
const viewModes = new Set<ViewMode>(['grid', 'list'])

const getSingleQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return typeof value === 'string' ? value : ''
}

const getQueryValues = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
  }

  if (typeof value === 'string' && value.length > 0) {
    return [value]
  }

  return []
}

const toWorkspaceItem = (node: Node): WorkspaceItem => ({
  id: node.id,
  name: node.title,
  type: node.type,
  tags: node.tags.map((tag) => tag.name),
  createdAt: node.createdAt,
  createdBy: node.createdBy,
  updatedAt: node.updatedAt,
  updatedBy: node.updatedBy,
  isFavorite: node.isFavorite,
})

const toDraftWorkspaceItem = (draft: PendingNodeDraft): WorkspaceItem => ({
  id: draft.id,
  name: draft.title,
  type: draft.type,
  tags: [],
  createdAt: draft.createdAt,
  createdBy: draft.createdBy,
  updatedAt: draft.updatedAt,
  updatedBy: draft.updatedBy,
  isFavorite: false,
  isDraft: true,
})

const compareText = (left: string, right: string) => left.localeCompare(right, 'ru')
const createDraftId = (type: NodeType) => `draft-${type}-${Date.now()}`

const createUniqueDraftTitle = (baseTitle: string, items: Array<Pick<WorkspaceItem, 'name'>>) => {
  const normalizedBase = baseTitle.trim().toLowerCase()
  const takenTitles = new Set(items.map((item) => item.name.trim().toLowerCase()))

  if (!takenTitles.has(normalizedBase)) {
    return baseTitle
  }

  let suffix = 1

  while (takenTitles.has(`${baseTitle} (${suffix})`.toLowerCase())) {
    suffix += 1
  }

  return `${baseTitle} (${suffix})`
}

export function useWorkspacePage() {
  const route = useRoute()
  const router = useRouter()
  const workspaceStore = useWorkspaceStore()
  const {
    breadcrumbs,
    clipboard,
    currentFolder,
    currentFolderError,
    currentItems,
    currentProject,
    foldersTree,
    isCurrentFolderLoading,
    selectedItems,
    selectedNodeIds,
    specialView,
    specialViewItems,
    specialViewLoading,
    tags,
  } = storeToRefs(workspaceStore)

  const contentRef = ref<HTMLElement | null>(null)
  const creatingNodeDraft = ref<PendingNodeDraft | null>(null)
  const editingMode = ref<'create' | 'rename' | null>(null)
  const editingItemId = ref<string | null>(null)
  const editingInitialName = ref('')
  const draftItemName = ref('')
  const isSavingItemName = ref(false)
  const selectionBox = ref<SelectionBox | null>(null)
  const isDragSelecting = ref(false)

  let dragSelectionState: DragSelectionState | null = null

  const projectId = computed(() => {
    return String(route.params.projectId ?? route.params.id ?? 'village-quest')
  })

  const folderId = computed(() => {
    const value = route.params.folderId

    if (Array.isArray(value)) {
      return value[0] ?? null
    }

    return value ?? null
  })

  const searchQuery = computed({
    get: () => getSingleQueryValue(route.query.search),
    set: (value: string) => {
      const nextQuery = { ...route.query }

      if (value.trim()) {
        nextQuery.search = value
      } else {
        delete nextQuery.search
      }

      void router.replace({ query: nextQuery })
    },
  })

  const activeTagIds = computed(() => getQueryValues(route.query.tag))

  const sortField = computed<SortField>(() => {
    const value = getSingleQueryValue(route.query.sort)

    return sortFields.has(value as SortField) ? (value as SortField) : 'updatedAt'
  })

  const sortOrder = computed<SortOrder>(() => {
    const value = getSingleQueryValue(route.query.order)

    return sortOrders.has(value as SortOrder) ? (value as SortOrder) : 'desc'
  })

  const viewMode = computed<ViewMode>({
    get: () => {
      const value = getSingleQueryValue(route.query.view)

      return viewModes.has(value as ViewMode) ? (value as ViewMode) : 'grid'
    },
    set: (value: ViewMode) => {
      void router.replace({ query: { ...route.query, view: value } })
    },
  })

  const projectName = computed(() => currentProject.value?.title ?? 'Проект')
  const breadcrumbLabels = computed(() => breadcrumbs.value.map((item) => item.title))
  const sidebarTags = computed(() => tags.value.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })))
  const activeTagNames = computed(() =>
    tags.value
      .filter((tag) => activeTagIds.value.includes(tag.id))
      .map((tag) => tag.name),
  )
  const selectedItem = computed(() =>
    selectedItems.value[0] ? toWorkspaceItem(selectedItems.value[0]) : null,
  )
  const selectedIdSet = computed(() => new Set(selectedNodeIds.value))
  const hasSelection = computed(() => selectedNodeIds.value.length > 0)
  const hasSingleSelection = computed(() => selectedNodeIds.value.length === 1)
  const canRenameSelection = computed(() => {
    return hasSingleSelection.value && !creatingNodeDraft.value && editingMode.value === null
  })
  const clipboardHasContent = computed(() => clipboard.value !== null)
  const viewModeLabel = computed(() => (viewMode.value === 'grid' ? 'Значки' : 'Список'))

  const currentDirectory = computed<WorkspaceItem>(() => {
    if (currentFolder.value) {
      return toWorkspaceItem(currentFolder.value)
    }

    return {
      id: 'loading',
      name: projectName.value,
      type: 'folder',
      tags: [],
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
      isFavorite: false,
    }
  })

  const parsedSearchQuery = computed(() => {
    const query = searchQuery.value
    const result = { name: '', tags: [] as string[], type: '', createdBy: '', date: '' }
    
    const regex = /(name:|tags:|type:|created_by:|date:)?\s*([^:]+?)(?=\s*(name:|tags:|type:|created_by:|date:)|$)/g
    let match;
    let hasTokens = false
    while ((match = regex.exec(query)) !== null) {
      const key = match[1]
      const val = (match && match[2]) ? match[2].trim() : ''
      if (!val) continue

      if (key === 'name:') { result.name = val.toLowerCase(); hasTokens = true }
      else if (key === 'tags:') { result.tags = val.split(',').map(s => s.trim().toLowerCase()).filter(Boolean); hasTokens = true }
      else if (key === 'type:') { result.type = val.toLowerCase(); hasTokens = true }
      else if (key === 'created_by:') { result.createdBy = val.toLowerCase(); hasTokens = true }
      else if (key === 'date:') { result.date = val.toLowerCase(); hasTokens = true }
      else if (!key && !hasTokens) { result.name = val.toLowerCase() }
    }
    return result
  })

  const users = computed(() => {
    const allUsers = new Set<string>()
    currentItems.value.forEach((node) => {
      if (node.createdBy) allUsers.add(node.createdBy)
    })
    return Array.from(allUsers)
  })

  const visibleItems = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    const parsedQuery = parsedSearchQuery.value
    const selectedTags = activeTagIds.value

    const filtered = currentItems.value.filter((node) => {
      if (selectedTags.length && !node.tags.some((tag) => selectedTags.includes(tag.id))) {
        return false
      }

      if (!query) {
        return true
      }

      if (parsedQuery.name && !node.title.toLowerCase().includes(parsedQuery.name)) return false;
      if (parsedQuery.type && !typeLabels[node.type].toLowerCase().includes(parsedQuery.type) && !node.type.toLowerCase().includes(parsedQuery.type)) return false;
      if (parsedQuery.createdBy && !node.createdBy.toLowerCase().includes(parsedQuery.createdBy)) return false;
      if (parsedQuery.tags.length > 0) {
        const nodeTags = node.tags.map(t => t.name.toLowerCase());
        const hasAllTags = parsedQuery.tags.every(pt => nodeTags.some(nt => nt.includes(pt)));
        if (!hasAllTags) return false;
      }
      if (parsedQuery.date) {
        // Date format handling can be improved, simple includes for now
        const createdAt = new Date(node.createdAt).toLocaleDateString('ru-RU')
        if (!createdAt.includes(parsedQuery.date)) return false;
      }

      return true
    })

    const direction = sortOrder.value === 'asc' ? 1 : -1
    const sortedItems = [...filtered]
      .sort((left, right) => {
        const field = sortField.value

        if (field === 'type') {
          return compareText(typeLabels[left.type], typeLabels[right.type]) * direction
        }

        return compareText(left[field], right[field]) * direction
      })
      .map(toWorkspaceItem)

    return creatingNodeDraft.value
      ? [toDraftWorkspaceItem(creatingNodeDraft.value), ...sortedItems]
      : sortedItems
  })

  const selectableItemIds = computed(() => {
    return visibleItems.value.filter((item) => !item.isDraft).map((item) => item.id)
  })

  const selectionBoxStyle = computed(() => {
    if (!selectionBox.value) {
      return null
    }

    return {
      left: `${selectionBox.value.left}px`,
      top: `${selectionBox.value.top}px`,
      width: `${selectionBox.value.width}px`,
      height: `${selectionBox.value.height}px`,
    }
  })

  const emptyStateTitle = computed(() => {
    if (activeTagIds.value.length) {
      return 'Нет файлов с выбранными тегами'
    }

    return 'Здесь пока пусто'
  })

  const emptyStateDescription = computed(() => {
    if (activeTagNames.value.length) {
      return `В текущей директории нет файлов или папок с тегами: ${activeTagNames.value.join(', ')}.`
    }

    return 'Создайте папку, документ или холст.'
  })

  const resetDragSelection = () => {
    dragSelectionState = null
    selectionBox.value = null
    isDragSelecting.value = false
    window.removeEventListener('pointermove', handleDragPointerMove)
    window.removeEventListener('pointerup', handleDragPointerUp)
  }

  const getSelectableNodeElements = () => {
    if (!contentRef.value) {
      return []
    }

    const selectableIds = new Set(selectableItemIds.value)

    return Array.from(contentRef.value.querySelectorAll<HTMLElement>('[data-node-id]')).filter((element) =>
      selectableIds.has(String(element.dataset.nodeId ?? '')),
    )
  }

  const getIntersectedNodeIds = (left: number, top: number, right: number, bottom: number) => {
    return getSelectableNodeElements()
      .filter((element) => {
        const rect = element.getBoundingClientRect()

        return !(
          rect.right < left ||
          rect.left > right ||
          rect.bottom < top ||
          rect.top > bottom
        )
      })
      .map((element) => String(element.dataset.nodeId))
  }

  const openFolder = (nextFolderId: string) => {
    void router.push({
      name: 'project-folder',
      params: { projectId: projectId.value, folderId: nextFolderId },
      query: route.query,
    })
  }

  const openItem = (item: WorkspaceItem) => {
    if (item.isDraft) {
      return
    }

    if (item.type === 'folder') {
      openFolder(item.id)
      return
    }

    void router.push({
      name: `project-${item.type}`,
      params: { projectId: projectId.value, [`${item.type}Id`]: item.id },
    })
  }

  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
  }

  const setSortField = (field: SortField) => {
    void router.replace({ query: { ...route.query, sort: field } })
  }

  const toggleTagId = (tagId: string) => {
    const nextQuery = { ...route.query }
    const nextTagIds = activeTagIds.value.includes(tagId)
      ? activeTagIds.value.filter((id) => id !== tagId)
      : [...activeTagIds.value, tagId]

    if (nextTagIds.length) {
      nextQuery.tag = nextTagIds
    } else {
      delete nextQuery.tag
    }

    void router.replace({ query: nextQuery })
  }

  const toggleSortOrder = () => {
    const nextOrder: SortOrder = sortOrder.value === 'asc' ? 'desc' : 'asc'
    void router.replace({ query: { ...route.query, order: nextOrder } })
  }

  const resetCreatingNodeState = () => {
    creatingNodeDraft.value = null
    editingMode.value = null
    editingItemId.value = null
    editingInitialName.value = ''
    draftItemName.value = ''
    isSavingItemName.value = false
  }

  const finishItemName = async () => {
    if (!editingMode.value || !editingItemId.value || isSavingItemName.value) {
      return
    }

    if (editingMode.value === 'create') {
      if (!creatingNodeDraft.value) {
        resetCreatingNodeState()
        return
      }

      isSavingItemName.value = true

      try {
        const nextTitle = draftItemName.value.trim() || creatingNodeDraft.value.title
        const createdNode = await workspaceStore.createNode({
          parentId: creatingNodeDraft.value.parentId,
          type: creatingNodeDraft.value.type,
          title: nextTitle,
        })

        resetCreatingNodeState()

        if (createdNode) {
          workspaceStore.selectOne(createdNode.id)
        }
      } finally {
        isSavingItemName.value = false
      }

      return
    }

    const nextTitle = draftItemName.value.trim()

    if (!nextTitle || nextTitle === editingInitialName.value) {
      resetCreatingNodeState()
      return
    }

    isSavingItemName.value = true

    try {
      await workspaceStore.renameSelected(nextTitle)
      resetCreatingNodeState()
    } finally {
      isSavingItemName.value = false
    }
  }

  const startCreateNode = async (type: NodeType) => {
    if (editingMode.value) {
      await finishItemName()
    }

    if (!currentFolder.value) {
      return
    }

    const siblingItems = currentItems.value.map(toWorkspaceItem)
    const title = createUniqueDraftTitle(defaultNodeTitles[type], siblingItems)
    const savedAt = new Date().toISOString()

    creatingNodeDraft.value = {
      id: createDraftId(type),
      projectId: projectId.value,
      parentId: currentFolder.value.id,
      type,
      title,
      createdAt: savedAt,
      createdBy: 'Вы',
      updatedAt: savedAt,
      updatedBy: 'Вы',
    }
    editingMode.value = 'create'
    editingItemId.value = creatingNodeDraft.value.id
    editingInitialName.value = title
    draftItemName.value = title
    workspaceStore.clearSelection()
  }

  const startRenameSelected = () => {
    if (!hasSingleSelection.value || creatingNodeDraft.value || editingMode.value) {
      return
    }

    const node = selectedItems.value[0]

    if (!node) {
      return
    }

    editingMode.value = 'rename'
    editingItemId.value = node.id
    editingInitialName.value = node.title
    draftItemName.value = node.title
  }

  const cancelItemName = () => {
    if (!editingMode.value || isSavingItemName.value) {
      return
    }

    resetCreatingNodeState()
  }

  const handleItemSelect = ({ id, event }: WorkspaceItemSelectPayload) => {
    if (editingItemId.value) {
      return
    }

    const isAdditive = event.ctrlKey || event.metaKey

    if (event.shiftKey) {
      workspaceStore.selectRange(selectableItemIds.value, id, isAdditive)
      return
    }

    if (isAdditive) {
      workspaceStore.toggleSelection(id)
      return
    }

    workspaceStore.selectOne(id)
  }

  const handleDragPointerMove = (event: PointerEvent) => {
    if (!dragSelectionState || !contentRef.value || event.pointerId !== dragSelectionState.pointerId) {
      return
    }

    const dx = event.clientX - dragSelectionState.startX
    const dy = event.clientY - dragSelectionState.startY

    if (!isDragSelecting.value && Math.abs(dx) < 3 && Math.abs(dy) < 3) {
      return
    }

    isDragSelecting.value = true

    const containerRect = contentRef.value.getBoundingClientRect()
    const left = Math.min(dragSelectionState.startX, event.clientX)
    const top = Math.min(dragSelectionState.startY, event.clientY)
    const right = Math.max(dragSelectionState.startX, event.clientX)
    const bottom = Math.max(dragSelectionState.startY, event.clientY)
    const intersectedNodeIds = getIntersectedNodeIds(left, top, right, bottom)

    selectionBox.value = {
      left: left - containerRect.left,
      top: top - containerRect.top,
      width: right - left,
      height: bottom - top,
    }

    workspaceStore.setSelection(
      dragSelectionState.additive
        ? [...dragSelectionState.baseSelection, ...intersectedNodeIds]
        : intersectedNodeIds,
      intersectedNodeIds[intersectedNodeIds.length - 1] ?? null,
    )
  }

  const handleDragPointerUp = (event: PointerEvent) => {
    if (!dragSelectionState || event.pointerId !== dragSelectionState.pointerId) {
      return
    }

    resetDragSelection()
  }

  const handleContentPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || editingItemId.value) {
      return
    }

    const target = event.target

    if (target instanceof Element && target.closest('[data-node-id]')) {
      return
    }

    const additive = event.ctrlKey || event.metaKey

    if (!additive && !event.shiftKey) {
      workspaceStore.clearSelection()
    }

    dragSelectionState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      additive,
      baseSelection: additive ? [...selectedNodeIds.value] : [],
    }

    window.addEventListener('pointermove', handleDragPointerMove)
    window.addEventListener('pointerup', handleDragPointerUp)
  }

  watch(
    [projectId, folderId],
    ([nextProjectId, nextFolderId]) => {
      resetCreatingNodeState()
      resetDragSelection()
      void workspaceStore.loadFolder(nextProjectId, nextFolderId)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    resetDragSelection()
  })

  return {
    breadcrumbLabels,
    cancelItemName,
    canRenameSelection,
    clipboardHasContent,
    contentRef,
    copySelected: workspaceStore.copySelected,
    currentDirectory,
    cutSelected: workspaceStore.cutSelected,
    deleteSelected: workspaceStore.deleteSelected,
    draftItemName,
    editingItemId,
    emptyStateDescription,
    emptyStateTitle,
    error: currentFolderError,
    finishItemName,
    folders: foldersTree,
    handleContentPointerDown,
    handleItemSelect,
    hasSelection,
    isDragSelecting,
    isLoading: isCurrentFolderLoading,
    isSavingItemName,
    items: visibleItems,
    openFolder,
    openItem,
    pasteClipboard: workspaceStore.pasteClipboard,
    projectId,
    projectName,
    reloadCurrentFolder: workspaceStore.reloadCurrentFolder,
    searchQuery,
    selectedIdSet,
    selectedItem,
    selectionBoxStyle,
    sortOrder,
    selectedTagIds: activeTagIds,
    setSortField,
    setViewMode,
    startRenameSelected,
    startCreateNode,
    tags: sidebarTags,
    users,
    toggleTagId,
    toggleSortOrder,
    typeLabels,
    viewMode,
    viewModeLabel,
    toggleFavorite: workspaceStore.toggleFavorite,
    specialView,
    specialViewItems,
    specialViewLoading,
    loadTrash: workspaceStore.loadTrash,
    loadFavorites: workspaceStore.loadFavorites,
    exitSpecialView: workspaceStore.exitSpecialView,
    restoreSelected: workspaceStore.restoreSelected,
    restoreAll: workspaceStore.restoreAll,
    permanentDeleteSelected: workspaceStore.permanentDeleteSelected,
    emptyTrash: workspaceStore.emptyTrash,
    createTag: workspaceStore.createProjectTag,
    updateTag: workspaceStore.updateProjectTag,
    deleteTag: workspaceStore.deleteProjectTag,
  }
}
