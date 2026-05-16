import { apiRequest } from '@/api/http'
import type { CanvasConnection, CanvasData, CanvasElement } from '@/types/canvas'
import type { CanvasPage, Node, NodeId, ProjectId } from '@/types/domain'

type RawNode = Omit<Node, 'tags'> & {
  tagIds: string[]
  icon?: string | null
}

type LegacyCanvasDocumentCard = {
  id?: unknown
  type?: unknown
  documentId?: unknown
  projectId?: unknown
  title?: unknown
  x?: unknown
  y?: unknown
  width?: unknown
  height?: unknown
}

type LegacyCanvasData = Partial<CanvasData> & {
  cards?: unknown
  documentCards?: unknown
  objects?: unknown
}

const getCurrentDate = () => new Date().toISOString()

export const createDefaultCanvasData = (): CanvasData => ({
  elements: [],
  connections: [],
})

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object'
}

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value)
}

const cloneSerializable = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value)) as T
}

const normalizeCanvasElement = (value: unknown): CanvasElement | null => {
  if (!isRecord(value)) {
    return null
  }

  if (
    !('id' in value) ||
    typeof value.type !== 'string' ||
    !isFiniteNumber(value.x) ||
    !isFiniteNumber(value.y) ||
    !isFiniteNumber(value.width) ||
    !isFiniteNumber(value.height)
  ) {
    return null
  }

  return cloneSerializable(value) as CanvasElement
}

const normalizeCanvasConnection = (value: unknown): CanvasConnection | null => {
  if (!isRecord(value)) {
    return null
  }

  const targetPoint = isRecord(value.targetPoint)
    && isFiniteNumber(value.targetPoint.x)
    && isFiniteNumber(value.targetPoint.y)
    ? { x: value.targetPoint.x, y: value.targetPoint.y }
    : undefined
  const hasElementTarget = (typeof value.targetId === 'string' || typeof value.targetId === 'number')
    && ['top', 'right', 'bottom', 'left'].includes(String(value.targetHandle))

  if (
    !('id' in value) ||
    !('sourceId' in value) ||
    !['top', 'right', 'bottom', 'left'].includes(String(value.sourceHandle)) ||
    (!hasElementTarget && !targetPoint)
  ) {
    return null
  }

  return {
    id: value.id as CanvasConnection['id'],
    sourceId: value.sourceId as CanvasConnection['sourceId'],
    targetId: hasElementTarget ? (value.targetId as CanvasConnection['targetId']) : null,
    sourceHandle: value.sourceHandle as CanvasConnection['sourceHandle'],
    targetHandle: hasElementTarget ? (value.targetHandle as CanvasConnection['targetHandle']) : null,
    targetPoint,
    type: ['straight', 'orthogonal', 'curved'].includes(String(value.type))
      ? (value.type as CanvasConnection['type'])
      : 'orthogonal',
    markerEnd: value.markerEnd === 'none' ? 'none' : 'arrow',
    style: isRecord(value.style) ? (value.style as Record<string, string>) : undefined,
    data: isRecord(value.data) ? cloneSerializable(value.data) : undefined,
  }
}

const normalizeLegacyDocumentCard = (value: LegacyCanvasDocumentCard): CanvasElement | null => {
  if (
    value.type !== 'document-card' ||
    typeof value.documentId !== 'string' ||
    typeof value.projectId !== 'string' ||
    !isFiniteNumber(value.x) ||
    !isFiniteNumber(value.y) ||
    !isFiniteNumber(value.width) ||
    !isFiniteNumber(value.height)
  ) {
    return null
  }

  return {
    id: typeof value.id === 'string' || typeof value.id === 'number' ? value.id : crypto.randomUUID(),
    type: 'document-card',
    documentId: value.documentId,
    projectId: value.projectId,
    title: typeof value.title === 'string' ? value.title : 'Document',
    x: value.x,
    y: value.y,
    width: value.width,
    height: value.height,
  }
}

const normalizeElements = (data: LegacyCanvasData) => {
  if (Array.isArray(data.elements)) {
    return data.elements
      .map(normalizeCanvasElement)
      .filter((element): element is CanvasElement => element !== null)
  }

  if (Array.isArray(data.cards)) {
    return data.cards
      .map(normalizeCanvasElement)
      .filter((element): element is CanvasElement => element !== null)
  }

  if (Array.isArray(data.documentCards)) {
    return data.documentCards
      .map((card) => normalizeLegacyDocumentCard(card as LegacyCanvasDocumentCard))
      .filter((element): element is CanvasElement => element !== null)
  }

  return []
}

const normalizeConnections = (data: LegacyCanvasData) => {
  if (!Array.isArray(data.connections)) {
    return []
  }

  return data.connections
    .map(normalizeCanvasConnection)
    .filter((connection): connection is CanvasConnection => connection !== null)
}

export const cloneCanvasData = (data?: LegacyCanvasData | null): CanvasData => {
  if (!data) {
    return createDefaultCanvasData()
  }

  return {
    elements: normalizeElements(data),
    connections: normalizeConnections(data),
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

    return {
      ...canvasPage,
      data: cloneCanvasData(canvasPage.data),
    }
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
