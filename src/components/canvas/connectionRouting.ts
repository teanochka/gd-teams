import type {
  CanvasConnection,
  CanvasElement,
  CanvasHandlePosition,
  CanvasPoint,
} from '@/types/canvas'

export const connectorLeadLength = 20

export const handlePositions: CanvasHandlePosition[] = [
  'top',
  'right',
  'bottom',
  'left',
]

type CanvasVector = {
  x: -1 | 0 | 1
  y: -1 | 0 | 1
}

type RouteConnectionOptions = {
  source: CanvasElement
  sourceHandle: CanvasHandlePosition
  target?: CanvasElement | null
  targetHandle?: CanvasHandlePosition | null
  targetPoint?: CanvasPoint
  waypoints?: CanvasPoint[]
  type?: CanvasConnection['type']
}

export const getHandleVector = (handle: CanvasHandlePosition): CanvasVector => {
  switch (handle) {
    case 'top':
      return { x: 0, y: -1 }
    case 'right':
      return { x: 1, y: 0 }
    case 'bottom':
      return { x: 0, y: 1 }
    case 'left':
      return { x: -1, y: 0 }
  }
}

export const getHandlePoint = (
  element: CanvasElement,
  handle: CanvasHandlePosition | null | undefined,
): CanvasPoint => {
  switch (handle) {
    case 'top':
      return { x: element.x + element.width / 2, y: element.y }
    case 'right':
      return { x: element.x + element.width, y: element.y + element.height / 2 }
    case 'bottom':
      return { x: element.x + element.width / 2, y: element.y + element.height }
    case 'left':
      return { x: element.x, y: element.y + element.height / 2 }
    default:
      return { x: element.x + element.width / 2, y: element.y + element.height / 2 }
  }
}

export const getElementHandlePoints = (element: CanvasElement) => {
  return handlePositions.map((handle) => ({
    element,
    handle,
    point: getHandlePoint(element, handle),
  }))
}

const offsetPoint = (
  point: CanvasPoint,
  handle: CanvasHandlePosition,
  distance = connectorLeadLength,
): CanvasPoint => {
  const vector = getHandleVector(handle)

  return {
    x: point.x + vector.x * distance,
    y: point.y + vector.y * distance,
  }
}

const roundPoint = (point: CanvasPoint): CanvasPoint => ({
  x: Math.round(point.x),
  y: Math.round(point.y),
})

const isSamePoint = (left: CanvasPoint, right: CanvasPoint) => {
  return left.x === right.x && left.y === right.y
}

const isCollinear = (
  previous: CanvasPoint,
  current: CanvasPoint,
  next: CanvasPoint,
) => {
  return (
    (previous.x === current.x && current.x === next.x) ||
    (previous.y === current.y && current.y === next.y)
  )
}

export const simplifyOrthogonalPoints = (points: CanvasPoint[]) => {
  const deduped: CanvasPoint[] = []

  for (const point of points.map(roundPoint)) {
    const previous = deduped[deduped.length - 1]

    if (!previous || !isSamePoint(previous, point)) {
      deduped.push(point)
    }
  }

  const simplified: CanvasPoint[] = []

  for (const point of deduped) {
    simplified.push(point)

    while (simplified.length >= 3) {
      const next = simplified[simplified.length - 1]
      const current = simplified[simplified.length - 2]
      const previous = simplified[simplified.length - 3]

      if (!previous || !current || !next || !isCollinear(previous, current, next)) {
        break
      }

      simplified.splice(simplified.length - 2, 1)
    }
  }

  return simplified
}

const routeBetweenLeads = (
  sourceLead: CanvasPoint,
  sourceHandle: CanvasHandlePosition,
  targetLead: CanvasPoint,
  targetHandle?: CanvasHandlePosition | null,
) => {
  const sourceVector = getHandleVector(sourceHandle)

  if (!targetHandle) {
    if (sourceVector.x !== 0) {
      return [{ x: targetLead.x, y: sourceLead.y }]
    }

    return [{ x: sourceLead.x, y: targetLead.y }]
  }

  const targetVector = getHandleVector(targetHandle)
  const sourceIsHorizontal = sourceVector.x !== 0
  const targetIsHorizontal = targetVector.x !== 0

  if (sourceIsHorizontal && targetIsHorizontal) {
    const midX = sourceLead.x + (targetLead.x - sourceLead.x) / 2

    return [
      { x: midX, y: sourceLead.y },
      { x: midX, y: targetLead.y },
    ]
  }

  if (!sourceIsHorizontal && !targetIsHorizontal) {
    const midY = sourceLead.y + (targetLead.y - sourceLead.y) / 2

    return [
      { x: sourceLead.x, y: midY },
      { x: targetLead.x, y: midY },
    ]
  }

  if (sourceIsHorizontal) {
    return [{ x: targetLead.x, y: sourceLead.y }]
  }

  return [{ x: sourceLead.x, y: targetLead.y }]
}

export const routeOrthogonalConnection = ({
  source,
  sourceHandle,
  target,
  targetHandle,
  targetPoint,
  waypoints = [],
}: RouteConnectionOptions) => {
  const sourcePoint = getHandlePoint(source, sourceHandle)
  const sourceLead = offsetPoint(sourcePoint, sourceHandle)
  const resolvedTargetPoint = target && targetHandle
    ? getHandlePoint(target, targetHandle)
    : targetPoint

  if (!resolvedTargetPoint) {
    return []
  }

  if (target && targetHandle) {
    const targetLead = offsetPoint(resolvedTargetPoint, targetHandle)

    if (waypoints.length) {
      return simplifyOrthogonalPoints([
        sourcePoint,
        sourceLead,
        ...waypoints,
        targetLead,
        resolvedTargetPoint,
      ])
    }

    return simplifyOrthogonalPoints([
      sourcePoint,
      sourceLead,
      ...routeBetweenLeads(sourceLead, sourceHandle, targetLead, targetHandle),
      targetLead,
      resolvedTargetPoint,
    ])
  }

  if (waypoints.length) {
    return simplifyOrthogonalPoints([
      sourcePoint,
      sourceLead,
      ...waypoints,
      resolvedTargetPoint,
    ])
  }

  return simplifyOrthogonalPoints([
    sourcePoint,
    sourceLead,
    ...routeBetweenLeads(sourceLead, sourceHandle, resolvedTargetPoint),
    resolvedTargetPoint,
  ])
}

export const buildSvgPath = (points: CanvasPoint[]) => {
  const [firstPoint, ...restPoints] = points

  if (!firstPoint) {
    return ''
  }

  return restPoints.reduce(
    (path, point) => `${path} L ${point.x} ${point.y}`,
    `M ${firstPoint.x} ${firstPoint.y}`,
  )
}
