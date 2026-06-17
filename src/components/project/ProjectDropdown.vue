<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import IconOverflowMenuHorizontal from "~icons/carbon/overflow-menu-horizontal";
import { useProjectsStore } from "@/stores/projects";

type ProjectDropdownData = {
  id: string;
  isFavorite: boolean;
  isDeleted: boolean;
};

const props = withDefaults(
  defineProps<{
    project: ProjectDropdownData;
    placement?: "card" | "list";
  }>(),
  {
    placement: "card",
  },
);

const emit = defineEmits<{
  rename: [];
}>();

const dropdownMenu = useTemplateRef("dropdownMenu");
const router = useRouter();
const projectsStore = useProjectsStore();

const hide = () => dropdownMenu.value?.hide();
const toggle = () => dropdownMenu.value?.toggle();

const openEditPage = () => {
  hide();
  void router.push({
    name: "project-edit",
    params: { projectId: props.project.id },
  });
};

const startRename = () => {
  hide();
  emit("rename");
};

const addToFavorites = () => {
  hide();
  void projectsStore.toggleFavoriteProject(props.project.id, true);
};

const removeFromFavorites = () => {
  hide();
  void projectsStore.toggleFavoriteProject(props.project.id, false);
};

const moveToTrash = () => {
  hide();
  void projectsStore.softDeleteProject(props.project.id);
};

defineExpose({
  hide,
  toggle,
});
</script>

<template>
  <BDropdown
    ref="dropdownMenu"
    variant="link"
    toggle-class="project-dropdown-toggle"
    class="project-dropdown"
    :class="`project-dropdown--${placement}`"
    no-caret
  >
    <template #button-content>
      <IconOverflowMenuHorizontal aria-hidden="true" style="color: black" />
    </template>
    <BDropdownItem @click="startRename">Переименовать</BDropdownItem>
    <BDropdownItem @click="openEditPage">Изменить</BDropdownItem>
    <BDropdownItem v-if="!project.isFavorite" @click="addToFavorites">
      В избранное
    </BDropdownItem>
    <BDropdownItem v-if="project.isFavorite" @click="removeFromFavorites">
      Убрать из избранного
    </BDropdownItem>
    <BDropdownItem v-if="!project.isDeleted" @click="moveToTrash">
      В корзину
    </BDropdownItem>
  </BDropdown>
</template>

<style scoped>
.project-dropdown {
  position: absolute;
  z-index: 99;
  padding: 0;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  background: #ffffff;
}

.project-dropdown :deep(.dropdown-menu) {
  z-index: 99;
}

.project-dropdown--card {
  top: 10px;
  right: 10px;
}

.project-dropdown--list {
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
}

.project-dropdown :deep(.project-dropdown-toggle) {
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px !important;
}
</style>
