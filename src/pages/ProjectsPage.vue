<script setup lang="ts">
import ProjectCard from '@/components/common/ProjectCard.vue'
import { projects } from '@/data/mockData'
</script>

<template>
  <div class="row g-0 min-vh-100">
    <aside class="col-12 col-md-3 col-lg-2 border-end bg-white p-3 d-grid gap-2">
      <button class="btn btn-outline-primary text-start">Все проекты</button>
      <button class="btn btn-outline-secondary text-start">Команда 1</button>
      <button class="btn btn-outline-secondary text-start">Команда 2</button>
      <button class="btn btn-outline-secondary text-start">Избранное</button>
      <button class="btn btn-outline-secondary text-start">Корзина</button>
    </aside>

    <section class="col p-4">
      <div class="row g-3">
        <div v-for="project in projects" :key="project.id" class="col-12 col-md-6 col-xl-4">
          <RouterLink :to="`/project/${project.id}`" class="text-decoration-none">
            <ProjectCard :project="project" />
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
