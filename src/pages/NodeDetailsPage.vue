<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const nodeType = computed(() => route.params.nodeType)
const nodeId = computed(() => route.params.nodeId)
</script>

<template>
  <div class="container py-4">
    <div class="card shadow-sm">
      <div class="card-body">
        <h4 class="card-title"><i class="bi bi-file-earmark-richtext"></i> Страница объекта</h4>
        <p class="text-secondary mb-0">Тип: {{ nodeType }}, id: {{ nodeId }}</p>
      </div>
    </div>
  </div>
</template>
