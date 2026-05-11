<script setup lang="ts">
import { ref } from 'vue'
import IconTemplate from '~icons/carbon/template'

type TemplateOption = {
  id: string
  title: string
}

const templates: TemplateOption[] = [
  {
    id: 'blank',
    title: 'Пустой',
  },
]

const emit = defineEmits<{
  (event: 'apply', templateId: string): void
  (event: 'skip'): void
}>()

const selectedTemplateId = ref(templates[0]?.id ?? '')

const selectTemplate = (templateId: string) => {
  selectedTemplateId.value = templateId
}

const applySelectedTemplate = () => {
  if (!selectedTemplateId.value) {
    return
  }

  emit('apply', selectedTemplateId.value)
}
</script>

<template>
  <section class="template-prompt" aria-labelledby="template-prompt-title">
    <div class="template-prompt-panel">
      <header class="template-prompt-header">
        <h2 id="template-prompt-title">Кажется, что этот документ пуст</h2>
        <p>Хотите использовать для него шаблон?</p>
      </header>

      <div class="template-grid">
        <button
          v-for="template in templates"
          :key="template.id"
          class="template-card"
          :class="{ selected: selectedTemplateId === template.id }"
          type="button"
          @click="selectTemplate(template.id)"
          @dblclick="selectTemplate(template.id)"
        >
          <span class="template-card-logo">
            <IconTemplate aria-hidden="true" />
          </span>
          <span class="template-card-title">{{ template.title }}</span>
        </button>
      </div>

      <footer class="template-prompt-actions">
        <button class="template-action secondary" type="button" @click="emit('skip')">
          Пропустить
        </button>
        <button class="template-action primary" type="button" @click="applySelectedTemplate">
          ОК
        </button>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.template-prompt {
  position: fixed;
  inset: 0;
  z-index: 15;
  display: grid;
  place-items: start center;
  padding: 120px 24px 24px;
  pointer-events: none;
}

.template-prompt-panel {
  width: min(560px, 100%);
  padding: 22px;
  border: 1px solid #dedede;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 16px 40px rgba(15, 23, 42, 0.12),
    0 2px 10px rgba(15, 23, 42, 0.08);
  pointer-events: auto;
}

.template-prompt-header {
  display: grid;
  gap: 6px;
  margin-bottom: 18px;
}

.template-prompt-header h2,
.template-prompt-header p {
  margin: 0;
}

.template-prompt-header h2 {
  color: #1f2328;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.template-prompt-header p {
  color: #69707d;
  font-size: 14px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 12px;
}

.template-card {
  display: grid;
  gap: 10px;
  justify-items: center;
  min-height: 128px;
  padding: 16px 12px;
  border: 1px solid #d9dde3;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2328;
  font: inherit;
  text-align: center;
}

.template-card:hover {
  border-color: #b7bec8;
  background: #f8f9fb;
}

.template-card.selected {
  border-color: #1f2328;
  background: #f2f4f7;
  box-shadow: inset 0 0 0 1px #1f2328;
}

.template-card-logo {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: 1px solid #d9dde3;
  border-radius: 8px;
  background: #f8f9fb;
  color: #1f2328;
}

.template-card-logo svg {
  width: 30px;
  height: 30px;
}

.template-card-title {
  color: #1f2328;
  font-size: 14px;
  font-weight: 500;
}

.template-prompt-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.template-action {
  min-width: 96px;
  height: 36px;
  padding: 0 14px;
  border-radius: 6px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
}

.template-action.secondary {
  border: 1px solid #d0d5dd;
  background: #ffffff;
  color: #344054;
}

.template-action.primary {
  border: 1px solid #1f2328;
  background: #1f2328;
  color: #ffffff;
}

@media (max-width: 640px) {
  .template-prompt {
    padding-top: 96px;
  }

  .template-prompt-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .template-action {
    width: 100%;
  }
}
</style>
