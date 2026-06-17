<script setup lang="ts">
import { computed } from "vue";
import IconCalendar from "~icons/carbon/calendar";
import IconDocument from "~icons/carbon/document";
import IconFolder from "~icons/carbon/folder";
import IconInformation from "~icons/carbon/information";
import IconPaintBrush from "~icons/carbon/paint-brush";
import IconTag from "~icons/carbon/tag";
import IconTemplate from "~icons/carbon/template";
import IconUserAvatar from "~icons/carbon/user-avatar";
import { formatDateTime } from "@/utils/formatDate";

type WorkspaceItemType = "folder" | "document" | "canvas" | "template";

type WorkspaceDetails = {
  id: string;
  name: string;
  type: WorkspaceItemType;
  tags: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

const props = defineProps<{
  item?: WorkspaceDetails | null;
  currentDirectory: WorkspaceDetails;
}>();

const details = computed(() => props.item ?? props.currentDirectory);
const heading = computed(() =>
  props.item ? "Сведения" : "Текущая директория",
);
const typeLabel = computed(() => {
  const labels: Record<WorkspaceItemType, string> = {
    folder: "Папка",
    document: "Документ",
    canvas: "Холст",
    template: "Шаблон",
  };

  return labels[details.value.type];
});
</script>

<template>
  <aside class="workspace-right-sidebar" aria-label="Сведения">
    <div class="details-heading">
      <IconInformation aria-hidden="true" />
      <h2>{{ heading }}</h2>
    </div>

    <div class="details-icon" :class="details.type">
      <IconFolder v-if="details.type === 'folder'" aria-hidden="true" />
      <IconDocument
        v-else-if="details.type === 'document'"
        aria-hidden="true"
      />
      <IconPaintBrush
        v-else-if="details.type === 'canvas'"
        aria-hidden="true"
      />
      <IconTemplate v-else aria-hidden="true" />
    </div>

    <div class="details-name">
      <span>{{ typeLabel }}</span>
      <strong>{{ details.name }}</strong>
    </div>

    <section class="details-section">
      <h3>
        <IconTag aria-hidden="true" />
        Тэги
      </h3>
      <div class="tag-list">
        <BBadge v-for="tag in details.tags" :key="tag" variant="light">{{
          tag
        }}</BBadge>
        <span v-if="!details.tags.length" class="muted">Нет тэгов</span>
      </div>
    </section>

    <section class="details-section">
      <h3>
        <IconCalendar aria-hidden="true" />
        Даты
      </h3>
      <dl>
        <div>
          <dt>Создано</dt>
          <dd>{{ formatDateTime(details.createdAt) }}</dd>
        </div>
        <div>
          <dt>Изменено</dt>
          <dd>{{ formatDateTime(details.updatedAt) }}</dd>
        </div>
      </dl>
    </section>

    <section class="details-section">
      <h3>
        <IconUserAvatar aria-hidden="true" />
        Участники
      </h3>
      <dl>
        <div>
          <dt>Кем создан</dt>
          <dd>{{ details.createdBy }}</dd>
        </div>
        <div>
          <dt>Кем изменен</dt>
          <dd>{{ details.updatedBy }}</dd>
        </div>
      </dl>
    </section>
  </aside>
</template>

<style scoped>
.workspace-right-sidebar {
  width: 292px;
  min-width: 292px;
  padding: 20px;
  border-left: 1px solid #dcdcdc;
  background: #fafafa;
}

.details-heading,
.details-name,
.details-section h3,
.details-section dl div {
  display: flex;
  align-items: center;
}

.details-heading {
  gap: 8px;
  margin-bottom: 22px;
  color: #333333;
}

.details-heading h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 750;
}

.details-heading svg {
  width: 18px;
  height: 18px;
}

.details-icon {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  margin-bottom: 14px;
  border: 1px solid #d2d2d2;
  border-radius: 8px;
  background: #ffffff;
  color: #1f1f1f;
}

.details-icon svg {
  width: 38px;
  height: 38px;
}

.details-name {
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  margin-bottom: 24px;
}

.details-name span {
  color: #747474;
  font-size: 12px;
}

.details-name strong {
  max-width: 100%;
  overflow-wrap: anywhere;
  color: #151515;
  font-size: 20px;
  font-weight: 750;
  line-height: 1.25;
}

.details-section {
  padding: 18px 0;
  border-top: 1px solid #dedede;
}

.details-section h3 {
  gap: 8px;
  margin: 0 0 12px;
  color: #3c3c3c;
  font-size: 13px;
  font-weight: 750;
}

.details-section h3 svg {
  width: 16px;
  height: 16px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-list :deep(.badge) {
  border: 1px solid #d8d8d8;
  color: #343434;
  font-weight: 650;
}

.muted {
  color: #777777;
  font-size: 13px;
}

dl {
  display: grid;
  gap: 12px;
  margin: 0;
}

.details-section dl div {
  align-items: flex-start;
  flex-direction: column;
  gap: 2px;
}

dt {
  color: #777777;
  font-size: 12px;
  font-weight: 500;
}

dd {
  margin: 0;
  color: #202020;
  font-size: 14px;
}

@media (max-width: 1180px) {
  .workspace-right-sidebar {
    width: 100%;
    min-width: 0;
    border-left: 0;
    border-top: 1px solid #dcdcdc;
  }
}
</style>
