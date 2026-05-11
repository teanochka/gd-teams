<script setup lang="ts">
import { ref, computed } from 'vue'
import IconAdd from '~icons/carbon/add'
import IconClose from '~icons/carbon/close'
import IconEdit from '~icons/carbon/edit'
import IconTrashCan from '~icons/carbon/trash-can'
import IconCheckmark from '~icons/carbon/checkmark'

type TagItem = {
  id: string
  name: string
  color: string
}

const props = defineProps<{
  tags: TagItem[]
  activeTagIds?: string[]
}>()

const emit = defineEmits<{
  (event: 'create', payload: { name: string; color: string }): void
  (event: 'update', payload: { id: string; name: string; color: string }): void
  (event: 'delete', id: string): void
  (event: 'toggle-tag', id: string): void
}>()

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#78716c',
]

const isCreating = ref(false)
const editingId = ref<string | null>(null)
const newTagName = ref('')
const newTagColor = ref(TAG_COLORS[0]!)
const editTagName = ref('')
const editTagColor = ref('')
const showColorPicker = ref(false)
const editShowColorPicker = ref(false)

const canCreate = computed(() => newTagName.value.trim().length > 0)
const canSaveEdit = computed(() => editTagName.value.trim().length > 0)

function startCreate() {
  isCreating.value = true
  editingId.value = null
  newTagName.value = ''
  newTagColor.value = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]!
  showColorPicker.value = false
}

function cancelCreate() {
  isCreating.value = false
  newTagName.value = ''
  showColorPicker.value = false
}

function submitCreate() {
  if (!canCreate.value) return
  emit('create', { name: newTagName.value.trim(), color: newTagColor.value })
  cancelCreate()
}

function startEdit(tag: TagItem) {
  editingId.value = tag.id
  isCreating.value = false
  editTagName.value = tag.name
  editTagColor.value = tag.color || TAG_COLORS[0]!
  editShowColorPicker.value = false
}

function cancelEdit() {
  editingId.value = null
  editTagName.value = ''
  editShowColorPicker.value = false
}

function submitEdit() {
  if (!editingId.value || !canSaveEdit.value) return
  emit('update', { id: editingId.value, name: editTagName.value.trim(), color: editTagColor.value })
  cancelEdit()
}

function confirmDelete(id: string) {
  emit('delete', id)
  if (editingId.value === id) {
    cancelEdit()
  }
}
</script>

<template>
  <div class="tag-manager">
    <div class="tag-manager-header">
      <h3>Управление тегами</h3>
      <button v-if="!isCreating" class="tag-add-btn" @click="startCreate" type="button">
        <IconAdd aria-hidden="true" />
      </button>
      <button v-else class="tag-add-btn" @click="cancelCreate" type="button">
        <IconClose aria-hidden="true" />
      </button>
    </div>

    <!-- Create form -->
    <div v-if="isCreating" class="tag-form">
      <div class="tag-form-row">
        <button
          class="color-swatch"
          :style="{ background: newTagColor }"
          type="button"
          @click="showColorPicker = !showColorPicker"
        />
        <input
          v-model="newTagName"
          class="tag-input"
          placeholder="Название тега..."
          @keydown.enter.prevent="submitCreate"
          @keydown.esc.prevent="cancelCreate"
        />
        <button class="tag-action-btn save" :disabled="!canCreate" @click="submitCreate" type="button">
          <IconCheckmark aria-hidden="true" />
        </button>
      </div>
      <div v-if="showColorPicker" class="color-grid">
        <button
          v-for="color in TAG_COLORS"
          :key="color"
          class="color-option"
          :class="{ selected: color === newTagColor }"
          :style="{ background: color }"
          type="button"
          @click="newTagColor = color"
        />
      </div>
    </div>

    <!-- Tag list -->
    <div class="tag-list">
      <div v-for="tag in tags" :key="tag.id" class="tag-item">
        <template v-if="editingId === tag.id">
          <div class="tag-form">
            <div class="tag-form-row">
              <button
                class="color-swatch"
                :style="{ background: editTagColor }"
                type="button"
                @click="editShowColorPicker = !editShowColorPicker"
              />
              <input
                v-model="editTagName"
                class="tag-input"
                @keydown.enter.prevent="submitEdit"
                @keydown.esc.prevent="cancelEdit"
              />
              <button class="tag-action-btn save" :disabled="!canSaveEdit" @click="submitEdit" type="button">
                <IconCheckmark aria-hidden="true" />
              </button>
              <button class="tag-action-btn cancel" @click="cancelEdit" type="button">
                <IconClose aria-hidden="true" />
              </button>
            </div>
            <div v-if="editShowColorPicker" class="color-grid">
              <button
                v-for="color in TAG_COLORS"
                :key="color"
                class="color-option"
                :class="{ selected: color === editTagColor }"
                :style="{ background: color }"
                type="button"
                @click="editTagColor = color"
              />
            </div>
          </div>
        </template>

        <template v-else>
          <div class="tag-display" :class="{ active: activeTagIds?.includes(tag.id) }">
            <div class="tag-toggle-area" @click="emit('toggle-tag', tag.id)">
              <span class="tag-color-dot" :style="{ background: tag.color || '#78716c' }" />
              <span class="tag-name">{{ tag.name }}</span>
            </div>
            <div class="tag-actions">
              <button class="tag-action-btn" @click="startEdit(tag)" type="button">
                <IconEdit aria-hidden="true" />
              </button>
              <button class="tag-action-btn danger" @click="confirmDelete(tag.id)" type="button">
                <IconTrashCan aria-hidden="true" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <p v-if="!tags.length && !isCreating" class="tag-empty">
      Нет тегов. Нажмите <strong>+</strong> чтобы создать.
    </p>
  </div>
</template>

<style scoped>
.tag-manager {
  padding: 0;
}

.tag-manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.tag-manager-header h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 750;
  color: #707070;
  text-transform: uppercase;
  letter-spacing: 0;
}

.tag-add-btn {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
}

.tag-add-btn:hover {
  background: #f0f0f0;
  border-color: #999;
  color: #222;
}

.tag-add-btn svg {
  width: 14px;
  height: 14px;
}

.tag-form {
  margin-bottom: 8px;
}

.tag-form-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-swatch {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: 2px solid white;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.15);
  transition: transform 0.1s;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.tag-input {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 8px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 13px;
  color: #222;
  background: white;
  outline: none;
}

.tag-input:focus {
  border-color: #333;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.06);
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 6px;
}

.color-option {
  width: 22px;
  height: 22px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s, border-color 0.1s;
}

.color-option:hover {
  transform: scale(1.15);
}

.color-option.selected {
  border-color: #1f1f1f;
  box-shadow: 0 0 0 2px white, 0 0 0 3px #1f1f1f;
}

.tag-list {
  display: grid;
  gap: 2px;
}

.tag-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: background 0.1s;
}

.tag-display:hover {
  background: #f0f0f0;
}

.tag-display.active {
  background: #202020;
  color: #ffffff;
}

.tag-display.active .tag-name {
  color: #ffffff;
}

.tag-display.active .tag-action-btn {
  color: #a0a0a0;
}

.tag-display.active .tag-action-btn:hover {
  background: #404040;
  color: #ffffff;
}

.tag-display.active .tag-action-btn.danger:hover {
  background: #401010;
  color: #ff6060;
}

.tag-toggle-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.tag-color-dot {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
}

.tag-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #333;
}

.tag-actions {
  display: none;
  gap: 2px;
}

.tag-display:hover .tag-actions {
  display: flex;
}

.tag-action-btn {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #777;
  cursor: pointer;
  transition: all 0.1s;
}

.tag-action-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.tag-action-btn.save {
  color: #16a34a;
}

.tag-action-btn.save:hover {
  background: #dcfce7;
}

.tag-action-btn.save:disabled {
  color: #bbb;
  cursor: not-allowed;
}

.tag-action-btn.cancel:hover {
  background: #fef2f2;
  color: #b91c1c;
}

.tag-action-btn.danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.tag-action-btn svg {
  width: 14px;
  height: 14px;
}

.tag-empty {
  margin: 8px 0 0;
  font-size: 12px;
  color: #888;
}

.tag-empty strong {
  color: #555;
}
</style>
