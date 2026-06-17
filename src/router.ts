import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore } from "./stores/auth";
import projectCreate from "./components/pages/project-create.vue";
import projectEdit from "./components/pages/project-edit.vue";
import projects from "./components/pages/projects.vue";
import workspace from "./components/pages/workspace.vue";
import document from "./components/pages/document.vue";
import kanban from "./components/pages/kanban.vue";
import canvas from "./components/pages/canvas.vue";
import chat from "./components/pages/chat.vue";
import login from "./components/pages/login.vue";
import register from "./components/pages/register.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/projects" },
  {
    path: "/auth/login",
    name: "login",
    component: login,
    meta: { public: true }
  },
  {
    path: "/auth/register",
    name: "register",
    component: register,
    meta: { public: true }
  },
  {
    path: "/projects/new",
    name: "project-create",
    component: projectCreate,
    meta: { layout: "projects" },
  },
  {
    path: "/projects/:projectId/edit",
    name: "project-edit",
    component: projectEdit,
    meta: { layout: "projects" },
  },
  {
    path: "/projects",
    name: "projects",
    component: projects,
    meta: { layout: "projects" },
  },
  {
    path: "/projects/:id",
    redirect: (to) => ({
      name: "project",
      params: { projectId: to.params.id },
    }),
  },
  { path: "/project/:projectId", name: "project", component: workspace },
  {
    path: "/project/:projectId/folder/:folderId",
    name: "project-folder",
    component: workspace,
  },
  {
    path: "/project/:projectId/document/:documentId",
    name: "project-document",
    component: document,
  },
  {
    path: "/project/:projectId/kanban",
    name: "project-kanban",
    component: kanban,
  },
  {
    path: "/project/:projectId/canvas/:canvasId",
    name: "project-canvas",
    component: canvas,
  },
  {
    path: "/project/:projectId/chat/:type?/:id?",
    name: "project-chat",
    component: chat,
  },
  {
    path: "/project/:projectId/template/:templateId",
    name: "project-template",
    component: workspace,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();
  
  if (!to.meta.public && !auth.isAuthenticated) {
    return next('/auth/login');
  }

  if (auth.isAuthenticated && !auth.user) {
    await auth.fetchCurrentUser();
  }

  next();
});

export default router;
