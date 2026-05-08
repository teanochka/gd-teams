import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  cloneLotionBlockDetails,
  getDocumentPage as apiGetDocumentPage,
  sanitizeLotionBlockValue,
  saveDocumentPage as apiSaveDocumentPage,
} from '@/api/documents'
import { useAppToast } from '@/composables/useAppToast'
import { useWorkspaceStore } from '@/stores/workspace'
import type { DocumentPage, LotionPage, NodeId, ProjectId } from '@/types/domain'

const saveDelay = 700

const getSaveErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : ''

  if (
    message.includes('Payload too large') ||
    message.includes('102400') ||
    message.includes('413')
  ) {
    return 'Документ слишком большой для mock db. Загрузите изображение меньше 45 KB или используйте ссылку на внешнюю картинку.'
  }

  return 'Не удалось сохранить документ. Изменения остались на странице, попробуйте сохранить позже.'
}

const clonePage = (page: LotionPage): LotionPage => ({
  name: page.name,
  coverUrl: page.coverUrl,
  blocks: page.blocks.map((block) => ({
    ...block,
    details: cloneLotionBlockDetails(block.details),
  })),
  card: {
    blockIds: page.card?.blockIds.filter((blockId) =>
      page.blocks.some((block) => block.id === blockId),
    ) ?? [],
  },
})

function sanitizePageInPlace(page: LotionPage) {
  let changed = false
  const blockIds = new Set(page.blocks.map((block) => block.id))

  for (const block of page.blocks) {
    const value = block.details.value
    const nextValue = sanitizeLotionBlockValue(value)

    if (nextValue !== value) {
      block.details.value = nextValue
      changed = true
    }
  }

  const nextCardBlockIds = page.card?.blockIds.filter((blockId) => blockIds.has(blockId)) ?? []

  if (!page.card) {
    page.card = { blockIds: nextCardBlockIds }
    changed = true
  } else if (nextCardBlockIds.length !== page.card.blockIds.length) {
    page.card.blockIds = nextCardBlockIds
    changed = true
  }

  return changed
}

export const useDocumentsStore = defineStore('documents', () => {
  const { showToast } = useAppToast()
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
    } catch (error) {
      showToast(getSaveErrorMessage(error))
      return null
    } finally {
      isSavingById.value[documentId] = false
    }
  }

  function scheduleSave(documentId: NodeId) {
    const page = pagesById.value[documentId]

    if (!page) {
      return
    }

    sanitizePageInPlace(page)
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

  function addBlockToCard(documentId: NodeId, blockId: string) {
    const page = pagesById.value[documentId]

    if (!page || !page.blocks.some((block) => block.id === blockId)) {
      return
    }

    if (!page.card) {
      page.card = { blockIds: [] }
    }

    if (page.card.blockIds.includes(blockId)) {
      return
    }

    page.card.blockIds.push(blockId)
    scheduleSave(documentId)
  }

  function setCardBlockIds(documentId: NodeId, blockIds: string[]) {
    const page = pagesById.value[documentId]

    if (!page) {
      return
    }

    const validBlockIds = new Set(page.blocks.map((block) => block.id))
    const nextBlockIds = [...new Set(blockIds)].filter((blockId) => validBlockIds.has(blockId))

    if (!page.card) {
      page.card = { blockIds: [] }
    }

    if (page.card.blockIds.join('\u0000') === nextBlockIds.join('\u0000')) {
      return
    }

    page.card.blockIds = nextBlockIds
    scheduleSave(documentId)
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
    addBlockToCard,
    setCardBlockIds,
    flushDocument,
    clearDocument,
  }
})
