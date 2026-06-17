<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import IconChevronRight from "~icons/carbon/chevron-right";
import IconFolder from "~icons/carbon/folder";
import IconStar from "~icons/carbon/star";
import IconChat from "~icons/carbon/chat";
import TagManager from "@/components/TagManager.vue";

type FolderNode = {
  id: string;
  name: string;
  children?: FolderNode[];
};

type TagItem = {
  id: string;
  name: string;
  color: string;
};

defineProps<{
  projectId: string;
  projectName: string;
  folders: FolderNode[];
  tags: TagItem[];
  activeTagIds?: string[];
  specialView?: "trash" | "favorites" | null;
}>();

const emit = defineEmits<{
  (event: "open-folder", id: string): void;
  (event: "toggle-tag", id: string): void;
  (event: "open-favorites"): void;
  (event: "open-trash"): void;
  (event: "create-tag", payload: { name: string; color: string }): void;
  (
    event: "update-tag",
    payload: { id: string; name: string; color: string },
  ): void;
  (event: "delete-tag", id: string): void;
}>();

const rootExpanded = ref(true);
</script>

<template>
  <aside class="workspace-left-sidebar" aria-label="Дерево проекта">
    <RouterLink
      class="sidebar-button"
      :to="{ name: 'project-kanban', params: { projectId } }"
    >
      <IconStar aria-hidden="true" />
      <span>Agile Board</span>
    </RouterLink>
    <RouterLink
      class="sidebar-button"
      :to="{ name: 'project-chat', params: { projectId } }"
    >
      <IconChat aria-hidden="true" />
      <span>Чат</span>
    </RouterLink>
    <button
      class="project-root"
      type="button"
      @click="rootExpanded = !rootExpanded"
    >
      <IconChevronRight
        :class="{ expanded: rootExpanded }"
        aria-hidden="true"
      />
      <IconFolder aria-hidden="true" />
      <span>{{ projectName }}</span>
    </button>

    <div v-if="rootExpanded" class="folder-tree">
      <div v-for="folder in folders" :key="folder.id" class="folder-group">
        <button
          class="tree-item"
          type="button"
          @click="emit('open-folder', folder.id)"
        >
          <IconFolder aria-hidden="true" />
          <span>{{ folder.name }}</span>
        </button>

        <div v-if="folder.children?.length" class="tree-children">
          <button
            v-for="child in folder.children"
            :key="child.id"
            class="tree-item child"
            type="button"
            @click="emit('open-folder', child.id)"
          >
            <IconFolder aria-hidden="true" />
            <span>{{ child.name }}</span>
          </button>
        </div>
      </div>
    </div>
    <nav class="sidebar-section" aria-label="Быстрые разделы">
      <button
        class="sidebar-link"
        :class="{ active: specialView === 'favorites' }"
        type="button"
        @click="emit('open-favorites')"
      >
        <IconStar aria-hidden="true" />
        <span>Избранное</span>
      </button>
      <button
        class="sidebar-link"
        :class="{ active: specialView === 'trash' }"
        type="button"
        @click="emit('open-trash')"
      >
        <IconTrashCan aria-hidden="true" />
        <span>Корзина</span>
      </button>
    </nav>

    <section class="sidebar-section tags-section">
      <TagManager
        :tags="tags"
        :active-tag-ids="activeTagIds"
        @create="emit('create-tag', $event)"
        @update="emit('update-tag', $event)"
        @delete="emit('delete-tag', $event)"
        @toggle-tag="emit('toggle-tag', $event)"
      />
    </section>
  </aside>
</template>

<style scoped>
.workspace-left-sidebar {
  width: 260px;
  min-width: 260px;
  padding: 18px 12px;
  border-right: 1px solid #dcdcdc;
  background: #f7f7f7;
}

.project-root,
.tree-item,
.sidebar-link {
  display: grid;
  align-items: center;
  width: 100%;
  min-height: 38px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #242424;
  font: inherit;
  text-align: left;
}

.sidebar-button {
  display: flex;
  gap: 8px;
  margin-bottom: 2px;
  padding: 8px 10px;
  align-items: center;
  width: 100%;
  min-height: 38px;
  border: 1px solid transparent;
  border-radius: 0px 18px 18px 0px;
  background: #242424;
  color: white;
  font: inherit;
  text-align: left;
  text-decoration: none;
}

.project-root {
  grid-template-columns: 16px 20px minmax(0, 1fr);
  gap: 8px;
  padding: 8px;
  font-weight: 700;
}

.tree-item,
.sidebar-link {
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 10px;
  padding: 8px 10px;
}

.project-root:hover,
.tree-item:hover,
.sidebar-link:hover {
  border-color: #dddddd;
  background: #ffffff;
}

.project-root span,
.tree-item span,
.sidebar-link span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-root svg,
.tree-item svg,
.sidebar-link svg {
  width: 18px;
  height: 18px;
}

.project-root svg:first-child {
  width: 14px;
  height: 14px;
  transition: transform 0.16s ease;
}

.project-root svg:first-child.expanded {
  transform: rotate(90deg);
}

.folder-tree {
  display: grid;
  gap: 3px;
  margin: 6px 10px 18px;
}

.tree-children {
  display: grid;
  gap: 2px;
  margin-left: 18px;
}

.tree-item.child {
  color: #4f4f4f;
}

.sidebar-section {
  display: grid;
  gap: 5px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #dedede;
}

.tags-section h2 {
  margin: 0 10px 4px;
  color: #707070;
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tag-link {
  color: #383838;
}

.sidebar-link.active {
  border-color: #202020;
  background: #202020;
  color: #ffffff;
}

@media (max-width: 980px) {
  .workspace-left-sidebar {
    width: 100%;
    min-width: 0;
    border-right: 0;
    border-bottom: 1px solid #dcdcdc;
  }
}
</style>
