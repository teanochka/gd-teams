<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

type NodeType = 'folder' | 'document' | 'canvas'

type AppRoute =
  | { name: 'projects'; projectId?: string; folderId?: string; nodeId?: string; fullPath: string }
  | { name: 'folder'; projectId: string; folderId: string; fullPath: string }
  | { name: 'document'; projectId: string; nodeId: string; fullPath: string }
  | { name: 'canvas'; projectId: string; nodeId: string; fullPath: string }

interface Project {
  id: string
  name: string
  banner: string
  updatedAt: string
}

interface FileNode {
  id: string
  parentId: string | null
  projectId: string
  title: string
  type: NodeType
  icon: string
  tags: string[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  isFavorite: boolean
}

interface Tag {
  id: string
  name: string
  color: string
}

const projects: Project[] = [
  { id: 'test', name: 'Nebula Ops', banner: 'Linear gradient', updatedAt: '14.04.2026' },
  { id: 'alpha', name: 'Alpha Prototype', banner: 'Landing redesign', updatedAt: '09.04.2026' },
]

const tags: Tag[] = [
  { id: 'art', name: 'art', color: '#F97316' },
  { id: 'villian', name: 'villian', color: '#EF4444' },
  { id: 'archive', name: 'archive', color: '#6B7280' },
  { id: 'ux', name: 'ux', color: '#8B5CF6' },
  { id: 'team-1', name: 'team-1', color: '#0EA5E9' },
  { id: 'release', name: 'release', color: '#22C55E' },
  { id: 'engine', name: 'engine', color: '#EAB308' },
]

const members = ['Alex Harper', 'Dana Moon', 'Iris Quinn', 'Maks Sol']

const nodes: FileNode[] = [
  {
    id: 'fld-root-design',
    parentId: null,
    projectId: 'test',
    title: 'Design',
    type: 'folder',
    icon: '📁',
    tags: ['ux'],
    createdAt: '02.03.2026',
    createdBy: 'Alex Harper',
    updatedAt: '13.04.2026',
    updatedBy: 'Dana Moon',
    isFavorite: true,
  },
  {
    id: 'fld-root-assets',
    parentId: null,
    projectId: 'test',
    title: 'Assets',
    type: 'folder',
    icon: '📁',
    tags: ['archive'],
    createdAt: '03.03.2026',
    createdBy: 'Dana Moon',
    updatedAt: '11.04.2026',
    updatedBy: 'Dana Moon',
    isFavorite: false,
  },
  {
    id: 'doc-root-roadmap',
    parentId: null,
    projectId: 'test',
    title: 'Roadmap Q3',
    type: 'document',
    icon: '📄',
    tags: ['release'],
    createdAt: '20.03.2026',
    createdBy: 'Iris Quinn',
    updatedAt: '15.04.2026',
    updatedBy: 'Maks Sol',
    isFavorite: true,
  },
  {
    id: 'can-root-wireframe',
    parentId: null,
    projectId: 'test',
    title: 'Wireframe System',
    type: 'canvas',
    icon: '🧩',
    tags: ['ux', 'team-1'],
    createdAt: '01.04.2026',
    createdBy: 'Alex Harper',
    updatedAt: '10.04.2026',
    updatedBy: 'Alex Harper',
    isFavorite: false,
  },
  {
    id: 'doc-design-guidelines',
    parentId: 'fld-root-design',
    projectId: 'test',
    title: 'Guidelines',
    type: 'document',
    icon: '📄',
    tags: ['ux'],
    createdAt: '06.03.2026',
    createdBy: 'Dana Moon',
    updatedAt: '08.04.2026',
    updatedBy: 'Iris Quinn',
    isFavorite: false,
  },
  {
    id: 'can-design-moodboard',
    parentId: 'fld-root-design',
    projectId: 'test',
    title: 'Moodboard',
    type: 'canvas',
    icon: '🧩',
    tags: ['art'],
    createdAt: '16.03.2026',
    createdBy: 'Alex Harper',
    updatedAt: '12.04.2026',
    updatedBy: 'Dana Moon',
    isFavorite: false,
  },
  {
    id: 'fld-assets-icons',
    parentId: 'fld-root-assets',
    projectId: 'test',
    title: 'Icons',
    type: 'folder',
    icon: '📁',
    tags: ['archive'],
    createdAt: '12.03.2026',
    createdBy: 'Maks Sol',
    updatedAt: '12.03.2026',
    updatedBy: 'Maks Sol',
    isFavorite: false,
  },
]

const currentPath = ref(window.location.pathname)
const viewMode = ref<'list' | 'grid'>('list')
const sortBy = ref<'name' | 'created' | 'updated' | 'type'>('updated')
const sortOrder = ref<'asc' | 'desc'>('desc')
const searchText = ref('')
const selectedIds = ref<string[]>([])
const clipboardState = reactive({ type: null as 'copy' | 'cut' | null, nodeIds: [] as string[] })
const activeDropdown = ref<string | null>(null)
const showTagEditor = ref(false)

const menu = reactive({
  visible: false,
  x: 0,
  y: 0,
  section: '' as 'node' | 'tag' | 'sidebar' | '',
  targetId: '',
})

function parseRoute(pathname: string): AppRoute {
  const segments = pathname.split('/').filter(Boolean)
  if (pathname === '/projects' || segments[0] === 'projects') {
    return { name: 'projects', fullPath: pathname }
  }

  if (segments[0] === 'project' && segments[1]) {
    const projectId = segments[1]
    if (segments[2] === 'folder' && segments[3]) {
      return { name: 'folder', projectId, folderId: segments[3], fullPath: pathname }
    }
    if (segments[2] === 'document' && segments[3]) {
      return { name: 'document', projectId, nodeId: segments[3], fullPath: pathname }
    }
    if (segments[2] === 'canvas' && segments[3]) {
      return { name: 'canvas', projectId, nodeId: segments[3], fullPath: pathname }
    }
    return { name: 'folder', projectId, folderId: 'root', fullPath: pathname }
  }

  return { name: 'projects', fullPath: '/projects' }
}

const route = computed(() => parseRoute(currentPath.value))

const fallbackProject: Project = projects[0] ?? { id: 'test', name: 'Demo project', banner: 'Demo', updatedAt: '16.04.2026' }

const activeProject = computed<Project>(() => {
  if (route.value.name === 'projects') {
    return fallbackProject
  }
  return projects.find((project) => project.id === route.value.projectId) ?? fallbackProject
})

const currentFolderId = computed(() => {
  if (route.value.name === 'folder') {
    return route.value.folderId === 'root' ? null : route.value.folderId
  }
  return null
})

const displayedNodes = computed(() => {
  if (route.value.name !== 'folder') {
    return []
  }

  return [...nodes]
    .filter((node) => node.projectId === route.value.projectId && node.parentId === currentFolderId.value)
    .filter((node) => {
      if (!searchText.value.trim()) {
        return true
      }
      return node.title.toLowerCase().includes(searchText.value.toLowerCase())
    })
    .sort((a, b) => {
      const direction = sortOrder.value === 'asc' ? 1 : -1
      if (sortBy.value === 'name') {
        return a.title.localeCompare(b.title) * direction
      }
      if (sortBy.value === 'type') {
        return a.type.localeCompare(b.type) * direction
      }
      if (sortBy.value === 'created') {
        return a.createdAt.localeCompare(b.createdAt) * direction
      }
      return a.updatedAt.localeCompare(b.updatedAt) * direction
    })
})

const selectedNode = computed(() => nodes.find((node) => node.id === selectedIds.value.at(0)))
const canPaste = computed(() => clipboardState.nodeIds.length > 0)

function goto(path: string) {
  window.history.pushState({}, '', path)
  currentPath.value = window.location.pathname
  selectedIds.value = []
  closeAllMenus()
}

function goBack() {
  window.history.back()
}

function goForward() {
  window.history.forward()
}

function goUp() {
  if (route.value.name !== 'folder') {
    return
  }
  const currentRoute = route.value
  const currentFolder = nodes.find((node) => node.id === currentRoute.folderId)
  const parentId = currentFolder?.parentId
  if (!parentId) {
    goto(`/project/${currentRoute.projectId}`)
    return
  }
  goto(`/project/${currentRoute.projectId}/folder/${parentId}`)
}

function reloadFolder() {
  selectedIds.value = []
}

function openNode(node: FileNode) {
  if (node.type === 'folder') {
    goto(`/project/${node.projectId}/folder/${node.id}`)
    return
  }
  goto(`/project/${node.projectId}/${node.type}/${node.id}`)
}

function onNodeClick(event: MouseEvent, node: FileNode) {
  if (event.shiftKey && selectedIds.value.length > 0) {
    const allIds = displayedNodes.value.map((entry) => entry.id)
    const anchorId = selectedIds.value[0]
    if (!anchorId) return
    const first = allIds.indexOf(anchorId)
    const last = allIds.indexOf(node.id)
    const [start, end] = [Math.min(first, last), Math.max(first, last)]
    selectedIds.value = allIds.slice(start, end + 1)
    return
  }

  if (event.ctrlKey || event.metaKey) {
    selectedIds.value = selectedIds.value.includes(node.id)
      ? selectedIds.value.filter((id) => id !== node.id)
      : [...selectedIds.value, node.id]
    return
  }

  selectedIds.value = [node.id]
}

function handleContextMenu(event: MouseEvent, section: 'node' | 'tag' | 'sidebar', targetId = '') {
  event.preventDefault()
  menu.visible = true
  menu.x = event.clientX
  menu.y = event.clientY
  menu.section = section
  menu.targetId = targetId
}

function closeAllMenus() {
  menu.visible = false
  activeDropdown.value = null
}

function chooseSearchToken(token: string) {
  searchText.value = `${token}: `
  activeDropdown.value = 'search-values'
}

const tagSuggestions = computed(() => {
  const chunk = searchText.value.split(',').at(-1)?.trim().replace('tags:', '').trim().toLowerCase() ?? ''
  return tags
    .map((tag) => tag.name)
    .sort((a, b) => {
      const aStarts = a.startsWith(chunk)
      const bStarts = b.startsWith(chunk)
      if (aStarts === bStarts) return a.localeCompare(b)
      return aStarts ? -1 : 1
    })
    .slice(0, 6)
})

function applySuggestion(value: string) {
  if (!searchText.value.includes('tags:')) {
    searchText.value = `tags: ${value}, `
    return
  }

  const chunks = searchText.value.split(',')
  chunks[chunks.length - 1] = ` ${value}`
  searchText.value = `${chunks.join(',').trim()}, `
}

function onGlobalClick() {
  closeAllMenus()
}

function onPopState() {
  currentPath.value = window.location.pathname
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Delete' && selectedIds.value.length > 0) {
    selectedIds.value = []
  }
  if (event.key === 'Escape') {
    searchText.value = ''
  }
  if (event.key === 'F2' && selectedNode.value) {
    // stub rename shortcut handler
  }
}

onMounted(() => {
  if (window.location.pathname === '/') {
    goto('/projects')
  }
  window.addEventListener('popstate', onPopState)
  window.addEventListener('click', onGlobalClick)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', onPopState)
  window.removeEventListener('click', onGlobalClick)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="app-shell">
    <section v-if="route.name === 'projects'" class="projects-page">
      <header class="projects-topbar">
        <div class="brand">GD Teams</div>
        <div class="top-actions">
          <input placeholder="Поиск проектов" />
          <button>🔔</button>
          <button class="primary">Создать проект</button>
          <div class="avatar">AM</div>
        </div>
      </header>
      <div class="projects-layout">
        <aside class="projects-sidebar">
          <button class="nav-item active">Все проекты</button>
          <button class="nav-item">Команда 1</button>
          <button class="nav-item">Команда 2</button>
          <button class="nav-item">Избранное</button>
          <button class="nav-item">Корзина</button>
        </aside>
        <main class="projects-grid">
          <article v-for="project in projects" :key="project.id" class="project-card" @dblclick="goto(`/project/${project.id}`)">
            <div class="banner">{{ project.banner }}</div>
            <h3>{{ project.name }}</h3>
            <p>Изменено: {{ project.updatedAt }}</p>
          </article>
        </main>
      </div>
    </section>

    <section v-else class="file-manager">
      <header class="fm-topbar">
        <div class="nav-buttons">
          <button @click="goBack">←</button>
          <button @click="goForward">→</button>
          <button @click="goUp">↑</button>
          <button @click="reloadFolder">⟳</button>
        </div>
        <div class="path">/project/{{ activeProject.id }}/{{ route.name }}</div>
        <div class="search-box" @click.stop>
          <input
            v-model="searchText"
            placeholder="Локальный поиск"
            @focus="activeDropdown = searchText ? 'search-values' : 'search-mode'"
          />
          <div v-if="activeDropdown === 'search-mode'" class="dropdown">
            <button @click="chooseSearchToken('name')">Искать по name:</button>
            <button @click="chooseSearchToken('tags')">Искать по tags:</button>
            <button @click="chooseSearchToken('type')">Искать по type:</button>
            <button @click="chooseSearchToken('created_by')">Искать по created_by:</button>
            <button @click="chooseSearchToken('date')">Искать по date:</button>
          </div>
          <div v-if="activeDropdown === 'search-values'" class="dropdown">
            <template v-if="searchText.includes('tags:')">
              <button v-for="tag in tagSuggestions" :key="tag" @click="applySuggestion(tag)">{{ tag }}</button>
            </template>
            <template v-else-if="searchText.includes('type:')">
              <button @click="applySuggestion('folder')">folder</button>
              <button @click="applySuggestion('document')">document</button>
              <button @click="applySuggestion('canvas')">canvas</button>
            </template>
            <template v-else-if="searchText.includes('created_by:')">
              <button v-for="member in members" :key="member" @click="applySuggestion(member)">{{ member }}</button>
            </template>
            <template v-else-if="searchText.includes('date:')">
              <div class="date-range">Диапазон дат (дд.мм.гггг)</div>
            </template>
          </div>
        </div>
      </header>

      <div class="fm-body" @click="selectedIds = []">
        <aside class="left-sidebar" @contextmenu="handleContextMenu($event, 'sidebar')">
          <h3>{{ activeProject.name }}</h3>
          <button class="tree-item">▾ Корень проекта</button>
          <button class="tree-item">⭐ Избранное</button>
          <button class="tree-item">🗑 Корзина</button>
          <h4>Теги</h4>
          <button
            v-for="tag in tags"
            :key="tag.id"
            class="tag-item"
            @contextmenu="handleContextMenu($event, 'tag', tag.id)"
          >
            <span class="dot" :style="{ backgroundColor: tag.color }"></span>{{ tag.name }}
          </button>
        </aside>

        <main class="main-area" @click.stop>
          <div class="toolbar">
            <div class="left-tools">
              <button @click.stop="activeDropdown = activeDropdown === 'create' ? null : 'create'">Создать ▾</button>
              <button :disabled="selectedIds.length === 0">Вырезать</button>
              <button :disabled="selectedIds.length === 0">Копировать</button>
              <button :disabled="!canPaste">Вставить</button>
              <button :disabled="selectedIds.length !== 1">Переименовать</button>
              <button :disabled="selectedIds.length === 0">Удалить</button>
            </div>
            <div class="right-tools">
              <button @click.stop="activeDropdown = activeDropdown === 'sort' ? null : 'sort'">Сортировать ▾</button>
              <button @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</button>
              <button @click.stop="activeDropdown = activeDropdown === 'view' ? null : 'view'">Вид ▾</button>
            </div>
            <div v-if="activeDropdown === 'create'" class="dropdown floating create-menu">
              <button>Папка</button>
              <button>Документ</button>
              <button>Холст</button>
              <button>Шаблон</button>
            </div>
            <div v-if="activeDropdown === 'sort'" class="dropdown floating sort-menu">
              <button @click="sortBy = 'name'">По имени</button>
              <button @click="sortBy = 'created'">По дате создания</button>
              <button @click="sortBy = 'updated'">По дате изменения</button>
              <button @click="sortBy = 'type'">По типу</button>
            </div>
            <div v-if="activeDropdown === 'view'" class="dropdown floating view-menu">
              <button @click="viewMode = 'list'">Список</button>
              <button @click="viewMode = 'grid'">Значки</button>
            </div>
          </div>

          <div v-if="route.name === 'folder'" :class="['nodes', viewMode]">
            <article
              v-for="node in displayedNodes"
              :key="node.id"
              class="node-row"
              :class="{ selected: selectedIds.includes(node.id) }"
              @click.stop="onNodeClick($event, node)"
              @dblclick.stop="openNode(node)"
              @contextmenu.stop="handleContextMenu($event, 'node', node.id)"
            >
              <div class="title">{{ node.icon }} {{ node.title }}</div>
              <div class="type">{{ node.type }}</div>
              <div class="tags-cell">{{ node.tags.join(', ') }}</div>
              <div class="updated">{{ node.updatedAt }}</div>
            </article>
            <div v-if="displayedNodes.length === 0" class="empty-state">Папка пуста / нет результатов</div>
          </div>
          <div v-else class="stub-editor">Stub editor page: {{ route.name }} #{{ route.nodeId }}</div>
        </main>

        <aside class="right-sidebar">
          <h4>Сведения</h4>
          <template v-if="selectedNode">
            <p><strong>Иконка:</strong> {{ selectedNode.icon }}</p>
            <p><strong>Имя:</strong> {{ selectedNode.title }}</p>
            <p><strong>Тэги:</strong> {{ selectedNode.tags.join(', ') || '—' }}</p>
            <p><strong>Создан:</strong> {{ selectedNode.createdAt }} / {{ selectedNode.createdBy }}</p>
            <p><strong>Изменен:</strong> {{ selectedNode.updatedAt }} / {{ selectedNode.updatedBy }}</p>
          </template>
          <template v-else>
            <p><strong>Папка:</strong> {{ currentFolderId || 'root' }}</p>
            <p><strong>Объектов:</strong> {{ displayedNodes.length }}</p>
            <p>Выберите элемент для подробностей.</p>
          </template>
          <button class="secondary" @click="showTagEditor = !showTagEditor">{{ showTagEditor ? 'Скрыть' : 'Создать тэг' }}</button>
          <div v-if="showTagEditor" class="tag-editor">
            <label>Имя <input placeholder="Новый тэг" /></label>
            <label>Цвет
              <select>
                <option>#F97316</option>
                <option>#22C55E</option>
                <option>#8B5CF6</option>
                <option>+</option>
              </select>
            </label>
            <label>RGBA <input value="rgba(249, 115, 22, 1)" /></label>
            <label>HEX <input value="#F97316" /></label>
          </div>
        </aside>
      </div>

      <div
        v-if="menu.visible"
        class="context-menu"
        :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
        @click.stop
      >
        <template v-if="menu.section === 'node'">
          <button>Открыть</button>
          <button>Переименовать</button>
          <button>Дублировать</button>
          <button>Переместить</button>
          <button>В избранное / убрать</button>
          <button>Редактировать теги</button>
          <button class="danger">Удалить</button>
        </template>
        <template v-else-if="menu.section === 'tag'">
          <button>Редактировать тэг</button>
          <button class="danger">Удалить тэг</button>
        </template>
        <template v-else>
          <button>Настройки проекта (stub)</button>
          <button>Добавить новый тэг</button>
        </template>
      </div>
    </section>
  </div>
</template>
