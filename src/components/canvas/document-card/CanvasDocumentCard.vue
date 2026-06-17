<script setup lang="ts">
import { computed, watch } from "vue";
import IconDocument from "~icons/carbon/document";
import CanvasCardBlockRenderer from "@/components/canvas/document-card/CanvasCardBlockRenderer.vue";
import { useDocumentsStore } from "@/stores/documents";
import type { CanvasElement } from "@/types/canvas";
import type { LotionBlock } from "@/types/domain";

const props = defineProps<{
  element: CanvasElement;
}>();

const documentsStore = useDocumentsStore();

const documentId = computed(() => {
  return typeof props.element.documentId === "string"
    ? props.element.documentId
    : "";
});
const projectId = computed(() => {
  return typeof props.element.projectId === "string"
    ? props.element.projectId
    : "";
});
const sourcePage = computed(() =>
  documentId.value
    ? (documentsStore.pagesById[documentId.value] ?? null)
    : null,
);
const isLoading = computed(() =>
  documentId.value
    ? Boolean(documentsStore.isLoadingById[documentId.value])
    : false,
);
const error = computed(() =>
  documentId.value
    ? (documentsStore.errorById[documentId.value] ?? null)
    : null,
);
const title = computed(
  () => sourcePage.value?.name || props.element.title || "Документ",
);

const stripHtml = (value: string) => {
  return value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
};

const isBlockEmpty = (block: LotionBlock) => {
  if (block.type === "IMAGE") {
    return (
      typeof block.details.imageUrl !== "string" ||
      block.details.imageUrl.length === 0
    );
  }

  if (block.type === "TABLE" && block.details.table) {
    return block.details.table.rows.every((row) =>
      row.every((cell) => stripHtml(cell).length === 0),
    );
  }

  const value = block.details.value;

  return typeof value !== "string" || stripHtml(value).length === 0;
};

const cardBlocks = computed(() => {
  const page = sourcePage.value;

  if (!page) {
    return [];
  }

  const selectedCardBlocks = (page.card?.blockIds ?? [])
    .map((blockId) => page.blocks.find((block) => block.id === blockId) ?? null)
    .filter((block): block is LotionBlock => block !== null);

  if (selectedCardBlocks.length) {
    return selectedCardBlocks;
  }

  return page.blocks.filter((block) => !isBlockEmpty(block));
});

watch(
  [documentId, projectId],
  async ([nextDocumentId, nextProjectId]) => {
    if (!nextDocumentId || !nextProjectId) {
      return;
    }

    await documentsStore.loadDocument(nextDocumentId, nextProjectId);
  },
  { immediate: true },
);
</script>

<template>
  <article class="canvas-document-card">
    <header class="document-card-header">
      <IconDocument aria-hidden="true" />
      <strong>{{ title }}</strong>
      <span>Карточка</span>
    </header>

    <div class="document-card-body">
      <div v-if="isLoading" class="document-card-state">Загрузка...</div>
      <div v-else-if="error" class="document-card-state error">{{ error }}</div>
      <div v-else-if="!cardBlocks.length" class="document-card-state">
        В карточке документа нет блоков
      </div>
      <div v-else class="document-card-blocks">
        <CanvasCardBlockRenderer
          v-for="block in cardBlocks"
          :key="block.id"
          :block="block"
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
.canvas-document-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid #d7dce3;
  border-radius: 8px;
  background: #ffffff;
  color: #171717;
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
  min-height: 0;
  overflow: auto;
  padding: 14px 16px 18px;
}

.document-card-blocks {
  display: grid;
  gap: 10px;
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
</style>
