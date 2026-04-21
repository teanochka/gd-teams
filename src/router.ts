import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import projectCreate from './components/pages/project-create.vue'
import projectEdit from './components/pages/project-edit.vue'
import projects from './components/pages/projects.vue'
import workspace from './components/pages/workspace.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/projects' },
  {
    path: '/projects/new',
    name: 'project-create',
    component: projectCreate,
    meta: { layout: 'projects' },
  },
  {
    path: '/projects/:projectId/edit',
    name: 'project-edit',
    component: projectEdit,
    meta: { layout: 'projects' },
  },
  { path: '/projects', name: 'projects', component: projects, meta: { layout: 'projects' } },
  {
    path: '/projects/:id',
    redirect: (to) => ({ name: 'project', params: { projectId: to.params.id } }),
  },
  { path: '/project/:projectId', name: 'project', component: workspace },
  { path: '/project/:projectId/folder/:folderId', name: 'project-folder', component: workspace },
  {
    path: '/project/:projectId/document/:documentId',
    name: 'project-document',
    component: workspace,
  },
  { path: '/project/:projectId/canvas/:canvasId', name: 'project-canvas', component: workspace },
  {
    path: '/project/:projectId/template/:templateId',
    name: 'project-template',
    component: workspace,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
