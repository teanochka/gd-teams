<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconArrowDown from '~icons/carbon/arrow-down'
import IconArrowLeft from '~icons/carbon/arrow-left'
import IconArrowUp from '~icons/carbon/arrow-up'
import CanvasProjectExplorer from '@/components/canvas/CanvasProjectExplorer.vue'
import CanvasWorkspace from '@/components/canvas/CanvasWorkspace.vue'
import { cloneCanvasData, createDefaultCanvasData } from '@/api/canvas'
import { useCanvasesStore } from '@/stores/canvases'
import type { CanvasData, Node, NodeType } from '@/types/domain'

const route = useRoute()
const router = useRouter()
const canvasesStore = useCanvasesStore()

const currentCanvasData = ref<CanvasData>(createDefaultCanvasData())
const canScheduleSave = ref(false)
const isExplorerOpen = ref(false)

const projectId = computed(() => {
  const value = route.params.projectId

  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
})

const canvasId = computed(() => {
  const value = route.params.canvasId

  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
})

const isLoading = computed(() => {
  return canvasId.value
    ? Boolean(canvasesStore.isLoadingById[canvasId.value])
    : false
})

const isSaving = computed(() => {
  return canvasId.value
    ? Boolean(canvasesStore.isSavingById[canvasId.value])
    : false
})

const isDirty = computed(() => {
  return canvasId.value
    ? Boolean(canvasesStore.isDirtyById[canvasId.value])
    : false
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

const nodeRouteParams: Partial<Record<NodeType, string>> = {
  document: 'documentId',
  canvas: 'canvasId',
  template: 'templateId',
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

const toggleExplorer = () => {
  isExplorerOpen.value = !isExplorerOpen.value
}

const openExplorerNode = (node: Node) => {
  if (node.type === 'folder') {
    return
  }

  const paramName = nodeRouteParams[node.type]

  if (!paramName) {
    return
  }

  void router.push({
    name: `project-${node.type}`,
    params: {
      projectId: projectId.value,
      [paramName]: node.id,
    },
  })
}

const setCurrentCanvasData = (data: CanvasData | null | undefined) => {
  currentCanvasData.value = cloneCanvasData(data ?? createDefaultCanvasData())
}

const handleCanvasDataUpdate = (data: CanvasData) => {
  const nextData = cloneCanvasData(data)

  currentCanvasData.value = nextData

  if (!canScheduleSave.value || !canvasId.value) {
    return
  }

  canvasesStore.scheduleSave(canvasId.value, nextData)
}

watch(
  [projectId, canvasId],
  async ([nextProjectId, nextCanvasId], previousValues) => {
    const previousCanvasId = previousValues?.[1]

    canScheduleSave.value = false

    if (previousCanvasId && previousCanvasId !== nextCanvasId) {
      await canvasesStore.flushCanvas(previousCanvasId)
    }

    if (!nextProjectId || !nextCanvasId) {
      setCurrentCanvasData(null)
      canScheduleSave.value = true
      return
    }

    const data = await canvasesStore.loadCanvas(nextCanvasId, nextProjectId)

    setCurrentCanvasData(data)
    canScheduleSave.value = true
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
  <main class="canvas-page" :class="{ 'explorer-open': isExplorerOpen }">
    <button class="canvas-back-button" type="button" @click="goBack">
      <IconArrowLeft aria-hidden="true" />
      <span>Назад</span>
    </button>

    <button
      class="explorer-handle"
      type="button"
      :aria-expanded="isExplorerOpen"
      aria-controls="canvas-project-explorer"
      @click="toggleExplorer"
    >
      <span class="handle-content">
        <span>{{ isExplorerOpen ? 'Спрятать' : 'Проводник' }}</span>
        <IconArrowDown v-if="isExplorerOpen" aria-hidden="true" />
        <IconArrowUp v-else aria-hidden="true" />
      </span>
    </button>

    <aside
      id="canvas-project-explorer"
      class="canvas-explorer"
      :aria-hidden="!isExplorerOpen"
      aria-label="Проводник проекта"
    >
      <CanvasProjectExplorer
        v-if="projectId"
        :project-id="projectId"
        :active-canvas-id="canvasId"
        @open-node="openExplorerNode"
      />
    </aside>

    <p v-if="isLoading" class="canvas-state">Загрузка холста...</p>
    <p v-else-if="error" class="canvas-state canvas-state-error">{{ error }}</p>
    <template v-else>
      <div class="canvas-save-state" aria-live="polite">
        {{ saveStatusLabel }}
      </div>
      <CanvasWorkspace
        class="canvas-workspace-view"
        :data="currentCanvasData"
        :project-id="projectId"
        @update:data="handleCanvasDataUpdate"
      />
    </template>
  </main>
</template>

<style scoped>
.canvas-page {
  --explorer-width: clamp(420px, 48vw, 760px);

  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  background: #ffffff;
  color: #171717;
}

.canvas-workspace-view {
  width: 100%;
  height: 100%;
}

.canvas-back-button {
  position: fixed;
  top: 18px;
  left: 18px;
  z-index: 38;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2328;
  font: inherit;
  font-size: 14px;
  font-weight: 650;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.canvas-back-button:hover {
  border-color: #b7bec8;
  background: #f8f9fb;
}

.canvas-back-button svg {
  width: 18px;
  height: 18px;
}

.explorer-handle {
  position: fixed;
  top: 50%;
  right: 0;
  z-index: 36;
  display: grid;
  place-items: center;
  width: 42px;
  height: 150px;
  padding: 0;
  border: 1px solid #d7dce3;
  border-right: 0;
  border-radius: 8px 0 0 8px;
  background: #202020;
  color: #ffffff;
  box-shadow: -8px 12px 28px rgba(15, 23, 42, 0.16);
  transition:
    right 0.2s ease,
    background 0.16s ease;
  transform: translateY(-50%);
}

.explorer-handle:hover {
  background: #343434;
}

.explorer-open .explorer-handle {
  right: var(--explorer-width);
}

.handle-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: 0;
  white-space: nowrap;
  transform: rotate(-90deg);
}

.handle-content svg {
  width: 15px;
  height: 15px;
}

.canvas-explorer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 34;
  width: var(--explorer-width);
  height: 100vh;
  overflow: hidden;
  border-left: 1px solid #dcdcdc;
  background: #ffffff;
  box-shadow: -18px 0 44px rgba(15, 23, 42, 0.16);
  transform: translateX(100%);
  transition: transform 0.2s ease;
}

.explorer-open .canvas-explorer {
  transform: translateX(0);
}

.canvas-save-state {
  position: fixed;
  right: 284px;
  bottom: 20px;
  z-index: 20;
  color: #7a828e;
  font-size: 13px;
  line-height: 1;
  pointer-events: none;
  transition: right 0.2s ease;
}

.explorer-open .canvas-save-state {
  right: calc(var(--explorer-width) + 284px);
}

.canvas-state {
  margin: 0;
  padding: 48px;
  color: #6f7682;
}

.canvas-state-error {
  color: #b42318;
}

@media (max-width: 1100px) {
  .canvas-save-state,
  .explorer-open .canvas-save-state {
    right: 24px;
  }
}

@media (max-width: 720px) {
  .canvas-page {
    --explorer-width: calc(100vw - 52px);
  }

  .canvas-back-button {
    top: 12px;
    left: 12px;
  }

  .explorer-handle {
    height: 132px;
  }
}
</style>
