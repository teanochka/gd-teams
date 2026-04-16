import { createMemoryHistory, createRouter } from 'vue-router'
import projects from './components/pages/projects.vue'
import workspace from './components/pages/workspace.vue'
const routes = [
    {path: '/', name: 'projects', component: projects, meta: { layout: 'projects' } },
    {path: '/projects/:id', name: 'workspace', component: workspace, meta: { layout: 'workspace' } },
    {path: '/folder/:id', name: 'folder', component: workspace, meta: { layout: 'workspace' } },
]