# AI Sider Nav

一个功能强大的跨浏览器插件，集成了智能导航和 AI 助手功能。支持 Chrome 和 Edge 浏览器，基于 Manifest V3 规范开发。

## ✨ 核心功能

### 🔍 简洁导航页面
- **快速搜索**: 支持 Google、Bing 等主流搜索引擎
- **搜索历史**: 自动保存最近搜索记录
- **一键切换**: 快速切换不同搜索引擎

### 🤖 AI 全局侧边栏
- **智能对话**: 与 AI 助手进行自然语言交互
- **内容总结**: 一键总结网页内容
- **文本处理**: 翻译、解释、改写选中文本
- **多模式支持**: 支持 OpenAI、Claude、Gemini 等 AI 服务

### 🛠️ 高级功能
- **右键菜单**: 快速访问 AI 功能
- **键盘快捷键**: `Ctrl+Shift+S` 切换侧边栏
- **自动总结**: 可选的页面内容自动总结
- **数据同步**: 设置和对话历史云端同步

## 🚀 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **样式框架**: UnoCSS
- **代码规范**: ESLint + Prettier
- **测试框架**: Vitest
- **插件规范**: Manifest V3

## 📦 安装方法

### 从源码安装（开发版）

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/ai-sider-nav.git
   cd ai-sider-nav
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建插件**
   ```bash
   npm run build
   ```

4. **加载到浏览器**
   - 打开 Chrome 浏览器
   - 访问 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

### 从发布包安装

1. 从 [Releases](https://github.com/your-username/ai-sider-nav/releases) 下载最新版本的 `ai-sider-nav.zip`
2. 解压到本地目录
3. 按照上述步骤 4 加载到浏览器

## 🔧 开发指南

### 环境要求

- Node.js >= 18
- npm >= 8

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 构建并打包
npm run build:zip

# 运行测试
npm run test

# 运行测试（UI 模式）
npm run test:ui

# 代码检查
npm run lint

# 格式化代码
npm run format

# 类型检查
npm run type-check
```

### 项目结构

```
src/
├── popup/              # 插件弹窗页面
├── sidebar/            # AI 侧边栏组件
├── options/            # 设置页面
├── content-script/     # 内容脚本
├── background/         # 后台脚本
├── components/         # 共享组件
├── stores/             # Pinia 状态管理
├── utils/              # 工具函数
├── types/              # TypeScript 类型定义
└── test/               # 测试文件
```

### 开发流程

1. **功能开发**
   - 在对应目录下创建组件或功能模块
   - 遵循 Vue 3 Composition API 规范
   - 使用 TypeScript 进行类型检查

2. **状态管理**
   - 使用 Pinia 管理应用状态
   - 将状态按功能模块划分

3. **样式开发**
   - 使用 UnoCSS 原子化 CSS
   - 支持响应式设计和深色模式

4. **测试**
   - 编写单元测试和组件测试
   - 确保测试覆盖率达到要求

## ⚙️ 配置说明

### AI 服务配置

插件支持多种 AI 服务提供商：

- **OpenAI**: 需要 API Key
- **Claude**: 需要 Anthropic API Key  
- **Gemini**: 需要 Google AI API Key

在设置页面中配置相应的 API Key 即可使用。

### 权限说明

插件需要以下权限：

- `activeTab`: 访问当前标签页内容
- `storage`: 保存设置和对话历史
- `tabs`: 创建新标签页进行搜索
- `scripting`: 注入内容脚本
- `contextMenus`: 创建右键菜单

## 🔒 隐私保护

- **本地存储**: 所有数据存储在本地，不会上传到服务器
- **API 安全**: API Key 加密存储，仅用于 AI 服务调用
- **最小权限**: 仅请求必要的浏览器权限
- **开源透明**: 完全开源，代码可审查

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 使用 ESLint 和 Prettier 保持代码风格一致
- 编写清晰的提交信息
- 为新功能添加测试用例
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [UnoCSS](https://unocss.dev/) - 即时原子化 CSS 引擎
- [Pinia](https://pinia.vuejs.org/) - Vue 状态管理库

## 📞 支持

如果您遇到问题或有建议，请：

- 查看 [FAQ](docs/FAQ.md)
- 提交 [Issue](https://github.com/your-username/ai-sider-nav/issues)
- 发送邮件至 support@example.com

---

⭐ 如果这个项目对您有帮助，请给我们一个 Star！
