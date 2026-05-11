import { apiRequest } from '@/api/http'
import type {
  CanvasData,
  CanvasDocumentCard,
  CanvasObject,
  CanvasPage,
  Node,
  NodeId,
  ProjectId,
} from '@/types/domain'

type RawNode = Omit<Node, 'tags'> & {
  tagIds: string[]
  icon?: string | null
}

const getCurrentDate = () => new Date().toISOString()

export const createDefaultCanvasData = (): CanvasData => ({
  objects: [],
  documentCards: [],
})

const cloneCanvasObjects = (objects: CanvasObject[]): CanvasObject[] => {
  return objects.map((object) => {
    const { imageElement: _imageElement, ...serializableObject } = object

    return JSON.parse(JSON.stringify(serializableObject)) as CanvasObject
  })
}

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value)
}

const cloneCanvasDocumentCards = (cards: unknown): CanvasDocumentCard[] => {
  if (!Array.isArray(cards)) {
    return []
  }

  return cards
    .map((card) => {
      if (!card || typeof card !== 'object') {
        return null
      }

      const candidate = card as Partial<CanvasDocumentCard>

      if (
        candidate.type !== 'document-card' ||
        typeof candidate.id !== 'string' ||
        typeof candidate.documentId !== 'string' ||
        typeof candidate.projectId !== 'string' ||
        !isFiniteNumber(candidate.x) ||
        !isFiniteNumber(candidate.y) ||
        !isFiniteNumber(candidate.width) ||
        !isFiniteNumber(candidate.height)
      ) {
        return null
      }

      return {
        id: candidate.id,
        type: 'document-card',
        documentId: candidate.documentId,
        projectId: candidate.projectId,
        title: typeof candidate.title === 'string' ? candidate.title : 'Document',
        x: candidate.x,
        y: candidate.y,
        width: candidate.width,
        height: candidate.height,
      }
    })
    .filter((card): card is CanvasDocumentCard => card !== null)
}

export const cloneCanvasData = (data?: Partial<CanvasData> | null): CanvasData => {
  if (!data) {
    return createDefaultCanvasData()
  }

  return {
    objects: Array.isArray(data.objects) ? cloneCanvasObjects(data.objects) : [],
    documentCards: cloneCanvasDocumentCards(data.documentCards),
  }
}

const createCanvasPage = async (node: Pick<Node, 'id' | 'projectId'>): Promise<CanvasPage> => {
  const savedAt = getCurrentDate()

  return apiRequest<CanvasPage>('/canvasPages', {
    method: 'POST',
    body: {
      nodeId: node.id,
      projectId: node.projectId,
      data: createDefaultCanvasData(),
      createdAt: savedAt,
      updatedAt: savedAt,
    },
  })
}

export const getCanvasPage = async (
  canvasId: NodeId,
  projectId: ProjectId,
): Promise<CanvasPage> => {
  const pages = await apiRequest<CanvasPage[]>('/canvasPages', {
    query: { nodeId: canvasId },
  })
  const existingPage = pages[0]

  if (existingPage) {
    if (existingPage.projectId !== projectId) {
      throw new Error('Canvas not found')
    }

    return {
      ...existingPage,
      data: cloneCanvasData(existingPage.data),
    }
  }

  const node = await apiRequest<RawNode>(`/nodes/${canvasId}`)

  if (node.type !== 'canvas' || node.projectId !== projectId) {
    throw new Error('Canvas not found')
  }

  return createCanvasPage({
    id: node.id,
    projectId: node.projectId,
  })
}

export const saveCanvasPage = async (
  canvasId: NodeId,
  data: CanvasData,
): Promise<CanvasPage> => {
  const savedAt = getCurrentDate()
  const nextData = cloneCanvasData(data)
  const pages = await apiRequest<CanvasPage[]>('/canvasPages', {
    query: { nodeId: canvasId },
  })
  const canvasPageId = pages[0]?.id

  if (!canvasPageId) {
    const node = await apiRequest<RawNode>(`/nodes/${canvasId}`)

    if (node.type !== 'canvas') {
      throw new Error('Canvas not found')
    }

    const [canvasPage] = await Promise.all([
      apiRequest<CanvasPage>('/canvasPages', {
        method: 'POST',
        body: {
          nodeId: node.id,
          projectId: node.projectId,
          data: nextData,
          createdAt: savedAt,
          updatedAt: savedAt,
        },
      }),
      apiRequest<RawNode>(`/nodes/${canvasId}`, {
        method: 'PATCH',
        body: {
          updatedAt: savedAt,
          updatedBy: 'Вы',
        },
      }),
    ])

    return canvasPage
  }

  const [canvasPage] = await Promise.all([
    apiRequest<CanvasPage>(`/canvasPages/${canvasPageId}`, {
      method: 'PATCH',
      body: {
        data: nextData,
        updatedAt: savedAt,
      },
    }),
    apiRequest<RawNode>(`/nodes/${canvasId}`, {
      method: 'PATCH',
      body: {
        updatedAt: savedAt,
        updatedBy: 'Вы',
      },
    }),
  ])

  return {
    ...canvasPage,
    data: cloneCanvasData(canvasPage.data),
  }
}
