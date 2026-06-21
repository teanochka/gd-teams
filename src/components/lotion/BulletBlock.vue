<script setup lang="ts">
import { nextTick, onMounted, ref, watch, type PropType } from "vue";
import { types } from "@dashibase/lotion";

type BulletBlock = types.Block & {
  details: types.Details;
};

const props = defineProps({
  block: {
    type: Object as PropType<BulletBlock>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const editorRef = ref<HTMLDivElement | null>(null);

const getText = () => props.block.details.value ?? "";

function ensureDetails() {
  props.block.details.value = props.block.details.value ?? "";
}

function setEditorText(value = getText()) {
  const editor = editorRef.value;

  if (!editor || editor.textContent === value) {
    return;
  }

  editor.textContent = value;
}

function focusInput(position: "start" | "end" = "end") {
  void nextTick(() => {
    const editor = editorRef.value;

    if (!editor) {
      return;
    }

    setEditorText();

    const textNode = editor.firstChild ?? editor;
    const caretPosition = position === "start" ? 0 : getText().length;
    const range = document.createRange();
    const selection = window.getSelection();

    range.setStart(
      textNode,
      Math.min(caretPosition, textNode.textContent?.length ?? 0),
    );
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    editor.focus();
  });
}

function onSet() {
  ensureDetails();
  focusInput("end");
}

function onUnset() {
  syncTextFromEditor();
}

function getTextContent() {
  return getText();
}

function getHtmlContent() {
  return getText();
}

function moveToStart() {
  focusInput("start");
}

function moveToEnd() {
  focusInput("end");
}

function syncTextFromEditor() {
  props.block.details.value = editorRef.value?.textContent ?? "";
}

defineExpose({
  onSet,
  onUnset,
  getTextContent,
  getHtmlContent,
  moveToStart,
  moveToEnd,
});

onMounted(() => {
  ensureDetails();
  setEditorText();
});

watch(
  () => props.block.id,
  () => {
    void nextTick(() => {
      ensureDetails();
      setEditorText();
    });
  },
);

watch(
  () => props.block.details.value,
  (value) => {
    if (document.activeElement === editorRef.value) {
      return;
    }

    setEditorText(value ?? "");
  },
);
</script>

<template>
  <div
    ref="editorRef"
    class="bullet-block"
    :contenteditable="!readonly"
    data-placeholder="List item"
    spellcheck="true"
    role="textbox"
    tabindex="-1"
    @input="syncTextFromEditor"
    @blur="syncTextFromEditor"
  />
</template>

<style scoped>
.bullet-block {
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 32px;
  padding-left: 30px;
  color: #1f2328;
  font: inherit;
  line-height: 1.5;
  outline: 0;
  white-space: pre-wrap;
}

.bullet-block::before {
  position: absolute;
  top: 12px;
  left: 7px;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #1f2328;
  content: "";
}
</style>
