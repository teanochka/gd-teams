import { apiRequest } from "@/api/http";
import type {
  DocumentPage,
  LotionBlockDetails,
  LotionPage,
  LotionTableData,
  Node,
  NodeId,
  ProjectId,
} from "@/types/domain";

type RawNode = Omit<Node, "tags"> & {
  tagIds: string[];
  icon?: string | null;
};

const createBlockId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getCurrentDate = () => new Date().toISOString();

export const sanitizeLotionBlockValue = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/<input\b[^>]*>/gi, "")
    .replace(/<br\b[^>]*ProseMirror-trailingBreak[^>]*>/gi, "")
    .replace(/<br\b[^>]*class=["']?ProseMirror-trailingBreak["']?[^>]*>/gi, "")
    .replace(
      /(?:<br\s*)?class=["']?Prose(?:Mirror-trailingBreak)?(?:["']?&gt;|["']?>)?/gi,
      "",
    )
    .replace(/Mirror-trailingBreak(?:["']?&gt;|["']?>)?/gi, "")
    .replace(/ProseMirror-trailingBreak(?:["']?&gt;|["']?>)?/gi, "")
    .replace(/&gt;/gi, "");
};

const cloneTableData = (table: LotionTableData): LotionTableData => ({
  rows: table.rows.map((row) => [...row]),
  columnWidths: [...table.columnWidths],
  rowHeights: [...table.rowHeights],
});

export const cloneLotionBlockDetails = (
  details: LotionBlockDetails,
): LotionBlockDetails => ({
  ...details,
  value: sanitizeLotionBlockValue(details.value),
  table: details.table ? cloneTableData(details.table) : undefined,
});

export const createDefaultLotionPage = (title: string): LotionPage => ({
  name: title,
  blocks: [
    {
      id: createBlockId(),
      type: "TEXT",
      details: {
        value: "",
      },
    },
  ],
  card: {
    blockIds: [],
  },
});

const clonePage = (page: LotionPage): LotionPage => ({
  name: page.name.trim() || "Untitled",
  coverUrl: page.coverUrl,
  blocks: page.blocks.map((block) => ({
    ...block,
    details: cloneLotionBlockDetails(block.details),
  })),
  card: {
    blockIds:
      page.card?.blockIds.filter((blockId) =>
        page.blocks.some((block) => block.id === blockId),
      ) ?? [],
  },
});

export const createDocumentPage = async (
  node: Pick<Node, "id" | "projectId" | "title">,
) => {
  const savedAt = getCurrentDate();

  return apiRequest<DocumentPage>("/documentPages", {
    method: "POST",
    body: {
      nodeId: node.id,
      projectId: node.projectId,
      page: createDefaultLotionPage(node.title),
      createdAt: savedAt,
      updatedAt: savedAt,
    },
  });
};

export const copyDocumentPage = async (
  sourceNodeId: NodeId,
  targetNode: Pick<Node, "id" | "projectId" | "title">,
) => {
  const pages = await apiRequest<DocumentPage[]>("/documentPages", {
    query: { nodeId: sourceNodeId },
  });
  const savedAt = getCurrentDate();
  const sourcePage =
    pages[0]?.page ?? createDefaultLotionPage(targetNode.title);
  const page = clonePage(sourcePage);

  page.name = targetNode.title;

  return apiRequest<DocumentPage>("/documentPages", {
    method: "POST",
    body: {
      nodeId: targetNode.id,
      projectId: targetNode.projectId,
      page,
      createdAt: savedAt,
      updatedAt: savedAt,
    },
  });
};

export const getDocumentPage = async (
  documentId: NodeId,
  projectId: ProjectId,
): Promise<DocumentPage> => {
  const pages = await apiRequest<DocumentPage[]>("/documentPages", {
    query: { nodeId: documentId },
  });
  const existingPage = pages[0];

  if (existingPage) {
    return existingPage;
  }

  const node = await apiRequest<RawNode>(`/nodes/${documentId}`);

  if (node.type !== "document" || node.projectId !== projectId) {
    throw new Error("Document not found");
  }

  return createDocumentPage({
    id: node.id,
    projectId: node.projectId,
    title: node.title,
  });
};

export const saveDocumentPage = async (
  documentId: NodeId,
  page: LotionPage,
): Promise<DocumentPage> => {
  const savedAt = getCurrentDate();
  const nextPage = clonePage(page);
  const [pages, node] = await Promise.all([
    apiRequest<DocumentPage[]>("/documentPages", {
      query: { nodeId: documentId },
    }),
    apiRequest<RawNode>(`/nodes/${documentId}`),
  ]);
  const savedNode = await apiRequest<RawNode>(`/nodes/${documentId}`, {
    method: "PATCH",
    body: {
      title: nextPage.name.trim() || "Untitled",
      updatedAt: savedAt,
      updatedBy: "Вы",
    },
  });

  nextPage.name = savedNode.title;

  const documentPageId = pages[0]?.id;

  if (!documentPageId) {
    return apiRequest<DocumentPage>("/documentPages", {
      method: "POST",
      body: {
        nodeId: node.id,
        projectId: node.projectId,
        page: nextPage,
        createdAt: savedAt,
        updatedAt: savedAt,
      },
    });
  }

  return apiRequest<DocumentPage>(`/documentPages/${documentPageId}`, {
    method: "PATCH",
    body: {
      page: nextPage,
      updatedAt: savedAt,
    },
  });
};
