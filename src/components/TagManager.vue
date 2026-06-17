<script setup lang="ts">
import { ref, computed } from "vue";
import IconAdd from "~icons/carbon/add";
import IconClose from "~icons/carbon/close";
import IconEdit from "~icons/carbon/edit";
import IconTrashCan from "~icons/carbon/trash-can";
import IconCheckmark from "~icons/carbon/checkmark";
import IconSearch from "~icons/carbon/search";

type TagItem = {
  id: string;
  name: string;
  color: string;
};

const props = defineProps<{
  tags: TagItem[];
  activeTagIds?: string[];
}>();

const emit = defineEmits<{
  (event: "create", payload: { name: string; color: string }): void;
  (event: "update", payload: { id: string; name: string; color: string }): void;
  (event: "delete", id: string): void;
  (event: "toggle-tag", id: string): void;
}>();

const TAG_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#78716c",
];

const isSearching = ref(false);
const searchQuery = ref("");
const editingId = ref<string | null>(null);
const newTagName = ref("");
const newTagColor = ref(TAG_COLORS[0]!);
const editTagName = ref("");
const editTagColor = ref("");
const showColorPicker = ref(false);
const editShowColorPicker = ref(false);

const canCreate = computed(() => newTagName.value.trim().length > 0);
const canSaveEdit = computed(() => editTagName.value.trim().length > 0);

const filteredTags = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return props.tags;
  return props.tags.filter((t) => t.name.toLowerCase().includes(query));
});

const showCreateOption = computed(() => {
  const query = searchQuery.value.trim();
  if (!query) return false;
  return !props.tags.some((t) => t.name.toLowerCase() === query.toLowerCase());
});

function toggleSearch() {
  isSearching.value = !isSearching.value;
  if (!isSearching.value) {
    searchQuery.value = "";
  }
}

function startCreateFromSearch() {
  newTagName.value = searchQuery.value.trim();
  newTagColor.value =
    TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]!;
  isSearching.value = false;
  searchQuery.value = "";
  // In a real app we might just emit create directly,
  // but let's show the color picker for a better UX
  submitCreate();
}

function submitCreate() {
  const name = newTagName.value.trim() || searchQuery.value.trim();
  if (!name) return;
  emit("create", { name, color: newTagColor.value });
  newTagName.value = "";
  isSearching.value = false;
  searchQuery.value = "";
}

function startEdit(tag: TagItem) {
  editingId.value = tag.id;
  editTagName.value = tag.name;
  editTagColor.value = tag.color || TAG_COLORS[0]!;
  editShowColorPicker.value = false;
}

function cancelEdit() {
  editingId.value = null;
  editTagName.value = "";
  editShowColorPicker.value = false;
}

function submitEdit() {
  if (!editingId.value || !canSaveEdit.value) return;
  emit("update", {
    id: editingId.value,
    name: editTagName.value.trim(),
    color: editTagColor.value,
  });
  cancelEdit();
}

function confirmDelete(id: string) {
  emit("delete", id);
  if (editingId.value === id) {
    cancelEdit();
  }
}

function getContrastColor(hexColor: string | undefined) {
  if (!hexColor) return "#000000";
  const hex = hexColor.replace("#", "");
  if (hex.length < 6) return "#000000";
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "#000000";
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}
</script>

<template>
  <div class="tag-manager">
    <div class="tag-manager-header">
      <h3>Теги</h3>
      <button
        class="tag-add-btn"
        :class="{ active: isSearching }"
        @click="toggleSearch"
        type="button"
      >
        <IconAdd v-if="!isSearching" aria-hidden="true" />
        <IconClose v-else aria-hidden="true" />
      </button>
    </div>

    <div v-if="isSearching" class="tag-search-container">
      <div class="search-input-wrapper">
        <IconSearch class="search-icon" aria-hidden="true" />
        <input
          v-model="searchQuery"
          class="tag-search-input"
          placeholder="Поиск или создание..."
          autofocus
          @keydown.enter.prevent="showCreateOption && submitCreate()"
        />
      </div>

      <div class="search-results">
        <div
          v-for="tag in filteredTags"
          :key="tag.id"
          class="search-result-item"
          @click="emit('toggle-tag', tag.id)"
        >
          <span class="tag-dot" :style="{ background: tag.color }" />
          <span class="tag-name">{{ tag.name }}</span>
          <IconCheckmark
            v-if="activeTagIds?.includes(tag.id)"
            class="check-icon"
          />
        </div>
        <div
          v-if="showCreateOption"
          class="create-option"
          @click="submitCreate"
        >
          <IconAdd aria-hidden="true" />
          <span>Создать "{{ searchQuery }}"</span>
        </div>
      </div>
    </div>

    <div class="tag-cloud">
      <div
        v-for="tag in tags"
        :key="tag.id"
        class="tag-badge"
        :class="{ active: activeTagIds?.includes(tag.id) }"
        :style="{
          backgroundColor: activeTagIds?.includes(tag.id)
            ? tag.color
            : '#f0f0f0',
          color: activeTagIds?.includes(tag.id)
            ? getContrastColor(tag.color)
            : '#444',
        }"
        @click="emit('toggle-tag', tag.id)"
      >
        <span class="tag-text">{{ tag.name }}</span>
        <button class="tag-edit-small" @click.stop="startEdit(tag)">
          <IconEdit aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Edit Modal (Simplified as a dropdown/overlay) -->
    <div v-if="editingId" class="tag-edit-overlay" @click.self="cancelEdit">
      <div class="tag-edit-card">
        <div class="tag-edit-header">
          <h4>Редактировать тег</h4>
          <button @click="cancelEdit"><IconClose /></button>
        </div>
        <div class="tag-edit-body">
          <div class="tag-form-row">
            <button
              class="color-swatch"
              :style="{ background: editTagColor }"
              type="button"
              @click="editShowColorPicker = !editShowColorPicker"
            />
            <input v-model="editTagName" class="tag-input" />
          </div>
          <div v-if="editShowColorPicker" class="color-grid">
            <button
              v-for="color in TAG_COLORS"
              :key="color"
              class="color-option"
              :class="{ selected: color === editTagColor }"
              :style="{ background: color }"
              @click="editTagColor = color"
            />
          </div>
        </div>
        <div class="tag-edit-footer">
          <button class="btn-delete" @click="confirmDelete(editingId!)">
            <IconTrashCan />
          </button>
          <button class="btn-save" :disabled="!canSaveEdit" @click="submitEdit">
            Сохранить
          </button>
        </div>
      </div>
    </div>

    <p v-if="!tags.length && !isSearching" class="tag-empty">
      Нет тегов. Нажмите <strong>+</strong> чтобы добавить.
    </p>
  </div>
</template>

<style scoped>
.tag-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tag-manager-header h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 750;
  color: #707070;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tag-add-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-add-btn:hover,
.tag-add-btn.active {
  background: #f5f5f5;
  border-color: #bbb;
  color: #111;
}

.tag-search-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  width: 14px;
  height: 14px;
  color: #888;
}

.tag-search-input {
  width: 100%;
  height: 34px;
  padding: 0 10px 0 32px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.tag-search-input:focus {
  border-color: #999;
}

.search-results {
  max-height: 160px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.search-result-item,
.create-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}

.search-result-item:hover,
.create-option:hover {
  background: #f0f0f0;
}

.tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.check-icon {
  margin-left: auto;
  width: 14px;
  height: 14px;
  color: #16a34a;
}

.create-option {
  color: #3b82f6;
  font-weight: 600;
  border-top: 1px solid #eee;
  margin-top: 4px;
  padding-top: 8px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  user-select: none;
}

.tag-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tag-badge.active {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.tag-edit-small {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
}

.tag-edit-small:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

.tag-edit-small svg {
  width: 10px;
  height: 10px;
}

.tag-edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  z-index: 2000;
}

.tag-edit-card {
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.tag-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.tag-edit-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 750;
}

.tag-edit-header button {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
}

.tag-edit-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-form-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #ddd;
  cursor: pointer;
}

.tag-input {
  flex: 1;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
}

.color-option.selected {
  border-color: #333;
  transform: scale(1.1);
}

.tag-edit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fcfcfc;
  border-top: 1px solid #eee;
}

.btn-delete {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid #ffdada;
  background: #fff5f5;
  color: #ff4d4d;
  border-radius: 8px;
  cursor: pointer;
}

.btn-delete:hover {
  background: #ffebeb;
}

.btn-save {
  height: 36px;
  padding: 0 20px;
  background: #171717;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 650;
  cursor: pointer;
}

.btn-save:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.tag-empty {
  font-size: 12px;
  color: #888;
  text-align: center;
  padding: 10px 0;
}
</style>
