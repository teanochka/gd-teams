import { apiRequest } from '@/api/http'
import type { ProjectId, Tag } from '@/types/domain'

export type CreateTagPayload = {
  projectId: ProjectId
  name: string
  color: string
}

export type UpdateTagPayload = {
  name?: string
  color?: string
}

export const getTags = async (projectId: ProjectId): Promise<Tag[]> => {
  return apiRequest<Tag[]>('/tags', { query: { projectId } })
}

export const createTag = async (payload: CreateTagPayload): Promise<Tag> => {
  return apiRequest<Tag>('/tags', {
    method: 'POST',
    body: {
      id: `tag-${Date.now()}`,
      projectId: payload.projectId,
      name: payload.name.trim(),
      color: payload.color,
    },
  })
}

export const updateTag = async (tagId: string, payload: UpdateTagPayload): Promise<Tag> => {
  return apiRequest<Tag>(`/tags/${tagId}`, {
    method: 'PATCH',
    body: payload,
  })
}

export const deleteTag = async (tagId: string): Promise<void> => {
  await apiRequest(`/tags/${tagId}`, { method: 'DELETE' })
}
