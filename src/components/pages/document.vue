<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lotion } from '@dashibase/lotion'
import IconArrowLeft from '~icons/carbon/arrow-left'
import DocumentTemplatePrompt from '@/components/DocumentTemplatePrompt.vue'
import { useDocumentsStore } from '@/stores/documents'
import type { LotionBlock } from '@/types/domain'

const route = useRoute()
const router = useRouter()
const documentsStore = useDocumentsStore()

let canScheduleSave = false
const isTemplatePromptDismissed = ref(false)

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

const stripHtml = (value: string) => {
  return value
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim()
}

const isBlockEmpty = (block: LotionBlock) => {
  const value = block.details.value

  return typeof value !== 'string' || stripHtml(value).length === 0
}

const isDocumentEmpty = computed(() => {
  if (!page.value) {
    return false
  }

  return page.value.blocks.length === 0 || page.value.blocks.every(isBlockEmpty)
})

const shouldShowTemplatePrompt = computed(() => {
  return Boolean(page.value && isDocumentEmpty.value && !isTemplatePromptDismissed.value)
})

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  void router.push({
    name: 'project',
    params: { projectId: projectId.value },
  })
}

const applyTemplate = (templateId: string) => {
  if (templateId === 'blank') {
    isTemplatePromptDismissed.value = true
  }
}

const skipTemplatePrompt = () => {
  isTemplatePromptDismissed.value = true
}

watch(
  [projectId, documentId],
  async ([nextProjectId, nextDocumentId]) => {
    canScheduleSave = false
    isTemplatePromptDismissed.value = false

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
    <button class="document-back-button" type="button" @click="goBack">
      <IconArrowLeft aria-hidden="true" />
      <span>Назад</span>
    </button>
    <p v-if="isLoading" class="document-state">Загрузка документа...</p>
    <p v-else-if="error" class="document-state document-state-error">{{ error }}</p>
    <template v-else-if="page">
      <div class="document-save-state" aria-live="polite">
        <span v-if="isSaving">Сохранение...</span>
        <span v-else-if="isDirty">Есть несохраненные изменения</span>
        <span v-else>Сохранено</span>
      </div>
      <Lotion :page="page" />
      <DocumentTemplatePrompt
        v-if="shouldShowTemplatePrompt"
        @apply="applyTemplate"
        @skip="skipTemplatePrompt"
      />
    </template>
  </main>
</template>

<style scoped>
.document-page {
  position: relative;
  min-height: 100vh;
  background: #ffffff;
}

.document-back-button {
  position: fixed;
  top: 20px;
  left: 24px;
  z-index: 18;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d9dde3;
  border-radius: 6px;
  background: #ffffff;
  color: #1f2328;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.document-back-button:hover {
  background: #f8f9fb;
}

.document-back-button svg {
  width: 18px;
  height: 18px;
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
