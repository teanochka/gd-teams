import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apiRequest } from "@/api/http";
import { useProjectsStore } from "./projects";
import { useWorkspaceStore } from "./workspace";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token") || "");
  const user = ref(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(username, password) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: { username, password },
    });
    token.value = data.access;
    localStorage.setItem("token", data.access);
    await fetchCurrentUser();
  }

  async function register(payload) {
    await apiRequest("/auth/register", {
      method: "POST",
      body: payload,
    });
  }

  async function fetchCurrentUser() {
    try {
      const userData = await apiRequest("/auth/me");
      user.value = userData;
      return userData;
    } catch (e) {
      logout();
    }
  }

  function logout() {
    token.value = "";
    user.value = null;
    localStorage.removeItem("token");

    // Очищаем другие хранилища
    const projectsStore = useProjectsStore();
    projectsStore.projects = [];
    projectsStore.teams = [];

    const workspaceStore = useWorkspaceStore();
    workspaceStore.projectId = null;
    workspaceStore.currentProject = null;
    workspaceStore.nodesById = {};
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    fetchCurrentUser,
    logout,
  };
});
