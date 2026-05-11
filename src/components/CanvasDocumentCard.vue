<script setup lang="ts">
import { computed, nextTick, reactive, watch } from 'vue'
import { Lotion } from '@dashibase/lotion'
import IconDocument from '~icons/carbon/document'
import { cloneLotionBlockDetails } from '@/api/documents'
import { useDocumentsStore } from '@/stores/documents'
import type { CanvasDocumentCard, LotionBlock, LotionPage } from '@/types/domain'

const props = defineProps<{
  card: CanvasDocumentCard
}>()

const emit = defineEmits<{
  (event: 'start-move', payload: { card: CanvasDocumentCard; event: PointerEvent }): void
}>()

const documentsStore = useDocumentsStore()
const cardPage = reactive<LotionPage>({
  name: '',
  blocks: [],
  card: {
    blockIds: [],
  },
})

const sourcePage = computed(() => documentsStore.pagesById[props.card.documentId] ?? null)
const isLoading = computed(() => Boolean(documentsStore.isLoadingById[props.card.documentId]))
const error = computed(() => documentsStore.errorById[props.card.documentId] ?? null)
const title = computed(() => sourcePage.value?.name || props.card.title)

const cardStyle = computed(() => ({
  left: `${props.card.x}px`,
  top: `${props.card.y}px`,
  width: `${props.card.width}px`,
  minHeight: `${props.card.height}px`,
}))

const cloneBlock = (block: LotionBlock): LotionBlock => ({
  ...block,
  details: cloneLotionBlockDetails(block.details),
})

const prepareReadonlyDom = async () => {
  await nextTick()

  document
    .querySelectorAll<HTMLElement>(
      `[data-canvas-document-card-id="${props.card.id}"] .group > div:first-child > *`,
    )
    .forEach((control) => {
      if (control.querySelector('path[d="M12 4v16m8-8H4"]')) {
        control.style.display = 'none'
      }
    })

  document
    .querySelectorAll<HTMLElement>(
      `[data-canvas-document-card-id="${props.card.id}"] [contenteditable="true"]`,
    )
    .forEach((element) => {
      element.setAttribute('contenteditable', 'false')
      element.setAttribute('spellcheck', 'false')
    })
}

const syncCardPage = async () => {
  const page = sourcePage.value

  if (!page) {
    cardPage.name = props.card.title
    cardPage.blocks = []
    cardPage.card = { blockIds: [] }
    return
  }

  const cardBlockIds = page.card?.blockIds ?? []
  const blocks = cardBlockIds
    .map((blockId) => page.blocks.find((block) => block.id === blockId) ?? null)
    .filter((block): block is LotionBlock => block !== null)
    .map(cloneBlock)

  cardPage.name = page.name
  cardPage.blocks = blocks
  cardPage.card = { blockIds: blocks.map((block) => block.id) }

  await prepareReadonlyDom()
}

const isEditableTarget = (target: EventTarget | null) => {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest('.canvas-document-card [contenteditable]'))
  )
}

const preventTextInput = (event: Event) => {
  if (!isEditableTarget(event.target)) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
}

const preventEditingKeydown = (event: KeyboardEvent) => {
  if (!isEditableTarget(event.target)) {
    return
  }

  const key = event.key.toLowerCase()
  const isAllowedShortcut = (event.ctrlKey || event.metaKey) && ['a', 'c'].includes(key)
  const isNavigationKey = [
    'arrowup',
    'arrowdown',
    'arrowleft',
    'arrowright',
    'escape',
    'tab',
  ].includes(key)

  if (isAllowedShortcut || isNavigationKey) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
}

const startMove = (event: PointerEvent) => {
  emit('start-move', { card: props.card, event })
}

watch(
  () => [props.card.documentId, props.card.projectId] as const,
  async ([documentId, projectId]) => {
    if (!documentId || !projectId) {
      return
    }

    await documentsStore.loadDocument(documentId, projectId)
    await syncCardPage()
  },
  { immediate: true },
)

watch(sourcePage, () => {
  void syncCardPage()
}, { deep: true })
</script>

<template>
  <article
    class="canvas-document-card"
    :data-canvas-document-card-id="card.id"
    :style="cardStyle"
    @beforeinput.capture="preventTextInput"
    @keydown.capture="preventEditingKeydown"
    @paste.capture="preventTextInput"
    @compositionstart.capture="preventTextInput"
  >
    <header class="document-card-header" @pointerdown="startMove">
      <IconDocument aria-hidden="true" />
      <strong>{{ title }}</strong>
      <span>Карточка</span>
    </header>

    <div class="document-card-body">
      <div v-if="isLoading" class="document-card-state">Загрузка...</div>
      <div v-else-if="error" class="document-card-state error">{{ error }}</div>
      <div v-else-if="!cardPage.blocks.length" class="document-card-state">
        В карточке документа нет блоков
      </div>
      <Lotion v-else :page="cardPage" />
    </div>
  </article>
</template>

<style scoped>
.canvas-document-card {
  position: absolute;
  z-index: 24;
  overflow: hidden;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  background: #ffffff;
  color: #171717;
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.16);
  pointer-events: auto;
}

.document-card-header {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid #e2e5ea;
  background: #f8f8f8;
  cursor: move;
  user-select: none;
}

.document-card-header svg {
  width: 18px;
  height: 18px;
  color: #202020;
}

.document-card-header strong {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-card-header span {
  color: #707070;
  font-size: 12px;
  font-weight: 650;
}

.document-card-body {
  max-height: 360px;
  overflow: auto;
  padding: 14px 16px 18px;
}

.document-card-state {
  display: grid;
  place-items: center;
  min-height: 160px;
  color: #707070;
  font-size: 14px;
  text-align: center;
}

.document-card-state.error {
  color: #b42318;
}

.document-card-body :deep(.lotion h1) {
  margin-bottom: 16px;
  font-size: 22px;
  line-height: 1.2;
}

.document-card-body :deep([contenteditable='false']) {
  caret-color: transparent;
}
</style>
