<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import IconSearch from '~icons/carbon/search'

const search = defineModel<string>({ default: '' })

const props = defineProps<{
  tags: { id: string; name: string }[]
  users: string[]
}>()

const isFocused = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const showDropdown = computed(() => isFocused.value)

const searchTokens = [
  { label: 'названию', value: 'name:' },
  { label: 'тегам', value: 'tags:' },
  { label: 'типу', value: 'type:' },
  { label: 'автору', value: 'created_by:' },
  { label: 'дате', value: 'date:' }
]

const currentToken = computed(() => {
  const parts = search.value.split(/\s+/)
  const lastPart = parts[parts.length - 1]
  if (lastPart?.includes(':')) {
    const key = lastPart.split(':')[0] + ':'
    return key
  }
  // Check if we are inside a token with spaces (like tags: a, b)
  const regex = /(name:|tags:|type:|created_by:|date:)([^:]*)$/
  const match = search.value.match(regex)
  if (match && match[1]) return match[1]
  return null
})

const autocompleteOptions = computed(() => {
  if (!currentToken.value) return []
  
  const token = currentToken.value
  const regex = new RegExp(`${token}([^:]*)$`)
  const match = search.value.match(regex)
  const currentVal = (match && match[1]) ? match[1].trim() : ''

  if (token === 'tags:') {
    const parts = currentVal.split(',')
    const lastTagStr = parts[parts.length - 1]
    const lastTag = lastTagStr ? lastTagStr.trim().toLowerCase() : ''
    return props.tags
      .filter(t => t.name.toLowerCase().startsWith(lastTag) && !currentVal.includes(t.name))
      .map(t => ({ label: t.name, value: t.name }))
  }
  if (token === 'type:') {
    const types = ['folder', 'document', 'canvas']
    return types.filter(t => t.startsWith(currentVal.toLowerCase()))
      .map(t => ({ label: t, value: t }))
  }
  if (token === 'created_by:') {
    return props.users.filter(u => u.toLowerCase().startsWith(currentVal.toLowerCase()))
      .map(u => ({ label: u, value: u }))
  }

  return []
})

const appendToken = (val: string) => {
  if (!currentToken.value) {
    search.value = search.value ? `${search.value.trim()} ${val} ` : `${val} `
  } else {
    const token = currentToken.value
    if (token === 'tags:') {
      const regex = new RegExp(`${token}([^:]*)$`)
      const match = search.value.match(regex)
      if (match && match[1]) {
        const parts = match[1].split(',')
        parts[parts.length - 1] = ' ' + val + ', '
        search.value = search.value.replace(regex, `${token}${parts.join(',')}`)
      }
    } else {
      const regex = new RegExp(`${token}([^:]*)$`)
      search.value = search.value.replace(regex, `${token} ${val} `)
    }
  }
  inputRef.value?.focus()
}

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isFocused.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    search.value = ''
    isFocused.value = false
  }
  if (e.key === 'Enter') {
    isFocused.value = false
  }
  if (e.key === 'Tab' && autocompleteOptions.value && autocompleteOptions.value.length > 0 && currentToken.value) {
    e.preventDefault()
    if (autocompleteOptions.value[0]) {
      appendToken(autocompleteOptions.value[0].value)
    }
  }
}
</script>

<template>
  <div class="workspace-search-container" ref="dropdownRef">
    <BInputGroup class="workspace-search">
      <BInputGroupText>
        <IconSearch aria-hidden="true" />
      </BInputGroupText>
      <BFormInput
        ref="inputRef"
        v-model="search"
        type="search"
        placeholder="Поиск в текущей папке"
        aria-label="Поиск в текущей папке"
        @focus="isFocused = true"
        @keydown="onKeyDown"
      />
    </BInputGroup>
    
    <div v-if="showDropdown && (search === '' || autocompleteOptions.length > 0)" class="search-dropdown">
      <template v-if="search === ''">
        <div class="dropdown-header">Искать по</div>
        <button 
          v-for="opt in searchTokens" 
          :key="opt.value" 
          class="dropdown-item"
          @click.stop="appendToken(opt.value)"
        >
          {{ opt.label }}
        </button>
      </template>
      <template v-else>
        <button 
          v-for="opt in autocompleteOptions" 
          :key="opt.value" 
          class="dropdown-item"
          @click.stop="appendToken(opt.value)"
        >
          {{ opt.label }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.workspace-search-container {
  position: relative;
  width: 100%;
}
.workspace-search :deep(.input-group-text) {
  border-color: #d4d4d4;
  border-radius: 8px 0 0 8px;
  background: #f7f7f7;
  color: #5b5b5b;
}

.workspace-search :deep(.form-control) {
  min-height: 42px;
  border-color: #d4d4d4;
  border-radius: 0 8px 8px 0;
}

.workspace-search :deep(.form-control:focus) {
  border-color: #7a7a7a;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  padding: 8px 12px;
  font-size: 12px;
  color: #777;
  font-weight: 600;
  text-transform: uppercase;
  background: #f8f8f8;
  border-bottom: 1px solid #eee;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  background: transparent;
  border: none;
  font-size: 14px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f0f0f0;
}
</style>
