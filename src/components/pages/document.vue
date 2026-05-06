<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Lotion } from "@dashibase/lotion";
import IconArrowLeft from "~icons/carbon/arrow-left";
import DocumentCover from "@/components/DocumentCover.vue";
import DocumentTemplatePrompt from "@/components/DocumentTemplatePrompt.vue";
import { useDocumentsStore } from "@/stores/documents";
import type { LotionBlock, LotionPage } from "@/types/domain";

const route = useRoute();
const router = useRouter();
const documentsStore = useDocumentsStore();

let canScheduleSave = false;
const isTemplatePromptDismissed = ref(false);
const isCardVisible = ref(false);
const draggedDocumentBlockId = ref<string | null>(null);

const projectId = computed(() => String(route.params.projectId ?? ""));
const documentId = computed(() => {
  const value = route.params.documentId;

  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
});

const page = computed(() => {
  return documentId.value ? documentsStore.pagesById[documentId.value] : null;
});

const isLoading = computed(() => {
  return documentId.value
    ? Boolean(documentsStore.isLoadingById[documentId.value])
    : false;
});

const isSaving = computed(() => {
  return documentId.value
    ? Boolean(documentsStore.isSavingById[documentId.value])
    : false;
});

const isDirty = computed(() => {
  return documentId.value
    ? Boolean(documentsStore.isDirtyById[documentId.value])
    : false;
});

const error = computed(() => {
  return documentId.value ? documentsStore.errorById[documentId.value] : null;
});

const stripHtml = (value: string) => {
  return value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
};

const isBlockEmpty = (block: LotionBlock) => {
  if (block.type === "TABLE" && block.details.table) {
    return block.details.table.rows.every((row) =>
      row.every((cell) => stripHtml(cell).length === 0),
    );
  }

  const value = block.details.value;

  return typeof value !== "string" || stripHtml(value).length === 0;
};

const isDocumentEmpty = computed(() => {
  if (!page.value) {
    return false;
  }

  return (
    page.value.blocks.length === 0 || page.value.blocks.every(isBlockEmpty)
  );
});

const shouldShowTemplatePrompt = computed(() => {
  return Boolean(
    page.value && isDocumentEmpty.value && !isTemplatePromptDismissed.value,
  );
});

const cardPage = computed<LotionPage | null>(() => {
  if (!page.value) {
    return null;
  }

  return {
    name: page.value.name,
    blocks: (page.value.card?.blockIds ?? [])
      .map(
        (blockId) =>
          page.value?.blocks.find((block) => block.id === blockId) ?? null,
      )
      .filter((block): block is LotionBlock => Boolean(block)),
  };
});

const getBlockIdFromDragTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const blockElement = target.closest<HTMLElement>('[id^="block-"]');

  return blockElement?.id.replace(/^block-/, "") ?? null;
};

const handleDocumentDragStart = (event: DragEvent) => {
  const blockId = getBlockIdFromDragTarget(event.target);

  if (!blockId) {
    return;
  }

  draggedDocumentBlockId.value = blockId;
  event.dataTransfer?.setData("text/plain", blockId);

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "copy";
  }
};

const handleDocumentDragEnd = () => {
  draggedDocumentBlockId.value = null;
};

const handleCardDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();

  const blockId =
    draggedDocumentBlockId.value ?? event.dataTransfer?.getData("text/plain");

  if (documentId.value && blockId) {
    documentsStore.addBlockToCard(documentId.value, blockId);
  }

  draggedDocumentBlockId.value = null;
};

const updateCover = (coverUrl: string) => {
  if (!page.value || !documentId.value) {
    return;
  }

  page.value.coverUrl = coverUrl;
  documentsStore.scheduleSave(documentId.value);
};

const removeCover = () => {
  if (!page.value || !documentId.value) {
    return;
  }

  delete page.value.coverUrl;
  documentsStore.scheduleSave(documentId.value);
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  void router.push({
    name: "project",
    params: { projectId: projectId.value },
  });
};

const applyTemplate = (templateId: string) => {
  if (templateId === "blank") {
    isTemplatePromptDismissed.value = true;
  }
};

const skipTemplatePrompt = () => {
  isTemplatePromptDismissed.value = true;
};

watch(
  [projectId, documentId],
  async ([nextProjectId, nextDocumentId]) => {
    canScheduleSave = false;
    isTemplatePromptDismissed.value = false;

    if (!nextProjectId || !nextDocumentId) {
      return;
    }

    await documentsStore.loadDocument(nextDocumentId, nextProjectId);
    await nextTick();
    canScheduleSave = true;
  },
  { immediate: true },
);

watch(
  page,
  () => {
    if (!canScheduleSave || !documentId.value || !page.value) {
      return;
    }

    documentsStore.scheduleSave(documentId.value);
  },
  { deep: true },
);

onBeforeUnmount(() => {
  canScheduleSave = false;

  if (documentId.value) {
    void documentsStore.flushDocument(documentId.value);
  }
});
</script>

<template>
  <main class="document-page">
    <button class="document-back-button" type="button" @click="goBack">
      <IconArrowLeft aria-hidden="true" />
      <span>Назад</span>
    </button>
    <p v-if="isLoading" class="document-state">Загрузка документа...</p>
    <p v-else-if="error" class="document-state document-state-error">
      {{ error }}
    </p>
    <template v-else-if="page">
      <div class="document-save-state" aria-live="polite">
        <span v-if="isSaving">Сохранение...</span>
        <span v-else-if="isDirty">Есть несохраненные изменения</span>
        <span v-else>Сохранено</span>
      </div>
      <button
        class="document-card-toggle"
        type="button"
        @click="isCardVisible = !isCardVisible"
      >
        {{ isCardVisible ? "Скрыть" : "Карточка" }}
      </button>
      <div
        class="document-workspace"
        :class="{ 'card-visible': isCardVisible }"
      >
        <section
          class="document-editor-shell"
          aria-label="Документ"
          @dragstart.capture="handleDocumentDragStart"
          @dragend.capture="handleDocumentDragEnd"
        >
          <DocumentCover
            :cover-url="page.coverUrl"
            @update-cover="updateCover"
            @remove-cover="removeCover"
          />
          <Lotion :page="page" />
        </section>

        <aside
          v-if="isCardVisible && cardPage"
          class="document-card-panel"
          aria-label="Карточка документа"
        >
          <Lotion :page="cardPage" />
          <div
            v-if="draggedDocumentBlockId"
            class="document-card-drop-overlay"
            @dragenter.prevent.stop
            @dragover.prevent.stop
            @drop="handleCardDrop"
          >
            <div>Отпустите, чтобы добавить в карточку</div>
          </div>
        </aside>
      </div>
      <DocumentTemplatePrompt
        v-if="shouldShowTemplatePrompt"
        @apply="applyTemplate"
        @skip="skipTemplatePrompt"
      />
    </template>
  </main>
</template>

<style scoped>
.document-page {
  position: relative;
  min-height: 100vh;
  background: #ffffff;
}

.document-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 32px;
  width: min(900px, calc(100% - 64px));
  margin: 0 auto;
  padding: 72px 0 64px;
}

.document-workspace.card-visible {
  grid-template-columns: minmax(0, 1fr) 320px;
  width: min(1240px, calc(100% - 64px));
}

.document-editor-shell {
  min-width: 0;
}

.document-card-panel {
  position: sticky;
  top: 72px;
  align-self: start;
  min-height: 420px;
  border: 1px solid #d9dde3;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.document-card-drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  place-items: center;
  border: 2px dashed #8aa4c8;
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.82);
  padding: 24px;
  text-align: center;
}

.document-card-panel :deep(.lotion h1) {
  margin-bottom: 24px;
  font-size: 26px;
  line-height: 1.2;
}

.document-back-button {
  position: fixed;
  top: 20px;
  left: 24px;
  z-index: 18;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d9dde3;
  border-radius: 6px;
  background: #ffffff;
  color: #1f2328;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.document-back-button:hover {
  background: #f8f9fb;
}

.document-back-button svg {
  width: 18px;
  height: 18px;
}

.document-card-toggle {
  position: fixed;
  top: 20px;
  right: 24px;
  z-index: 18;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  min-width: 88px;
  padding: 0 12px;
  border: 1px solid #d9dde3;
  border-radius: 6px;
  background: #ffffff;
  color: #1f2328;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.document-card-toggle:hover {
  background: #f8f9fb;
}

.document-state {
  margin: 0;
  padding: 48px;
  color: #6f7682;
}

.document-state-error {
  color: #b42318;
}

.document-save-state {
  position: fixed;
  right: 24px;
  bottom: 20px;
  z-index: 20;
  color: #7a828e;
  font-size: 13px;
  line-height: 1;
  pointer-events: none;
}

@media (max-width: 980px) {
  .document-workspace,
  .document-workspace.card-visible {
    grid-template-columns: 1fr;
    width: min(900px, calc(100% - 32px));
    gap: 24px;
    padding-top: 72px;
  }

  .document-card-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .document-back-button {
    left: 16px;
  }

  .document-card-toggle {
    right: 16px;
  }

  .document-workspace {
    width: calc(100% - 24px);
    padding-top: 68px;
  }
}
</style>
