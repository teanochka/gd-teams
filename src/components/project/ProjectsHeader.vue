<script setup lang="ts">
import { computed } from 'vue'
import IconAdd from '~icons/carbon/add'
import IconNotification from '~icons/carbon/notification'
import IconSearch from '~icons/carbon/search'
import IconUserAvatar from '~icons/carbon/user-avatar'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    userName?: string
    notificationCount?: number
  }>(),
  {
    modelValue: '',
    userName: 'Анна Командова',
    notificationCount: 3,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'create'): void
}>()

const searchValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})
</script>

<template>
  <header class="projects-header">
    <div class="user-block" aria-label="Профиль пользователя">
      <div class="user-avatar">
        <IconUserAvatar aria-hidden="true" />
      </div>
      <div class="user-copy">
        <span class="user-eyebrow">Рабочее пространство</span>
        <strong>{{ userName }}</strong>
      </div>
    </div>

    <div class="header-actions">
      <BInputGroup class="search-field">
        <BInputGroupText>
          <IconSearch aria-hidden="true" />
        </BInputGroupText>
        <BFormInput
          v-model="searchValue"
          type="search"
          placeholder="Поиск проектов"
          aria-label="Поиск проектов"
        />
      </BInputGroup>

      <BButton variant="light" class="notification-button" aria-label="Уведомления">
        <IconNotification aria-hidden="true" />
        <span v-if="notificationCount" class="notification-count">{{ notificationCount }}</span>
      </BButton>

      <BButton variant="dark" class="create-button" @click="emit('create')">
        <IconAdd aria-hidden="true" />
        <span>Новый проект</span>
      </BButton>
    </div>
  </header>
</template>

<style scoped>
.projects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  min-height: 80px;
  padding: 18px 28px;
  border-bottom: 1px solid #dedede;
  background: #ffffff;
}

.user-block,
.header-actions,
.create-button,
.notification-button {
  display: flex;
  align-items: center;
}

.user-block {
  gap: 12px;
  min-width: 220px;
}

.user-avatar {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border: 1px solid #cfcfcf;
  border-radius: 8px;
  background: #f5f5f5;
  color: #1f1f1f;
}

.user-avatar svg {
  width: 24px;
  height: 24px;
}

.user-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.user-copy strong {
  color: #141414;
  font-size: 15px;
  line-height: 1.2;
  white-space: nowrap;
}

.user-eyebrow {
  color: #777777;
  font-size: 12px;
  line-height: 1.2;
}

.header-actions {
  justify-content: flex-end;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.search-field {
  max-width: 430px;
  min-width: 260px;
}

.search-field :deep(.input-group-text) {
  border-color: #d5d5d5;
  border-radius: 8px 0 0 8px;
  background: #f7f7f7;
  color: #595959;
}

.search-field :deep(.form-control) {
  min-height: 42px;
  border-color: #d5d5d5;
  border-radius: 0 8px 8px 0;
  color: #191919;
}

.search-field :deep(.form-control:focus) {
  border-color: #7a7a7a;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
}

.notification-button {
  position: relative;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid #d5d5d5;
  border-radius: 8px;
  background: #ffffff;
  color: #191919;
}

.notification-button:hover {
  border-color: #a8a8a8;
  background: #f2f2f2;
}

.notification-count {
  position: absolute;
  top: -7px;
  right: -7px;
  display: grid;
  place-items: center;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  border: 2px solid #ffffff;
  border-radius: 8px;
  background: #191919;
  color: #ffffff;
  font-size: 11px;
  line-height: 1;
}

.create-button {
  gap: 8px;
  min-height: 42px;
  border-radius: 8px;
  font-weight: 600;
}

.create-button svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 860px) {
  .projects-header {
    align-items: stretch;
    flex-direction: column;
    padding: 16px;
  }

  .header-actions {
    justify-content: stretch;
  }

  .search-field {
    max-width: none;
    min-width: 0;
  }
}

@media (max-width: 560px) {
  .header-actions {
    display: grid;
    grid-template-columns: 1fr 42px;
  }

  .search-field,
  .create-button {
    grid-column: 1 / -1;
  }

  .create-button {
    justify-content: center;
  }
}
</style>
