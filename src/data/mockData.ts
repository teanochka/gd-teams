import type { FileNode, Project, Tag } from '@/types/models'

export const projects: Project[] = [
  { id: 'test', name: 'Nebula Ops', banner: 'Linear gradient', updatedAt: '14.04.2026' },
  { id: 'alpha', name: 'Alpha Prototype', banner: 'Landing redesign', updatedAt: '09.04.2026' },
]

export const tags: Tag[] = [
  { id: 'art', name: 'art', color: '#F97316' },
  { id: 'villian', name: 'villian', color: '#EF4444' },
  { id: 'archive', name: 'archive', color: '#6B7280' },
  { id: 'ux', name: 'ux', color: '#8B5CF6' },
  { id: 'team-1', name: 'team-1', color: '#0EA5E9' },
  { id: 'release', name: 'release', color: '#22C55E' },
  { id: 'engine', name: 'engine', color: '#EAB308' },
]

export const members = ['Alex Harper', 'Dana Moon', 'Iris Quinn', 'Maks Sol']

export const nodes: FileNode[] = [
  {
    id: 'fld-root-design',
    parentId: null,
    projectId: 'test',
    title: 'Design',
    type: 'folder',
    icon: 'bi-folder-fill',
    tags: ['ux'],
    createdAt: '02.03.2026',
    createdBy: 'Alex Harper',
    updatedAt: '13.04.2026',
    updatedBy: 'Dana Moon',
    isFavorite: true,
  },
  {
    id: 'fld-root-assets',
    parentId: null,
    projectId: 'test',
    title: 'Assets',
    type: 'folder',
    icon: 'bi-folder-fill',
    tags: ['archive'],
    createdAt: '03.03.2026',
    createdBy: 'Dana Moon',
    updatedAt: '11.04.2026',
    updatedBy: 'Dana Moon',
    isFavorite: false,
  },
  {
    id: 'doc-root-roadmap',
    parentId: null,
    projectId: 'test',
    title: 'Roadmap Q3',
    type: 'document',
    icon: 'bi-file-earmark-text-fill',
    tags: ['release'],
    createdAt: '20.03.2026',
    createdBy: 'Iris Quinn',
    updatedAt: '15.04.2026',
    updatedBy: 'Maks Sol',
    isFavorite: true,
  },
  {
    id: 'can-root-wireframe',
    parentId: null,
    projectId: 'test',
    title: 'Wireframe System',
    type: 'canvas',
    icon: 'bi-grid-3x3-gap-fill',
    tags: ['ux', 'team-1'],
    createdAt: '01.04.2026',
    createdBy: 'Alex Harper',
    updatedAt: '10.04.2026',
    updatedBy: 'Alex Harper',
    isFavorite: false,
  },
]
