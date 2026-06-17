<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  options: {
    label: string;
    action: () => void;
    icon?: any;
    disabled?: boolean;
    divider?: boolean;
  }[];
}>();

const visible = ref(false);
const position = ref({ x: 0, y: 0 });
const menuRef = ref<HTMLElement | null>(null);

const show = (e: MouseEvent) => {
  e.preventDefault();
  visible.value = true;
  position.value = { x: e.clientX, y: e.clientY };

  // Adjust position if it goes off screen
  setTimeout(() => {
    if (menuRef.value) {
      const rect = menuRef.value.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        position.value.x -= rect.width;
      }
      if (rect.bottom > window.innerHeight) {
        position.value.y -= rect.height;
      }
    }
  }, 0);
};

const hide = () => {
  visible.value = false;
};

const handleAction = (action: () => void) => {
  hide();
  action();
};

const handleClickOutside = (e: MouseEvent) => {
  if (
    visible.value &&
    menuRef.value &&
    !menuRef.value.contains(e.target as Node)
  ) {
    hide();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("contextmenu", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("contextmenu", handleClickOutside);
});

defineExpose({ show, hide });
</script>

<template>
  <div
    v-if="visible"
    ref="menuRef"
    class="context-menu"
    :style="{ top: `${position.y}px`, left: `${position.x}px` }"
  >
    <template v-for="(opt, idx) in options" :key="idx">
      <div v-if="opt.divider" class="menu-divider"></div>
      <button
        v-else
        class="menu-item"
        :disabled="opt.disabled"
        @click="handleAction(opt.action)"
      >
        <component v-if="opt.icon" :is="opt.icon" class="menu-icon" />
        <span>{{ opt.label }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 180px;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 16px;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  gap: 10px;
}

.menu-item:hover:not(:disabled) {
  background: #f0f0f0;
}

.menu-item:disabled {
  color: #aaa;
  cursor: not-allowed;
}

.menu-icon {
  width: 16px;
  height: 16px;
  color: #555;
}

.menu-item:disabled .menu-icon {
  color: #aaa;
}

.menu-divider {
  height: 1px;
  background: #eaeaea;
  margin: 4px 0;
}
</style>
