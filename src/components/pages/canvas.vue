<script setup lang="ts">
import 'canvas-drawing-editor'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconArrowLeft from '~icons/carbon/arrow-left'
import { createDefaultCanvasData } from '@/api/canvas'
import { useCanvasesStore } from '@/stores/canvases'
import type { CanvasData, CanvasObject } from '@/types/domain'

type EditorChangeEvent = CustomEvent<{
  objects?: CanvasObject[]
}>

const route = useRoute()
const router = useRouter()
const canvasesStore = useCanvasesStore()

const initialDataJson = ref(JSON.stringify(createDefaultCanvasData()))
const editorRenderKey = ref('canvas-editor-empty')
const canScheduleSave = ref(false)

const projectId = computed(() => {
  const value = route.params.projectId

  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
})

const canvasId = computed(() => {
  const value = route.params.canvasId

  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
})

const isLoading = computed(() => {
  return canvasId.value ? Boolean(canvasesStore.isLoadingById[canvasId.value]) : false
})

const isSaving = computed(() => {
  return canvasId.value ? Boolean(canvasesStore.isSavingById[canvasId.value]) : false
})

const isDirty = computed(() => {
  return canvasId.value ? Boolean(canvasesStore.isDirtyById[canvasId.value]) : false
})

const error = computed(() => {
  return canvasId.value ? canvasesStore.errorById[canvasId.value] : null
})

const saveStatusLabel = computed(() => {
  if (isSaving.value) {
    return 'Сохранение...'
  }

  if (isDirty.value) {
    return 'Есть несохраненные изменения'
  }

  return 'Сохранено'
})

const setInitialData = async (data: CanvasData | null | undefined) => {
  initialDataJson.value = JSON.stringify(data ?? createDefaultCanvasData())
  editorRenderKey.value = `${canvasId.value}-${Date.now()}`

  await nextTick()
  canScheduleSave.value = true
}

const handleEditorChange = (event: Event) => {
  if (!canScheduleSave.value || !canvasId.value) {
    return
  }

  const objects = (event as EditorChangeEvent).detail?.objects

  canvasesStore.scheduleSave(canvasId.value, {
    objects: Array.isArray(objects) ? objects : [],
  })
}

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

watch(
  [projectId, canvasId],
  async ([nextProjectId, nextCanvasId], previousValues) => {
    const previousCanvasId = previousValues?.[1]

    canScheduleSave.value = false

    if (previousCanvasId) {
      await canvasesStore.flushCanvas(previousCanvasId)
    }

    if (!nextProjectId || !nextCanvasId) {
      await setInitialData(null)
      return
    }

    const data = await canvasesStore.loadCanvas(nextCanvasId, nextProjectId)
    await setInitialData(data)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  canScheduleSave.value = false

  if (canvasId.value) {
    void canvasesStore.flushCanvas(canvasId.value)
  }
})
</script>

<template>
  <main class="canvas-page">
    <button class="canvas-back-button" type="button" @click="goBack">
      <IconArrowLeft aria-hidden="true" />
      <span>Назад</span>
    </button>

    <p v-if="isLoading" class="canvas-state">Загрузка холста...</p>
    <p v-else-if="error" class="canvas-state canvas-state-error">{{ error }}</p>
    <template v-else>
      <div class="canvas-save-state" aria-live="polite">{{ saveStatusLabel }}</div>
      <canvas-drawing-editor
        :key="editorRenderKey"
        class="canvas-editor"
        title="Canvas Editor"
        lang="en"
        theme-color="#5450dc"
        max-image-size="500kb"
        :initial-data="initialDataJson"
        @editor-change="handleEditorChange"
      />
    </template>
  </main>
</template>

<style scoped>
.canvas-page {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  background: #ffffff;
}

.canvas-editor {
  display: block;
  width: 100%;
  height: 100%;
}

.canvas-back-button {
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

.canvas-back-button:hover {
  background: #f8f9fb;
}

.canvas-back-button svg {
  width: 18px;
  height: 18px;
}

.canvas-save-state {
  position: fixed;
  right: 24px;
  bottom: 20px;
  z-index: 20;
  color: #7a828e;
  font-size: 13px;
  line-height: 1;
  pointer-events: none;
}

.canvas-state {
  margin: 0;
  padding: 48px;
  color: #6f7682;
}

.canvas-state-error {
  color: #b42318;
}

@media (max-width: 640px) {
  .canvas-back-button {
    left: 16px;
  }

  .canvas-save-state {
    right: 16px;
  }
}
</style>
