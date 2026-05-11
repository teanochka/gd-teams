<script setup lang="ts">
import { computed } from 'vue'
import IconDocument from '~icons/carbon/document'
import IconFolder from '~icons/carbon/folder'
import IconPaintBrush from '~icons/carbon/paint-brush'
import IconStar from '~icons/carbon/star'
import IconStarFilled from '~icons/carbon/star-filled'
import IconTemplate from '~icons/carbon/template'
import { useInlineTitleEdit } from '@/composables/useInlineTitleEdit'
import type { NodeId, WorkspaceItem } from '@/types/domain'

type WorkspaceItemSelectPayload = {
  id: NodeId
  event: MouseEvent
}

const props = defineProps<{
  item: WorkspaceItem
  selected: boolean
  editing?: boolean
  draftName?: string
  isSavingName?: boolean
}>()

const emit = defineEmits<{
  (event: 'select', payload: WorkspaceItemSelectPayload): void
  (event: 'open', item: WorkspaceItem): void
  (event: 'toggle-favorite', item: WorkspaceItem): void
  (event: 'update:draftName', value: string): void
  (event: 'finish-name'): void
  (event: 'cancel-name'): void
}>()

const isEditing = computed(() => props.editing ?? false)
const currentDraftName = computed({
  get: () => props.draftName ?? props.item.name,
  set: (value: string) => emit('update:draftName', value),
})

const { inputRef } = useInlineTitleEdit({
  isEditing,
  isBusy: computed(() => props.isSavingName ?? false),
  onCommit: () => emit('finish-name'),
})

const handleClick = (event: MouseEvent) => {
  if (isEditing.value) {
    return
  }

  emit('select', { id: props.item.id, event })
}

const handleDoubleClick = () => {
  if (isEditing.value) {
    return
  }

  emit('open', props.item)
}
</script>

<template>
  <button
    class="workspace-card"
    :class="{ selected, editing: isEditing }"
    type="button"
    @click="handleClick"
    @dblclick="handleDoubleClick"
  >
    <span class="card-icon" :class="item.type">
      <IconFolder v-if="item.type === 'folder'" aria-hidden="true" />
      <IconDocument v-else-if="item.type === 'document'" aria-hidden="true" />
      <IconPaintBrush v-else-if="item.type === 'canvas'" aria-hidden="true" />
      <IconTemplate v-else aria-hidden="true" />
      <button 
        class="favorite-btn" 
        :class="{ active: item.isFavorite }" 
        @click.stop="emit('toggle-favorite', item)"
        type="button"
      >
        <IconStarFilled v-if="item.isFavorite" aria-hidden="true" class="star-filled" />
        <IconStar v-else aria-hidden="true" />
      </button>
    </span>

    <span class="card-title-shell">
      <input
        v-if="isEditing"
        ref="inputRef"
        v-model="currentDraftName"
        class="form-control card-title-input"
        :disabled="isSavingName"
        @click.stop
        @keydown.enter.prevent="emit('finish-name')"
        @keydown.esc.prevent="emit('cancel-name')"
      />
      <span v-else class="card-title">{{ item.name }}</span>
    </span>
  </button>
</template>

<style scoped>
.workspace-card {
  display: grid;
  grid-template-rows: 76px 36px;
  justify-items: center;
  gap: 10px;
  width: 100%;
  min-height: 136px;
  padding: 16px 12px 14px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #ffffff;
  color: #202020;
  font: inherit;
  text-align: center;
}

.workspace-card:hover {
  border-color: #d8d8d8;
  background: #fafafa;
}

.workspace-card.selected {
  border-color: #1f1f1f;
  background: #f1f1f1;
  box-shadow: inset 0 0 0 1px #1f1f1f;
}

.workspace-card.editing {
  border-color: #1f1f1f;
  background: #fafafa;
}

.card-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  background: #f7f7f7;
  color: #191919;
}

.card-icon svg {
  width: 42px;
  height: 42px;
}

.favorite-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  display: none;
}

.workspace-card:hover .favorite-btn, .favorite-btn.active {
  display: grid;
  place-items: center;
}

.favorite-btn:hover {
  color: #333;
}

.favorite-btn svg {
  width: 16px;
  height: 16px;
}

.star-filled {
  color: #f5b041;
}

.favorite-btn:hover .star-filled {
  color: #f39c12;
}

.card-title-shell {
  display: grid;
  align-items: center;
  width: 100%;
  height: 36px;
}

.card-title,
.card-title-input {
  width: 100%;
  height: 36px;
  min-width: 0;
  color: #171717;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
}

.card-title {
  display: -webkit-box;
  overflow: hidden;
  height: auto;
  max-height: 36px;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-title-input {
  padding: 0 8px;
  border-radius: 6px;
  text-align: center;
}
</style>
