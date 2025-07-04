# AI Sider Nav - 标签页导航插件

一个美观的新标签页浏览器扩展，适配 Chrome 和 Edge 浏览器。

## 功能特性

- 🌅 美丽的自然风景背景
- ⏰ 实时时间和日期显示
- 🌤️ **实时天气显示**（新功能）
- 📅 **点击时间查看日历**（新功能）
- 🔍 集成搜索功能（支持 Google、Bing、百度）
- 🎨 现代化的用户界面
- 📱 响应式设计
- ⚡ 快速加载

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **样式框架**: UnoCSS
- **状态管理**: Pinia
- **包管理器**: pnpm
- **代码规范**: ESLint + Prettier

## 开发指南

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建扩展

```bash
pnpm build
```

### 代码检查

```bash
pnpm lint
```

### 代码格式化

```bash
pnpm format
```

## 新功能使用指南

### 🌤️ 天气功能
- **自动定位**：首次使用时允许位置权限，自动显示当前位置天气
- **手动设置**：如拒绝位置权限，可在设置中手动输入城市名称
- **API配置**：建议申请 [OpenWeatherMap](https://openweathermap.org/api) 免费API密钥以获得更好服务

### 📅 日历功能
- **查看日历**：点击时间显示区域打开日历
- **月份导航**：使用左右箭头切换月份
- **日期选择**：点击任意日期进行选择
- **快速回到今天**：点击"回到今天"按钮

## 安装扩展

1. 运行 `pnpm build` 构建扩展
2. 打开 Chrome/Edge 浏览器
3. 进入扩展管理页面 (`chrome://extensions/` 或 `edge://extensions/`)
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择 `dist` 目录

## 许可证

MIT License
