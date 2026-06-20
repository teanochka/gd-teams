import type {
  CanvasConnection,
  CanvasElement,
  CanvasElementId,
  CanvasHandlePosition,
  CanvasPoint,
} from "@/types/canvas";

export const connectorLeadLength = 50;
export const connectionSnapThreshold = 8;
export const connectionSegmentHitWidth = 12;
export const connectionSnapMinOverlap = 12;

export const handlePositions: CanvasHandlePosition[] = [
  "top",
  "right",
  "bottom",
  "left",
];

type CanvasVector = {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
};

type RouteConnectionOptions = {
  source: CanvasElement;
  sourceHandle: CanvasHandlePosition;
  target?: CanvasElement | null;
  targetHandle?: CanvasHandlePosition | null;
  targetPoint?: CanvasPoint;
  waypoints?: CanvasPoint[];
  type?: CanvasConnection["type"];
};

export type CanvasConnectionSegment = {
  connectionId: CanvasElementId;
  index: number;
  orientation: "horizontal" | "vertical";
  start: CanvasPoint;
  end: CanvasPoint;
};

export const getHandleVector = (handle: CanvasHandlePosition): CanvasVector => {
  switch (handle) {
    case "top":
      return { x: 0, y: -1 };
    case "right":
      return { x: 1, y: 0 };
    case "bottom":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
  }
};

export const getHandlePoint = (
  element: CanvasElement,
  handle: CanvasHandlePosition | null | undefined,
): CanvasPoint => {
  switch (handle) {
    case "top":
      return { x: element.x + element.width / 2, y: element.y };
    case "right":
      return {
        x: element.x + element.width,
        y: element.y + element.height / 2,
      };
    case "bottom":
      return {
        x: element.x + element.width / 2,
        y: element.y + element.height,
      };
    case "left":
      return { x: element.x, y: element.y + element.height / 2 };
    default:
      return {
        x: element.x + element.width / 2,
        y: element.y + element.height / 2,
      };
  }
};

export const getElementHandlePoints = (element: CanvasElement) => {
  return handlePositions.map((handle) => ({
    element,
    handle,
    point: getHandlePoint(element, handle),
  }));
};

const offsetPoint = (
  point: CanvasPoint,
  handle: CanvasHandlePosition,
  distance = connectorLeadLength,
): CanvasPoint => {
  const vector = getHandleVector(handle);

  return {
    x: point.x + vector.x * distance,
    y: point.y + vector.y * distance,
  };
};

const roundPoint = (point: CanvasPoint): CanvasPoint => ({
  x: Math.round(point.x),
  y: Math.round(point.y),
});

const isSamePoint = (left: CanvasPoint, right: CanvasPoint) => {
  return left.x === right.x && left.y === right.y;
};

const isCollinear = (
  previous: CanvasPoint,
  current: CanvasPoint,
  next: CanvasPoint,
) => {
  return (
    (previous.x === current.x && current.x === next.x) ||
    (previous.y === current.y && current.y === next.y)
  );
};

export const simplifyOrthogonalPoints = (points: CanvasPoint[]) => {
  const deduped: CanvasPoint[] = [];

  for (const point of points.map(roundPoint)) {
    const previous = deduped[deduped.length - 1];

    if (!previous || !isSamePoint(previous, point)) {
      deduped.push(point);
    }
  }

  const simplified: CanvasPoint[] = [];

  for (const point of deduped) {
    simplified.push(point);

    while (simplified.length >= 3) {
      const next = simplified[simplified.length - 1];
      const current = simplified[simplified.length - 2];
      const previous = simplified[simplified.length - 3];

      if (
        !previous ||
        !current ||
        !next ||
        !isCollinear(previous, current, next)
      ) {
        break;
      }

      simplified.splice(simplified.length - 2, 1);
    }
  }

  return simplified;
};

const orthogonalizePointChain = (points: CanvasPoint[]) => {
  const [firstPoint, ...restPoints] = points;

  if (!firstPoint) {
    return [];
  }

  const orthogonalPoints: CanvasPoint[] = [firstPoint];

  for (const nextPoint of restPoints) {
    const previousPoint = orthogonalPoints[orthogonalPoints.length - 1];

    if (!previousPoint) {
      orthogonalPoints.push(nextPoint);
      continue;
    }

    if (
      previousPoint.x !== nextPoint.x &&
      previousPoint.y !== nextPoint.y
    ) {
      orthogonalPoints.push({ x: nextPoint.x, y: previousPoint.y });
    }

    orthogonalPoints.push(nextPoint);
  }

  return simplifyOrthogonalPoints(orthogonalPoints);
};

export const getConnectionSegments = (
  connectionId: CanvasElementId,
  points: CanvasPoint[],
): CanvasConnectionSegment[] => {
  const segments: CanvasConnectionSegment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (!start || !end || isSamePoint(start, end)) {
      continue;
    }

    if (start.y === end.y) {
      segments.push({
        connectionId,
        index,
        orientation: "horizontal",
        start,
        end,
      });
      continue;
    }

    if (start.x === end.x) {
      segments.push({
        connectionId,
        index,
        orientation: "vertical",
        start,
        end,
      });
    }
  }

  return segments;
};

const setPointAxis = (
  point: CanvasPoint,
  orientation: CanvasConnectionSegment["orientation"],
  coordinate: number,
): CanvasPoint => {
  return orientation === "horizontal"
    ? { ...point, y: coordinate }
    : { ...point, x: coordinate };
};

const createEndpointCorner = (
  point: CanvasPoint,
  orientation: CanvasConnectionSegment["orientation"],
  coordinate: number,
): CanvasPoint => {
  return orientation === "horizontal"
    ? { x: point.x, y: coordinate }
    : { x: coordinate, y: point.y };
};

export const moveOrthogonalSegment = (
  points: CanvasPoint[],
  segmentIndex: number,
  coordinate: number,
) => {
  const start = points[segmentIndex];
  const end = points[segmentIndex + 1];

  if (!start || !end || isSamePoint(start, end)) {
    return points;
  }

  const orientation =
    start.y === end.y ? "horizontal" : start.x === end.x ? "vertical" : null;

  if (!orientation) {
    return points;
  }

  const lastIndex = points.length - 1;
  const firstPoint = points[0];
  const lastPoint = points[lastIndex];
  const roundedCoordinate = Math.round(coordinate);

  if (!firstPoint || !lastPoint) {
    return points;
  }

  if (segmentIndex === 0) {
    return simplifyOrthogonalPoints([
      firstPoint,
      createEndpointCorner(start, orientation, roundedCoordinate),
      setPointAxis(end, orientation, roundedCoordinate),
      ...points.slice(2),
    ]);
  }

  if (segmentIndex + 1 === lastIndex) {
    return simplifyOrthogonalPoints([
      ...points.slice(0, segmentIndex),
      setPointAxis(start, orientation, roundedCoordinate),
      createEndpointCorner(end, orientation, roundedCoordinate),
      lastPoint,
    ]);
  }

  return simplifyOrthogonalPoints(
    points.map((point, index) => {
      if (index !== segmentIndex && index !== segmentIndex + 1) {
        return point;
      }

      return setPointAxis(point, orientation, roundedCoordinate);
    }),
  );
};

export const getWaypointsFromRoutePoints = (points: CanvasPoint[]) => {
  return simplifyOrthogonalPoints(points).slice(1, -1);
};

const getSegmentCoordinate = (segment: CanvasConnectionSegment) => {
  return segment.orientation === "horizontal"
    ? segment.start.y
    : segment.start.x;
};

const getSegmentProjection = (segment: CanvasConnectionSegment) => {
  const start =
    segment.orientation === "horizontal" ? segment.start.x : segment.start.y;
  const end =
    segment.orientation === "horizontal" ? segment.end.x : segment.end.y;

  return {
    min: Math.min(start, end),
    max: Math.max(start, end),
  };
};

const getProjectionOverlap = (
  left: CanvasConnectionSegment,
  right: CanvasConnectionSegment,
) => {
  const leftProjection = getSegmentProjection(left);
  const rightProjection = getSegmentProjection(right);

  return (
    Math.min(leftProjection.max, rightProjection.max) -
    Math.max(leftProjection.min, rightProjection.min)
  );
};

export const findParallelSegmentSnap = ({
  segment,
  coordinate,
  segments,
  threshold = connectionSnapThreshold,
}: {
  segment: CanvasConnectionSegment;
  coordinate: number;
  segments: CanvasConnectionSegment[];
  threshold?: number;
}) => {
  let bestSnap: { coordinate: number; distance: number } | null = null;

  for (const candidate of segments) {
    if (
      candidate.connectionId === segment.connectionId ||
      candidate.orientation !== segment.orientation ||
      getProjectionOverlap(segment, candidate) < connectionSnapMinOverlap
    ) {
      continue;
    }

    const candidateCoordinate = getSegmentCoordinate(candidate);
    const distance = Math.abs(candidateCoordinate - coordinate);

    if (distance > threshold) {
      continue;
    }

    if (!bestSnap || distance < bestSnap.distance) {
      bestSnap = { coordinate: candidateCoordinate, distance };
    }
  }

  return bestSnap;
};

const routeBetweenLeads = (
  sourceLead: CanvasPoint,
  sourceHandle: CanvasHandlePosition,
  targetLead: CanvasPoint,
  targetHandle?: CanvasHandlePosition | null,
) => {
  const sourceVector = getHandleVector(sourceHandle);

  if (!targetHandle) {
    if (sourceVector.x !== 0) {
      return [{ x: targetLead.x, y: sourceLead.y }];
    }

    return [{ x: sourceLead.x, y: targetLead.y }];
  }

  const targetVector = getHandleVector(targetHandle);
  const sourceIsHorizontal = sourceVector.x !== 0;
  const targetIsHorizontal = targetVector.x !== 0;

  if (sourceIsHorizontal && targetIsHorizontal) {
    const midX = sourceLead.x + (targetLead.x - sourceLead.x) / 2;

    return [
      { x: midX, y: sourceLead.y },
      { x: midX, y: targetLead.y },
    ];
  }

  if (!sourceIsHorizontal && !targetIsHorizontal) {
    const midY = sourceLead.y + (targetLead.y - sourceLead.y) / 2;

    return [
      { x: sourceLead.x, y: midY },
      { x: targetLead.x, y: midY },
    ];
  }

  if (sourceIsHorizontal) {
    return [{ x: targetLead.x, y: sourceLead.y }];
  }

  return [{ x: sourceLead.x, y: targetLead.y }];
};

export const routeOrthogonalConnection = ({
  source,
  sourceHandle,
  target,
  targetHandle,
  targetPoint,
  waypoints = [],
}: RouteConnectionOptions) => {
  const sourcePoint = getHandlePoint(source, sourceHandle);
  const sourceLead = offsetPoint(sourcePoint, sourceHandle);
  const resolvedTargetPoint =
    target && targetHandle ? getHandlePoint(target, targetHandle) : targetPoint;

  if (!resolvedTargetPoint) {
    return [];
  }

  if (target && targetHandle) {
    const targetLead = offsetPoint(resolvedTargetPoint, targetHandle);

    if (waypoints.length) {
      return orthogonalizePointChain([
        sourcePoint,
        ...waypoints,
        resolvedTargetPoint,
      ]);
    }

    return simplifyOrthogonalPoints([
      sourcePoint,
      sourceLead,
      ...routeBetweenLeads(sourceLead, sourceHandle, targetLead, targetHandle),
      targetLead,
      resolvedTargetPoint,
    ]);
  }

  if (waypoints.length) {
    return orthogonalizePointChain([
      sourcePoint,
      ...waypoints,
      resolvedTargetPoint,
    ]);
  }

  return simplifyOrthogonalPoints([
    sourcePoint,
    sourceLead,
    ...routeBetweenLeads(sourceLead, sourceHandle, resolvedTargetPoint),
    resolvedTargetPoint,
  ]);
};

export const buildSvgPath = (points: CanvasPoint[]) => {
  const [firstPoint, ...restPoints] = points;

  if (!firstPoint) {
    return "";
  }

  return restPoints.reduce(
    (path, point) => `${path} L ${point.x} ${point.y}`,
    `M ${firstPoint.x} ${firstPoint.y}`,
  );
};
