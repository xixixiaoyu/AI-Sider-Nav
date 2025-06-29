import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { webExtension } from 'vite-plugin-web-extension'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    webExtension({
      manifest: './src/manifest.json',
      watchFilePaths: ['src/**/*'],
      additionalInputs: {
        'content-script': 'src/content-script/index.ts',
        'background': 'src/background/index.ts'
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '~': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        sidebar: resolve(__dirname, 'src/sidebar/index.html')
      }
    }
  },
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false
  },
  server: {
    port: 3000,
    hmr: {
      port: 3001
    }
  }
})
