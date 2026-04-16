<script setup lang="ts">
import { ref } from 'vue'
import IconChevronRight from '~icons/carbon/chevron-right'
import IconFolder from '~icons/carbon/folder'
import IconStar from '~icons/carbon/star'
import IconTag from '~icons/carbon/tag'
import IconTrashCan from '~icons/carbon/trash-can'

type FolderNode = {
  id: string
  name: string
  children?: FolderNode[]
}

type TagItem = {
  id: string
  name: string
}

defineProps<{
  projectName: string
  folders: FolderNode[]
  tags: TagItem[]
}>()

const rootExpanded = ref(true)
</script>

<template>
  <aside class="workspace-left-sidebar" aria-label="Дерево проекта">
    <button class="project-root" type="button" @click="rootExpanded = !rootExpanded">
      <IconChevronRight :class="{ expanded: rootExpanded }" aria-hidden="true" />
      <IconFolder aria-hidden="true" />
      <span>{{ projectName }}</span>
    </button>

    <div v-if="rootExpanded" class="folder-tree">
      <div v-for="folder in folders" :key="folder.id" class="folder-group">
        <button class="tree-item" type="button">
          <IconFolder aria-hidden="true" />
          <span>{{ folder.name }}</span>
        </button>

        <div v-if="folder.children?.length" class="tree-children">
          <button v-for="child in folder.children" :key="child.id" class="tree-item child" type="button">
            <IconFolder aria-hidden="true" />
            <span>{{ child.name }}</span>
          </button>
        </div>
      </div>
    </div>

    <nav class="sidebar-section" aria-label="Быстрые разделы">
      <button class="sidebar-link" type="button">
        <IconStar aria-hidden="true" />
        <span>Избранное</span>
      </button>
      <button class="sidebar-link" type="button">
        <IconTrashCan aria-hidden="true" />
        <span>Корзина</span>
      </button>
    </nav>

    <section v-if="tags.length" class="sidebar-section tags-section">
      <h2>Тэги</h2>
      <button v-for="tag in tags" :key="tag.id" class="sidebar-link tag-link" type="button">
        <IconTag aria-hidden="true" />
        <span>{{ tag.name }}</span>
      </button>
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
  margin: 6px 0 18px;
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

@media (max-width: 980px) {
  .workspace-left-sidebar {
    width: 100%;
    min-width: 0;
    border-right: 0;
    border-bottom: 1px solid #dcdcdc;
  }
}
</style>
