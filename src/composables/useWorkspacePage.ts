import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useWorkspaceStore } from '@/stores/workspace'
import type { Node, NodeType, SortField, SortOrder, ViewMode } from '@/types/domain'

type WorkspaceItem = {
  id: string
  name: string
  type: NodeType
  tags: string[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

const typeLabels: Record<NodeType, string> = {
  folder: 'Папка',
  document: 'Документ',
  canvas: 'Холст',
  template: 'Шаблон',
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
})

const compareText = (left: string, right: string) => left.localeCompare(right, 'ru')

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
    tags,
  } = storeToRefs(workspaceStore)

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
  const sidebarTags = computed(() => tags.value.map((tag) => ({ id: tag.id, name: tag.name })))
  const activeTagNames = computed(() =>
    tags.value
      .filter((tag) => activeTagIds.value.includes(tag.id))
      .map((tag) => tag.name),
  )
  const selectedItem = computed(() => (selectedItems.value[0] ? toWorkspaceItem(selectedItems.value[0]) : null))
  const hasSelection = computed(() => selectedNodeIds.value.length > 0)
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
    }
  })

  const visibleItems = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    const selectedTags = activeTagIds.value

    const filtered = currentItems.value.filter((node) => {
      if (selectedTags.length && !node.tags.some((tag) => selectedTags.includes(tag.id))) {
        return false
      }

      if (!query) {
        return true
      }

      const haystack = [node.title, node.type, ...node.tags.map((tag) => tag.name)]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })

    const direction = sortOrder.value === 'asc' ? 1 : -1

    return [...filtered]
      .sort((left, right) => {
        const field = sortField.value

        if (field === 'type') {
          return compareText(typeLabels[left.type], typeLabels[right.type]) * direction
        }

        return compareText(left[field], right[field]) * direction
      })
      .map(toWorkspaceItem)
  })

  const emptyStateTitle = computed(() => {
    if (activeTagIds.value.length) {
      return 'Нет файлов с выбранными тэгами'
    }

    return 'Здесь пока пусто'
  })

  const emptyStateDescription = computed(() => {
    if (activeTagNames.value.length) {
      return `В текущей директории нет файлов или папок с тэгами: ${activeTagNames.value.join(', ')}.`
    }

    return 'Создайте папку, документ или холст.'
  })

  const openFolder = (nextFolderId: string) => {
    void router.push({
      name: 'project-folder',
      params: { projectId: projectId.value, folderId: nextFolderId },
      query: route.query,
    })
  }

  const openItem = (item: WorkspaceItem) => {
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

  watch(
    [projectId, folderId],
    ([nextProjectId, nextFolderId]) => {
      void workspaceStore.loadFolder(nextProjectId, nextFolderId)
    },
    { immediate: true },
  )

  return {
    breadcrumbLabels,
    clipboardHasContent,
    copySelected: workspaceStore.copySelected,
    currentDirectory,
    cutSelected: workspaceStore.cutSelected,
    deleteSelected: workspaceStore.deleteSelected,
    emptyStateDescription,
    emptyStateTitle,
    error: currentFolderError,
    folders: foldersTree,
    hasSelection,
    isLoading: isCurrentFolderLoading,
    items: visibleItems,
    openFolder,
    openItem,
    pasteClipboard: workspaceStore.pasteClipboard,
    projectName,
    reloadCurrentFolder: workspaceStore.reloadCurrentFolder,
    searchQuery,
    selectedId: computed(() => selectedNodeIds.value[0] ?? null),
    selectedItem,
    selectedTagIds: activeTagIds,
    selectItem: workspaceStore.selectOne,
    setSortField,
    setViewMode,
    tags: sidebarTags,
    toggleTagId,
    toggleSortOrder,
    typeLabels,
    viewMode,
    viewModeLabel,
  }
}
