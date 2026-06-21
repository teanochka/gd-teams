<script setup lang="ts">
import { computed } from "vue";
import type { CanvasElement } from "@/types/canvas";

const props = defineProps<{
  element: CanvasElement | null;
  elementName?: string;
}>();

const emit = defineEmits<{
  (event: "update:element", element: CanvasElement): void;
}>();

const hasText = computed(() => {
  return Boolean(
    props.element?.content !== undefined || props.element?.title !== undefined,
  );
});

const hasShadow = computed(() => {
  return Boolean(
    props.element?.shadowColor ||
    props.element?.shadowBlur !== undefined ||
    props.element?.shadowOffsetX !== undefined ||
    props.element?.shadowOffsetY !== undefined,
  );
});

const isTextElement = computed(() => props.element?.type === "text");

const getColorInputValue = (
  value: string | undefined,
  fallback: string,
) => {
  return /^#[0-9a-f]{6}$/i.test(value ?? "") ? value : fallback;
};

const backgroundColorInputValue = computed(() =>
  getColorInputValue(props.element?.backgroundColor, "#fff3a3"),
);

const isBackgroundTransparent = computed(() => {
  return (
    props.element?.backgroundColor === undefined ||
    props.element.backgroundColor === "transparent"
  );
});

const updateElement = (patch: Partial<CanvasElement>) => {
  if (!props.element) {
    return;
  }

  emit("update:element", {
    ...props.element,
    ...patch,
  });
};

const updateText = (key: "content" | "title", event: Event) => {
  updateElement({ [key]: (event.target as HTMLInputElement).value });
};

const updateNumber = (key: keyof CanvasElement, event: Event) => {
  const value = Number((event.target as HTMLInputElement).value);

  if (Number.isFinite(value)) {
    updateElement({ [key]: value });
  }
};

const updateString = (key: keyof CanvasElement, event: Event) => {
  updateElement({ [key]: (event.target as HTMLInputElement).value });
};

const updateBackgroundColor = (event: Event) => {
  updateElement({
    backgroundColor: (event.target as HTMLInputElement).value,
  });
};

const updateTextAlign = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;

  if (value === "left" || value === "center" || value === "right") {
    updateElement({ textAlign: value });
  }
};

const toggleTransparentBackground = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked;

  updateElement({
    backgroundColor: checked ? "transparent" : backgroundColorInputValue.value,
  });
};

const toggleShadow = (event: Event) => {
  if (!props.element) {
    return;
  }

  const checked = (event.target as HTMLInputElement).checked;

  if (checked) {
    updateElement({
      shadowColor: props.element.shadowColor ?? "#00000040",
      shadowBlur: props.element.shadowBlur ?? 10,
      shadowOffsetX: props.element.shadowOffsetX ?? 0,
      shadowOffsetY: props.element.shadowOffsetY ?? 5,
    });
    return;
  }

  const {
    shadowColor: _shadowColor,
    shadowBlur: _shadowBlur,
    shadowOffsetX: _shadowOffsetX,
    shadowOffsetY: _shadowOffsetY,
    ...nextElement
  } = props.element;

  emit("update:element", nextElement);
};
</script>

<template>
  <section
    class="properties-panel"
    aria-label="Свойства элемента"
    @mousedown.stop
    @click.stop
  >
    <header class="properties-header">
      <strong>Свойства</strong>
      <span>{{ element ? (elementName ?? element.type) : "Нет выбора" }}</span>
    </header>

    <p v-if="!element" class="empty-properties">
      Выберите элемент на холсте, чтобы изменить его свойства.
    </p>

    <div v-else class="properties-body">
      <section class="property-section">
        <h3>Позиция и размер</h3>
        <div class="field-grid">
          <label>
            <span>X</span>
            <input
              type="number"
              :value="element.x"
              @input="updateNumber('x', $event)"
            />
          </label>
          <label>
            <span>Y</span>
            <input
              type="number"
              :value="element.y"
              @input="updateNumber('y', $event)"
            />
          </label>
          <label>
            <span>Ширина</span>
            <input
              type="number"
              min="64"
              :value="element.width"
              @input="updateNumber('width', $event)"
            />
          </label>
          <label>
            <span>Высота</span>
            <input
              type="number"
              min="48"
              :value="element.height"
              @input="updateNumber('height', $event)"
            />
          </label>
        </div>
      </section>

      <section
        v-if="element.title !== undefined || element.content !== undefined"
        class="property-section"
      >
        <h3>Контент</h3>
        <label v-if="element.title !== undefined" class="field">
          <span>Название</span>
          <input
            type="text"
            :value="element.title"
            @input="updateText('title', $event)"
          />
        </label>
        <label v-if="element.content !== undefined" class="field">
          <span>Текст</span>
          <input
            type="text"
            :value="element.content"
            @input="updateText('content', $event)"
          />
        </label>
      </section>

      <section class="property-section">
        <h3>Заливка и обводка</h3>
        <div class="field-grid">
          <label>
            <span>Заливка</span>
            <input
              type="color"
              :value="backgroundColorInputValue"
              @input="updateBackgroundColor"
            />
          </label>
          <template v-if="!isTextElement">
          <label>
            <span>Обводка</span>
            <input
              type="color"
              :value="element.borderColor ?? '#d7dce3'"
              @input="updateString('borderColor', $event)"
            />
          </label>
          <label>
            <span>Толщина</span>
            <input
              type="number"
              min="0"
              max="20"
              :value="element.borderWidth ?? 1"
              @input="updateNumber('borderWidth', $event)"
            />
          </label>
          <label>
            <span>Скругление</span>
            <input
              type="number"
              min="0"
              max="100"
              :value="
                typeof element.borderRadius === 'number'
                  ? element.borderRadius
                  : 0
              "
              @input="updateNumber('borderRadius', $event)"
            />
          </label>
          </template>
        </div>
        <label v-if="isTextElement" class="toggle-row">
          <span>Прозрачная заливка</span>
          <input
            type="checkbox"
            :checked="isBackgroundTransparent"
            @change="toggleTransparentBackground"
          />
        </label>
        <label class="field">
          <span>Прозрачность</span>
          <input
            type="range"
            min="10"
            max="100"
            :value="element.opacity ?? 100"
            @input="updateNumber('opacity', $event)"
          />
        </label>
      </section>

      <section v-if="hasText" class="property-section">
        <h3>Текст</h3>
        <div class="field-grid">
          <label>
            <span>Цвет</span>
            <input
              type="color"
              :value="element.textColor ?? '#202020'"
              @input="updateString('textColor', $event)"
            />
          </label>
          <label>
            <span>Размер</span>
            <input
              type="number"
              min="8"
              max="72"
              :value="element.fontSize ?? 14"
              @input="updateNumber('fontSize', $event)"
            />
          </label>
          <label>
            <span>Жирность</span>
            <input
              type="number"
              min="100"
              max="900"
              step="100"
              :value="element.fontWeight ?? 400"
              @input="updateNumber('fontWeight', $event)"
            />
          </label>
          <label>
            <span>Выравнивание</span>
            <select
              :value="element.textAlign ?? 'center'"
              @change="updateTextAlign"
            >
              <option value="left">Слева</option>
              <option value="center">Центр</option>
              <option value="right">Справа</option>
            </select>
          </label>
        </div>
      </section>

      <section class="property-section">
        <label class="toggle-row">
          <span>Тень</span>
          <input type="checkbox" :checked="hasShadow" @change="toggleShadow" />
        </label>

        <div v-if="hasShadow" class="field-grid">
          <label>
            <span>Цвет</span>
            <input
              type="color"
              :value="element.shadowColor ?? '#000000'"
              @input="updateString('shadowColor', $event)"
            />
          </label>
          <label>
            <span>Размытие</span>
            <input
              type="number"
              min="0"
              max="50"
              :value="element.shadowBlur ?? 10"
              @input="updateNumber('shadowBlur', $event)"
            />
          </label>
          <label>
            <span>X</span>
            <input
              type="number"
              min="-50"
              max="50"
              :value="element.shadowOffsetX ?? 0"
              @input="updateNumber('shadowOffsetX', $event)"
            />
          </label>
          <label>
            <span>Y</span>
            <input
              type="number"
              min="-50"
              max="50"
              :value="element.shadowOffsetY ?? 5"
              @input="updateNumber('shadowOffsetY', $event)"
            />
          </label>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.properties-panel {
  min-height: 0;
  border-top: 1px solid #dddddd;
  background: #f8f8f8;
}

.properties-header {
  display: grid;
  gap: 2px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #dddddd;
}

.properties-header strong {
  color: #202020;
  font-size: 15px;
  font-weight: 750;
}

.properties-header span {
  min-width: 0;
  overflow: hidden;
  color: #6f7682;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-properties {
  margin: 0;
  padding: 16px;
  color: #777777;
  font-size: 13px;
}

.properties-body {
  display: grid;
  gap: 14px;
  max-height: min(46vh, 520px);
  overflow: auto;
  padding: 14px 12px 18px;
}

.property-section {
  display: grid;
  gap: 10px;
}

.property-section h3 {
  margin: 0;
  color: #202020;
  font-size: 13px;
  font-weight: 750;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.field,
.field-grid label,
.toggle-row {
  display: grid;
  gap: 5px;
  min-width: 0;
  color: #5f6670;
  font-size: 12px;
  font-weight: 650;
}

.toggle-row {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

input,
select {
  width: 100%;
  min-width: 0;
  height: 32px;
  border: 1px solid #d7dce3;
  border-radius: 7px;
  background: #ffffff;
  color: #202020;
  font: inherit;
  font-size: 13px;
}

input[type="number"],
input[type="text"],
select {
  padding: 0 8px;
}

input[type="color"] {
  padding: 3px;
}

input[type="range"] {
  padding: 0;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
}
</style>
