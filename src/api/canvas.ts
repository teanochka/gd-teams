import { apiRequest } from "@/api/http";
import type {
  CanvasConnection,
  CanvasData,
  CanvasElement,
} from "@/types/canvas";
import type { CanvasPage, Node, NodeId, ProjectId } from "@/types/domain";

type RawCanvasNode = {
  id: NodeId;
  projectId: ProjectId;
  type: string;
  createdAt?: string;
  updatedAt?: string;
};

type LegacyCanvasDocumentCard = {
  id?: unknown;
  type?: unknown;
  documentId?: unknown;
  projectId?: unknown;
  title?: unknown;
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;
};

type LegacyCanvasData = Partial<CanvasData> & {
  cards?: unknown;
  documentCards?: unknown;
  objects?: unknown;
};

type RawCanvasPage = Partial<Omit<CanvasPage, "data">> & {
  data?: LegacyCanvasData | null;
  elements?: unknown;
};

const getCurrentDate = () => new Date().toISOString();

export const createDefaultCanvasData = (): CanvasData => ({
  elements: [],
  connections: [],
});

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object";
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const cloneSerializable = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value)) as T;
};

const normalizeCanvasElement = (value: unknown): CanvasElement | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !("id" in value) ||
    typeof value.type !== "string" ||
    !isFiniteNumber(value.x) ||
    !isFiniteNumber(value.y) ||
    !isFiniteNumber(value.width) ||
    !isFiniteNumber(value.height)
  ) {
    return null;
  }

  return cloneSerializable(value) as CanvasElement;
};

const normalizeCanvasConnection = (value: unknown): CanvasConnection | null => {
  if (!isRecord(value)) {
    return null;
  }

  const targetPoint =
    isRecord(value.targetPoint) &&
    isFiniteNumber(value.targetPoint.x) &&
    isFiniteNumber(value.targetPoint.y)
      ? { x: value.targetPoint.x, y: value.targetPoint.y }
      : undefined;
  const hasElementTarget =
    (typeof value.targetId === "string" ||
      typeof value.targetId === "number") &&
    ["top", "right", "bottom", "left"].includes(String(value.targetHandle));

  if (
    !("id" in value) ||
    !("sourceId" in value) ||
    !["top", "right", "bottom", "left"].includes(String(value.sourceHandle)) ||
    (!hasElementTarget && !targetPoint)
  ) {
    return null;
  }

  return {
    id: value.id as CanvasConnection["id"],
    sourceId: value.sourceId as CanvasConnection["sourceId"],
    targetId: hasElementTarget
      ? (value.targetId as CanvasConnection["targetId"])
      : null,
    sourceHandle: value.sourceHandle as CanvasConnection["sourceHandle"],
    targetHandle: hasElementTarget
      ? (value.targetHandle as CanvasConnection["targetHandle"])
      : null,
    targetPoint,
    type: ["straight", "orthogonal", "curved"].includes(String(value.type))
      ? (value.type as CanvasConnection["type"])
      : "orthogonal",
    markerEnd: value.markerEnd === "none" ? "none" : "arrow",
    style: isRecord(value.style)
      ? (value.style as Record<string, string>)
      : undefined,
    data: isRecord(value.data) ? cloneSerializable(value.data) : undefined,
  };
};

const normalizeLegacyDocumentCard = (
  value: LegacyCanvasDocumentCard,
): CanvasElement | null => {
  if (
    value.type !== "document-card" ||
    typeof value.documentId !== "string" ||
    typeof value.projectId !== "string" ||
    !isFiniteNumber(value.x) ||
    !isFiniteNumber(value.y) ||
    !isFiniteNumber(value.width) ||
    !isFiniteNumber(value.height)
  ) {
    return null;
  }

  return {
    id:
      typeof value.id === "string" || typeof value.id === "number"
        ? value.id
        : crypto.randomUUID(),
    type: "document-card",
    documentId: value.documentId,
    projectId: value.projectId,
    title: typeof value.title === "string" ? value.title : "Document",
    x: value.x,
    y: value.y,
    width: value.width,
    height: value.height,
  };
};

const normalizeElements = (data: LegacyCanvasData) => {
  if (Array.isArray(data.elements)) {
    return data.elements
      .map(normalizeCanvasElement)
      .filter((element): element is CanvasElement => element !== null);
  }

  if (Array.isArray(data.cards)) {
    return data.cards
      .map(normalizeCanvasElement)
      .filter((element): element is CanvasElement => element !== null);
  }

  if (Array.isArray(data.documentCards)) {
    return data.documentCards
      .map((card) =>
        normalizeLegacyDocumentCard(card as LegacyCanvasDocumentCard),
      )
      .filter((element): element is CanvasElement => element !== null);
  }

  if (Array.isArray(data.objects)) {
    return data.objects
      .map(normalizeCanvasElement)
      .filter((element): element is CanvasElement => element !== null);
  }

  return [];
};

const normalizeConnections = (data: LegacyCanvasData) => {
  if (!Array.isArray(data.connections)) {
    return [];
  }

  return data.connections
    .map(normalizeCanvasConnection)
    .filter(
      (connection): connection is CanvasConnection => connection !== null,
    );
};

export const cloneCanvasData = (data?: LegacyCanvasData | null): CanvasData => {
  if (!data) {
    return createDefaultCanvasData();
  }

  return {
    elements: normalizeElements(data),
    connections: normalizeConnections(data),
  };
};

const getRawCanvasData = (record: RawCanvasPage): LegacyCanvasData | null => {
  if (record.data) {
    return record.data;
  }

  if (Array.isArray(record.elements)) {
    return { elements: record.elements };
  }

  if (isRecord(record.elements)) {
    return record.elements as LegacyCanvasData;
  }

  return null;
};

const getCanvasPages = (canvasId: NodeId) => {
  return apiRequest<RawCanvasPage[]>("/canvasPages", {
    query: { nodeId: canvasId },
  });
};

const createCanvasPageRecord = (
  canvasId: NodeId,
  projectId: ProjectId,
  data: CanvasData,
  savedAt = getCurrentDate(),
) => {
  return apiRequest<RawCanvasPage>("/canvasPages", {
    method: "POST",
    body: {
      id: `${canvasId}-canvas-page`,
      nodeId: canvasId,
      projectId,
      data: cloneCanvasData(data),
      createdAt: savedAt,
      updatedAt: savedAt,
    },
  });
};

const normalizeCanvasPage = (
  record: RawCanvasPage,
  canvasId: NodeId,
  projectId: ProjectId,
): CanvasPage => {
  const savedAt = getCurrentDate();

  return {
    id: record.id ?? canvasId,
    nodeId: record.nodeId ?? canvasId,
    projectId: record.projectId ?? projectId,
    data: cloneCanvasData(getRawCanvasData(record)),
    createdAt: record.createdAt ?? savedAt,
    updatedAt: record.updatedAt ?? savedAt,
  };
};

export const getCanvasPage = async (
  canvasId: NodeId,
  projectId: ProjectId,
): Promise<CanvasPage> => {
  const pages = await getCanvasPages(canvasId);
  const existingPage = pages[0];

  if (existingPage) {
    return normalizeCanvasPage(existingPage, canvasId, projectId);
  }

  const node = await apiRequest<RawCanvasNode>(`/nodes/${canvasId}`);

  if (node.type !== "canvas" || node.projectId !== projectId) {
    throw new Error("Canvas not found");
  }

  const record = await createCanvasPageRecord(
    canvasId,
    projectId,
    createDefaultCanvasData(),
  );

  return normalizeCanvasPage(record, canvasId, projectId);
};

export const copyCanvasPage = async (
  sourceNodeId: NodeId,
  targetNode: Pick<Node, "id" | "projectId">,
) => {
  const [sourcePages, targetPages] = await Promise.all([
    getCanvasPages(sourceNodeId),
    getCanvasPages(targetNode.id),
  ]);
  const sourcePage = sourcePages[0];
  const targetPageId = targetPages[0]?.id;
  const savedAt = getCurrentDate();
  const data = cloneCanvasData(getRawCanvasData(sourcePage ?? {}));

  if (targetPageId) {
    return apiRequest<RawCanvasPage>(`/canvasPages/${targetPageId}`, {
      method: "PATCH",
      body: {
        data,
        updatedAt: savedAt,
      },
    });
  }

  return createCanvasPageRecord(
    targetNode.id,
    targetNode.projectId,
    data,
    savedAt,
  );
};

export const saveCanvasPage = async (
  canvasId: NodeId,
  projectId: ProjectId,
  data: CanvasData,
): Promise<CanvasPage> => {
  const savedAt = getCurrentDate();
  const nextData = cloneCanvasData(data);
  const pages = await getCanvasPages(canvasId);
  const canvasPageId = pages.find((page) => page.id)?.id;
  const record = canvasPageId
    ? await apiRequest<RawCanvasPage>(`/canvasPages/${canvasPageId}`, {
        method: "PATCH",
        body: {
          data: nextData,
          updatedAt: savedAt,
          updatedBy: "user",
        },
      })
    : await createCanvasPageRecord(canvasId, projectId, nextData, savedAt);

  return normalizeCanvasPage(record, canvasId, projectId);
};
