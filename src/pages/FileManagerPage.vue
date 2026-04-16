<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppDropdown from '@/components/common/AppDropdown.vue'
import { members, nodes, tags } from '@/data/mockData'

const route = useRoute()
const router = useRouter()

function goBack() {
  router.back()
}

function goForward() {
  router.forward()
}

const searchText = ref('')
const viewMode = ref<'list' | 'grid'>('list')
const sortBy = ref<'name' | 'type' | 'updated'>('updated')
const activeDropdown = ref<string | null>(null)

const projectId = computed(() => String(route.params.projectId))
const currentFolderId = computed(() => (route.params.folderId ? String(route.params.folderId) : null))

const filteredNodes = computed(() => {
  return nodes
    .filter((node) => node.projectId === projectId.value && node.parentId === currentFolderId.value)
    .filter((node) => node.title.toLowerCase().includes(searchText.value.toLowerCase()))
    .sort((a, b) => {
      if (sortBy.value === 'name') return a.title.localeCompare(b.title)
      if (sortBy.value === 'type') return a.type.localeCompare(b.type)
      return b.updatedAt.localeCompare(a.updatedAt)
    })
})

function openNode(nodeId: string, nodeType: string) {
  if (nodeType === 'folder') {
    router.push(`/project/${projectId.value}/folder/${nodeId}`)
    return
  }
  router.push(`/project/${projectId.value}/${nodeType}/${nodeId}`)
}

const searchModes = [
  { label: 'Искать по name', value: 'name' },
  { label: 'Искать по tags', value: 'tags' },
  { label: 'Искать по created_by', value: 'created_by' },
]

const sortModes = [
  { label: 'По имени', value: 'name' },
  { label: 'По типу', value: 'type' },
  { label: 'По изменению', value: 'updated' },
]
</script>

<template>
  <div class="d-flex align-items-center justify-content-between gap-3">
    <div class="btn-group">
      <button class="btn btn-outline-secondary" @click="goBack"><i class="bi bi-arrow-left"></i></button>
      <button class="btn btn-outline-secondary" @click="goForward"><i class="bi bi-arrow-right"></i></button>
      <RouterLink class="btn btn-outline-secondary" :to="`/project/${projectId}`"><i class="bi bi-arrow-up"></i></RouterLink>
    </div>

    <div class="position-relative w-100" style="max-width: 420px">
      <input
        v-model="searchText"
        class="form-control"
        placeholder="Локальный поиск"
        @focus="activeDropdown = 'search'"
      />
      <div v-if="activeDropdown === 'search'" class="position-absolute mt-1 z-3">
        <AppDropdown :options="searchModes" title="Режимы поиска" @select="(mode) => (searchText = `${mode}: `)" />
      </div>
    </div>

    <div class="position-relative">
      <button class="btn btn-outline-secondary" @click="activeDropdown = activeDropdown === 'sort' ? null : 'sort'">
        <i class="bi bi-funnel"></i> Сортировка
      </button>
      <div v-if="activeDropdown === 'sort'" class="position-absolute end-0 mt-1 z-3">
        <AppDropdown :options="sortModes" title="Сортировать" @select="(value) => (sortBy = value as any)" />
      </div>
    </div>
  </div>

  <div class="row g-0 mt-3" style="min-height: calc(100vh - 110px)">
    <aside class="col-12 col-md-3 col-lg-2 border-end bg-white p-3">
      <button class="btn btn-light w-100 text-start mb-2"><i class="bi bi-folder2-open me-2"></i>Корень проекта</button>
      <button class="btn btn-light w-100 text-start mb-2"><i class="bi bi-star me-2"></i>Избранное</button>
      <button class="btn btn-light w-100 text-start mb-2"><i class="bi bi-trash me-2"></i>Корзина</button>
      <h6 class="mt-3">Теги</h6>
      <div v-for="tag in tags" :key="tag.id" class="small py-1"><span class="dot" :style="{ background: tag.color }"></span>{{ tag.name }}</div>
    </aside>

    <section class="col p-3">
      <div class="d-flex gap-2 mb-3">
        <button class="btn btn-primary btn-sm"><i class="bi bi-plus-lg"></i> Создать</button>
        <button class="btn btn-outline-secondary btn-sm" @click="viewMode = viewMode === 'list' ? 'grid' : 'list'">
          <i :class="viewMode === 'list' ? 'bi bi-grid' : 'bi bi-list-ul'"></i>
        </button>
      </div>

      <div :class="viewMode === 'list' ? 'd-grid gap-2' : 'row g-2'">
        <div
          v-for="node in filteredNodes"
          :key="node.id"
          :class="viewMode === 'list' ? 'card p-2' : 'col-12 col-md-6 col-xl-4'"
        >
          <div class="card h-100 p-2" @dblclick="openNode(node.id, node.type)">
            <div class="d-flex justify-content-between align-items-center">
              <div><i class="bi me-2" :class="node.icon"></i>{{ node.title }}</div>
              <span class="badge text-bg-light">{{ node.type }}</span>
            </div>
            <small class="text-secondary">{{ node.tags.join(', ') }}</small>
          </div>
        </div>
      </div>
    </section>

    <aside class="col-12 col-md-3 col-lg-2 border-start bg-white p-3">
      <h6>Участники</h6>
      <div v-for="member in members" :key="member" class="d-flex align-items-center gap-2 mb-2">
        <i class="bi bi-person-circle"></i>
        <span class="small">{{ member }}</span>
      </div>
    </aside>
  </div>
</template>
