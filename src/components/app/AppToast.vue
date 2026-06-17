<script setup lang="ts">
import { useAppToast } from "@/composables/useAppToast";

const { toast, hideToast } = useAppToast();
</script>

<template>
  <Transition name="app-toast">
    <div
      v-if="toast"
      class="app-toast"
      :class="toast.variant"
      role="alert"
      @click="hideToast"
    >
      {{ toast.message }}
    </div>
  </Transition>
</template>

<style scoped>
.app-toast {
  position: fixed;
  top: 18px;
  left: 50%;
  z-index: 3000;
  max-width: min(560px, calc(100vw - 32px));
  min-height: 44px;
  padding: 12px 16px;
  border-radius: 7px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.35;
  text-align: center;
  transform: translateX(-50%);
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.22);
  cursor: default;
}

.app-toast.error {
  background: #b42318;
}

.app-toast-enter-active,
.app-toast-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
