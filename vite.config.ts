import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'canvas-drawing-editor',
        },
      },
    }),
    vueDevTools(),
    Components({
      resolvers: [BootstrapVueNextResolver()],
    }),
    Icons({
      autoInstall: true,
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
