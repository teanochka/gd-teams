export type CanvasElementId = string | number;

export type CanvasHandlePosition = "top" | "right" | "bottom" | "left";

export type CanvasPoint = {
  x: number;
  y: number;
};

export type CanvasElement = {
  id: CanvasElementId;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;

  /** Basic cards, text blocks, labels, and similar editable content. */
  content?: string;
  title?: string;
  documentId?: string;
  projectId?: string;

  /** Image-like elements. */
  src?: string;
  /** Editable structured fields for UML and other composite elements. */
  fields?: Array<{ id: string; value: string }>;

  /** Presentation styles shared by canvas elements. */
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number | string;
  textAlign?: "left" | "center" | "right";
  fontSize?: number;
  textColor?: string;
  fontWeight?: number;
  opacity?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  style?: Record<string, string | number>;
};

export type CanvasConnection = {
  id: CanvasElementId;
  sourceId: CanvasElementId;
  targetId?: CanvasElementId | null;
  sourceHandle: CanvasHandlePosition;
  targetHandle?: CanvasHandlePosition | null;
  targetPoint?: CanvasPoint;
  type: "straight" | "orthogonal" | "curved";
  markerEnd?: "arrow" | "none";
  style?: Record<string, string>;
  data?: {
    waypoints?: CanvasPoint[];
  };
};

export type CanvasData = {
  elements: CanvasElement[];
  connections: CanvasConnection[];
};

export type CreateCanvasElementDefaults = {
  width?: number;
  height?: number;
  content?: string;
  defaultProps?: Record<string, unknown>;
};

export function createCanvasElement(
  type: string,
  overrides: Partial<CanvasElement> = {},
  defaults?: CreateCanvasElementDefaults,
): CanvasElement {
  const width = defaults?.width ?? 140;
  const height = defaults?.height ?? 100;

  return {
    id: overrides.id ?? crypto.randomUUID(),
    type,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    width: overrides.width ?? width,
    height: overrides.height ?? height,
    content: defaults?.content,
    ...defaults?.defaultProps,
    ...overrides,
  };
}
