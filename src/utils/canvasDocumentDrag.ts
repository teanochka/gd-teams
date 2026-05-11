import type { Node, NodeId, ProjectId } from '@/types/domain'

export const canvasDocumentDragType = 'application/x-gdteams-document-card'

export type CanvasDocumentDragPayload = {
  type: 'document'
  nodeId: NodeId
  projectId: ProjectId
  title: string
}

export const createCanvasDocumentDragPayload = (
  node: Pick<Node, 'id' | 'projectId' | 'title'>,
): CanvasDocumentDragPayload => ({
  type: 'document',
  nodeId: node.id,
  projectId: node.projectId,
  title: node.title,
})

export const hasCanvasDocumentDragPayload = (dataTransfer: DataTransfer | null) => {
  return Boolean(dataTransfer?.types.includes(canvasDocumentDragType))
}

export const parseCanvasDocumentDragPayload = (
  dataTransfer: DataTransfer | null,
): CanvasDocumentDragPayload | null => {
  const rawPayload = dataTransfer?.getData(canvasDocumentDragType)

  if (!rawPayload) {
    return null
  }

  try {
    const payload = JSON.parse(rawPayload) as Partial<CanvasDocumentDragPayload>

    if (
      payload.type !== 'document' ||
      typeof payload.nodeId !== 'string' ||
      typeof payload.projectId !== 'string' ||
      typeof payload.title !== 'string'
    ) {
      return null
    }

    return {
      type: 'document',
      nodeId: payload.nodeId,
      projectId: payload.projectId,
      title: payload.title,
    }
  } catch {
    return null
  }
}
