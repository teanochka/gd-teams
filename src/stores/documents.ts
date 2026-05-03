import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getDocumentPage as apiGetDocumentPage,
  saveDocumentPage as apiSaveDocumentPage,
} from '@/api/documents'
import { useWorkspaceStore } from '@/stores/workspace'
import type { DocumentPage, LotionPage, NodeId, ProjectId } from '@/types/domain'

const saveDelay = 700

const clonePage = (page: LotionPage): LotionPage => ({
  name: page.name,
  blocks: page.blocks.map((block) => ({
    ...block,
    details: { ...block.details },
  })),
})

export const useDocumentsStore = defineStore('documents', () => {
  const pagesById = ref<Record<NodeId, LotionPage>>({})
  const recordsById = ref<Record<NodeId, DocumentPage>>({})
  const isLoadingById = ref<Record<NodeId, boolean>>({})
  const isSavingById = ref<Record<NodeId, boolean>>({})
  const isDirtyById = ref<Record<NodeId, boolean>>({})
  const errorById = ref<Record<NodeId, string | null>>({})

  const saveTimers = new Map<NodeId, ReturnType<typeof setTimeout>>()

  const activeSaveCount = computed(() => {
    return Object.values(isSavingById.value).filter(Boolean).length
  })

  function cacheDocument(record: DocumentPage) {
    recordsById.value[record.nodeId] = record
    pagesById.value[record.nodeId] = clonePage(record.page)
    isDirtyById.value[record.nodeId] = false
    errorById.value[record.nodeId] = null
  }

  async function loadDocument(documentId: NodeId, projectId: ProjectId, force = false) {
    if (pagesById.value[documentId] && !force) {
      return pagesById.value[documentId]
    }

    isLoadingById.value[documentId] = true
    errorById.value[documentId] = null

    try {
      const record = await apiGetDocumentPage(documentId, projectId)
      cacheDocument(record)

      return pagesById.value[documentId]
    } catch {
      errorById.value[documentId] = 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РґРѕРєСѓРјРµРЅС‚'
      return null
    } finally {
      isLoadingById.value[documentId] = false
    }
  }

  async function saveDocument(documentId: NodeId) {
    const page = pagesById.value[documentId]

    if (!page) {
      return null
    }

    if (saveTimers.has(documentId)) {
      clearTimeout(saveTimers.get(documentId))
      saveTimers.delete(documentId)
    }

    isSavingById.value[documentId] = true
    errorById.value[documentId] = null

    try {
      const record = await apiSaveDocumentPage(documentId, page)
      const workspaceStore = useWorkspaceStore()
      const cachedNode = workspaceStore.nodesById[documentId]

      if (cachedNode) {
        workspaceStore.nodesById[documentId] = {
          ...cachedNode,
          title: record.page.name,
          updatedAt: record.updatedAt,
          updatedBy: 'Р’С‹',
        }
      }

      recordsById.value[documentId] = record
      isDirtyById.value[documentId] = false

      return record
    } catch {
      errorById.value[documentId] = 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РґРѕРєСѓРјРµРЅС‚'
      return null
    } finally {
      isSavingById.value[documentId] = false
    }
  }

  function scheduleSave(documentId: NodeId) {
    if (!pagesById.value[documentId]) {
      return
    }

    isDirtyById.value[documentId] = true

    if (saveTimers.has(documentId)) {
      clearTimeout(saveTimers.get(documentId))
    }

    saveTimers.set(
      documentId,
      setTimeout(() => {
        saveTimers.delete(documentId)
        void saveDocument(documentId)
      }, saveDelay),
    )
  }

  async function flushDocument(documentId: NodeId) {
    if (saveTimers.has(documentId)) {
      clearTimeout(saveTimers.get(documentId))
      saveTimers.delete(documentId)
    }

    if (!isDirtyById.value[documentId]) {
      return recordsById.value[documentId] ?? null
    }

    return saveDocument(documentId)
  }

  function clearDocument(documentId: NodeId) {
    if (saveTimers.has(documentId)) {
      clearTimeout(saveTimers.get(documentId))
      saveTimers.delete(documentId)
    }

    delete pagesById.value[documentId]
    delete recordsById.value[documentId]
    delete isLoadingById.value[documentId]
    delete isSavingById.value[documentId]
    delete isDirtyById.value[documentId]
    delete errorById.value[documentId]
  }

  return {
    pagesById,
    recordsById,
    isLoadingById,
    isSavingById,
    isDirtyById,
    errorById,
    activeSaveCount,
    loadDocument,
    saveDocument,
    scheduleSave,
    flushDocument,
    clearDocument,
  }
})
