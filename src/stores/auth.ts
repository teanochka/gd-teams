import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apiRequest } from "@/api/http";
import { useProjectsStore } from "./projects";
import { useWorkspaceStore } from "./workspace";

type AuthUser = {
  id: string;
  username: string;
  display_name?: string | null;
  displayName?: string | null;
  name?: string | null;
  user?: unknown;
};

type LoginResponse = {
  access: string;
  refresh: string;
};

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  secretWord?: string;
};

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token") || "");
  const refreshToken = ref(localStorage.getItem("refreshToken") || "");
  const user = ref<AuthUser | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(username: string, password: string) {
    const data = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { username, password },
    });
    token.value = data.access;
    refreshToken.value = data.refresh;
    localStorage.setItem("token", data.access);
    localStorage.setItem("refreshToken", data.refresh);
    await fetchCurrentUser();
  }

  async function register(payload: RegisterPayload) {
    await apiRequest("/auth/register", {
      method: "POST",
      body: payload,
    });
  }

  async function fetchCurrentUser() {
    try {
      const userData = await apiRequest<AuthUser>("/auth/me");
      user.value = userData;
      return userData;
    } catch (e) {
      logout();
    }
  }

  function logout() {
    token.value = "";
    refreshToken.value = "";
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

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
    refreshToken,
    user,
    isAuthenticated,
    login,
    register,
    fetchCurrentUser,
    logout,
  };
});
