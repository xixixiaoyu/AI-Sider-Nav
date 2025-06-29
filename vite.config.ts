import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), UnoCSS()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '~': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        sidebar: resolve(__dirname, 'src/sidebar/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        'content-script': resolve(__dirname, 'src/content-script/index.ts'),
      },
      output: {
        entryFileNames: chunk => {
          if (chunk.name === 'background') return 'background.js'
          if (chunk.name === 'content-script') return 'content-script.js'
          return '[name]/[name].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: assetInfo => {
          if (assetInfo.name?.endsWith('.css')) {
            if (assetInfo.name.includes('content-script')) {
              return 'content-script.css'
            }
            return '[name]/[name].css'
          }
          return 'assets/[name]-[hash].[ext]'
        },
      },
    },
  },
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
  },
  server: {
    port: 3000,
    hmr: {
      port: 3001,
    },
  },
})
