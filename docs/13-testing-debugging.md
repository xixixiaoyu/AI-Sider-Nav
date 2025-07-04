# 第十三章：测试和调试

## 🎯 学习目标

- 掌握 Vue 3 组件测试策略
- 学习浏览器扩展调试技巧
- 实现自动化测试流程
- 建立完善的错误监控体系

## 🧪 测试策略概述

### 测试金字塔

```
    E2E Tests (端到端测试)
         /\
        /  \
       /    \
      /      \
     /        \
    /          \
   / Integration \  (集成测试)
  /    Tests     \
 /________________\
/                  \
/   Unit Tests      \  (单元测试)
/____________________\
```

### 测试配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

## 🔧 单元测试实现

### 组件测试基础

```typescript
// src/test/setup.ts
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// 全局测试配置
config.global.plugins = [createPinia()]

// 模拟浏览器 API
Object.defineProperty(window, 'chrome', {
  value: {
    storage: {
      sync: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined)
      },
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined)
      },
      onChanged: {
        addListener: vi.fn()
      }
    },
    runtime: {
      getManifest: vi.fn().mockReturnValue({ version: '1.0.0' })
    }
  },
  writable: true
})

// 设置全局 Pinia 实例
beforeEach(() => {
  setActivePinia(createPinia())
})
```

### TimeDisplay 组件测试

```typescript
// src/components/__tests__/TimeDisplay.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TimeDisplay from '../TimeDisplay.vue'
import { useAppStore } from '@/stores/app'

describe('TimeDisplay', () => {
  let wrapper: any
  let appStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    appStore = useAppStore()
    
    // 模拟时间
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01 12:00:00'))
    
    wrapper = mount(TimeDisplay)
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('renders time and date correctly', () => {
    expect(wrapper.find('.time').exists()).toBe(true)
    expect(wrapper.find('.date').exists()).toBe(true)
  })

  it('displays formatted time', () => {
    const timeElement = wrapper.find('.time')
    expect(timeElement.text()).toBe('12:00')
  })

  it('displays formatted date', () => {
    const dateElement = wrapper.find('.date')
    expect(dateElement.text()).toContain('1月1日')
    expect(dateElement.text()).toContain('星期一')
  })

  it('updates time every second', async () => {
    const initialTime = wrapper.find('.time').text()
    
    // 前进 1 秒
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()
    
    const updatedTime = wrapper.find('.time').text()
    expect(updatedTime).not.toBe(initialTime)
  })

  it('cleans up timer on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    
    wrapper.unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('applies correct CSS classes', () => {
    expect(wrapper.classes()).toContain('time-display')
    expect(wrapper.find('.time').classes()).toContain('time')
    expect(wrapper.find('.date').classes()).toContain('date')
  })

  it('has proper accessibility attributes', () => {
    const timeElement = wrapper.find('.time')
    const dateElement = wrapper.find('.date')
    
    expect(timeElement.attributes('role')).toBe('timer')
    expect(dateElement.attributes('aria-label')).toContain('当前日期')
  })
})
```

### SearchBox 组件测试

```typescript
// src/components/__tests__/SearchBox.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchBox from '../SearchBox.vue'
import { useAppStore, useSettingsStore } from '@/stores'

describe('SearchBox', () => {
  let wrapper: any
  let appStore: any
  let settingsStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    appStore = useAppStore()
    settingsStore = useSettingsStore()
    
    wrapper = mount(SearchBox)
  })

  it('renders search input and icon', () => {
    expect(wrapper.find('.search-input').exists()).toBe(true)
    expect(wrapper.find('.search-icon').exists()).toBe(true)
  })

  it('updates search query on input', async () => {
    const input = wrapper.find('.search-input')
    
    await input.setValue('test query')
    
    expect(input.element.value).toBe('test query')
  })

  it('triggers search on Enter key', async () => {
    const input = wrapper.find('.search-input')
    const addSearchHistorySpy = vi.spyOn(appStore, 'addSearchHistory')
    const addRecentSearchSpy = vi.spyOn(appStore, 'addRecentSearch')
    
    // 模拟 window.open
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    
    await input.setValue('test search')
    await input.trigger('keyup.enter')
    
    expect(addSearchHistorySpy).toHaveBeenCalledWith('test search')
    expect(addRecentSearchSpy).toHaveBeenCalledWith('test search')
    expect(openSpy).toHaveBeenCalled()
    
    openSpy.mockRestore()
  })

  it('does not search with empty query', async () => {
    const input = wrapper.find('.search-input')
    const addSearchHistorySpy = vi.spyOn(appStore, 'addSearchHistory')
    
    await input.setValue('   ')
    await input.trigger('keyup.enter')
    
    expect(addSearchHistorySpy).not.toHaveBeenCalled()
  })

  it('updates focus state correctly', async () => {
    const input = wrapper.find('.search-input')
    const setSearchFocusSpy = vi.spyOn(appStore, 'setSearchFocus')
    
    await input.trigger('focus')
    expect(setSearchFocusSpy).toHaveBeenCalledWith(true)
    
    await input.trigger('blur')
    expect(setSearchFocusSpy).toHaveBeenCalledWith(false)
  })

  it('uses correct search engine URL', async () => {
    // 设置搜索引擎为 Google
    settingsStore.settings.searchEngine = 'google'
    
    const input = wrapper.find('.search-input')
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    
    await input.setValue('vue testing')
    await input.trigger('keyup.enter')
    
    expect(openSpy).toHaveBeenCalledWith(
      'https://www.google.com/search?q=vue%20testing',
      '_blank'
    )
    
    openSpy.mockRestore()
  })

  it('clears input after search', async () => {
    const input = wrapper.find('.search-input')
    vi.spyOn(window, 'open').mockImplementation(() => null)
    
    await input.setValue('test query')
    await input.trigger('keyup.enter')
    
    expect(input.element.value).toBe('')
  })
})
```

## 🏪 Store 测试

### Pinia Store 测试

```typescript
// src/stores/__tests__/settings.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../settings'

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default settings', () => {
    const store = useSettingsStore()
    
    expect(store.settings.searchEngine).toBe('google')
    expect(store.settings.timeFormat).toBe('24h')
    expect(store.settings.language).toBe('zh-CN')
    expect(store.settings.showSeconds).toBe(false)
  })

  it('updates single setting correctly', async () => {
    const store = useSettingsStore()
    
    await store.updateSetting('searchEngine', 'bing')
    
    expect(store.settings.searchEngine).toBe('bing')
  })

  it('saves settings to storage', async () => {
    const store = useSettingsStore()
    const setSpy = vi.spyOn(chrome.storage.sync, 'set')
    
    await store.saveSettings()
    
    expect(setSpy).toHaveBeenCalledWith({
      userSettings: store.settings
    })
  })

  it('loads settings from storage', async () => {
    const mockSettings = {
      searchEngine: 'baidu',
      timeFormat: '12h',
      language: 'en-US'
    }
    
    vi.mocked(chrome.storage.sync.get).mockResolvedValue({
      userSettings: mockSettings
    })
    
    const store = useSettingsStore()
    await store.loadSettings()
    
    expect(store.settings.searchEngine).toBe('baidu')
    expect(store.settings.timeFormat).toBe('12h')
    expect(store.settings.language).toBe('en-US')
  })

  it('handles storage errors gracefully', async () => {
    const store = useSettingsStore()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    vi.mocked(chrome.storage.sync.get).mockRejectedValue(new Error('Storage error'))
    
    await store.loadSettings()
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load settings:',
      expect.any(Error)
    )
    
    consoleSpy.mockRestore()
  })

  it('computes current search engine correctly', () => {
    const store = useSettingsStore()
    
    store.settings.searchEngine = 'google'
    expect(store.currentSearchEngine.name).toBe('Google')
    expect(store.currentSearchEngine.url).toBe('https://www.google.com/search?q=')
    
    store.settings.searchEngine = 'bing'
    expect(store.currentSearchEngine.name).toBe('Bing')
    expect(store.currentSearchEngine.url).toBe('https://www.bing.com/search?q=')
  })

  it('resets settings to defaults', async () => {
    const store = useSettingsStore()
    
    // 修改设置
    store.settings.searchEngine = 'bing'
    store.settings.timeFormat = '12h'
    
    // 重置设置
    await store.resetSettings()
    
    expect(store.settings.searchEngine).toBe('google')
    expect(store.settings.timeFormat).toBe('24h')
  })
})
```

## 🔍 集成测试

### 组件集成测试

```typescript
// src/test/integration/app.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '@/App.vue'
import { useAppStore, useSettingsStore } from '@/stores'

describe('App Integration', () => {
  let wrapper: any

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01 12:00:00'))
    
    wrapper = mount(App)
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('renders all main components', () => {
    expect(wrapper.findComponent({ name: 'TimeDisplay' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SearchBox' }).exists()).toBe(true)
  })

  it('initializes stores on mount', async () => {
    const appStore = useAppStore()
    const settingsStore = useSettingsStore()
    
    const loadSettingsSpy = vi.spyOn(settingsStore, 'loadSettings')
    const loadSearchHistorySpy = vi.spyOn(appStore, 'loadSearchHistory')
    
    // 重新挂载以触发初始化
    wrapper.unmount()
    wrapper = mount(App)
    
    await wrapper.vm.$nextTick()
    
    expect(loadSettingsSpy).toHaveBeenCalled()
    expect(loadSearchHistorySpy).toHaveBeenCalled()
  })

  it('handles search flow correctly', async () => {
    const searchInput = wrapper.find('.search-input')
    const appStore = useAppStore()
    
    const addSearchHistorySpy = vi.spyOn(appStore, 'addSearchHistory')
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    
    await searchInput.setValue('integration test')
    await searchInput.trigger('keyup.enter')
    
    expect(addSearchHistorySpy).toHaveBeenCalledWith('integration test')
    expect(openSpy).toHaveBeenCalled()
    
    openSpy.mockRestore()
  })

  it('updates time display automatically', async () => {
    const timeElement = wrapper.find('.time')
    const initialTime = timeElement.text()
    
    // 前进 1 分钟
    vi.advanceTimersByTime(60000)
    await wrapper.vm.$nextTick()
    
    const updatedTime = timeElement.text()
    expect(updatedTime).not.toBe(initialTime)
  })
})
```

## 🌐 端到端测试

### Playwright E2E 测试

```typescript
// tests/e2e/extension.spec.ts
import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Browser Extension E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    // 加载扩展
    const extensionPath = path.join(__dirname, '../../dist')
    await context.addInitScript(() => {
      // 模拟扩展环境
      window.chrome = {
        storage: {
          sync: {
            get: () => Promise.resolve({}),
            set: () => Promise.resolve(),
          },
          local: {
            get: () => Promise.resolve({}),
            set: () => Promise.resolve(),
          }
        }
      }
    })
    
    await page.goto('http://localhost:3000')
  })

  test('displays time and search components', async ({ page }) => {
    await expect(page.locator('.time-display')).toBeVisible()
    await expect(page.locator('.search-container')).toBeVisible()
    
    // 检查时间格式
    const timeText = await page.locator('.time').textContent()
    expect(timeText).toMatch(/^\d{2}:\d{2}$/)
  })

  test('performs search functionality', async ({ page }) => {
    const searchInput = page.locator('.search-input')
    
    await searchInput.fill('playwright testing')
    
    // 监听新标签页打开
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      searchInput.press('Enter')
    ])
    
    // 验证搜索 URL
    expect(newPage.url()).toContain('google.com/search')
    expect(newPage.url()).toContain('playwright%20testing')
  })

  test('responsive design works correctly', async ({ page }) => {
    // 测试桌面视图
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('.time')).toHaveCSS('font-size', '64px')
    
    // 测试移动视图
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('.time')).toHaveCSS('font-size', '44.8px')
  })

  test('animations work properly', async ({ page }) => {
    // 检查页面加载动画
    await page.waitForSelector('.main-content')
    
    const mainContent = page.locator('.main-content')
    await expect(mainContent).toHaveCSS('animation-name', 'fadeInUp')
  })

  test('accessibility features', async ({ page }) => {
    // 检查键盘导航
    await page.keyboard.press('Tab')
    await expect(page.locator('.search-input')).toBeFocused()
    
    // 检查 ARIA 标签
    await expect(page.locator('.time')).toHaveAttribute('role', 'timer')
  })
})
```

## 🐛 调试技巧

### Vue DevTools 集成

```typescript
// src/utils/debug.ts
export class DebugHelper {
  private static instance: DebugHelper
  private debugMode: boolean = false
  
  static getInstance(): DebugHelper {
    if (!DebugHelper.instance) {
      DebugHelper.instance = new DebugHelper()
    }
    return DebugHelper.instance
  }
  
  constructor() {
    this.debugMode = import.meta.env.DEV || localStorage.getItem('debug') === 'true'
    
    if (this.debugMode) {
      this.setupDebugTools()
    }
  }
  
  private setupDebugTools() {
    // 添加全局调试方法
    (window as any).__DEBUG__ = {
      stores: () => {
        const { useAppStore, useSettingsStore } = require('@/stores')
        return {
          app: useAppStore(),
          settings: useSettingsStore()
        }
      },
      
      performance: () => {
        return {
          memory: (performance as any).memory,
          timing: performance.timing,
          navigation: performance.navigation
        }
      },
      
      extension: () => {
        return {
          manifest: chrome.runtime.getManifest(),
          storage: {
            sync: chrome.storage.sync,
            local: chrome.storage.local
          }
        }
      }
    }
    
    console.log('🐛 Debug tools available at window.__DEBUG__')
  }
  
  log(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`[DEBUG] ${message}`, data)
    }
  }
  
  error(message: string, error?: any) {
    if (this.debugMode) {
      console.error(`[DEBUG] ${message}`, error)
    }
  }
  
  time(label: string) {
    if (this.debugMode) {
      console.time(`[DEBUG] ${label}`)
    }
  }
  
  timeEnd(label: string) {
    if (this.debugMode) {
      console.timeEnd(`[DEBUG] ${label}`)
    }
  }
}

// 使用示例
const debug = DebugHelper.getInstance()
debug.log('Component mounted', { componentName: 'TimeDisplay' })
```

### 扩展调试工具

```typescript
// src/utils/extension-debug.ts
export class ExtensionDebugger {
  private logs: Array<{ timestamp: Date; level: string; message: string; data?: any }> = []
  
  constructor() {
    this.setupExtensionDebugging()
  }
  
  private setupExtensionDebugging() {
    // 监听扩展错误
    if (typeof chrome !== 'undefined') {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'DEBUG_LOG') {
          this.addLog('info', message.message, message.data)
        }
      })
    }
    
    // 拦截控制台方法
    const originalConsole = { ...console }
    
    console.log = (...args) => {
      this.addLog('log', args[0], args.slice(1))
      originalConsole.log(...args)
    }
    
    console.error = (...args) => {
      this.addLog('error', args[0], args.slice(1))
      originalConsole.error(...args)
    }
    
    console.warn = (...args) => {
      this.addLog('warn', args[0], args.slice(1))
      originalConsole.warn(...args)
    }
  }
  
  private addLog(level: string, message: string, data?: any) {
    this.logs.push({
      timestamp: new Date(),
      level,
      message,
      data
    })
    
    // 限制日志数量
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500)
    }
  }
  
  getLogs(level?: string): typeof this.logs {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }
  
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
  
  clearLogs() {
    this.logs = []
  }
  
  // 创建调试面板
  createDebugPanel() {
    const panel = document.createElement('div')
    panel.id = 'extension-debug-panel'
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 400px;
      height: 300px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      overflow-y: auto;
      display: none;
    `
    
    // 添加切换按钮
    const toggleButton = document.createElement('button')
    toggleButton.textContent = '🐛'
    toggleButton.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10001;
      background: #333;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 5px 10px;
      cursor: pointer;
    `
    
    toggleButton.onclick = () => {
      const isVisible = panel.style.display !== 'none'
      panel.style.display = isVisible ? 'none' : 'block'
      
      if (!isVisible) {
        this.updateDebugPanel(panel)
      }
    }
    
    document.body.appendChild(panel)
    document.body.appendChild(toggleButton)
    
    return panel
  }
  
  private updateDebugPanel(panel: HTMLElement) {
    const logs = this.getLogs().slice(-50) // 显示最近 50 条日志
    
    panel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold;">Extension Debug Panel</div>
      <div style="margin-bottom: 10px;">
        <button onclick="this.parentElement.nextElementSibling.innerHTML = ''">Clear</button>
        <button onclick="console.log(${JSON.stringify(this.exportLogs())})">Export</button>
      </div>
      <div style="max-height: 200px; overflow-y: auto;">
        ${logs.map(log => `
          <div style="margin-bottom: 5px; color: ${this.getLogColor(log.level)};">
            [${log.timestamp.toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}
            ${log.data ? `<br><pre style="margin: 0; font-size: 10px;">${JSON.stringify(log.data, null, 2)}</pre>` : ''}
          </div>
        `).join('')}
      </div>
    `
  }
  
  private getLogColor(level: string): string {
    switch (level) {
      case 'error': return '#ff6b6b'
      case 'warn': return '#feca57'
      case 'info': return '#48dbfb'
      default: return '#ffffff'
    }
  }
}

// 初始化扩展调试器
if (import.meta.env.DEV) {
  const extensionDebugger = new ExtensionDebugger()
  extensionDebugger.createDebugPanel()
  
  // 添加到全局对象
  ;(window as any).__EXTENSION_DEBUGGER__ = extensionDebugger
}
```

## 📊 错误监控

### 全局错误处理

```typescript
// src/utils/error-handler.ts
export class ErrorHandler {
  private errorQueue: Array<{
    error: Error
    timestamp: Date
    context?: string
    userAgent?: string
    url?: string
  }> = []
  
  constructor() {
    this.setupGlobalErrorHandling()
  }
  
  private setupGlobalErrorHandling() {
    // 捕获未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(event.reason),
        'Unhandled Promise Rejection'
      )
    })
    
    // 捕获全局错误
    window.addEventListener('error', (event) => {
      this.handleError(
        event.error || new Error(event.message),
        'Global Error',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      )
    })
    
    // Vue 错误处理
    const app = getCurrentInstance()?.appContext.app
    if (app) {
      app.config.errorHandler = (error, instance, info) => {
        this.handleError(
          error as Error,
          'Vue Error',
          {
            componentName: instance?.$options.name,
            errorInfo: info
          }
        )
      }
    }
  }
  
  handleError(error: Error, context?: string, additionalInfo?: any) {
    const errorInfo = {
      error,
      timestamp: new Date(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...additionalInfo
    }
    
    this.errorQueue.push(errorInfo)
    
    // 立即记录错误
    console.error('Error captured:', errorInfo)
    
    // 发送错误报告
    this.reportError(errorInfo)
    
    // 限制错误队列大小
    if (this.errorQueue.length > 100) {
      this.errorQueue = this.errorQueue.slice(-50)
    }
  }
  
  private async reportError(errorInfo: any) {
    try {
      // 发送到错误监控服务
      // 这里可以集成 Sentry、LogRocket 等服务
      
      // 示例：发送到自定义端点
      if (import.meta.env.PROD) {
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: errorInfo.error.message,
            stack: errorInfo.error.stack,
            context: errorInfo.context,
            timestamp: errorInfo.timestamp,
            userAgent: errorInfo.userAgent,
            url: errorInfo.url
          })
        })
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }
  
  getErrors(): typeof this.errorQueue {
    return [...this.errorQueue]
  }
  
  clearErrors() {
    this.errorQueue = []
  }
}

// 初始化错误处理器
export const errorHandler = new ErrorHandler()
```

## 📚 扩展阅读

### 测试框架文档
- [Vitest 官方文档](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright 文档](https://playwright.dev/)

### 调试工具
- [Vue DevTools](https://devtools.vuejs.org/)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)

---

**下一章：[部署和发布](./14-deployment-publishing.md)**
