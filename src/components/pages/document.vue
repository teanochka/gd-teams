<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Lotion } from '@dashibase/lotion'
import { useDocumentsStore } from '@/stores/documents'

const route = useRoute()
const documentsStore = useDocumentsStore()

let canScheduleSave = false

const projectId = computed(() => String(route.params.projectId ?? ''))
const documentId = computed(() => {
  const value = route.params.documentId

  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
})

const page = computed(() => {
  return documentId.value ? documentsStore.pagesById[documentId.value] : null
})

const isLoading = computed(() => {
  return documentId.value ? Boolean(documentsStore.isLoadingById[documentId.value]) : false
})

const isSaving = computed(() => {
  return documentId.value ? Boolean(documentsStore.isSavingById[documentId.value]) : false
})

const isDirty = computed(() => {
  return documentId.value ? Boolean(documentsStore.isDirtyById[documentId.value]) : false
})

const error = computed(() => {
  return documentId.value ? documentsStore.errorById[documentId.value] : null
})

watch(
  [projectId, documentId],
  async ([nextProjectId, nextDocumentId]) => {
    canScheduleSave = false

    if (!nextProjectId || !nextDocumentId) {
      return
    }

    await documentsStore.loadDocument(nextDocumentId, nextProjectId)
    await nextTick()
    canScheduleSave = true
  },
  { immediate: true },
)

watch(
  page,
  () => {
    if (!canScheduleSave || !documentId.value || !page.value) {
      return
    }

    documentsStore.scheduleSave(documentId.value)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  canScheduleSave = false

  if (documentId.value) {
    void documentsStore.flushDocument(documentId.value)
  }
})
</script>

<template>
  <main class="document-page">
    <p v-if="isLoading" class="document-state">Загрузка документа...</p>
    <p v-else-if="error" class="document-state document-state-error">{{ error }}</p>
    <template v-else-if="page">
      <div class="document-save-state" aria-live="polite">
        <span v-if="isSaving">Сохранение...</span>
        <span v-else-if="isDirty">Есть несохраненные изменения</span>
        <span v-else>Сохранено</span>
      </div>
      <Lotion :page="page" />
    </template>
  </main>
</template>

<style scoped>
.document-page {
  min-height: 100vh;
  background: #ffffff;
}

.document-state {
  margin: 0;
  padding: 48px;
  color: #6f7682;
}

.document-state-error {
  color: #b42318;
}

.document-save-state {
  position: fixed;
  right: 24px;
  bottom: 20px;
  z-index: 20;
  color: #7a828e;
  font-size: 13px;
  line-height: 1;
  pointer-events: none;
}
</style>
