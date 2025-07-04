# 第六章：样式框架集成

## 🎯 学习目标

- 理解原子化 CSS 的概念和优势
- 配置和使用 UnoCSS 框架
- 设计项目的主题色彩系统
- 实现响应式设计和动画效果

## 🎨 UnoCSS 简介

### 什么是原子化 CSS？

原子化 CSS 是一种 CSS 架构方法，将样式拆分为最小的、可复用的单元。

**传统 CSS vs 原子化 CSS**

```css
/* 传统 CSS */
.button {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
}

.button:hover {
  background-color: #2563eb;
}
```

```html
<!-- 原子化 CSS -->
<button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded border-none cursor-pointer">
  按钮
</button>
```

### UnoCSS 的优势

| 特性 | Tailwind CSS | UnoCSS |
|------|--------------|--------|
| 性能 | 好 | 更好 |
| 包体积 | 中等 | 更小 |
| 自定义性 | 高 | 更高 |
| 学习成本 | 中等 | 较低 |
| 生态系统 | 成熟 | 新兴 |

## ⚙️ UnoCSS 配置

### 安装 UnoCSS

```bash
pnpm add -D unocss
```

### 基础配置 uno.config.ts

```typescript
import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),        // 默认预设
    presetAttributify(), // 属性化模式
    presetIcons({       // 图标预设
      scale: 1.2,
      warn: true,
    }),
  ],
  theme: {
    colors: {
      primary: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6', // 主色调 - 青绿色
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
      },
      secondary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
      'slide-up': 'slideUp 0.3s ease-out',
      'bounce-in': 'bounceIn 0.6s ease-out',
    },
  },
  shortcuts: {
    // 常用组合样式
    'btn-primary': 'bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors',
    'card': 'bg-white rounded-lg shadow-md p-4',
    'input-field': 'border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500',
  },
  rules: [
    // 自定义规则
    ['text-shadow-sm', { 'text-shadow': '0 1px 2px rgba(0, 0, 0, 0.1)' }],
    ['text-shadow', { 'text-shadow': '0 2px 4px rgba(0, 0, 0, 0.3)' }],
    ['text-shadow-lg', { 'text-shadow': '0 4px 8px rgba(0, 0, 0, 0.5)' }],
    ['backdrop-blur-sm', { 'backdrop-filter': 'blur(4px)' }],
    ['backdrop-blur', { 'backdrop-filter': 'blur(8px)' }],
    ['backdrop-blur-lg', { 'backdrop-filter': 'blur(16px)' }],
  ],
  safelist: [
    // 确保这些类不会被清除
    'text-shadow',
    'backdrop-blur',
    'bg-primary-500',
    'text-white',
  ],
})
```

### Vite 集成

```typescript
// vite.config.ts
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
  ],
})
```

### 在项目中引入

```typescript
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'

// 引入 UnoCSS
import 'virtual:uno.css'

const app = createApp(App)
app.mount('#app')
```

## 🎨 主题设计系统

### 色彩系统

```typescript
// uno.config.ts
export default defineConfig({
  theme: {
    colors: {
      // 主色调 - 青绿色系
      primary: {
        50: '#f0fdfa',   // 最浅
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6',  // 主色调
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',  // 最深
      },
      
      // 辅助色 - 灰色系
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      
      // 语义化颜色
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
})
```

### 字体系统

```typescript
export default defineConfig({
  theme: {
    fontFamily: {
      // 无衬线字体
      sans: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'sans-serif'
      ],
      
      // 等宽字体
      mono: [
        'JetBrains Mono',
        'Fira Code',
        'Consolas',
        'Monaco',
        'monospace'
      ],
      
      // 中文字体
      chinese: [
        'PingFang SC',
        'Hiragino Sans GB',
        'Microsoft YaHei',
        'sans-serif'
      ],
    },
    
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      'base': ['1rem', { lineHeight: '1.5rem' }],
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },
  },
})
```

### 间距系统

```typescript
export default defineConfig({
  theme: {
    spacing: {
      'px': '1px',
      '0': '0',
      '0.5': '0.125rem',  // 2px
      '1': '0.25rem',     // 4px
      '1.5': '0.375rem',  // 6px
      '2': '0.5rem',      // 8px
      '2.5': '0.625rem',  // 10px
      '3': '0.75rem',     // 12px
      '3.5': '0.875rem',  // 14px
      '4': '1rem',        // 16px
      '5': '1.25rem',     // 20px
      '6': '1.5rem',      // 24px
      '7': '1.75rem',     // 28px
      '8': '2rem',        // 32px
      '9': '2.25rem',     // 36px
      '10': '2.5rem',     // 40px
      '12': '3rem',       // 48px
      '16': '4rem',       // 64px
      '20': '5rem',       // 80px
      '24': '6rem',       // 96px
      '32': '8rem',       // 128px
    },
  },
})
```

## 🎭 动画系统

### 关键帧动画

```typescript
export default defineConfig({
  theme: {
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideUp: {
        '0%': { transform: 'translateY(20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      slideDown: {
        '0%': { transform: 'translateY(-20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      bounceIn: {
        '0%': { transform: 'scale(0.3)', opacity: '0' },
        '50%': { transform: 'scale(1.05)' },
        '70%': { transform: 'scale(0.9)' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
      pulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' },
      },
      spin: {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
    },
    
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
      'slide-up': 'slideUp 0.3s ease-out',
      'slide-down': 'slideDown 0.3s ease-out',
      'bounce-in': 'bounceIn 0.6s ease-out',
      'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'spin': 'spin 1s linear infinite',
    },
  },
})
```

### 过渡效果

```typescript
export default defineConfig({
  theme: {
    transitionDuration: {
      '75': '75ms',
      '100': '100ms',
      '150': '150ms',
      '200': '200ms',
      '300': '300ms',
      '500': '500ms',
      '700': '700ms',
      '1000': '1000ms',
    },
    
    transitionTimingFunction: {
      'linear': 'linear',
      'in': 'cubic-bezier(0.4, 0, 1, 1)',
      'out': 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
})
```

## 🔧 自定义规则和快捷方式

### 快捷方式 (Shortcuts)

```typescript
export default defineConfig({
  shortcuts: {
    // 按钮样式
    'btn': 'px-4 py-2 rounded font-medium transition-colors cursor-pointer',
    'btn-primary': 'btn bg-primary-500 hover:bg-primary-600 text-white',
    'btn-secondary': 'btn bg-gray-200 hover:bg-gray-300 text-gray-800',
    'btn-outline': 'btn border border-primary-500 text-primary-500 hover:bg-primary-50',
    
    // 卡片样式
    'card': 'bg-white rounded-lg shadow-md p-6',
    'card-hover': 'card hover:shadow-lg transition-shadow',
    
    // 输入框样式
    'input': 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500',
    
    // 布局样式
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'absolute-center': 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    
    // 文本样式
    'text-gradient': 'bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent',
  },
})
```

### 自定义规则

```typescript
export default defineConfig({
  rules: [
    // 文字阴影
    ['text-shadow-sm', { 'text-shadow': '0 1px 2px rgba(0, 0, 0, 0.1)' }],
    ['text-shadow', { 'text-shadow': '0 2px 4px rgba(0, 0, 0, 0.3)' }],
    ['text-shadow-lg', { 'text-shadow': '0 4px 8px rgba(0, 0, 0, 0.5)' }],
    
    // 背景模糊
    ['backdrop-blur-xs', { 'backdrop-filter': 'blur(2px)' }],
    ['backdrop-blur-sm', { 'backdrop-filter': 'blur(4px)' }],
    ['backdrop-blur', { 'backdrop-filter': 'blur(8px)' }],
    ['backdrop-blur-lg', { 'backdrop-filter': 'blur(16px)' }],
    ['backdrop-blur-xl', { 'backdrop-filter': 'blur(24px)' }],
    
    // 渐变边框
    [/^border-gradient-(.+)$/, ([, c]) => ({
      'border': '1px solid transparent',
      'background': `linear-gradient(white, white) padding-box, linear-gradient(45deg, ${c}) border-box`,
    })],
    
    // 动态尺寸
    [/^size-(.+)$/, ([, size]) => ({
      'width': size,
      'height': size,
    })],
  ],
})
```

## 📱 响应式设计

### 断点系统

```typescript
export default defineConfig({
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
})
```

### 响应式使用示例

```vue
<template>
  <div class="
    w-full 
    px-4 sm:px-6 lg:px-8
    py-8 sm:py-12 lg:py-16
    text-center sm:text-left
  ">
    <h1 class="
      text-2xl sm:text-3xl lg:text-4xl xl:text-5xl
      font-bold
      text-gray-900
      mb-4 sm:mb-6 lg:mb-8
    ">
      响应式标题
    </h1>
    
    <p class="
      text-base sm:text-lg lg:text-xl
      text-gray-600
      max-w-none sm:max-w-2xl lg:max-w-4xl
      mx-auto sm:mx-0
    ">
      这是一个响应式的段落文本
    </p>
  </div>
</template>
```

## 🎨 全局样式

### 创建全局样式文件

```css
/* src/styles/global.css */

/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  overflow: hidden;
  background: #1a1a1a;
}

#app {
  height: 100vh;
  width: 100vw;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* 选择文本样式 */
::selection {
  background: rgba(20, 184, 166, 0.3);
  color: inherit;
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid #14b8a6;
  outline-offset: 2px;
}

/* 动画类 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
```

## 🔍 开发工具和调试

### VS Code 扩展

推荐安装以下 VS Code 扩展：
- **UnoCSS**: 提供智能提示和语法高亮
- **Tailwind CSS IntelliSense**: 兼容的智能提示

### 开发者工具

```typescript
// 开发环境下启用 UnoCSS 开发者工具
export default defineConfig({
  plugins: [
    UnoCSS({
      // 启用检查器
      inspector: true,
    }),
  ],
})
```

访问 `http://localhost:3000/__unocss` 查看生成的样式。

### 样式调试

```vue
<template>
  <!-- 添加调试边框 -->
  <div class="debug-border">
    <div class="debug-bg-red">内容区域</div>
  </div>
</template>

<style>
/* 调试样式 */
.debug-border * {
  border: 1px solid red !important;
}

.debug-bg-red {
  background: rgba(255, 0, 0, 0.1) !important;
}
</style>
```

## 🚀 性能优化

### 按需生成

UnoCSS 默认按需生成样式，只包含实际使用的类：

```typescript
export default defineConfig({
  // 配置扫描文件
  content: {
    filesystem: [
      'src/**/*.{vue,js,ts,jsx,tsx}',
      'index.html',
    ],
  },
})
```

### 预设优化

```typescript
export default defineConfig({
  presets: [
    presetUno({
      // 只包含需要的功能
      dark: 'class',
      attributify: false,
    }),
  ],
})
```

## 📚 扩展阅读

### 官方文档
- [UnoCSS 官方文档](https://unocss.dev/)
- [原子化 CSS 最佳实践](https://antfu.me/posts/reimagine-atomic-css)

### 设计系统
- [Tailwind CSS 设计系统](https://tailwindcss.com/docs/customizing-colors)
- [Material Design 色彩系统](https://material.io/design/color/the-color-system.html)

---

**下一章：[状态管理实现](./07-state-management.md)**
