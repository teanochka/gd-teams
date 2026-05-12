import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    Components({
      resolvers: [
        BootstrapVueNextResolver(),
        IconsResolver(),
      ],
      dts: true,
    }),
    Icons({
      autoInstall: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    proxy: {
      // Любой запрос, начинающийся с /api, будет перенаправлен
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        // Убираем /api из пути при перенаправлении
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
