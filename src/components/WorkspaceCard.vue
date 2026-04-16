<script setup lang="ts">
import IconDocument from '~icons/carbon/document'
import IconFolder from '~icons/carbon/folder'
import IconPaintBrush from '~icons/carbon/paint-brush'
import IconTemplate from '~icons/carbon/template'

type WorkspaceItemType = 'folder' | 'document' | 'canvas' | 'template'

type WorkspaceItem = {
  id: string
  name: string
  type: WorkspaceItemType
  tags: string[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

defineProps<{
  item: WorkspaceItem
  selected: boolean
}>()

const emit = defineEmits<{
  (event: 'select', id: string): void
  (event: 'open', item: WorkspaceItem): void
}>()
</script>

<template>
  <button
    class="workspace-card"
    :class="{ selected }"
    type="button"
    @click="emit('select', item.id)"
    @dblclick="emit('open', item)"
  >
    <span class="card-icon" :class="item.type">
      <IconFolder v-if="item.type === 'folder'" aria-hidden="true" />
      <IconDocument v-else-if="item.type === 'document'" aria-hidden="true" />
      <IconPaintBrush v-else-if="item.type === 'canvas'" aria-hidden="true" />
      <IconTemplate v-else aria-hidden="true" />
    </span>

    <span class="card-title">{{ item.name }}</span>
  </button>
</template>

<style scoped>
.workspace-card {
  display: grid;
  grid-template-rows: 76px minmax(36px, auto);
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

.card-icon {
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

.card-title {
  display: -webkit-box;
  width: 100%;
  overflow: hidden;
  color: #171717;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
