import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import projects from './components/pages/projects.vue'
import workspace from './components/pages/workspace.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/projects' },
  { path: '/projects', name: 'projects', component: projects, meta: { layout: 'projects' } },
  { path: '/projects/:id', name: 'workspace', component: workspace },
  { path: '/folder/:id', name: 'folder', component: workspace },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
