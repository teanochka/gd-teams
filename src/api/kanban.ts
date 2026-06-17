import { apiRequest } from "@/api/http";
import type { KanbanBoard, ProjectId } from "@/types/domain";

const getCurrentDate = () => new Date().toISOString();

const createBoardId = (projectId: ProjectId) => `kanban-${projectId}`;

const createDefaultBoard = (projectId: ProjectId): Omit<KanbanBoard, "id"> => {
  const savedAt = getCurrentDate();

  return {
    projectId,
    members: [
      {
        id: "user-1",
        name: "Мятный уголок",
        role: "Game Designer",
        color: "#0f8f72",
      },
      {
        id: "user-2",
        name: "Светлая башня",
        role: "Developer",
        color: "#4263eb",
      },
      { id: "user-3", name: "Тихий контур", role: "QA", color: "#9b5de5" },
      {
        id: "user-4",
        name: "Новый игрок",
        role: "Narrative",
        color: "#c47f17",
      },
    ],
    roles: ["Game Designer", "Developer", "QA", "Narrative"],
    taskTypes: ["Task", "Bug", "Story", "Epic"],
    priorities: ["Low", "Medium", "High", "Critical"],
    statuses: ["to-do", "in-progress", "in-review", "done"],
    tags: ["combat", "economy", "ux", "level", "balance"],
    columns: [
      { id: "column-1", title: "To do", status: "to-do", tasks: [] },
      {
        id: "column-2",
        title: "In progress",
        status: "in-progress",
        tasks: [],
      },
      { id: "column-3", title: "In review", status: "in-review", tasks: [] },
      { id: "column-4", title: "Done", status: "done", tasks: [] },
    ],
    createdAt: savedAt,
    updatedAt: savedAt,
  };
};

export const getKanbanBoard = async (
  projectId: ProjectId,
): Promise<KanbanBoard> => {
  const boards = await apiRequest<KanbanBoard[]>("/kanbanBoards", {
    query: { projectId },
  });
  const existingBoard = boards[0];

  if (existingBoard) {
    return existingBoard;
  }

  return apiRequest<KanbanBoard>("/kanbanBoards", {
    method: "POST",
    body: {
      id: createBoardId(projectId),
      ...createDefaultBoard(projectId),
    },
  });
};

export const saveKanbanBoard = async (
  board: KanbanBoard,
): Promise<KanbanBoard> => {
  return apiRequest<KanbanBoard>(`/kanbanBoards/${board.id}`, {
    method: "PATCH",
    body: {
      members: board.members,
      roles: board.roles,
      taskTypes: board.taskTypes,
      priorities: board.priorities,
      statuses: board.statuses,
      tags: board.tags,
      columns: board.columns,
      updatedAt: getCurrentDate(),
    },
  });
};
