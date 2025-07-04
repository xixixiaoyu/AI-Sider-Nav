# 第五章：构建工具配置

## 🎯 学习目标

- 配置 Vite 构建工具
- 优化浏览器扩展构建流程
- 理解模块打包和资源处理
- 设置开发和生产环境

## ⚡ Vite 简介

### 什么是 Vite？

Vite 是新一代前端构建工具，具有以下特点：
- 🚀 极快的开发服务器启动
- ⚡ 闪电般的热模块替换 (HMR)
- 📦 优化的生产构建
- 🔧 丰富的插件生态

### Vite vs 传统构建工具

| 特性 | Webpack | Rollup | Vite |
|------|---------|--------|------|
| 开发启动速度 | 慢 | 中等 | 极快 |
| HMR 速度 | 慢 | 无 | 极快 |
| 配置复杂度 | 高 | 中等 | 低 |
| 生产构建 | 优秀 | 优秀 | 优秀 |
| 生态成熟度 | 最高 | 高 | 快速增长 |

## 🔧 基础 Vite 配置

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // 为浏览器扩展优化
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true,
  },
  // 确保静态资源正确处理
  publicDir: 'public',
})
```

### 配置详解

**插件配置**
```typescript
plugins: [
  vue(),        // Vue 3 支持
  UnoCSS(),     // 原子化 CSS
]
```

**路径别名**
```typescript
resolve: {
  alias: {
    '@': resolve(__dirname, 'src'),  // @ 指向 src 目录
    '@components': resolve(__dirname, 'src/components'),
    '@stores': resolve(__dirname, 'src/stores'),
  },
}
```

**构建配置**
```typescript
build: {
  outDir: 'dist',           // 输出目录
  emptyOutDir: true,        // 构建前清空输出目录
  target: 'esnext',         // 目标环境
  minify: 'esbuild',        // 压缩工具
  sourcemap: false,         // 不生成 sourcemap
}
```

## 🏗️ 浏览器扩展特殊配置

### 多入口配置

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        popup: resolve(__dirname, 'popup.html'),
        // 如果有 background script
        // background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // 为不同入口设置不同的输出路径
          if (chunkInfo.name === 'popup') {
            return 'popup.js'
          }
          return 'assets/[name]-[hash].js'
        },
      },
    },
  },
})
```

### 静态资源处理

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // 保持 manifest.json 在根目录
          if (assetInfo.name === 'manifest.json') {
            return '[name].[ext]'
          }
          // 其他资源放在 assets 目录
          return 'assets/[name]-[hash].[ext]'
        },
      },
    },
  },
  // 确保 public 目录的文件被正确复制
  publicDir: 'public',
})
```

### 环境变量配置

```typescript
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve'
  const isProd = mode === 'production'
  
  return {
    define: {
      __DEV__: isDev,
      __PROD__: isProd,
    },
    build: {
      minify: isProd ? 'esbuild' : false,
      sourcemap: isDev,
    },
  }
})
```

## 🔌 插件配置

### Vue 插件配置

```typescript
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      // 自定义块支持
      customElement: true,
      // 模板编译选项
      template: {
        compilerOptions: {
          // 将自定义元素视为原生元素
          isCustomElement: (tag) => tag.startsWith('custom-')
        }
      }
    }),
  ],
})
```

### UnoCSS 插件配置

```typescript
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    UnoCSS({
      // 配置文件路径
      configFile: './uno.config.ts',
      // 模式配置
      mode: 'vue-scoped',
    }),
  ],
})
```

### 自定义插件

```typescript
// plugins/copy-manifest.ts
import type { Plugin } from 'vite'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

export function copyManifest(): Plugin {
  return {
    name: 'copy-manifest',
    writeBundle() {
      // 构建完成后复制 manifest.json
      copyFileSync(
        resolve(__dirname, '../public/manifest.json'),
        resolve(__dirname, '../dist/manifest.json')
      )
    }
  }
}

// 在 vite.config.ts 中使用
import { copyManifest } from './plugins/copy-manifest'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    copyManifest(),
  ],
})
```

## 🛠️ 开发服务器配置

### 基础服务器配置

```typescript
export default defineConfig({
  server: {
    port: 3000,              // 端口号
    open: true,              // 自动打开浏览器
    cors: true,              // 启用 CORS
    host: '0.0.0.0',         // 允许外部访问
    strictPort: true,        // 端口被占用时不自动尝试下一个
  },
})
```

### 代理配置

```typescript
export default defineConfig({
  server: {
    proxy: {
      // 代理 API 请求
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // 代理搜索请求
      '/search': {
        target: 'https://api.google.com',
        changeOrigin: true,
        secure: true,
      }
    }
  },
})
```

### 热更新配置

```typescript
export default defineConfig({
  server: {
    hmr: {
      port: 3001,            // HMR 端口
      overlay: true,         // 显示错误覆盖层
    },
    watch: {
      // 监听文件变化
      ignored: ['**/node_modules/**', '**/dist/**'],
    },
  },
})
```

## 📦 生产构建优化

### 代码分割

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 Vue 相关库打包到单独的 chunk
          vue: ['vue', 'pinia'],
          // 将工具库打包到单独的 chunk
          utils: ['lodash-es', 'date-fns'],
        },
      },
    },
  },
})
```

### 压缩优化

```typescript
export default defineConfig({
  build: {
    // 使用 esbuild 压缩，速度更快
    minify: 'esbuild',
    // 或使用 terser 获得更好的压缩率
    // minify: 'terser',
    // terserOptions: {
    //   compress: {
    //     drop_console: true,  // 移除 console
    //     drop_debugger: true, // 移除 debugger
    //   },
    // },
    
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    
    // 设置 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
  },
})
```

### 资源优化

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 优化资源文件名
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').pop()
          
          // 根据文件类型分类
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `images/[name]-[hash].[ext]`
          }
          if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return `fonts/[name]-[hash].[ext]`
          }
          return `assets/[name]-[hash].[ext]`
        },
      },
    },
  },
})
```

## 🔍 TypeScript 集成

### TypeScript 配置

```typescript
// vite-env.d.ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 环境变量类型定义
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### 类型检查

```typescript
export default defineConfig({
  plugins: [
    vue(),
    // 添加类型检查插件
    {
      name: 'typescript-checker',
      buildStart() {
        // 在构建开始时进行类型检查
        const { spawn } = require('child_process')
        spawn('vue-tsc', ['--noEmit'], { stdio: 'inherit' })
      }
    }
  ],
})
```

## 🌍 环境变量

### .env 文件配置

```bash
# .env.development
VITE_APP_TITLE=AI Sider Nav (Dev)
VITE_API_URL=http://localhost:8080
VITE_DEBUG=true

# .env.production
VITE_APP_TITLE=AI Sider Nav
VITE_API_URL=https://api.example.com
VITE_DEBUG=false
```

### 在代码中使用

```typescript
// src/config/index.ts
export const config = {
  appTitle: import.meta.env.VITE_APP_TITLE,
  apiUrl: import.meta.env.VITE_API_URL,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}

// 在组件中使用
import { config } from '@/config'

console.log(config.appTitle)
```

## 🚀 构建脚本优化

### package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "build:prod": "vite build --mode production",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit",
    "build:check": "vue-tsc && vite build",
    "clean": "rimraf dist",
    "build:clean": "npm run clean && npm run build"
  }
}
```

### 构建分析

```typescript
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    // 构建分析插件
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
})
```

## 🔧 故障排除

### 常见问题

**1. 模块解析错误**
```typescript
// 解决方案：配置路径别名
resolve: {
  alias: {
    '@': resolve(__dirname, 'src'),
  },
}
```

**2. 静态资源路径错误**
```typescript
// 解决方案：配置 base 路径
export default defineConfig({
  base: './',  // 使用相对路径
})
```

**3. 环境变量未生效**
```bash
# 确保环境变量以 VITE_ 开头
VITE_API_URL=http://localhost:8080
```

### 调试技巧

**启用详细日志**
```bash
# 启用 Vite 调试日志
DEBUG=vite:* npm run dev
```

**分析构建产物**
```bash
# 生成构建分析报告
npm run build -- --report
```

## 📚 扩展阅读

### 官方文档
- [Vite 官方文档](https://vitejs.dev/)
- [Rollup 配置指南](https://rollupjs.org/guide/en/)

### 最佳实践
- [Vite 性能优化](https://vitejs.dev/guide/performance.html)
- [现代前端构建工具对比](https://blog.logrocket.com/vite-3-vs-create-react-app-comparison-migration-guide/)

---

**下一章：[样式框架集成](./06-styling-framework.md)**
