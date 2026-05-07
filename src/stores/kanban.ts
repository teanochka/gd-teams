import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getKanbanBoard as apiGetKanbanBoard,
  saveKanbanBoard as apiSaveKanbanBoard,
} from '@/api/kanban'
import type {
  KanbanBoard,
  KanbanColumn,
  KanbanMember,
  KanbanPriority,
  KanbanStatus,
  KanbanTask,
  ProjectId,
} from '@/types/domain'

const saveDelay = 450

const cloneBoard = (board: KanbanBoard): KanbanBoard => ({
  ...board,
  members: board.members.map((member) => ({ ...member })),
  roles: [...board.roles],
  taskTypes: [...board.taskTypes],
  priorities: [...board.priorities],
  statuses: [...board.statuses],
  tags: [...board.tags],
  columns: board.columns.map((column) => ({
    ...column,
    tasks: column.tasks.map((task) => ({
      ...task,
      labels: [...task.labels],
      subtasks: [...task.subtasks],
      linkedTasks: [...task.linkedTasks],
    })),
  })),
})

const createEntityId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const useKanbanStore = defineStore('kanban', () => {
  const boardsByProjectId = ref<Record<ProjectId, KanbanBoard>>({})
  const isLoadingByProjectId = ref<Record<ProjectId, boolean>>({})
  const isSavingByProjectId = ref<Record<ProjectId, boolean>>({})
  const isDirtyByProjectId = ref<Record<ProjectId, boolean>>({})
  const errorByProjectId = ref<Record<ProjectId, string | null>>({})

  const saveTimers = new Map<ProjectId, ReturnType<typeof setTimeout>>()

  const activeSaveCount = computed(() => {
    return Object.values(isSavingByProjectId.value).filter(Boolean).length
  })

  function cacheBoard(board: KanbanBoard) {
    boardsByProjectId.value[board.projectId] = cloneBoard(board)
    isDirtyByProjectId.value[board.projectId] = false
    errorByProjectId.value[board.projectId] = null
  }

  function syncStatuses(projectId: ProjectId) {
    const board = boardsByProjectId.value[projectId]

    if (!board) {
      return
    }

    board.columns.forEach((column) => {
      column.tasks.forEach((task) => {
        task.status = column.status as KanbanStatus
      })
    })
  }

  async function loadBoard(projectId: ProjectId, force = false) {
    if (boardsByProjectId.value[projectId] && !force) {
      return boardsByProjectId.value[projectId]
    }

    isLoadingByProjectId.value[projectId] = true
    errorByProjectId.value[projectId] = null

    try {
      const board = await apiGetKanbanBoard(projectId)
      cacheBoard(board)

      return boardsByProjectId.value[projectId]
    } catch {
      errorByProjectId.value[projectId] = 'Не удалось загрузить kanban-доску'
      return null
    } finally {
      isLoadingByProjectId.value[projectId] = false
    }
  }

  async function saveBoard(projectId: ProjectId) {
    const board = boardsByProjectId.value[projectId]

    if (!board) {
      return null
    }

    if (saveTimers.has(projectId)) {
      clearTimeout(saveTimers.get(projectId))
      saveTimers.delete(projectId)
    }

    isSavingByProjectId.value[projectId] = true
    errorByProjectId.value[projectId] = null

    try {
      const savedBoard = await apiSaveKanbanBoard(cloneBoard(board))
      cacheBoard(savedBoard)

      return savedBoard
    } catch {
      errorByProjectId.value[projectId] = 'Не удалось сохранить kanban-доску'
      return null
    } finally {
      isSavingByProjectId.value[projectId] = false
    }
  }

  function scheduleSave(projectId: ProjectId) {
    if (!boardsByProjectId.value[projectId]) {
      return
    }

    syncStatuses(projectId)
    isDirtyByProjectId.value[projectId] = true

    if (saveTimers.has(projectId)) {
      clearTimeout(saveTimers.get(projectId))
    }

    saveTimers.set(
      projectId,
      setTimeout(() => {
        saveTimers.delete(projectId)
        void saveBoard(projectId)
      }, saveDelay),
    )
  }

  function addColumn(projectId: ProjectId, title: string) {
    const board = boardsByProjectId.value[projectId]
    const normalizedTitle = title.trim()

    if (!board || !normalizedTitle) {
      return
    }

    board.columns.push({
      id: createEntityId('column'),
      title: normalizedTitle,
      status: normalizedTitle.toLowerCase().replace(/\s+/g, '-'),
      tasks: [],
    })
    scheduleSave(projectId)
  }

  function createTask(projectId: ProjectId, columnId: string) {
    const board = boardsByProjectId.value[projectId]
    const column = board?.columns.find((item) => item.id === columnId)
    const defaultMember: KanbanMember | undefined = board?.members[0]

    if (!board || !column || !defaultMember) {
      return
    }

    const taskCount = board.columns.reduce((count, item) => count + item.tasks.length, 0)
    const task: KanbanTask = {
      id: createEntityId('task'),
      key: `KAN-${taskCount + 6}`,
      title: 'Новая задача',
      description: 'Добавьте описание задачи.',
      assigneeId: defaultMember.id,
      authorId: defaultMember.id,
      priority: 'Medium',
      parentId: null,
      dueDate: null,
      startDate: null,
      labels: [],
      role: null,
      type: 'Task',
      status: column.status as KanbanStatus,
      subtasks: [],
      linkedTasks: [],
    }

    column.tasks.unshift(task)
    scheduleSave(projectId)
  }

  function renameTask(projectId: ProjectId, taskId: string, title: string) {
    const task = getTask(projectId, taskId)
    const normalizedTitle = title.trim()

    if (!task || !normalizedTitle) {
      return
    }

    task.title = normalizedTitle
    scheduleSave(projectId)
  }

  function deleteTask(projectId: ProjectId, taskId: string) {
    const board = boardsByProjectId.value[projectId]

    if (!board) {
      return
    }

    board.columns.forEach((column) => {
      column.tasks = column.tasks.filter((task) => task.id !== taskId)
    })
    scheduleSave(projectId)
  }

  function setTaskCover(projectId: ProjectId, taskId: string, color: string) {
    const task = getTask(projectId, taskId)

    if (!task) {
      return
    }

    task.coverColor = color
    scheduleSave(projectId)
  }

  function updateTaskField<Key extends keyof KanbanTask>(
    projectId: ProjectId,
    taskId: string,
    field: Key,
    value: KanbanTask[Key],
  ) {
    const task = getTask(projectId, taskId)

    if (!task) {
      return
    }

    task[field] = value
    scheduleSave(projectId)
  }

  function replaceColumns(projectId: ProjectId, columns: KanbanColumn[]) {
    const board = boardsByProjectId.value[projectId]

    if (!board) {
      return
    }

    board.columns = columns
    scheduleSave(projectId)
  }

  function getTask(projectId: ProjectId, taskId: string) {
    const board = boardsByProjectId.value[projectId]

    return board?.columns.flatMap((column) => column.tasks).find((task) => task.id === taskId) ?? null
  }

  async function flushBoard(projectId: ProjectId) {
    if (saveTimers.has(projectId)) {
      clearTimeout(saveTimers.get(projectId))
      saveTimers.delete(projectId)
    }

    if (!isDirtyByProjectId.value[projectId]) {
      return boardsByProjectId.value[projectId] ?? null
    }

    return saveBoard(projectId)
  }

  return {
    boardsByProjectId,
    isLoadingByProjectId,
    isSavingByProjectId,
    isDirtyByProjectId,
    errorByProjectId,
    activeSaveCount,
    loadBoard,
    saveBoard,
    scheduleSave,
    syncStatuses,
    addColumn,
    createTask,
    renameTask,
    deleteTask,
    setTaskCover,
    updateTaskField,
    replaceColumns,
    getTask,
    flushBoard,
  }
})
