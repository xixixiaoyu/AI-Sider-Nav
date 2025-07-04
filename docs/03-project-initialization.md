# 第三章：项目初始化

## 🎯 学习目标

- 创建项目基础结构
- 配置 package.json 和依赖管理
- 设置 TypeScript 和构建配置
- 理解现代前端项目的组织方式

## 📁 创建项目目录

### 初始化项目

```bash
# 创建项目目录
mkdir AI-Sider-Nav
cd AI-Sider-Nav

# 初始化 Git 仓库
git init

# 创建基础目录结构
mkdir -p src/{components,stores,styles}
mkdir -p public/{icons,images}
mkdir docs
```

### 目录结构说明

```
AI-Sider-Nav/
├── src/                    # 源代码目录
│   ├── components/         # Vue 组件
│   ├── stores/            # Pinia 状态管理
│   ├── styles/            # 样式文件
│   ├── App.vue            # 根组件
│   └── main.ts            # 应用入口
├── public/                # 静态资源
│   ├── icons/             # 扩展图标
│   ├── images/            # 图片资源
│   ├── manifest.json      # 扩展配置
│   └── popup.html         # 弹出页面
├── docs/                  # 项目文档
├── dist/                  # 构建输出 (自动生成)
├── node_modules/          # 依赖包 (自动生成)
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
├── uno.config.ts          # UnoCSS 配置
├── .eslintrc.cjs          # ESLint 配置
├── .prettierrc.json       # Prettier 配置
├── .gitignore             # Git 忽略文件
└── README.md              # 项目说明
```

## 📦 配置 package.json

### 创建 package.json

```bash
# 交互式创建
pnpm init

# 或直接创建
touch package.json
```

### 完整的 package.json 配置

```json
{
  "name": "ai-sider-nav",
  "version": "1.0.0",
  "description": "A beautiful new tab page extension for Chrome and Edge browsers",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:check": "vue-tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore",
    "format": "prettier --write src/",
    "test": "vitest",
    "type-check": "vue-tsc --noEmit"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.1.7"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/chrome": "^0.0.268",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "@vue/eslint-config-prettier": "^9.0.0",
    "@vue/eslint-config-typescript": "^12.0.0",
    "eslint": "^8.56.0",
    "eslint-plugin-vue": "^9.20.0",
    "prettier": "^3.2.0",
    "typescript": "^5.3.0",
    "unocss": "^0.58.0",
    "vite": "^5.1.0",
    "vitest": "^1.2.0",
    "vue-tsc": "^1.8.27"
  },
  "keywords": [
    "browser-extension",
    "new-tab",
    "vue3",
    "typescript",
    "chrome-extension",
    "edge-extension"
  ],
  "author": "AI Sider Nav Team",
  "license": "MIT"
}
```

### 字段详解

**基础信息**
- `name`: 项目名称，遵循 npm 命名规范
- `version`: 版本号，遵循语义化版本
- `description`: 项目描述
- `type`: 模块类型，"module" 表示 ES 模块

**脚本命令**
- `dev`: 开发服务器
- `build`: 生产构建
- `lint`: 代码检查
- `format`: 代码格式化

**依赖管理**
- `dependencies`: 生产依赖
- `devDependencies`: 开发依赖

## 🔧 TypeScript 配置

### 主配置文件 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },

    /* Chrome Extension Types */
    "types": ["chrome", "node"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Node.js 配置 tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

### TypeScript 配置详解

**编译选项**
```typescript
// target: 编译目标
"target": "ES2020"  // 支持现代浏览器

// lib: 包含的库文件
"lib": ["ES2020", "DOM", "DOM.Iterable"]

// module: 模块系统
"module": "ESNext"  // 最新的 ES 模块
```

**严格检查**
```typescript
// 启用所有严格检查
"strict": true

// 检查未使用的变量
"noUnusedLocals": true
"noUnusedParameters": true

// 检查 switch 语句
"noFallthroughCasesInSwitch": true
```

**路径映射**
```typescript
// 设置基础路径
"baseUrl": "."

// 路径别名
"paths": {
  "@/*": ["src/*"]  // @ 指向 src 目录
}
```

## 🎨 代码规范配置

### ESLint 配置 .eslintrc.cjs

```javascript
/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  env: {
    browser: true,
    es2021: true,
    webextensions: true
  },
  rules: {
    // 自定义规则
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}
```

### Prettier 配置 .prettierrc.json

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "endOfLine": "lf",
  "vueIndentScriptAndStyle": true,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### 代码规范说明

**ESLint 规则**
- `vue/vue3-essential`: Vue 3 基础规则
- `@typescript-eslint/recommended`: TypeScript 推荐规则
- `prettier`: 格式化规则

**Prettier 配置**
- `semi: false`: 不使用分号
- `singleQuote: true`: 使用单引号
- `tabWidth: 2`: 缩进 2 个空格

## 📄 Git 配置

### .gitignore 文件

```gitignore
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Dependencies
node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# UnoCSS generated files
__uno

# Extension build files
extension/
build/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS generated files
Thumbs.db
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
```

### Git 提交规范

**Conventional Commits**
```bash
# 功能添加
git commit -m "feat: add search component"

# 问题修复
git commit -m "fix: resolve time display issue"

# 文档更新
git commit -m "docs: update installation guide"

# 样式调整
git commit -m "style: improve button hover effect"

# 重构代码
git commit -m "refactor: optimize component structure"
```

## 📚 安装依赖

### 核心依赖

```bash
# Vue 3 生态
pnpm add vue@next pinia

# 开发工具
pnpm add -D vite @vitejs/plugin-vue
pnpm add -D typescript vue-tsc

# 样式框架
pnpm add -D unocss

# 代码规范
pnpm add -D eslint prettier
pnpm add -D @typescript-eslint/eslint-plugin
pnpm add -D @typescript-eslint/parser
pnpm add -D @vue/eslint-config-typescript
pnpm add -D @vue/eslint-config-prettier
pnpm add -D eslint-plugin-vue

# 类型定义
pnpm add -D @types/node @types/chrome

# 测试工具
pnpm add -D vitest
```

### 依赖说明

**生产依赖**
- `vue`: Vue 3 框架
- `pinia`: 状态管理库

**开发依赖**
- `vite`: 构建工具
- `typescript`: TypeScript 编译器
- `unocss`: 原子化 CSS 框架
- `eslint`: 代码检查工具
- `prettier`: 代码格式化工具

## 🔍 项目验证

### 创建基础文件

**src/main.ts**
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 样式导入
import 'virtual:uno.css'
import '@/styles/global.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

**src/App.vue**
```vue
<template>
  <div class="app-container">
    <h1>AI Sider Nav</h1>
    <p>项目初始化成功！</p>
  </div>
</template>

<script setup lang="ts">
// 这里将添加组件逻辑
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-family: system-ui, sans-serif;
}

h1 {
  color: #79b4a6;
  margin-bottom: 1rem;
}
</style>
```

**index.html**
```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Sider Nav</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### 验证项目

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 在浏览器中访问 http://localhost:3000
```

## 🚀 最佳实践

### 项目组织原则

1. **模块化设计**
   - 按功能组织文件
   - 保持文件职责单一
   - 使用清晰的命名规范

2. **配置管理**
   - 集中管理配置文件
   - 使用环境变量
   - 分离开发和生产配置

3. **依赖管理**
   - 明确区分生产和开发依赖
   - 定期更新依赖版本
   - 使用 lockfile 锁定版本

### 开发工作流

```bash
# 1. 创建功能分支
git checkout -b feature/new-component

# 2. 开发和测试
pnpm dev
pnpm lint
pnpm type-check

# 3. 提交代码
git add .
git commit -m "feat: add new component"

# 4. 推送分支
git push origin feature/new-component
```

### 代码质量保证

**pre-commit 钩子**
```bash
# 安装 husky
pnpm add -D husky

# 初始化 husky
npx husky install

# 添加 pre-commit 钩子
npx husky add .husky/pre-commit "pnpm lint && pnpm type-check"
```

## 🔧 故障排除

### 常见问题

**1. 依赖安装失败**
```bash
# 清理缓存
pnpm store prune
rm -rf node_modules
rm pnpm-lock.yaml

# 重新安装
pnpm install
```

**2. TypeScript 类型错误**
```bash
# 重新生成类型
pnpm vue-tsc --noEmit

# 检查配置文件
cat tsconfig.json
```

**3. ESLint 配置冲突**
```bash
# 检查配置
pnpm eslint --print-config src/App.vue

# 修复自动修复的问题
pnpm lint --fix
```

### 调试技巧

**VS Code 调试配置**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

---

## 📚 扩展阅读

### 项目初始化最佳实践

1. **目录结构设计**
   - [Vue 3 项目结构指南](https://vuejs.org/guide/scaling-up/sfc.html)
   - [TypeScript 项目组织](https://www.typescriptlang.org/docs/handbook/project-references.html)

2. **依赖管理**
   - [pnpm 使用指南](https://pnpm.io/motivation)
   - [语义化版本控制](https://semver.org/lang/zh-CN/)

3. **代码规范**
   - [ESLint 配置指南](https://eslint.org/docs/user-guide/configuring/)
   - [Prettier 配置选项](https://prettier.io/docs/en/options.html)

---

**下一章：[浏览器扩展配置](./04-browser-extension-config.md)**
