# 第七章：状态管理实现

## 🎯 学习目标

- 理解 Pinia 状态管理的核心概念
- 设计应用的状态结构
- 实现用户设置和应用状态管理
- 集成浏览器存储持久化

## 🍍 Pinia 简介

### 什么是 Pinia？

Pinia 是 Vue 3 的官方状态管理库，具有以下特点：
- 🎯 类型安全的 TypeScript 支持
- 🔧 简洁的 API 设计
- 🛠️ 强大的开发工具
- 📦 模块化的 Store 设计

### Pinia vs Vuex

| 特性 | Vuex 4 | Pinia |
|------|--------|-------|
| TypeScript 支持 | 一般 | 优秀 |
| API 复杂度 | 高 | 低 |
| 模块化 | 复杂 | 简单 |
| 开发体验 | 一般 | 优秀 |
| 包体积 | 较大 | 较小 |

## 🏗️ 状态架构设计

### 状态分类

我们将应用状态分为两个主要类别：

1. **用户设置 (Settings Store)**
   - 搜索引擎偏好
   - 时间格式设置
   - 主题配置
   - 语言设置

2. **应用状态 (App Store)**
   - 当前时间
   - 搜索历史
   - UI 状态
   - 临时数据

### 状态持久化策略

```typescript
// 持久化策略
interface PersistenceStrategy {
  settings: 'chrome.storage.sync'    // 用户设置同步到云端
  searchHistory: 'chrome.storage.local'  // 搜索历史本地存储
  appState: 'memory'                 // 应用状态仅内存存储
}
```

## ⚙️ 设置状态管理

### 用户设置接口定义

```typescript
// src/stores/settings.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserSettings {
  searchEngine: 'google' | 'bing' | 'baidu'
  backgroundImage: string
  timeFormat: '12h' | '24h'
  language: 'zh-CN' | 'en-US'
  showSeconds: boolean
  customSearchEngines: Array<{
    name: string
    url: string
    icon?: string
  }>
}

export const useSettingsStore = defineStore('settings', () => {
  // 默认设置
  const defaultSettings: UserSettings = {
    searchEngine: 'google',
    backgroundImage: '/images/background.jpg',
    timeFormat: '24h',
    language: 'zh-CN',
    showSeconds: false,
    customSearchEngines: []
  }

  // 响应式状态
  const settings = ref<UserSettings>({ ...defaultSettings })
  const isLoading = ref(false)

  // 计算属性
  const currentSearchEngine = computed(() => {
    const engines = {
      google: {
        name: 'Google',
        url: 'https://www.google.com/search?q=',
        icon: '🔍'
      },
      bing: {
        name: 'Bing',
        url: 'https://www.bing.com/search?q=',
        icon: '🔍'
      },
      baidu: {
        name: '百度',
        url: 'https://www.baidu.com/s?wd=',
        icon: '🔍'
      }
    }
    return engines[settings.value.searchEngine]
  })

  return {
    settings,
    isLoading,
    currentSearchEngine,
    // 方法将在下面定义
  }
})
```

### 存储操作方法

```typescript
// 继续 settings.ts
export const useSettingsStore = defineStore('settings', () => {
  // ... 前面的代码

  // 从浏览器存储加载设置
  const loadSettings = async () => {
    isLoading.value = true
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get('userSettings')
        if (result.userSettings) {
          settings.value = { ...defaultSettings, ...result.userSettings }
        }
      } else {
        // 开发环境使用 localStorage
        const stored = localStorage.getItem('userSettings')
        if (stored) {
          settings.value = { ...defaultSettings, ...JSON.parse(stored) }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 保存设置到浏览器存储
  const saveSettings = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({ userSettings: settings.value })
      } else {
        // 开发环境使用 localStorage
        localStorage.setItem('userSettings', JSON.stringify(settings.value))
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // 更新单个设置
  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    settings.value[key] = value
    await saveSettings()
  }

  // 重置设置
  const resetSettings = async () => {
    settings.value = { ...defaultSettings }
    await saveSettings()
  }

  // 添加自定义搜索引擎
  const addCustomSearchEngine = async (engine: {
    name: string
    url: string
    icon?: string
  }) => {
    settings.value.customSearchEngines.push(engine)
    await saveSettings()
  }

  // 删除自定义搜索引擎
  const removeCustomSearchEngine = async (index: number) => {
    settings.value.customSearchEngines.splice(index, 1)
    await saveSettings()
  }

  return {
    settings,
    isLoading,
    currentSearchEngine,
    loadSettings,
    saveSettings,
    updateSetting,
    resetSettings,
    addCustomSearchEngine,
    removeCustomSearchEngine
  }
})
```

## 📱 应用状态管理

### 应用状态定义

```typescript
// src/stores/app.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const isSettingsOpen = ref(false)
  const isSearchFocused = ref(false)
  const currentTime = ref(new Date())
  const searchHistory = ref<string[]>([])
  const recentSearches = ref<string[]>([])

  // 计算属性
  const formattedTime = computed(() => {
    return currentTime.value.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  })

  const formattedDate = computed(() => {
    return currentTime.value.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  })

  // 更新时间
  const updateTime = () => {
    currentTime.value = new Date()
  }

  // 切换设置面板
  const toggleSettings = () => {
    isSettingsOpen.value = !isSettingsOpen.value
  }

  // 关闭设置面板
  const closeSettings = () => {
    isSettingsOpen.value = false
  }

  // 设置搜索焦点状态
  const setSearchFocus = (focused: boolean) => {
    isSearchFocused.value = focused
  }

  return {
    // 状态
    isSettingsOpen,
    isSearchFocused,
    currentTime,
    searchHistory,
    recentSearches,
    
    // 计算属性
    formattedTime,
    formattedDate,
    
    // 方法
    updateTime,
    toggleSettings,
    closeSettings,
    setSearchFocus,
  }
})
```

### 搜索历史管理

```typescript
// 继续 app.ts
export const useAppStore = defineStore('app', () => {
  // ... 前面的代码

  // 添加搜索历史
  const addSearchHistory = (query: string) => {
    if (query.trim() && !searchHistory.value.includes(query)) {
      searchHistory.value.unshift(query)
      // 限制历史记录数量
      if (searchHistory.value.length > 50) {
        searchHistory.value = searchHistory.value.slice(0, 50)
      }
      saveSearchHistory()
    }
  }

  // 添加最近搜索
  const addRecentSearch = (query: string) => {
    if (query.trim()) {
      // 移除已存在的相同搜索
      const index = recentSearches.value.indexOf(query)
      if (index > -1) {
        recentSearches.value.splice(index, 1)
      }
      
      // 添加到开头
      recentSearches.value.unshift(query)
      
      // 限制最近搜索数量
      if (recentSearches.value.length > 10) {
        recentSearches.value = recentSearches.value.slice(0, 10)
      }
      
      saveRecentSearches()
    }
  }

  // 清除搜索历史
  const clearSearchHistory = () => {
    searchHistory.value = []
    saveSearchHistory()
  }

  // 清除最近搜索
  const clearRecentSearches = () => {
    recentSearches.value = []
    saveRecentSearches()
  }

  // 保存搜索历史到存储
  const saveSearchHistory = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ searchHistory: searchHistory.value })
      } else {
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
      }
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }

  // 保存最近搜索到存储
  const saveRecentSearches = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ recentSearches: recentSearches.value })
      } else {
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value))
      }
    } catch (error) {
      console.error('Failed to save recent searches:', error)
    }
  }

  // 加载搜索历史
  const loadSearchHistory = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['searchHistory', 'recentSearches'])
        if (result.searchHistory) {
          searchHistory.value = result.searchHistory
        }
        if (result.recentSearches) {
          recentSearches.value = result.recentSearches
        }
      } else {
        const storedHistory = localStorage.getItem('searchHistory')
        const storedRecent = localStorage.getItem('recentSearches')
        
        if (storedHistory) {
          searchHistory.value = JSON.parse(storedHistory)
        }
        if (storedRecent) {
          recentSearches.value = JSON.parse(storedRecent)
        }
      }
    } catch (error) {
      console.error('Failed to load search data:', error)
    }
  }

  return {
    // ... 前面的返回值
    addSearchHistory,
    addRecentSearch,
    clearSearchHistory,
    clearRecentSearches,
    loadSearchHistory
  }
})
```

## 🔗 Store 组合和导出

### 统一导出

```typescript
// src/stores/index.ts
// 导出所有存储
export { useSettingsStore } from './settings'
export { useAppStore } from './app'

// 导出类型
export type { UserSettings } from './settings'
```

### 组合 Store 使用

```typescript
// src/composables/useStores.ts
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/app'

export function useStores() {
  const settingsStore = useSettingsStore()
  const appStore = useAppStore()

  return {
    settingsStore,
    appStore,
  }
}
```

## 🔄 状态持久化

### 自动持久化插件

```typescript
// src/stores/plugins/persistence.ts
import type { PiniaPluginContext } from 'pinia'

export function persistencePlugin({ store }: PiniaPluginContext) {
  // 只对特定 store 启用持久化
  if (store.$id === 'settings') {
    // 监听状态变化并自动保存
    store.$subscribe((mutation, state) => {
      // 防抖保存，避免频繁写入
      debounce(() => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.sync.set({ [store.$id]: state })
        } else {
          localStorage.setItem(store.$id, JSON.stringify(state))
        }
      }, 300)()
    })

    // 初始化时加载数据
    const loadInitialState = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.sync.get(store.$id)
          if (result[store.$id]) {
            store.$patch(result[store.$id])
          }
        } else {
          const stored = localStorage.getItem(store.$id)
          if (stored) {
            store.$patch(JSON.parse(stored))
          }
        }
      } catch (error) {
        console.error(`Failed to load ${store.$id}:`, error)
      }
    }

    loadInitialState()
  }
}

// 防抖函数
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
```

### 在应用中注册插件

```typescript
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { persistencePlugin } from '@/stores/plugins/persistence'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

// 注册持久化插件
pinia.use(persistencePlugin)

app.use(pinia)
app.mount('#app')
```

## 🧪 状态管理最佳实践

### 1. 状态结构设计

```typescript
// ✅ 好的设计 - 扁平化结构
interface AppState {
  user: User
  settings: Settings
  ui: UIState
}

// ❌ 避免 - 深度嵌套
interface BadAppState {
  data: {
    user: {
      profile: {
        settings: {
          preferences: Settings
        }
      }
    }
  }
}
```

### 2. 计算属性使用

```typescript
// ✅ 使用计算属性缓存复杂计算
const expensiveComputed = computed(() => {
  return heavyCalculation(state.value.data)
})

// ❌ 避免在模板中直接计算
// <template>{{ heavyCalculation(data) }}</template>
```

### 3. 异步操作处理

```typescript
export const useAsyncStore = defineStore('async', () => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchData = async () => {
    loading.value = true
    error.value = null
    
    try {
      const result = await api.getData()
      data.value = result
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetchData }
})
```

### 4. 类型安全

```typescript
// 定义严格的类型
interface StrictSettings {
  readonly theme: 'light' | 'dark'
  readonly language: 'zh-CN' | 'en-US'
}

// 使用类型守卫
function isValidSettings(obj: any): obj is StrictSettings {
  return obj && 
         typeof obj.theme === 'string' && 
         ['light', 'dark'].includes(obj.theme)
}
```

## 🔍 调试和开发工具

### Vue DevTools 集成

```typescript
// 开发环境下启用详细调试
export const useDebugStore = defineStore('debug', () => {
  const state = ref({ count: 0 })

  // 在开发环境下添加调试信息
  if (import.meta.env.DEV) {
    // 监听状态变化
    watch(state, (newState, oldState) => {
      console.log('State changed:', { oldState, newState })
    }, { deep: true })
  }

  return { state }
})
```

### 自定义调试工具

```typescript
// src/utils/debug.ts
export function createDebugger(storeName: string) {
  return {
    log: (message: string, data?: any) => {
      if (import.meta.env.DEV) {
        console.log(`[${storeName}] ${message}`, data)
      }
    },
    error: (message: string, error?: any) => {
      console.error(`[${storeName}] ${message}`, error)
    },
    time: (label: string) => {
      if (import.meta.env.DEV) {
        console.time(`[${storeName}] ${label}`)
      }
    },
    timeEnd: (label: string) => {
      if (import.meta.env.DEV) {
        console.timeEnd(`[${storeName}] ${label}`)
      }
    }
  }
}
```

## 🚀 性能优化

### 1. 懒加载 Store

```typescript
// 按需加载大型 store
export const useLargeStore = defineStore('large', () => {
  const data = ref(null)
  
  const loadData = async () => {
    if (!data.value) {
      // 只在需要时加载数据
      const { heavyData } = await import('@/data/heavy-data')
      data.value = heavyData
    }
  }

  return { data, loadData }
})
```

### 2. 状态分片

```typescript
// 将大型状态分解为小块
export const useUserStore = defineStore('user', () => {
  const profile = ref(null)
  return { profile }
})

export const useUserPreferencesStore = defineStore('userPreferences', () => {
  const preferences = ref(null)
  return { preferences }
})
```

### 3. 选择性响应

```typescript
// 使用 shallowRef 避免深度响应
import { shallowRef } from 'vue'

export const usePerformantStore = defineStore('performant', () => {
  // 对于大型对象使用 shallowRef
  const largeObject = shallowRef({})
  
  // 手动触发更新
  const updateLargeObject = (newData: any) => {
    largeObject.value = { ...largeObject.value, ...newData }
  }

  return { largeObject, updateLargeObject }
})
```

## 📚 扩展阅读

### 官方文档
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Vue 3 状态管理指南](https://vuejs.org/guide/scaling-up/state-management.html)

### 最佳实践
- [Pinia 最佳实践](https://pinia.vuejs.org/cookbook/)
- [Vue 3 组合式 API 指南](https://vuejs.org/guide/extras/composition-api-faq.html)

---

**下一章：[组件开发](./08-component-development.md)**
