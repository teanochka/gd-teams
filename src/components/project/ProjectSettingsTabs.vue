<script setup lang="ts">
import { ref } from 'vue'
import IconSettings from '~icons/carbon/settings'
import IconGroup from '~icons/carbon/group'
import IconUserRole from '~icons/carbon/user-role'

const props = defineProps<{
  activeTab: 'general' | 'members' | 'roles'
}>()

const emit = defineEmits<{
  'update:activeTab': [value: 'general' | 'members' | 'roles']
}>()

const tabs = [
  { id: 'general', label: 'Основное', icon: IconSettings },
  { id: 'members', label: 'Участники', icon: IconGroup },
  { id: 'roles', label: 'Роли', icon: IconUserRole },
] as const
</script>

<template>
  <div class="settings-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="tab-button"
      :class="{ active: activeTab === tab.id }"
      @click="emit('update:activeTab', tab.id)"
    >
      <component :is="tab.icon" aria-hidden="true" />
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.settings-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #666;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.tab-button:hover {
  background: #f5f5f5;
  color: #1a1a1a;
}

.tab-button.active {
  background: #1a1a1a;
  color: #fff;
}

.tab-button svg {
  width: 18px;
  height: 18px;
}
</style>
