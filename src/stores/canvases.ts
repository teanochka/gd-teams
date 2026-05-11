import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  cloneCanvasData,
  getCanvasPage as apiGetCanvasPage,
  saveCanvasPage as apiSaveCanvasPage,
} from '@/api/canvas'
import { useDebouncedSave } from '@/composables/useDebouncedSave'
import { useWorkspaceStore } from '@/stores/workspace'
import type { CanvasData, CanvasPage, NodeId, ProjectId } from '@/types/domain'

const saveDelay = 650

export const useCanvasesStore = defineStore('canvases', () => {
  const dataById = ref<Record<NodeId, CanvasData>>({})
  const recordsById = ref<Record<NodeId, CanvasPage>>({})
  const isLoadingById = ref<Record<NodeId, boolean>>({})
  const isSavingById = ref<Record<NodeId, boolean>>({})
  const isDirtyById = ref<Record<NodeId, boolean>>({})
  const errorById = ref<Record<NodeId, string | null>>({})

  const debouncedSave = useDebouncedSave<NodeId>({
    delay: saveDelay,
    save: (canvasId) => saveCanvas(canvasId),
  })

  const activeSaveCount = computed(() => {
    return Object.values(isSavingById.value).filter(Boolean).length
  })

  function cacheCanvas(record: CanvasPage) {
    recordsById.value[record.nodeId] = {
      ...record,
      data: cloneCanvasData(record.data),
    }
    dataById.value[record.nodeId] = cloneCanvasData(record.data)
    isDirtyById.value[record.nodeId] = false
    errorById.value[record.nodeId] = null
  }

  async function loadCanvas(canvasId: NodeId, projectId: ProjectId, force = false) {
    if (dataById.value[canvasId] && !force) {
      return dataById.value[canvasId]
    }

    isLoadingById.value[canvasId] = true
    errorById.value[canvasId] = null

    try {
      const record = await apiGetCanvasPage(canvasId, projectId)
      cacheCanvas(record)

      return dataById.value[canvasId]
    } catch {
      errorById.value[canvasId] = 'Не удалось загрузить холст'
      return null
    } finally {
      isLoadingById.value[canvasId] = false
    }
  }

  async function saveCanvas(canvasId: NodeId) {
    const data = dataById.value[canvasId]

    if (!data) {
      return null
    }

    debouncedSave.cancel(canvasId)
    isSavingById.value[canvasId] = true
    errorById.value[canvasId] = null

    try {
      const record = await apiSaveCanvasPage(canvasId, data)
      const workspaceStore = useWorkspaceStore()
      const cachedNode = workspaceStore.nodesById[canvasId]

      if (cachedNode) {
        workspaceStore.nodesById[canvasId] = {
          ...cachedNode,
          updatedAt: record.updatedAt,
          updatedBy: 'Вы',
        }
      }

      cacheCanvas(record)

      return record
    } catch {
      errorById.value[canvasId] = 'Не удалось сохранить холст'
      return null
    } finally {
      isSavingById.value[canvasId] = false
    }
  }

  function scheduleSave(canvasId: NodeId, data: CanvasData) {
    dataById.value[canvasId] = cloneCanvasData(data)
    isDirtyById.value[canvasId] = true
    errorById.value[canvasId] = null
    debouncedSave.schedule(canvasId)
  }

  async function flushCanvas(canvasId: NodeId) {
    if (!isDirtyById.value[canvasId] && !debouncedSave.hasPending(canvasId)) {
      return recordsById.value[canvasId] ?? null
    }

    return debouncedSave.flush(canvasId)
  }

  function clearCanvas(canvasId: NodeId) {
    debouncedSave.cancel(canvasId)
    delete dataById.value[canvasId]
    delete recordsById.value[canvasId]
    delete isLoadingById.value[canvasId]
    delete isSavingById.value[canvasId]
    delete isDirtyById.value[canvasId]
    delete errorById.value[canvasId]
  }

  return {
    dataById,
    recordsById,
    isLoadingById,
    isSavingById,
    isDirtyById,
    errorById,
    activeSaveCount,
    loadCanvas,
    saveCanvas,
    scheduleSave,
    flushCanvas,
    clearCanvas,
  }
})
