# 开发文档

本文档详细介绍了 AI Sider Nav 插件的开发相关信息。

## 🏗️ 架构设计

### 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Popup Page    │    │   Options Page  │    │   Sidebar App   │
│   (Vue App)     │    │   (Vue App)     │    │   (Vue App)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Background      │
                    │ Service Worker  │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Content Script  │
                    │ (Injected)      │
                    └─────────────────┘
```

### 组件通信

1. **Popup ↔ Background**: `chrome.runtime.sendMessage`
2. **Content Script ↔ Background**: `chrome.runtime.sendMessage`
3. **Sidebar ↔ Content Script**: `window.postMessage`
4. **Options ↔ Background**: `chrome.runtime.sendMessage`

## 📁 目录结构详解

```
src/
├── popup/                  # 插件弹窗
│   ├── index.html         # 弹窗 HTML
│   ├── main.ts            # 弹窗入口
│   └── App.vue            # 弹窗主组件
├── sidebar/               # AI 侧边栏
│   ├── index.html         # 侧边栏 HTML
│   ├── main.ts            # 侧边栏入口
│   ├── App.vue            # 侧边栏主组件
│   └── components/        # 侧边栏子组件
│       ├── ChatTab.vue    # 对话标签
│       ├── SummaryTab.vue # 总结标签
│       └── SettingsTab.vue# 设置标签
├── options/               # 设置页面
│   ├── index.html         # 设置页面 HTML
│   ├── main.ts            # 设置页面入口
│   └── App.vue            # 设置页面主组件
├── content-script/        # 内容脚本
│   ├── index.ts           # 内容脚本主文件
│   └── style.css          # 内容脚本样式
├── background/            # 后台脚本
│   └── index.ts           # 后台脚本主文件
├── stores/                # 状态管理
│   ├── index.ts           # Pinia 配置
│   ├── search.ts          # 搜索状态
│   ├── ai.ts              # AI 对话状态
│   └── settings.ts        # 设置状态
├── components/            # 共享组件
├── utils/                 # 工具函数
├── types/                 # 类型定义
│   └── index.ts           # 主要类型定义
└── test/                  # 测试文件
    ├── setup.ts           # 测试配置
    ├── stores/            # 状态管理测试
    └── components/        # 组件测试
```

## 🔧 核心功能实现

### 1. 侧边栏注入机制

内容脚本负责在页面中注入侧边栏：

```typescript
class SidebarManager {
  private createSidebar() {
    // 创建侧边栏容器
    this.sidebar = document.createElement('div')
    this.sidebar.id = 'ai-sider-nav-sidebar'
    
    // 创建 iframe 加载侧边栏应用
    this.iframe = document.createElement('iframe')
    this.iframe.src = chrome.runtime.getURL('sidebar/index.html')
    
    // 样式隔离和响应式设计
    this.sidebar.appendChild(this.iframe)
    document.body.appendChild(this.sidebar)
  }
}
```

### 2. 消息通信系统

使用统一的消息类型系统：

```typescript
export type MessageType = 
  | 'TOGGLE_SIDEBAR'
  | 'GET_PAGE_CONTENT'
  | 'SEND_AI_MESSAGE'
  | 'UPDATE_SETTINGS'
  | 'EXTRACT_SELECTION'

export interface ExtensionMessage {
  type: MessageType
  payload?: any
  tabId?: number
}
```

### 3. 状态管理

使用 Pinia 进行状态管理，支持持久化：

```typescript
export const useAIStore = defineStore('ai', () => {
  const conversations = ref<AIConversation[]>([])
  
  const saveConversations = () => {
    chrome.storage.local.set({ 
      aiConversations: conversations.value 
    })
  }
  
  return { conversations, saveConversations }
})
```

## 🎨 样式系统

### UnoCSS 配置

使用原子化 CSS 和预设快捷方式：

```typescript
shortcuts: {
  'btn': 'px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600',
  'input': 'px-3 py-2 border border-gray-300 rounded focus:outline-none',
  'card': 'bg-white rounded-lg shadow-md p-4'
}
```

### 样式隔离

内容脚本中的样式使用 `!important` 确保不被页面样式覆盖：

```css
#ai-sider-nav-sidebar {
  all: initial !important;
  position: fixed !important;
  z-index: 2147483647 !important;
}
```

## 🧪 测试策略

### 单元测试

使用 Vitest 进行单元测试：

```typescript
describe('Search Store', () => {
  it('should perform search with default engine', () => {
    const store = useSearchStore()
    store.search('test query')
    
    expect(mockChrome.tabs.create).toHaveBeenCalledWith({
      url: 'https://www.google.com/search?q=test%20query'
    })
  })
})
```

### 组件测试

使用 Vue Test Utils 进行组件测试：

```typescript
describe('ChatTab Component', () => {
  it('should send message when clicking send button', async () => {
    const wrapper = mount(ChatTab)
    
    await wrapper.find('.message-input').setValue('Hello AI')
    await wrapper.find('.send-btn').trigger('click')
    
    expect(wrapper.find('.user-message').exists()).toBe(true)
  })
})
```

## 🚀 构建流程

### Vite 配置

使用 `vite-plugin-web-extension` 插件：

```typescript
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    webExtension({
      manifest: './src/manifest.json',
      additionalInputs: {
        'content-script': 'src/content-script/index.ts',
        'background': 'src/background/index.ts'
      }
    })
  ]
})
```

### 构建优化

1. **代码分割**: 按页面分割代码
2. **Tree Shaking**: 移除未使用的代码
3. **资源压缩**: 压缩 JS、CSS 和图片
4. **Bundle 分析**: 监控包大小

## 🔍 调试技巧

### 开发者工具

1. **Popup 调试**: 右键插件图标 → 检查弹出内容
2. **Background 调试**: chrome://extensions → 背景页面
3. **Content Script 调试**: 页面开发者工具 → Sources
4. **Options 调试**: 右键选项页面 → 检查

### 日志系统

使用统一的日志格式：

```typescript
console.log('AI Sider Nav:', 'Message', data)
```

### 错误处理

实现全局错误处理：

```typescript
window.addEventListener('error', (event) => {
  console.error('AI Sider Nav Error:', event.error)
})
```

## 📦 发布流程

### 版本管理

1. 更新 `package.json` 中的版本号
2. 更新 `manifest.json` 中的版本号
3. 更新 `CHANGELOG.md`
4. 创建 Git 标签

### 自动化发布

使用 GitHub Actions 自动化构建和发布：

```yaml
- name: Build extension
  run: npm run build:zip

- name: Create Release
  uses: actions/create-release@v1
  with:
    tag_name: v${{ steps.version.outputs.version }}
```

## 🛠️ 常见问题

### Q: 如何添加新的 AI 服务提供商？

A: 在 `stores/settings.ts` 中添加新的提供商类型，然后在 AI 处理逻辑中添加相应的 API 调用。

### Q: 如何修改侧边栏的默认位置？

A: 修改 `stores/settings.ts` 中的 `defaultSettings.sidebarPosition`。

### Q: 如何添加新的搜索引擎？

A: 在 `stores/search.ts` 中的 `searchEngines` 数组中添加新的搜索引擎配置。

## 📚 参考资料

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [UnoCSS 文档](https://unocss.dev/)
- [Pinia 文档](https://pinia.vuejs.org/)
