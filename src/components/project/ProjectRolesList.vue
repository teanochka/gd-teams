<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import IconAdd from "~icons/carbon/add";
import IconTrash from "~icons/carbon/trash-can";
import IconCheckmark from "~icons/carbon/checkmark";
import { useProjectsStore } from "@/stores/projects";
import type { ProjectRole } from "@/types/domain";

const props = defineProps<{
  projectId: string;
}>();

const projectsStore = useProjectsStore();
const { currentProjectRoles } = storeToRefs(projectsStore);

const isLoading = ref(false);
const error = ref<string | null>(null);
const isCreating = ref(false);
const newRole = ref({
  name: "",
  color: "#666666",
});

const loadData = async () => {
  if (!props.projectId) return;
  isLoading.value = true;
  error.value = null;
  try {
    await projectsStore.loadProjectRoles(props.projectId);
  } catch (e) {
    error.value = "Не удалось загрузить роли";
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadData);

watch(() => props.projectId, loadData);

const startCreating = () => {
  isCreating.value = true;
};

const cancelCreating = () => {
  isCreating.value = false;
  newRole.value = {
    name: "",
    color: "#666666",
  };
};

const createRole = async () => {
  if (!newRole.value.name) return;
  isLoading.value = true;
  try {
    const res = await projectsStore.createRole(props.projectId, newRole.value);
    if (res) {
      selectedRoleId.value = res.id;
      cancelCreating();
    } else {
      error.value = projectsStore.error || "Не удалось создать роль";
    }
  } catch (e) {
    error.value = "Ошибка при создании роли";
  } finally {
    isLoading.value = false;
  }
};

const deleteRole = async (roleId: string) => {
  if (confirm("Удалить роль? Она будет снята со всех участников.")) {
    isLoading.value = true;
    try {
      await projectsStore.deleteRole(props.projectId, roleId);
    } catch (e) {
      error.value = "Не удалось удалить роль";
    } finally {
      isLoading.value = false;
    }
  }
};

const updateRoleColor = async (role: ProjectRole, color: string) => {
  await projectsStore.updateRole(props.projectId, role.id, { color });
};

const getRoleColor = (role: ProjectRole) => {
  if (typeof role.color === "string") return role.color;
  return role.color?.hex || "#666";
};

const colors = [
  "#666666",
  "#E02020",
  "#FA6400",
  "#F7B500",
  "#6DD400",
  "#0091FF",
  "#44D7B6",
  "#32C5FF",
  "#6236FF",
  "#B620E0",
];

const selectedRoleId = ref<string | null>(null);
const selectedRole = computed(
  () =>
    currentProjectRoles.value.find((r) => r.id === selectedRoleId.value) ||
    null,
);

watch(
  currentProjectRoles,
  (roles) => {
    if (roles.length > 0) {
      if (
        !selectedRoleId.value ||
        !roles.some((r) => r.id === selectedRoleId.value)
      ) {
        selectedRoleId.value = roles[0].id;
      }
    } else {
      selectedRoleId.value = null;
    }
  },
  { immediate: true },
);

const selectRole = (id: string) => {
  selectedRoleId.value = id;
};

const createDefaultRoles = async () => {
  const defaults = [
    {
      name: "Администратор",
      color: "#E02020",
      permissions: {
        can_edit: true,
        can_create: true,
        can_delete: true,
        can_manage_members: true,
        can_manage_roles: true,
      },
    },
    {
      name: "Модератор",
      color: "#FA6400",
      permissions: {
        can_edit: true,
        can_create: true,
        can_delete: false,
        can_manage_members: true,
        can_manage_roles: false,
      },
    },
    {
      name: "Пользователь",
      color: "#0091FF",
      permissions: {
        can_edit: true,
        can_create: true,
        can_delete: false,
        can_manage_members: false,
        can_manage_roles: false,
      },
    },
  ];

  for (const role of defaults) {
    await projectsStore.createRole(props.projectId, role);
  }
};
</script>

<template>
  <div class="roles-manager-container">
    <BAlert
      v-if="error"
      variant="danger"
      show
      dismissible
      @dismissed="error = null"
    >
      {{ error }}
    </BAlert>

    <div
      v-if="isLoading && !currentProjectRoles.length"
      class="text-center p-5 border rounded-3 bg-white"
    >
      <BSpinner label="Загрузка ролей..." />
    </div>

    <div v-else class="roles-manager">
      <aside class="roles-sidebar">
        <div class="sidebar-header">
          <div class="d-flex align-items-center gap-2">
            <h5 class="m-0">Роли</h5>
            <BSpinner v-if="isLoading" size="sm" variant="secondary" />
          </div>
          <BButton
            variant="link"
            class="p-0"
            title="Добавить роль"
            @click="startCreating"
          >
            <IconAdd />
          </BButton>
        </div>

        <div class="roles-nav">
          <div
            v-for="role in currentProjectRoles"
            :key="role.id"
            class="role-nav-item"
            :class="{ active: selectedRoleId === role.id }"
            @click="selectRole(role.id)"
          >
            <span
              class="role-dot"
              :style="{ backgroundColor: getRoleColor(role) }"
            ></span>
            <span class="role-name">{{ role.name }}</span>
          </div>
        </div>
      </aside>

      <main class="role-details">
        <div v-if="isCreating" class="role-editor-overlay">
          <div class="role-editor-card">
            <h4>Новая роль</h4>
            <div class="form-group mb-3">
              <label>Название</label>
              <BFormInput
                v-model="newRole.name"
                placeholder="Например, Модератор"
              />
            </div>
            <div class="form-group mb-4">
              <label>Цвет</label>
              <div class="color-picker">
                <div
                  v-for="c in colors"
                  :key="c"
                  class="color-option"
                  :style="{ backgroundColor: c }"
                  :class="{ active: newRole.color === c }"
                  @click="newRole.color = c"
                ></div>
              </div>
            </div>
            <div class="form-actions">
              <BButton variant="light" @click="cancelCreating">Отмена</BButton>
              <BButton
                variant="dark"
                :disabled="!newRole.name"
                @click="createRole"
                >Создать роль</BButton
              >
            </div>
          </div>
        </div>

        <template v-else-if="selectedRole">
          <header class="role-details-header">
            <div class="role-title-row">
              <span
                class="role-dot-lg"
                :style="{ backgroundColor: getRoleColor(selectedRole) }"
              ></span>
              <h2>{{ selectedRole.name }}</h2>
            </div>
            <BButton
              variant="outline-danger"
              size="sm"
              @click="deleteRole(selectedRole.id)"
            >
              Удалить роль
            </BButton>
          </header>

          <div class="role-info-section mb-4">
            <p class="text-muted">
              Это пользовательская роль (тег), которая помогает классифицировать
              участников команды по их специализации.
            </p>
          </div>

          <section class="role-settings-section">
            <h3>Оформление тега</h3>
            <p class="text-muted small">
              Выберите цвет, который будет отображаться рядом с именем
              участника.
            </p>
            <div class="color-picker mt-3">
              <div
                v-for="c in colors"
                :key="c"
                class="color-option"
                :style="{ backgroundColor: c }"
                :class="{ active: getRoleColor(selectedRole) === c }"
                @click="updateRoleColor(selectedRole!, c)"
              ></div>
            </div>
          </section>
        </template>

        <div v-else class="empty-state">
          <p>Выберите роль (тег) для настройки или создайте новую.</p>
          <div class="d-flex gap-2">
            <BButton variant="dark" @click="startCreating"
              >Добавить роль</BButton
            >
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.roles-manager {
  display: flex;
  height: 500px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.roles-sidebar {
  width: 220px;
  background: #f8f9fa;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.sidebar-header h5 {
  margin: 0;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  color: #666;
}

.roles-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.role-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-nav-item:hover {
  background: #eee;
}

.role-nav-item.active {
  background: #fff;
  font-weight: 700;
  box-shadow: inset 4px 0 0 #1a1a1a;
}

.role-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.role-dot-lg {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.role-details {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  position: relative;
}

.role-details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.role-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-title-row h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
}

.permissions-section h3,
.role-settings-section h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.permissions-list-editor {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #e5e5e5;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  margin-top: 16px;
  overflow: hidden;
}

.permission-edit-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fff;
}

.perm-label {
  font-weight: 600;
  font-size: 14px;
}

.perm-key {
  font-size: 11px;
  color: #999;
  font-family: monospace;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.color-option {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #000;
  transform: scale(1.1);
}

.role-editor-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.role-editor-card {
  width: 100%;
  max-width: 400px;
  padding: 32px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.role-editor-card h4 {
  margin-bottom: 24px;
  font-weight: 800;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  gap: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
