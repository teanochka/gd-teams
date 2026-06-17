<script setup lang="ts">
import { computed } from "vue";
import IconDocument from "~icons/carbon/document";
import IconFolder from "~icons/carbon/folder";
import IconPaintBrush from "~icons/carbon/paint-brush";
import IconStar from "~icons/carbon/star";
import IconStarFilled from "~icons/carbon/star-filled";
import IconTag from "~icons/carbon/tag";
import IconTemplate from "~icons/carbon/template";
import { useInlineTitleEdit } from "@/composables/useInlineTitleEdit";
import type { NodeId, WorkspaceItem } from "@/types/domain";
import { formatDateTime } from "@/utils/formatDate";

type WorkspaceItemSelectPayload = {
  id: NodeId;
  event: MouseEvent;
};

const props = defineProps<{
  item: WorkspaceItem;
  selected: boolean;
  typeLabel: string;
  editing?: boolean;
  draftName?: string;
  isSavingName?: boolean;
}>();

const emit = defineEmits<{
  (event: "select", payload: WorkspaceItemSelectPayload): void;
  (event: "open", item: WorkspaceItem): void;
  (event: "toggle-favorite", item: WorkspaceItem): void;
  (event: "update:draftName", value: string): void;
  (event: "finish-name"): void;
  (event: "cancel-name"): void;
}>();

const isEditing = computed(() => props.editing ?? false);
const currentDraftName = computed({
  get: () => props.draftName ?? props.item.name,
  set: (value: string) => emit("update:draftName", value),
});

const { inputRef } = useInlineTitleEdit({
  isEditing,
  isBusy: computed(() => props.isSavingName ?? false),
  onCommit: () => emit("finish-name"),
});

const handleClick = (event: MouseEvent) => {
  if (isEditing.value) {
    return;
  }

  emit("select", { id: props.item.id, event });
};

const handleDoubleClick = () => {
  if (isEditing.value) {
    return;
  }

  emit("open", props.item);
};
</script>

<template>
  <button
    class="workspace-list-item"
    :class="{ selected, editing: isEditing }"
    type="button"
    @click="handleClick"
    @dblclick="handleDoubleClick"
  >
    <span class="item-icon" :class="item.type">
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
        <IconStarFilled
          v-if="item.isFavorite"
          aria-hidden="true"
          class="star-filled"
        />
        <IconStar v-else aria-hidden="true" />
      </button>
    </span>

    <span class="item-main">
      <span class="item-name-shell">
        <input
          v-if="isEditing"
          ref="inputRef"
          v-model="currentDraftName"
          class="form-control item-title-input"
          :disabled="isSavingName"
          @click.stop
          @keydown.enter.prevent="emit('finish-name')"
          @keydown.esc.prevent="emit('cancel-name')"
        />
        <strong v-else>{{ item.name }}</strong>
      </span>
      <span>{{ typeLabel }}</span>
    </span>

    <span class="item-tags">
      <BBadge v-for="tag in item.tags" :key="tag" variant="light">
        <IconTag aria-hidden="true" />
        {{ tag }}
      </BBadge>
    </span>

    <span class="item-date">{{ formatDateTime(item.updatedAt) }}</span>
  </button>
</template>

<style scoped>
.workspace-list-item {
  display: grid;
  grid-template-columns: 42px minmax(170px, 1.2fr) minmax(120px, 1fr) minmax(
      120px,
      auto
    );
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

.workspace-list-item.editing {
  border-color: #1f1f1f;
  background: #fafafa;
}

.item-icon {
  position: relative;
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

.favorite-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  display: none;
}

.workspace-list-item:hover .favorite-btn,
.favorite-btn.active {
  display: grid;
  place-items: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.favorite-btn:hover {
  color: #333;
}

.favorite-btn svg {
  width: 12px;
  height: 12px;
}

.star-filled {
  color: #f5b041;
}

.favorite-btn:hover .star-filled {
  color: #f39c12;
}

.item-main {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.item-name-shell {
  display: flex;
  align-items: center;
  min-height: 28px;
}

.item-main strong,
.item-title-input {
  display: block;
  width: 100%;
  height: 28px;
  min-width: 0;
  color: #161616;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.25;
}

.item-main strong {
  overflow: hidden;
  line-height: 28px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-title-input {
  padding: 0 8px;
  border-radius: 6px;
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
