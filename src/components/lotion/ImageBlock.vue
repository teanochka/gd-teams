<script setup lang="ts">
import { computed, nextTick, ref, type PropType } from 'vue'
import { types } from '@dashibase/lotion'
import { useAppToast } from '@/composables/useAppToast'

defineOptions({
  inheritAttrs: false,
})

type ImageDetails = types.Details & {
  imageUrl?: string
  imageWidthPercent?: number
}

type ImageBlock = types.Block & {
  details: ImageDetails
}

type MenuTab = 'upload' | 'link'

type ResizeState = {
  side: 'left' | 'right'
  startX: number
  startWidthPercent: number
  containerWidth: number
}

const maxImageFileSizeBytes = 45_000
const maxDataUrlLength = 65_000
const maxLinkedImageUrlLength = 4096
const defaultImageWidthPercent = 60
const minImageWidthPercent = 20
const maxImageWidthPercent = 100

const props = defineProps({
  block: {
    type: Object as PropType<ImageBlock>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const { showToast } = useAppToast()

const blockRef = ref<HTMLDivElement | null>(null)
const emptyButtonRef = ref<HTMLButtonElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const imageFrameRef = ref<HTMLDivElement | null>(null)
const isMenuOpen = ref(false)
const activeTab = ref<MenuTab>('upload')
const linkedImageUrl = ref('')
const resizeState = ref<ResizeState | null>(null)
const menuPosition = ref({
  left: 0,
  top: 0,
})
let previousBodyUserSelect = ''

const imageUrl = computed(() => props.block.details.imageUrl ?? '')
const imageWidthPercent = computed({
  get: () => props.block.details.imageWidthPercent ?? defaultImageWidthPercent,
  set: (value: number) => {
    props.block.details.imageWidthPercent = clamp(
      value,
      minImageWidthPercent,
      maxImageWidthPercent,
    )
  },
})
const trimmedLinkedImageUrl = computed(() => linkedImageUrl.value.trim())
const isLinkedImageUrlValid = computed(() => isImageUrl(trimmedLinkedImageUrl.value))

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatMegabytes(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

function isImageUrl(value: string) {
  if (!value) {
    return false
  }

  if (value.startsWith('data:image/')) {
    return value.length <= maxDataUrlLength
  }

  let url: URL

  try {
    url = new URL(value)
  } catch {
    return false
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return false
  }

  return /\.(apng|avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)
}

function ensureDetails() {
  props.block.details.value = props.block.details.value ?? ''
  props.block.details.imageWidthPercent =
    props.block.details.imageWidthPercent ?? defaultImageWidthPercent
}

function updateMenuPosition(anchor: HTMLElement | null | undefined = emptyButtonRef.value ?? blockRef.value) {
  if (!anchor) {
    return
  }

  const rect = anchor.getBoundingClientRect()

  menuPosition.value = {
    left: rect.left + rect.width / 2,
    top: rect.bottom + 6,
  }
}

function openMenu(event?: MouseEvent) {
  if (props.readonly) {
    return
  }

  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  const anchor =
    event?.currentTarget instanceof HTMLElement ? event.currentTarget : undefined

  isMenuOpen.value = true
  void nextTick(() => updateMenuPosition(anchor))
}

function closeMenu() {
  isMenuOpen.value = false
}

function triggerUpload() {
  fileInputRef.value?.click()
}

function showImageSizeError() {
  showToast(
    `Image is too large for mock db. json-server accepts about 100 KB per save; use a file under ${formatMegabytes(maxImageFileSizeBytes)} or paste an external image link.`,
  )
}

function setImage(nextImageUrl: string) {
  props.block.details.imageUrl = nextImageUrl
  props.block.details.value = nextImageUrl
  props.block.details.imageWidthPercent =
    props.block.details.imageWidthPercent ?? defaultImageWidthPercent
  closeMenu()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  input.value = ''

  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file.')
    return
  }

  if (file.size > maxImageFileSizeBytes) {
    showImageSizeError()
    return
  }

  const reader = new FileReader()

  reader.addEventListener('load', () => {
    const result = String(reader.result ?? '')

    if (result.length > maxDataUrlLength) {
      showImageSizeError()
      return
    }

    setImage(result)
  })
  reader.addEventListener('error', () => {
    showToast('Could not read this image file.')
  })
  reader.readAsDataURL(file)
}

function confirmLinkedImage() {
  const nextImageUrl = trimmedLinkedImageUrl.value

  if (!nextImageUrl) {
    showToast('Add an image URL first.')
    return
  }

  if (!isImageUrl(nextImageUrl)) {
    showToast('Use a direct image link ending in .png, .jpg, .jpeg, .gif, .webp, .avif, .apng, or .svg.')
    return
  }

  if (nextImageUrl.startsWith('data:image/') && nextImageUrl.length > maxDataUrlLength) {
    showImageSizeError()
    return
  }

  if (!nextImageUrl.startsWith('data:image/') && nextImageUrl.length > maxLinkedImageUrlLength) {
    showToast(`Image URL is too long. Maximum link length is ${maxLinkedImageUrlLength} characters.`)
    return
  }

  setImage(nextImageUrl)
}

function startResize(side: 'left' | 'right', event: PointerEvent) {
  if (props.readonly || !imageFrameRef.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  const container = imageFrameRef.value.parentElement
  const containerWidth = container?.getBoundingClientRect().width ?? 0

  if (containerWidth <= 0) {
    return
  }

  resizeState.value = {
    side,
    startX: event.clientX,
    startWidthPercent: imageWidthPercent.value,
    containerWidth,
  }
  previousBodyUserSelect = document.body.style.userSelect
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', handleResizeMove)
  window.addEventListener('pointerup', stopResize, { once: true })
}

function handleResizeMove(event: PointerEvent) {
  const state = resizeState.value

  if (!state) {
    return
  }

  const delta = event.clientX - state.startX
  const direction = state.side === 'right' ? 1 : -1
  const nextWidth = state.startWidthPercent + (delta * direction * 200) / state.containerWidth

  imageWidthPercent.value = nextWidth
}

function stopResize() {
  resizeState.value = null
  document.body.style.userSelect = previousBodyUserSelect
  window.removeEventListener('pointermove', handleResizeMove)
}

function onSet() {
  ensureDetails()
  void nextTick(openMenu)
}

function onUnset() {
  props.block.details.value = imageUrl.value
}

function getTextContent() {
  return imageUrl.value
}

function getHtmlContent() {
  return imageUrl.value
}

function moveToStart() {
  openMenu()
}

function moveToEnd() {
  openMenu()
}

ensureDetails()

defineExpose({
  onSet,
  onUnset,
  getTextContent,
  getHtmlContent,
  moveToStart,
  moveToEnd,
})
</script>

<template>
  <div
    ref="blockRef"
    class="image-block"
    @keydown.stop
    @mousedown.stop
    @pointerdown.stop
    @click.stop
  >
    <input
      ref="fileInputRef"
      class="image-file-input"
      type="file"
      accept="image/*"
      @change="handleFileChange"
    >

    <div v-if="imageUrl" class="image-content">
      <div
        ref="imageFrameRef"
        class="image-frame"
        :style="{ width: `${imageWidthPercent}%` }"
      >
        <img class="image-preview" :src="imageUrl" alt="">
        <button
          class="image-resize-handle left"
          type="button"
          aria-label="Resize image from left"
          @pointerdown="startResize('left', $event)"
        />
        <button
          class="image-resize-handle right"
          type="button"
          aria-label="Resize image from right"
          @pointerdown="startResize('right', $event)"
        />
      </div>
    </div>

    <div v-else class="image-empty">
      <button
        ref="emptyButtonRef"
        class="image-empty-button"
        type="button"
        @click="openMenu"
      >
        <v-icon name="bi-image" />
        <span>add an image</span>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="isMenuOpen"
        class="image-menu"
        :style="{ left: `${menuPosition.left}px`, top: `${menuPosition.top}px` }"
        @mousedown.capture.stop
        @pointerdown.capture.stop
        @click.capture.stop
        @keydown.capture.stop
      >
        <div class="image-menu-tabs" role="tablist">
          <button
            type="button"
            :class="{ active: activeTab === 'upload' }"
            @click="activeTab = 'upload'"
          >
            Upload
          </button>
          <button
            type="button"
            :class="{ active: activeTab === 'link' }"
            @click="activeTab = 'link'"
          >
            Link
          </button>
        </div>

        <div v-if="activeTab === 'upload'" class="image-menu-panel">
          <button class="image-menu-primary" type="button" @click="triggerUpload">
            Upload file
          </button>
        </div>

        <div v-else class="image-menu-panel image-link-panel">
          <input
            v-model="linkedImageUrl"
            type="url"
            placeholder="https://example.com/image.png"
            spellcheck="false"
            @mousedown.stop
            @pointerdown.stop
            @click.stop
            @input.stop
            @keydown.enter.prevent="confirmLinkedImage"
          >
          <button
            class="image-menu-primary"
            type="button"
            :disabled="!isLinkedImageUrlValid"
            @click="confirmLinkedImage"
          >
            Confirm
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.image-block {
  position: relative;
  width: 100%;
  min-height: 48px;
  padding: 10px 0;
}

.image-file-input {
  display: none;
}

.image-empty {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

.image-empty-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
  background: #ffffff;
  color: #667085;
  font: inherit;
  font-size: 15px;
}

.image-empty-button:hover {
  background: #f8f9fb;
  color: #344054;
}

.image-empty-button svg {
  width: 21px;
  height: 21px;
}

.image-content {
  display: flex;
  justify-content: center;
}

.image-frame {
  position: relative;
  max-width: 100%;
}

.image-preview {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 6px;
}

.image-resize-handle {
  position: absolute;
  top: 50%;
  width: 10px;
  height: max(15%, 100px);
  min-height: 100px;
  max-height: 100%;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #2f6fed;
  opacity: 0;
  cursor: ew-resize;
  transform: translateY(-50%);
  transition: opacity 120ms ease;
}

.image-frame:hover .image-resize-handle,
.image-resize-handle:focus-visible {
  opacity: 1;
}

.image-resize-handle.left {
  left: -5px;
}

.image-resize-handle.right {
  right: -5px;
}

.image-menu {
  position: fixed;
  z-index: 2200;
  width: min(360px, calc(100vw - 48px));
  padding: 8px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.16);
  transform: translateX(-50%);
}

.image-menu-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding: 2px;
  border-radius: 7px;
  background: #f2f4f7;
}

.image-menu-tabs button,
.image-menu-primary {
  height: 34px;
  border: 0;
  border-radius: 6px;
  font: inherit;
  font-size: 14px;
}

.image-menu-tabs button {
  background: transparent;
  color: #667085;
}

.image-menu-tabs button.active {
  background: #ffffff;
  color: #1f2328;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.image-menu-panel {
  display: grid;
  gap: 8px;
  padding-top: 10px;
}

.image-link-panel {
  grid-template-columns: minmax(0, 1fr) auto;
}

.image-link-panel input {
  min-width: 0;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  font: inherit;
  font-size: 14px;
  outline: 0;
}

.image-link-panel input:focus {
  border-color: #2f6fed;
  box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.12);
}

.image-menu-primary {
  padding: 0 12px;
  background: #1f2328;
  color: #ffffff;
}

.image-menu-primary:hover {
  background: #343942;
}

.image-menu-primary:disabled {
  background: #d0d5dd;
  color: #667085;
  cursor: not-allowed;
}
</style>
