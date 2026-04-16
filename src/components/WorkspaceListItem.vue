<script setup lang="ts">
import IconDocument from '~icons/carbon/document'
import IconFolder from '~icons/carbon/folder'
import IconPaintBrush from '~icons/carbon/paint-brush'
import IconTag from '~icons/carbon/tag'
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
  typeLabel: string
}>()

const emit = defineEmits<{
  (event: 'select', id: string): void
  (event: 'open', item: WorkspaceItem): void
}>()
</script>

<template>
  <button
    class="workspace-list-item"
    :class="{ selected }"
    type="button"
    @click="emit('select', item.id)"
    @dblclick="emit('open', item)"
  >
    <span class="item-icon" :class="item.type">
      <IconFolder v-if="item.type === 'folder'" aria-hidden="true" />
      <IconDocument v-else-if="item.type === 'document'" aria-hidden="true" />
      <IconPaintBrush v-else-if="item.type === 'canvas'" aria-hidden="true" />
      <IconTemplate v-else aria-hidden="true" />
    </span>

    <span class="item-main">
      <strong>{{ item.name }}</strong>
      <span>{{ typeLabel }}</span>
    </span>

    <span class="item-tags">
      <BBadge v-for="tag in item.tags" :key="tag" variant="light">
        <IconTag aria-hidden="true" />
        {{ tag }}
      </BBadge>
    </span>

    <span class="item-date">{{ item.updatedAt }}</span>
  </button>
</template>

<style scoped>
.workspace-list-item {
  display: grid;
  grid-template-columns: 42px minmax(170px, 1.2fr) minmax(120px, 1fr) minmax(120px, auto);
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 62px;
  padding: 10px 12px;
  border: 1px solid #dddddd;
  border-radius: 8px;
  background: #ffffff;
  color: #222222;
  font: inherit;
  text-align: left;
}

.workspace-list-item:hover {
  border-color: #b7b7b7;
  background: #fafafa;
}

.workspace-list-item.selected {
  border-color: #1f1f1f;
  background: #f1f1f1;
  box-shadow: inset 0 0 0 1px #1f1f1f;
}

.item-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  background: #f7f7f7;
  color: #191919;
}

.item-icon svg {
  width: 23px;
  height: 23px;
}

.item-main {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.item-main strong {
  min-width: 0;
  overflow: hidden;
  color: #161616;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-main span,
.item-date {
  color: #707070;
  font-size: 13px;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.item-tags :deep(.badge) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #d8d8d8;
  color: #343434;
  font-weight: 650;
}

.item-tags svg {
  width: 12px;
  height: 12px;
}

.item-date {
  justify-self: end;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .workspace-list-item {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .item-tags,
  .item-date {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
