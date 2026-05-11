<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  coverUrl?: string
}>()

const emit = defineEmits<{
  (event: 'update-cover', coverUrl: string): void
  (event: 'remove-cover'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const openFilePicker = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const input = event.target

  if (!(input instanceof HTMLInputElement)) {
    return
  }

  const file = input.files?.[0]

  if (!file) {
    return
  }

  const reader = new FileReader()

  reader.addEventListener('load', () => {
    if (typeof reader.result === 'string') {
      emit('update-cover', reader.result)
    }
  })
  reader.readAsDataURL(file)
  input.value = ''
}
</script>

<template>
  <section class="document-cover" :class="{ empty: !props.coverUrl }" aria-label="Обложка документа">
    <input
      ref="fileInputRef"
      class="cover-file-input"
      type="file"
      accept="image/*"
      @change="handleFileChange"
    />

    <button
      v-if="!props.coverUrl"
      class="cover-add-button"
      type="button"
      @click="openFilePicker"
    >
      Добавить обложку
    </button>

    <template v-else>
      <img class="cover-image" :src="props.coverUrl" alt="" />
      <div class="cover-actions">
        <button class="cover-action" type="button" @click="openFilePicker">
          Изменить
        </button>
        <button class="cover-action danger" type="button" @click="emit('remove-cover')">
          Удалить
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.document-cover {
  position: relative;
  width: min(900px, 100%);
  height: 260px;
  margin: 0 auto 28px;
  overflow: hidden;
  border-radius: 8px;
  background: #f2f4f7;
}

.document-cover.empty {
  display: flex;
  justify-content: flex-end;
  height: 42px;
  background: transparent;
}

.cover-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.cover-add-button,
.cover-action {
  height: 34px;
  padding: 0 12px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  background: #ffffff;
  color: #344054;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
}

.cover-add-button:hover,
.cover-action:hover {
  background: #f8f9fb;
}

.cover-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-actions {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 120ms ease;
}

.document-cover:hover .cover-actions,
.cover-actions:focus-within {
  opacity: 1;
}

.cover-action.danger {
  color: #b42318;
}

@media (max-width: 640px) {
  .document-cover {
    height: 180px;
  }

  .document-cover.empty {
    height: 38px;
  }
}
</style>
