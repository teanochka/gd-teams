<script setup lang="ts">
import { computed, ref } from "vue";
import {
  getBlockStyle,
  getTextStyle,
  updateField,
} from "@/components/canvas/nodes/canvasNodeStyle";
import type { CanvasElement } from "@/types/canvas";

const props = defineProps<{
  element: CanvasElement;
}>();

const emit = defineEmits<{
  (event: "update:element", element: CanvasElement): void;
}>();

const classNameInput = ref<HTMLTextAreaElement | null>(null);
const attributesInput = ref<HTMLTextAreaElement | null>(null);
const methodsInput = ref<HTMLTextAreaElement | null>(null);

const blockStyle = computed(() => getBlockStyle(props.element));
const borderColorValue = computed(() => props.element.borderColor ?? "#6b7280");
const textStyle = computed(() => getTextStyle(props.element));
const classNameField = computed(() =>
  props.element.fields?.find((field) => field.id === "className"),
);
const attributesField = computed(() =>
  props.element.fields?.find((field) => field.id === "attributes"),
);
const methodsField = computed(() =>
  props.element.fields?.find((field) => field.id === "methods"),
);

const onFieldInput = (fieldId: string, event: Event) => {
  const value = (event.target as HTMLTextAreaElement).value;
  const fields = updateField(props.element.fields, fieldId, value);

  emit("update:element", {
    ...props.element,
    content: fieldId === "className" ? value : props.element.content,
    fields,
  });
};

const onEnter = (fieldId: string) => {
  if (fieldId === "className") {
    attributesInput.value?.focus();
  }
};

defineExpose({
  classNameInput,
  attributesInput,
  methodsInput,
});
</script>

<template>
  <div class="uml-class-node" :style="blockStyle">
    <div
      class="uml-section uml-class-name"
      :style="{ borderColor: borderColorValue }"
    >
      <textarea
        ref="classNameInput"
        class="uml-textarea uml-title"
        :style="textStyle"
        :value="classNameField?.value || 'ClassName'"
        rows="1"
        @input="onFieldInput('className', $event)"
        @keydown.enter.prevent="onEnter('className')"
      />
    </div>

    <div
      class="uml-section uml-member-section"
      :style="{ borderColor: borderColorValue }"
    >
      <textarea
        ref="attributesInput"
        class="uml-textarea"
        :style="textStyle"
        :value="attributesField?.value || '+ attribute: Type'"
        @input="onFieldInput('attributes', $event)"
      />
    </div>

    <div class="uml-section uml-member-section">
      <textarea
        ref="methodsInput"
        class="uml-textarea"
        :style="textStyle"
        :value="methodsField?.value || '+ method(): Type'"
        @input="onFieldInput('methods', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.uml-class-node {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  border-style: solid;
  overflow: hidden;
}

.uml-section {
  min-width: 0;
  padding: 8px;
}

.uml-class-name {
  flex: 0 0 auto;
  border-bottom: 1px solid;
}

.uml-member-section {
  flex: 1 1 0;
  min-height: 0;
  border-bottom: 1px solid;
  font-size: 13px;
}

.uml-member-section:last-child {
  border-bottom: 0;
}

.uml-textarea {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #4b5563;
  font: inherit;
  resize: none;
}

.uml-title {
  height: auto;
  overflow: hidden;
  color: #202020;
  font-weight: 700;
  text-align: center;
}
</style>
