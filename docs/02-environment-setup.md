# 第二章：环境搭建

## 🎯 学习目标

- 配置现代前端开发环境
- 安装必要的开发工具
- 理解工具链的作用和配置

## 📋 环境要求

### 系统要求

- **操作系统**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **内存**: 至少 4GB RAM (推荐 8GB+)
- **存储**: 至少 2GB 可用空间

### 软件版本要求

| 软件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| Node.js | 16.0.0 | 18.0.0+ | JavaScript 运行时 |
| pnpm | 7.0.0 | 8.0.0+ | 包管理器 |
| Git | 2.20.0 | 2.40.0+ | 版本控制 |
| VS Code | 1.60.0 | 最新版 | 代码编辑器 |

## 🛠️ 安装 Node.js

### 方法一：官方安装包

1. **访问官网**
   ```
   https://nodejs.org/
   ```

2. **下载 LTS 版本**
   - 选择 "LTS" 版本（长期支持版）
   - 根据操作系统选择对应安装包

3. **验证安装**
   ```bash
   node --version
   npm --version
   ```

### 方法二：使用版本管理器 (推荐)

**macOS/Linux - 使用 nvm**
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重启终端或执行
source ~/.bashrc

# 安装最新 LTS 版本
nvm install --lts
nvm use --lts

# 设置默认版本
nvm alias default node
```

**Windows - 使用 nvm-windows**
```bash
# 下载安装包
https://github.com/coreybutler/nvm-windows/releases

# 安装后使用
nvm install 18.17.0
nvm use 18.17.0
```

### Node.js 配置优化

**设置 npm 镜像源**
```bash
# 查看当前源
npm config get registry

# 设置淘宝镜像
npm config set registry https://registry.npmmirror.com/

# 验证设置
npm config get registry
```

## 📦 安装 pnpm

### 为什么选择 pnpm？

| 特性 | npm | yarn | pnpm |
|------|-----|------|------|
| 磁盘效率 | ❌ | ⚠️ | ✅ |
| 安装速度 | ⚠️ | ✅ | ✅ |
| 严格性 | ❌ | ⚠️ | ✅ |
| Monorepo 支持 | ⚠️ | ✅ | ✅ |

### 安装方法

**方法一：使用 npm**
```bash
npm install -g pnpm
```

**方法二：使用安装脚本**
```bash
# macOS/Linux
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Windows (PowerShell)
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

**验证安装**
```bash
pnpm --version
```

### pnpm 配置

**设置镜像源**
```bash
pnpm config set registry https://registry.npmmirror.com/
```

**配置存储位置**
```bash
# 查看配置
pnpm config list

# 设置全局存储目录
pnpm config set store-dir /path/to/pnpm-store
```

## 🔧 安装 Git

### 安装方法

**Windows**
```
下载：https://git-scm.com/download/win
```

**macOS**
```bash
# 使用 Homebrew
brew install git

# 或使用 Xcode Command Line Tools
xcode-select --install
```

**Linux (Ubuntu/Debian)**
```bash
sudo apt update
sudo apt install git
```

### Git 配置

**基础配置**
```bash
# 设置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 设置默认分支名
git config --global init.defaultBranch main

# 设置编辑器
git config --global core.editor "code --wait"
```

**SSH 密钥配置**
```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your.email@example.com"

# 启动 ssh-agent
eval "$(ssh-agent -s)"

# 添加密钥
ssh-add ~/.ssh/id_ed25519

# 查看公钥
cat ~/.ssh/id_ed25519.pub
```

## 💻 配置 VS Code

### 安装 VS Code

**官方下载**
```
https://code.visualstudio.com/
```

### 必装扩展

**Vue 开发**
```json
{
  "recommendations": [
    "Vue.volar",                    // Vue 3 支持
    "Vue.vscode-typescript-vue-plugin", // TypeScript 支持
    "bradlc.vscode-tailwindcss",    // CSS 智能提示
    "antfu.unocss",                 // UnoCSS 支持
    "esbenp.prettier-vscode",       // 代码格式化
    "dbaeumer.vscode-eslint",       // 代码检查
    "ms-vscode.vscode-typescript-next" // TypeScript 支持
  ]
}
```

### VS Code 配置

**创建工作区配置**
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "vue.codeActions.enabled": true,
  "vue.complete.casing.tags": "kebab",
  "vue.complete.casing.props": "camel"
}
```

**推荐的代码片段**
```json
// .vscode/vue.code-snippets
{
  "Vue 3 Composition API": {
    "prefix": "v3setup",
    "body": [
      "<template>",
      "  <div>",
      "    $1",
      "  </div>",
      "</template>",
      "",
      "<script setup lang=\"ts\">",
      "import { ref, computed, onMounted } from 'vue'",
      "",
      "$2",
      "</script>",
      "",
      "<style scoped>",
      "$3",
      "</style>"
    ],
    "description": "Vue 3 Composition API 模板"
  }
}
```

## 🌐 浏览器开发工具

### Chrome DevTools

**安装 Vue DevTools**
```
Chrome Web Store: Vue.js devtools
```

**启用开发者模式**
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 允许扩展在隐身模式下运行

### Firefox Developer Tools

**安装 Vue DevTools**
```
Firefox Add-ons: Vue.js devtools
```

## 🔍 环境验证

### 创建测试项目

```bash
# 创建测试目录
mkdir test-environment
cd test-environment

# 初始化项目
pnpm init

# 安装测试依赖
pnpm add vue@next
pnpm add -D vite @vitejs/plugin-vue typescript

# 创建测试文件
echo 'console.log("Environment test successful!")' > test.js

# 运行测试
node test.js
```

### 验证清单

- [ ] Node.js 版本 >= 16.0.0
- [ ] pnpm 版本 >= 7.0.0
- [ ] Git 配置完成
- [ ] VS Code 扩展安装完成
- [ ] 浏览器开发工具可用
- [ ] 网络连接正常

## 🚀 性能优化建议

### 系统优化

**Windows**
```bash
# 启用开发者模式
# 设置 -> 更新和安全 -> 开发者选项 -> 开发者模式

# 配置 Windows Defender 排除项
# 添加项目目录到排除列表
```

**macOS**
```bash
# 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装常用工具
brew install tree wget curl
```

### 开发环境优化

**终端配置**
```bash
# 安装 Oh My Zsh (macOS/Linux)
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# 安装有用的插件
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

**VS Code 性能优化**
```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/.git/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  },
  "typescript.disableAutomaticTypeAcquisition": true
}
```

## 🔧 故障排除

### 常见问题

**1. Node.js 版本冲突**
```bash
# 清理 npm 缓存
npm cache clean --force

# 重新安装 Node.js
nvm uninstall node
nvm install --lts
```

**2. pnpm 安装失败**
```bash
# 清理 pnpm 缓存
pnpm store prune

# 重新安装
npm uninstall -g pnpm
npm install -g pnpm@latest
```

**3. Git 权限问题**
```bash
# 重新配置 SSH
ssh-keygen -t ed25519 -C "your.email@example.com"
ssh-add ~/.ssh/id_ed25519
```

**4. VS Code 扩展问题**
```bash
# 重置扩展
code --disable-extensions
code --list-extensions --show-versions
```

### 网络问题解决

**配置代理**
```bash
# npm 代理
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# git 代理
git config --global http.proxy http://proxy.company.com:8080
git config --global https.proxy http://proxy.company.com:8080
```

**使用镜像源**
```bash
# 设置多个镜像源
pnpm config set registry https://registry.npmmirror.com/
pnpm config set @vue:registry https://registry.npmmirror.com/
```

## 📚 扩展阅读

### 工具链深入

1. **Node.js 生态**
   - [Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)
   - [npm vs yarn vs pnpm](https://blog.logrocket.com/javascript-package-managers-compared/)

2. **开发工具**
   - [VS Code 使用技巧](https://code.visualstudio.com/docs/getstarted/tips-and-tricks)
   - [Git 工作流](https://www.atlassian.com/git/tutorials/comparing-workflows)

3. **性能优化**
   - [前端开发环境优化](https://web.dev/fast/)
   - [开发工具性能调优](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance)

---

**下一章：[项目初始化](./03-project-initialization.md)**
