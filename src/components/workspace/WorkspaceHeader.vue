<script setup lang="ts">
import { useRouter } from "vue-router";
import IconArrowLeft from "~icons/carbon/arrow-left";
import IconArrowRight from "~icons/carbon/arrow-right";
import IconArrowUp from "~icons/carbon/arrow-up";
import IconChevronRight from "~icons/carbon/chevron-right";
import IconRenew from "~icons/carbon/renew";
import WorkspaceSearch from "@/components/WorkspaceSearch.vue";

const props = defineProps<{
  breadcrumbs: string[];
  tags: { id: string; name: string }[];
  users: string[];
  parentUrl?: string | null;
}>();

const emit = defineEmits<{
  (event: "reload"): void;
}>();

const search = defineModel<string>({ default: "" });
const router = useRouter();

const goUp = () => {
  if (props.parentUrl) {
    router.push(props.parentUrl);
  }
};
</script>

<template>
  <header class="workspace-header">
    <BButtonGroup class="navigation-buttons" aria-label="Навигация">
      <BButton variant="light" aria-label="Назад" @click="router.back()">
        <IconArrowLeft aria-hidden="true" />
      </BButton>
      <BButton variant="light" aria-label="Вперед" @click="router.forward()">
        <IconArrowRight aria-hidden="true" />
      </BButton>
      <BButton
        variant="light"
        aria-label="Вверх"
        :disabled="!parentUrl"
        @click="goUp"
      >
        <IconArrowUp aria-hidden="true" />
      </BButton>
      <BButton
        variant="light"
        aria-label="Перезагрузить"
        @click="emit('reload')"
      >
        <IconRenew aria-hidden="true" />
      </BButton>
    </BButtonGroup>

    <nav class="directory-path" aria-label="Текущая директория">
      <span
        v-for="(crumb, index) in breadcrumbs"
        :key="`${crumb}-${index}`"
        class="path-item"
      >
        <span>{{ crumb }}</span>
        <IconChevronRight
          v-if="index < breadcrumbs.length - 1"
          aria-hidden="true"
        />
      </span>
    </nav>

    <WorkspaceSearch
      v-model="search"
      class="workspace-search"
      :tags="tags"
      :users="users"
    />
  </header>
</template>

<style scoped>
.workspace-header {
  display: grid;
  grid-template-columns: auto minmax(220px, 1fr) minmax(220px, 360px);
  align-items: center;
  gap: 14px;
  min-height: 72px;
  padding: 14px 18px;
  border-bottom: 1px solid #dcdcdc;
  background: #ffffff;
}

.navigation-buttons {
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  overflow: hidden;
}

.navigation-buttons :deep(.btn) {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #ffffff;
  color: #1c1c1c;
}

.navigation-buttons :deep(.btn:hover) {
  background: #f1f1f1;
}

.directory-path {
  display: flex;
  align-items: center;
  min-height: 42px;
  min-width: 0;
  overflow: hidden;
  padding: 0 12px;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  background: #f8f8f8;
  color: #1c1c1c;
}

.path-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: #343434;
  font-size: 14px;
  white-space: nowrap;
}

.path-item span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.path-item:last-child {
  color: #121212;
  font-weight: 650;
}

.path-item svg {
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  color: #777777;
}

.workspace-search :deep(.input-group-text) {
  border-color: #d4d4d4;
  border-radius: 8px 0 0 8px;
  background: #f7f7f7;
  color: #5b5b5b;
}

.workspace-search :deep(.form-control) {
  min-height: 42px;
  border-color: #d4d4d4;
  border-radius: 0 8px 8px 0;
}

.workspace-search :deep(.form-control:focus) {
  border-color: #7a7a7a;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
}

@media (max-width: 980px) {
  .workspace-header {
    grid-template-columns: auto 1fr;
  }

  .workspace-search {
    grid-column: 1 / -1;
  }
}

@media (max-width: 620px) {
  .workspace-header {
    grid-template-columns: 1fr;
  }

  .navigation-buttons {
    width: max-content;
  }
}
</style>
