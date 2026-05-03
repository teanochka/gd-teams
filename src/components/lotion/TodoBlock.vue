<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type PropType } from 'vue'
import { types } from '@dashibase/lotion'

type TodoDetails = types.Details & {
  checked?: boolean
}

type TodoBlock = types.Block & {
  details: TodoDetails
}

const props = defineProps({
  block: {
    type: Object as PropType<TodoBlock>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const editorRef = ref<HTMLDivElement | null>(null)

const checked = computed({
  get: () => Boolean(props.block.details.checked),
  set: (value: boolean) => {
    props.block.details.checked = value
  },
})

const getText = () => props.block.details.value ?? ''

function ensureDetails() {
  props.block.details.value = props.block.details.value ?? ''
  props.block.details.checked = Boolean(props.block.details.checked)
}

function setEditorText(value = getText()) {
  const editor = editorRef.value

  if (!editor || editor.textContent === value) {
    return
  }

  editor.textContent = value
}

function focusInput(position: 'start' | 'end' = 'end') {
  void nextTick(() => {
    const editor = editorRef.value

    if (!editor) {
      return
    }

    setEditorText()

    const textNode = editor.firstChild ?? editor
    const caretPosition = position === 'start' ? 0 : getText().length
    const range = document.createRange()
    const selection = window.getSelection()

    range.setStart(textNode, Math.min(caretPosition, textNode.textContent?.length ?? 0))
    range.collapse(true)
    selection?.removeAllRanges()
    selection?.addRange(range)
    editor.focus()
  })
}

function onSet() {
  ensureDetails()
  focusInput('end')
}

function onUnset() {
  syncTextFromEditor()
}

function getTextContent() {
  return getText()
}

function getHtmlContent() {
  return getText()
}

function moveToStart() {
  focusInput('start')
}

function moveToEnd() {
  focusInput('end')
}

function syncTextFromEditor() {
  props.block.details.value = editorRef.value?.textContent ?? ''
}

function isCheckboxPointer(event: MouseEvent) {
  const editor = editorRef.value

  if (!editor) {
    return false
  }

  return event.clientX - editor.getBoundingClientRect().left <= 22
}

function handleMouseDown(event: MouseEvent) {
  if (isCheckboxPointer(event)) {
    event.preventDefault()
  }
}

function handleClick(event: MouseEvent) {
  if (props.readonly) {
    return
  }

  if (!isCheckboxPointer(event)) {
    return
  }

  checked.value = !checked.value
}

defineExpose({
  onSet,
  onUnset,
  getTextContent,
  getHtmlContent,
  moveToStart,
  moveToEnd,
})

onMounted(() => {
  ensureDetails()
  setEditorText()
})

watch(
  () => props.block.id,
  () => {
    void nextTick(() => {
      ensureDetails()
      setEditorText()
    })
  },
)

watch(
  () => props.block.details.value,
  (value) => {
    if (document.activeElement === editorRef.value) {
      return
    }

    setEditorText(value ?? '')
  },
)
</script>

<template>
  <div
    ref="editorRef"
    class="todo-block"
    :class="{ checked }"
    :contenteditable="!readonly"
    data-placeholder="To-do"
    spellcheck="true"
    role="textbox"
    :aria-checked="checked"
    tabindex="-1"
    @mousedown="handleMouseDown"
    @click="handleClick"
    @input="syncTextFromEditor"
    @blur="syncTextFromEditor"
  />
</template>

<style scoped>
.todo-block {
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

.todo-block::before {
  position: absolute;
  top: 7px;
  left: 0;
  width: 16px;
  height: 16px;
  border: 1.5px solid #69707d;
  border-radius: 4px;
  background: #ffffff;
  content: '';
}

.todo-block.checked::before {
  border-color: #1f2328;
  background: #1f2328;
}

.todo-block.checked::after {
  position: absolute;
  top: 9px;
  left: 5px;
  width: 16px;
  height: 16px;
  color: #ffffff;
  content: '✓';
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.todo-block.checked {
  color: #69707d;
  text-decoration: line-through;
}
</style>
