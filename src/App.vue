<script setup lang="ts">
import Layouts from '@/layouts/index.vue'
import AppToast from '@/components/AppToast.vue'
import { BApp } from 'bootstrap-vue-next'
</script>

<template>
  <BApp>
    <Layouts />
    <AppToast />
  </BApp>
</template>
