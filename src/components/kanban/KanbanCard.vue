<script setup lang="ts">
import { computed, ref, watch } from "vue";
import IconCheckmarkFilled from "~icons/carbon/checkmark-filled";
import IconCopy from "~icons/carbon/copy";
import IconEdit from "~icons/carbon/edit";
import IconFlagFilled from "~icons/carbon/flag-filled";
import IconOverflowMenuHorizontal from "~icons/carbon/overflow-menu-horizontal";
import IconPaintBrush from "~icons/carbon/paint-brush";
import IconTrashCan from "~icons/carbon/trash-can";
import IconUserAvatarFilled from "~icons/carbon/user-avatar-filled";
import ColorPaletteMenu from "@/components/shared/ColorPaletteMenu.vue";
import { useInlineTitleEdit } from "@/composables/useInlineTitleEdit";
import type { KanbanMember, KanbanPriority, KanbanTask } from "@/types/domain";

const priorityClasses: Record<KanbanPriority, string> = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical",
};

const props = defineProps<{
  task: KanbanTask;
  assignee: KanbanMember | null;
  done?: boolean;
  coverColors: Array<{ name: string; value: string }>;
}>();

const emit = defineEmits<{
  open: [taskId: string];
  rename: [taskId: string, title: string];
  delete: [taskId: string];
  copyLink: [taskId: string];
  setCover: [taskId: string, color: string];
}>();

const isRenaming = ref(false);
const draftTitle = ref(props.task.title);
const isSavingTitle = ref(false);

const priorityClass = computed(() => priorityClasses[props.task.priority]);
const assigneeInitials = computed(() => {
  if (!props.assignee?.name) {
    return "??";
  }

  return props.assignee.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

watch(
  () => props.task.title,
  (title) => {
    if (!isRenaming.value) {
      draftTitle.value = title;
    }
  },
);

const startRename = () => {
  isRenaming.value = true;
  draftTitle.value = props.task.title;
};

const finishRename = () => {
  if (!isRenaming.value || isSavingTitle.value) {
    return;
  }

  const nextTitle = draftTitle.value.trim();

  if (nextTitle && nextTitle !== props.task.title) {
    emit("rename", props.task.id, nextTitle);
  }

  draftTitle.value = nextTitle || props.task.title;
  isRenaming.value = false;
};

const cancelRename = () => {
  draftTitle.value = props.task.title;
  isRenaming.value = false;
};

const { inputRef: titleInput } = useInlineTitleEdit({
  isEditing: isRenaming,
  isBusy: isSavingTitle,
  onCommit: finishRename,
});
</script>

<template>
  <article class="kanban-card" @click="emit('open', task.id)">
    <div
      v-if="task.coverColor"
      class="card-cover"
      :style="{ backgroundColor: task.coverColor }"
    />

    <BDropdown
      variant="link"
      toggle-class="card-menu-toggle"
      class="card-menu"
      no-caret
      @click.stop
    >
      <template #button-content>
        <IconOverflowMenuHorizontal aria-hidden="true" />
      </template>
      <BDropdownItem @click="startRename">
        <IconEdit aria-hidden="true" />
        Переименовать
      </BDropdownItem>
      <BDropdownItem @click="emit('copyLink', task.id)">
        <IconCopy aria-hidden="true" />
        Копировать ссылку
      </BDropdownItem>
      <BDropdownText>
        <div class="cover-menu-title">
          <IconPaintBrush aria-hidden="true" />
          Добавить обложку
        </div>
        <ColorPaletteMenu
          :colors="coverColors"
          :selected-color="task.coverColor"
          @select="emit('setCover', task.id, $event)"
        />
      </BDropdownText>
      <BDropdownDivider />
      <BDropdownItem class="danger-item" @click="emit('delete', task.id)">
        <IconTrashCan aria-hidden="true" />
        Удалить
      </BDropdownItem>
    </BDropdown>

    <input
      v-if="isRenaming"
      ref="titleInput"
      v-model="draftTitle"
      class="form-control task-title-input"
      @click.stop
      @keydown.enter.prevent="finishRename"
      @keydown.esc.prevent="cancelRename"
    />
    <h3 v-else>{{ task.title }}</h3>

    <div class="card-footer">
      <span class="task-key">{{ task.key }}</span>
      <div class="task-signals">
        <IconCheckmarkFilled
          v-if="done"
          class="done-icon"
          aria-label="Готово"
        />
        <IconFlagFilled
          class="priority-icon"
          :class="priorityClass"
          :aria-label="task.priority"
        />
        <span
          class="assignee-avatar"
          :style="{ backgroundColor: assignee?.color ?? '#d8d8d8' }"
          :title="assignee?.name ?? 'Нет исполнителя'"
        >
          <IconUserAvatarFilled aria-hidden="true" />
          <span>{{ assigneeInitials }}</span>
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.kanban-card {
  position: relative;
  overflow: hidden;
  min-height: 116px;
  padding: 14px;
  border: 1px solid #d8d8d8;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.kanban-card:hover {
  border-color: #aeb4bd;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.card-cover {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 5px;
}

.card-menu {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.14s ease;
}

.kanban-card:hover .card-menu,
.card-menu.show {
  opacity: 1;
}

.card-menu :deep(.dropdown-menu) {
  min-width: 220px;
  border-color: #d9dde3;
  border-radius: 8px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.14);
}

.card-menu :deep(.dropdown-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
}

.card-menu-toggle {
  display: grid !important;
  place-items: center;
  width: 30px;
  height: 30px !important;
  padding: 0 !important;
  border: 1px solid #d7dce3 !important;
  border-radius: 7px !important;
  background: #ffffff !important;
  color: #1f2328 !important;
}

.cover-menu-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #343942;
  font-size: 13px;
  font-weight: 650;
}

.danger-item {
  color: #b42318;
}

.kanban-card h3 {
  margin: 0 32px 24px 0;
  color: #172033;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
}

.task-title-input {
  width: calc(100% - 38px);
  min-height: 34px;
  margin-bottom: 18px;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 700;
}

.card-footer,
.task-signals,
.assignee-avatar {
  display: flex;
  align-items: center;
}

.card-footer {
  justify-content: space-between;
  gap: 12px;
}

.task-key {
  color: #707782;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.task-signals {
  gap: 8px;
}

.priority-icon {
  width: 15px;
  height: 15px;
}

.priority-icon.low {
  color: #64748b;
}

.priority-icon.medium {
  color: #2f6fed;
}

.priority-icon.high {
  color: #c47900;
}

.priority-icon.critical {
  color: #d92d20;
}

.done-icon {
  width: 16px;
  height: 16px;
  color: #16803c;
}

.assignee-avatar {
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  color: #ffffff;
  font-size: 9px;
  font-weight: 800;
}

.assignee-avatar svg {
  display: none;
}
</style>
