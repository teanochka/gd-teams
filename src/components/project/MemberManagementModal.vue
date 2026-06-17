<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import IconSettings from "~icons/carbon/settings";
import IconUserRole from "~icons/carbon/user-role";
import { useProjectsStore } from "@/stores/projects";
import type { ProjectMember, ProjectRole, AccessLevel } from "@/types/domain";

const props = defineProps<{
  modelValue: boolean;
  member: ProjectMember | null;
  projectId: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  updated: [];
}>();

const projectsStore = useProjectsStore();
const { currentProjectRoles } = storeToRefs(projectsStore);

const isLoading = ref(false);
const error = ref<string | null>(null);
const activeTab = ref<"rights" | "roles">("rights");
const selectedRoleIds = ref<string[]>([]);
const selectedAccessLevel = ref<AccessLevel>("user");

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

watch(
  () => props.member,
  (newMember) => {
    if (newMember) {
      selectedRoleIds.value = newMember.roles.map((r) => r.id);
      selectedAccessLevel.value = newMember.accessLevel || "user";
      activeTab.value = "rights";
      error.value = null;
    }
  },
  { immediate: true },
);

const saveChanges = async () => {
  if (!props.member || isLoading.value) return;
  isLoading.value = true;
  error.value = null;
  try {
    await projectsStore.updateMember(props.projectId, props.member.id, {
      roleIds: selectedRoleIds.value,
      accessLevel: selectedAccessLevel.value,
    });
    emit("updated");
  } catch (e) {
    error.value = "Не удалось сохранить изменения";
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

// Автосохранение при изменении ролей или уровня доступа
watch(
  [selectedRoleIds, selectedAccessLevel],
  () => {
    if (isOpen.value && props.member) {
      saveChanges();
    }
  },
  { deep: true },
);

const toggleRole = (roleId: string) => {
  const index = selectedRoleIds.value.indexOf(roleId);
  if (index === -1) {
    selectedRoleIds.value = [...selectedRoleIds.value, roleId];
  } else {
    selectedRoleIds.value = selectedRoleIds.value.filter((id) => id !== roleId);
  }
};

const getRoleColor = (role: ProjectRole) => {
  if (typeof role.color === "string") return role.color;
  return role.color?.hex || "#666";
};

interface AccessLevelOption {
  id: AccessLevel;
  label: string;
  description: string;
}

const accessLevels: AccessLevelOption[] = [
  {
    id: "admin",
    label: "Администратор",
    description: "Полный доступ к управлению проектом, участниками и ролями.",
  },
  {
    id: "moderator",
    label: "Модератор",
    description:
      "Может управлять контентом и участниками, но не настройками проекта.",
  },
  {
    id: "user",
    label: "Пользователь",
    description:
      "Может создавать и редактировать контент в рамках своих задач.",
  },
];
</script>

<template>
  <BModal
    v-model="isOpen"
    :title="
      member
        ? `Управление участником: ${member.user.display_name || member.user.username}`
        : 'Управление участником'
    "
    size="lg"
    hide-footer
    body-class="p-0"
  >
    <BAlert
      v-if="error"
      variant="danger"
      show
      dismissible
      class="m-3"
      @dismissed="error = null"
    >
      {{ error }}
    </BAlert>

    <div class="member-mgmt-container">
      <aside class="mgmt-sidebar">
        <button
          class="mgmt-nav-item"
          :class="{ active: activeTab === 'rights' }"
          @click="activeTab = 'rights'"
        >
          <IconUserRole />
          <span>Права доступа</span>
        </button>
        <button
          class="mgmt-nav-item"
          :class="{ active: activeTab === 'roles' }"
          @click="activeTab = 'roles'"
        >
          <IconSettings />
          <span>Роли в проекте</span>
        </button>
      </aside>

      <main class="mgmt-content">
        <div v-if="activeTab === 'rights'" class="rights-tab">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h4 class="m-0">Права доступа</h4>
            <BSpinner v-if="isLoading" size="sm" />
          </div>
          <p class="text-muted small mb-4">
            Выберите уровень прав, определяющий возможности пользователя по
            управлению проектом.
          </p>

          <BAlert
            v-if="member?.isOwner"
            variant="info"
            show
            class="small py-2 mb-4"
          >
            Владелец проекта всегда имеет права администратора.
          </BAlert>

          <div
            class="access-levels-list"
            :class="{ 'opacity-50 pointer-events-none': member?.isOwner }"
          >
            <div
              v-for="level in accessLevels"
              :key="level.id"
              class="access-level-item"
              :class="{ active: selectedAccessLevel === level.id }"
              @click="!member?.isOwner && (selectedAccessLevel = level.id)"
            >
              <div class="level-info">
                <div class="level-label">{{ level.label }}</div>
                <div class="level-desc">{{ level.description }}</div>
              </div>
              <div class="level-radio">
                <div class="radio-outer">
                  <div
                    v-if="selectedAccessLevel === level.id"
                    class="radio-inner"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'roles'" class="roles-tab">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h4 class="m-0">Роли в проекте</h4>
            <BSpinner v-if="isLoading" size="sm" />
          </div>
          <p class="text-muted small mb-4">
            Назначьте участнику роли (теги), чтобы обозначить его специализацию
            (например, Художник).
          </p>

          <div class="roles-list-compact">
            <div
              v-for="role in currentProjectRoles"
              :key="role.id"
              class="role-select-item"
              :class="{ active: selectedRoleIds.includes(role.id) }"
              @click="toggleRole(role.id)"
            >
              <div class="role-info">
                <span
                  class="role-dot"
                  :style="{ backgroundColor: getRoleColor(role) }"
                ></span>
                <span class="role-name">{{ role.name }}</span>
              </div>
              <BFormCheckbox
                :model-value="selectedRoleIds.includes(role.id)"
                readonly
                @click.stop
              />
            </div>
            <div
              v-if="currentProjectRoles.length === 0"
              class="text-center p-4 text-muted border rounded-3"
            >
              Роли пока не созданы. Их можно создать в настройках проекта на
              вкладке "Роли".
            </div>
          </div>
        </div>
      </main>
    </div>
  </BModal>
</template>

<style scoped>
.member-mgmt-container {
  display: flex;
  min-height: 500px;
}

.mgmt-sidebar {
  width: 200px;
  background: #f8f9fa;
  border-right: 1px solid #e5e5e5;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
}

.mgmt-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #666;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.mgmt-nav-item:hover {
  background: #eee;
  color: #1a1a1a;
}

.mgmt-nav-item.active {
  background: #1a1a1a;
  color: #fff;
}

.mgmt-nav-item svg {
  width: 18px;
  height: 18px;
}

.mgmt-divider {
  height: 1px;
  background: #e5e5e5;
  margin: 16px 20px;
}

.mgmt-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  max-height: 600px;
}

h4 {
  margin-bottom: 8px;
  font-weight: 700;
}

.roles-list-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-select-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-select-item:hover {
  background: #f9f9f9;
  border-color: #ddd;
}

.role-select-item.active {
  border-color: #1a1a1a;
  background: #f0f7ff;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.role-name {
  font-weight: 600;
}

.permissions-display-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.perm-display-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  opacity: 0.6;
}

.perm-display-item.granted {
  opacity: 1;
  background: #e8f5e9;
  color: #2e7d32;
}

.perm-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.perm-display-item.granted .perm-status-dot {
  background: #4caf50;
}

.perm-label {
  flex: 1;
  font-weight: 600;
}

.perm-status-text {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.mgmt-actions {
  display: flex;
  justify-content: flex-end;
}

.access-levels-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.access-level-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.access-level-item:hover {
  background: #f9f9f9;
  border-color: #ddd;
}

.access-level-item.active {
  background: #f0f7ff;
  border-color: #1a1a1a;
}

.level-label {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 4px;
}

.level-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.radio-outer {
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.access-level-item.active .radio-outer {
  border-color: #1a1a1a;
}

.radio-inner {
  width: 10px;
  height: 10px;
  background: #1a1a1a;
  border-radius: 50%;
}
</style>
