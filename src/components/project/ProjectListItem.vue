<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import ProjectDropdown from "@/components/project/ProjectDropdown.vue";
import IconStar from "~icons/carbon/star";
import IconTime from "~icons/carbon/time";
import { useInlineTitleEdit } from "@/composables/useInlineTitleEdit";
import { useProjectsStore } from "@/stores/projects";
import { formatDateTime } from "@/utils/formatDate";

type ProjectListItemData = {
  id: string;
  title: string;
  createdAt: string;
  isFavorite: boolean;
  isDeleted: boolean;
};

const props = defineProps<{
  project: ProjectListItemData;
}>();

const projectDropdown = ref<InstanceType<typeof ProjectDropdown> | null>(null);
const projectsStore = useProjectsStore();
const renamingProjectId = ref<string | null>(null);
const draftTitle = ref("");
const isSavingTitle = ref(false);
const isRenaming = computed(() => renamingProjectId.value === props.project.id);
const projectLinkProps = computed(() => {
  if (isRenaming.value) {
    return {
      class: "project-list-link",
      "aria-label": props.project.title,
    };
  }

  return {
    class: "project-list-link",
    to: { name: "project", params: { projectId: props.project.id } },
    "aria-label": props.project.title,
  };
});

watch(
  () => props.project.title,
  (title) => {
    if (!isRenaming.value) {
      draftTitle.value = title;
    }
  },
  { immediate: true },
);

const toggleDropdown = () => projectDropdown.value?.toggle();

const startRename = () => {
  renamingProjectId.value = props.project.id;
  draftTitle.value = props.project.title;
};

const finishRename = async () => {
  if (!isRenaming.value || isSavingTitle.value) {
    return;
  }

  const nextTitle = draftTitle.value.trim();

  if (!nextTitle) {
    draftTitle.value = props.project.title;
    renamingProjectId.value = null;
    return;
  }

  if (nextTitle === props.project.title) {
    renamingProjectId.value = null;
    return;
  }

  isSavingTitle.value = true;

  try {
    await projectsStore.renameProject(props.project.id, nextTitle);
  } finally {
    isSavingTitle.value = false;
    renamingProjectId.value = null;
  }
};

const cancelRename = () => {
  draftTitle.value = props.project.title;
  renamingProjectId.value = null;
};

const toggleFavorite = () => {
  void projectsStore.toggleFavoriteProject(
    props.project.id,
    !props.project.isFavorite,
  );
};

const { inputRef: titleInput } = useInlineTitleEdit({
  isEditing: isRenaming,
  isBusy: isSavingTitle,
  onCommit: finishRename,
});
</script>

<template>
  <article class="project-list-item" @contextmenu.prevent="toggleDropdown">
    <component :is="isRenaming ? 'div' : RouterLink" v-bind="projectLinkProps">
      <div class="project-list-title-row">
        <input
          v-if="isRenaming"
          ref="titleInput"
          v-model="draftTitle"
          class="form-control title-input"
          :disabled="isSavingTitle"
          @click.stop
          @keydown.enter.prevent="finishRename"
          @keydown.esc.prevent="cancelRename"
        />
        <h2 v-else>{{ project.title }}</h2>
      </div>

      <span class="project-list-date">
        <IconTime aria-hidden="true" />
        Создан: {{ formatDateTime(project.createdAt) }}
      </span>
    </component>

    <BButton
      variant="link"
      class="favorite-toggle"
      :aria-label="project.isFavorite ? 'Убрать из избранного' : 'В избранное'"
      :aria-pressed="project.isFavorite"
      @click.stop="toggleFavorite"
    >
      <IconStar aria-hidden="true" />
    </BButton>

    <ProjectDropdown
      ref="projectDropdown"
      :project="project"
      placement="list"
      @rename="startRename"
    />
  </article>
</template>

<style scoped>
.project-list-item {
  position: relative;
  z-index: 0;
  overflow: visible;
  border: 1px solid #d8d8d8;
  border-radius: 8px;
  background: #ffffff;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.project-list-item:hover {
  z-index: 20;
  border-color: #9e9e9e;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.project-list-item:focus-within {
  z-index: 20;
}

.project-list-link {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(170px, auto);
  align-items: center;
  gap: 18px;
  min-height: 62px;
  padding: 12px 100px 12px 16px;
  color: inherit;
  text-decoration: none;
}

.project-list-title-row {
  min-width: 0;
}

.project-list-title-row h2 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #171717;
  font-size: 16px;
  font-weight: 750;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-input {
  width: min(100%, 520px);
  min-width: 0;
  height: 28px;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 750;
  line-height: 1.25;
}

.project-list-date {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  color: #6a6a6a;
  font-size: 13px;
  white-space: nowrap;
}

.project-list-date svg {
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
}

.favorite-toggle {
  position: absolute;
  top: 50%;
  right: 54px;
  z-index: 2;
  display: grid !important;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  background: #ffffff;
  color: #1c1c1c;
  transform: translateY(-50%);
}

.favorite-toggle svg {
  width: 18px;
  height: 18px;
}

.favorite-toggle[aria-pressed="false"] {
  color: #8a8a8a;
}

@media (max-width: 720px) {
  .project-list-link {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }

  .project-list-date {
    justify-content: flex-start;
  }
}
</style>
