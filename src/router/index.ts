import { createRouter, createWebHistory } from 'vue-router'

import FileManagerPage from '@/pages/FileManagerPage.vue'
import NodeDetailsPage from '@/pages/NodeDetailsPage.vue'
import ProjectsPage from '@/pages/ProjectsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/projects' },
    { path: '/projects', name: 'projects', component: ProjectsPage, meta: { layout: 'projects' } },
    {
      path: '/project/:projectId',
      name: 'project-root',
      component: FileManagerPage,
      meta: { layout: 'workspace' },
    },
    {
      path: '/project/:projectId/folder/:folderId',
      name: 'folder',
      component: FileManagerPage,
      meta: { layout: 'workspace' },
    },
    {
      path: '/project/:projectId/:nodeType(document|canvas)/:nodeId',
      name: 'node-details',
      component: NodeDetailsPage,
      meta: { layout: 'workspace' },
    },
  ],
})

export default router
