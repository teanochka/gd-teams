<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import IconUserAdd from '~icons/carbon/user-follow'
import IconTrash from '~icons/carbon/trash-can'
import IconOverflowMenuVertical from '~icons/carbon/overflow-menu-vertical'
import { useProjectsStore } from '@/stores/projects'
import { searchUsers } from '@/api/projects'
import MemberManagementModal from './MemberManagementModal.vue'
import type { User, ProjectRole, ProjectMember } from '@/types/domain'

const props = defineProps<{
  projectId: string
}>()

const projectsStore = useProjectsStore()
const { currentProjectMembers, currentProjectRoles } = storeToRefs(projectsStore)

const isLoading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const searchResults = ref<User[]>([])
const isSearching = ref(false)

const isMgmtModalOpen = ref(false)
const selectedMember = ref<ProjectMember | null>(null)

const loadData = async () => {
  if (!props.projectId) return
  isLoading.value = true
  error.value = null
  try {
    await Promise.all([
      projectsStore.loadProjectMembers(props.projectId),
      projectsStore.loadProjectRoles(props.projectId),
    ])
  } catch (e) {
    error.value = 'Не удалось загрузить данные участников'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

watch(() => props.projectId, loadData)

const openMemberMgmt = (member: ProjectMember) => {
  selectedMember.value = member
  isMgmtModalOpen.value = true
}

const handleSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  isSearching.value = true
  try {
    const users = await searchUsers(searchQuery.value)
    // Фильтруем тех, кто уже в проекте
    searchResults.value = users.filter(
      (u) => !currentProjectMembers.value.some((m) => m.user.id === u.id),
    )
  } finally {
    isSearching.value = false
  }
}

const addMember = async (userId: string) => {
  await projectsStore.addMember(props.projectId, userId)
  searchQuery.value = ''
  searchResults.value = []
}

const removeMember = async (memberId: string) => {
  if (confirm('Удалить участника из проекта?')) {
    await projectsStore.removeMember(props.projectId, memberId)
  }
}

const toggleRole = async (memberId: string, roleId: string) => {
  const member = currentProjectMembers.value.find((m) => m.id === memberId)
  if (!member) return

  const hasRole = member.roles.some((r) => r.id === roleId)
  let newRoleIds = member.roles.map((r) => r.id)

  if (hasRole) {
    newRoleIds = newRoleIds.filter((id) => id !== roleId)
  } else {
    newRoleIds.push(roleId)
  }

  await projectsStore.updateMember(props.projectId, memberId, newRoleIds)
}

const getRoleColor = (role: ProjectRole) => {
  if (typeof role.color === 'string') return role.color
  return role.color?.hex || '#666'
}
</script>

<template>
  <div class="members-list">
    <BAlert v-if="error" variant="danger" show dismissible @dismissed="error = null">
      {{ error }}
    </BAlert>

    <div v-if="isLoading && !currentProjectMembers.length" class="text-center p-5">
      <BSpinner label="Загрузка участников..." />
    </div>

    <template v-else>
      <section class="add-member-section">
        <h3>Добавить участника</h3>
        <div class="search-box">
          <BFormInput
            v-model="searchQuery"
            placeholder="Поиск пользователей по имени или email..."
            @input="handleSearch"
          />
          <div v-if="searchResults.length > 0" class="search-results">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="search-item"
              @click="addMember(user.id)"
            >
              <span>{{ user.display_name || user.username }}</span>
              <IconUserAdd />
            </div>
          </div>
        </div>
      </section>

      <section class="members-table-section">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h3 class="m-0">Список участников</h3>
          <BSpinner v-if="isLoading" size="sm" variant="secondary" />
        </div>
        
        <div class="members-table-wrapper">
          <table class="members-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Права доступа</th>
                <th>Роли (теги)</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in currentProjectMembers" :key="member.id">
                <td>
                  <div class="user-info">
                    <div class="user-avatar">
                      {{ (member.user.display_name || member.user.username || '?')[0].toUpperCase() }}
                    </div>
                    <div>
                      <div class="user-name">{{ member.user.display_name || member.user.username }}</div>
                      <div class="user-email text-muted small">{{ member.user.email }}</div>
                    </div>
                    <span v-if="member.isOwner" class="badge bg-dark ms-2">Владелец</span>
                  </div>
                </td>
                <td>
                  <span class="access-level-badge" :class="member.isOwner ? 'admin' : member.accessLevel">
                    {{ (member.isOwner || member.accessLevel === 'admin') ? 'Администратор' : member.accessLevel === 'moderator' ? 'Модератор' : 'Пользователь' }}
                  </span>
                </td>
                <td>
                  <div class="member-roles-summary">
                    <span 
                      v-for="role in member.roles" 
                      :key="role.id" 
                      class="role-badge"
                      :style="{ backgroundColor: getRoleColor(role) + '20', color: getRoleColor(role), borderColor: getRoleColor(role) }"
                    >
                      {{ role.name }}
                    </span>
                    <span v-if="member.roles.length === 0" class="text-muted small">Нет ролей</span>
                  </div>
                </td>
              <td>
                <div class="actions-cell">
                  <BButton
                    variant="link"
                    class="mgmt-trigger-btn"
                    title="Управление ролями и правами"
                    @click="openMemberMgmt(member)"
                  >
                    <IconOverflowMenuVertical />
                  </BButton>
                  
                  <BButton
                    v-if="!member.isOwner"
                    variant="link"
                    class="text-danger p-0 ms-2"
                    title="Удалить из проекта"
                    @click="removeMember(member.id)"
                  >
                    <IconTrash />
                  </BButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    </template>

    <MemberManagementModal
      v-model="isMgmtModalOpen"
      :member="selectedMember"
      :project-id="projectId"
      @updated="projectsStore.loadProjectMembers(projectId)"
    />
  </div>
</template>

<style scoped>
.members-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

h3 {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 700;
}

.search-box {
  position: relative;
  max-width: 500px;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  margin-top: 4px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
}

.search-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.search-item:hover {
  background: #f5f5f5;
}

.members-table-wrapper {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
}

.members-table {
  width: 100%;
  border-collapse: collapse;
}

.members-table th {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e5e5;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.members-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
  vertical-align: middle;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
  border-radius: 50%;
  font-weight: 700;
  color: #555;
}

.user-name {
  font-weight: 600;
}

.member-roles-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-badge {
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.actions-cell {
  display: flex;
  align-items: center;
}

.mgmt-trigger-btn {
  padding: 4px;
  color: #666;
  border-radius: 4px;
}

.mgmt-trigger-btn:hover {
  background: #eee;
  color: #1a1a1a;
}

.access-level-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.access-level-badge.admin {
  background: #ffebee;
  color: #c62828;
}

.access-level-badge.moderator {
  background: #e3f2fd;
  color: #1565c0;
}

.access-level-badge.user {
  background: #f5f5f5;
  color: #616161;
}
</style>
