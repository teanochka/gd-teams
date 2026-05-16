export type CanvasElementId = string | number

export type CanvasHandlePosition = 'top' | 'right' | 'bottom' | 'left'

export type CanvasPoint = {
  x: number
  y: number
}

export type CanvasElement = {
  id: CanvasElementId
  type: string
  x: number
  y: number
  width: number
  height: number
  parentId?: CanvasElementId | null
  content?: string
  title?: string
  documentId?: string
  projectId?: string
  src?: string
  fields?: Array<{ id: string; value: string }>
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number | string
  textAlign?: 'left' | 'center' | 'right'
  fontSize?: number
  textColor?: string
  fontWeight?: number
  opacity?: number
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
  style?: Record<string, unknown>
  [key: string]: unknown
}

export type CanvasConnection = {
  id: CanvasElementId
  sourceId: CanvasElementId
  targetId?: CanvasElementId | null
  sourceHandle: CanvasHandlePosition
  targetHandle?: CanvasHandlePosition | null
  targetPoint?: CanvasPoint
  type: 'straight' | 'orthogonal' | 'curved'
  markerEnd?: 'arrow' | 'none'
  style?: Record<string, string>
  data?: {
    waypoints?: Array<{ x: number; y: number }>
  }
}

export type CanvasData = {
  elements: CanvasElement[]
  connections: CanvasConnection[]
}

export type CreateCanvasElementDefaults = {
  width?: number
  height?: number
  content?: string
  defaultProps?: Record<string, unknown>
}

export const canvasContainerTypes = ['flex-container', 'grid-container'] as const

export function createCanvasElement(
  type: string,
  overrides: Partial<CanvasElement> = {},
  defaults?: CreateCanvasElementDefaults,
): CanvasElement {
  const width = defaults?.width ?? 140
  const height = defaults?.height ?? 100

  return {
    id: overrides.id ?? crypto.randomUUID(),
    type,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    width: overrides.width ?? width,
    height: overrides.height ?? height,
    parentId: overrides.parentId ?? null,
    content: defaults?.content,
    ...defaults?.defaultProps,
    ...overrides,
  }
}

export function isCanvasContainerType(type: string) {
  return (canvasContainerTypes as readonly string[]).includes(type)
}

export function isCanvasContainer(element: CanvasElement) {
  return isCanvasContainerType(element.type)
}

export function getCanvasChildren(
  elements: CanvasElement[],
  parentId: CanvasElementId,
) {
  return elements.filter((element) => element.parentId === parentId)
}

export function getRootCanvasElements(elements: CanvasElement[]) {
  return elements.filter((element) => element.parentId == null)
}
