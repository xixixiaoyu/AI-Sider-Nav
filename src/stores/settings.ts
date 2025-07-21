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
  // 文本选择复制功能设置
  textSelection: {
    enabled: boolean
    showCopyButton: boolean
    autoHideDelay: number // 复制按钮自动隐藏延迟（毫秒）
    minSelectionLength: number // 最小选择文本长度
    showSuccessMessage: boolean // 是否显示复制成功提示
  }
}

export const useSettingsStore = defineStore('settings', () => {
  // 默认设置
  const defaultSettings: UserSettings = {
    searchEngine: 'google',
    backgroundImage: '/images/background.jpg',
    timeFormat: '24h',
    language: 'zh-CN',
    showSeconds: false,
    customSearchEngines: [],
    textSelection: {
      enabled: true,
      showCopyButton: true,
      autoHideDelay: 2000,
      minSelectionLength: 1,
      showSuccessMessage: false,
    },
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
        icon: '🔍',
      },
      bing: {
        name: 'Bing',
        url: 'https://www.bing.com/search?q=',
        icon: '🔍',
      },
      baidu: {
        name: '百度',
        url: 'https://www.baidu.com/s?wd=',
        icon: '🔍',
      },
    }
    return engines[settings.value.searchEngine]
  })

  // 从浏览器存储加载设置
  const loadSettings = async () => {
    isLoading.value = true
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['aiSiderNavSettings'])
        if (result.aiSiderNavSettings) {
          // 从统一设置结构中提取用户设置
          const userSettings = result.aiSiderNavSettings.userSettings || result.aiSiderNavSettings
          settings.value = { ...defaultSettings, ...userSettings }
        }
      } else {
        // 开发环境使用 localStorage
        const stored = localStorage.getItem('aiSiderNavSettings')
        if (stored) {
          const data = JSON.parse(stored)
          const userSettings = data.userSettings || data
          settings.value = { ...defaultSettings, ...userSettings }
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
      // 获取现有的完整设置
      let existingSettings = {}
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['aiSiderNavSettings'])
        existingSettings = result.aiSiderNavSettings || {}
      } else {
        const stored = localStorage.getItem('aiSiderNavSettings')
        existingSettings = stored ? JSON.parse(stored) : {}
      }

      // 更新用户设置部分
      const updatedSettings = {
        ...existingSettings,
        ...settings.value, // 为了向后兼容，将用户设置直接合并到根级别
        userSettings: settings.value, // 同时保存到 userSettings 字段
      }

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({ aiSiderNavSettings: updatedSettings })
      } else {
        localStorage.setItem('aiSiderNavSettings', JSON.stringify(updatedSettings))
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // 更新单个设置
  const updateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    settings.value[key] = value
    await saveSettings()
  }

  // 重置设置
  const resetSettings = async () => {
    settings.value = { ...defaultSettings }
    await saveSettings()
  }

  // 添加自定义搜索引擎
  const addCustomSearchEngine = async (engine: { name: string; url: string; icon?: string }) => {
    settings.value.customSearchEngines.push(engine)
    await saveSettings()
  }

  // 删除自定义搜索引擎
  const removeCustomSearchEngine = async (index: number) => {
    settings.value.customSearchEngines.splice(index, 1)
    await saveSettings()
  }

  // 存储监听器清理函数
  let storageListenerCleanup: (() => void) | null = null

  // 设置存储监听器
  const setupStorageListener = () => {
    // 清理之前的监听器
    if (storageListenerCleanup) {
      storageListenerCleanup()
      storageListenerCleanup = null
    }

    if (typeof chrome !== 'undefined' && chrome.storage) {
      const chromeStorageListener = (changes: any, namespace: string) => {
        if (namespace === 'sync' && changes.aiSiderNavSettings) {
          const newData = changes.aiSiderNavSettings.newValue
          if (newData) {
            const userSettings = newData.userSettings || newData
            settings.value = { ...defaultSettings, ...userSettings }
          }
        }
      }

      chrome.storage.onChanged.addListener(chromeStorageListener)

      // 设置清理函数
      storageListenerCleanup = () => {
        chrome.storage.onChanged.removeListener(chromeStorageListener)
      }
    } else {
      // 开发环境使用 localStorage 事件监听
      const localStorageListener = (event: StorageEvent) => {
        if (event.key === 'aiSiderNavSettings' && event.newValue) {
          try {
            const data = JSON.parse(event.newValue)
            const userSettings = data.userSettings || data
            settings.value = { ...defaultSettings, ...userSettings }
          } catch (error) {
            console.error('Failed to parse settings from storage event:', error)
          }
        }
      }

      window.addEventListener('storage', localStorageListener)

      // 设置清理函数
      storageListenerCleanup = () => {
        window.removeEventListener('storage', localStorageListener)
      }
    }
  }

  // 清理存储监听器
  const cleanupStorageListener = () => {
    if (storageListenerCleanup) {
      storageListenerCleanup()
      storageListenerCleanup = null
    }
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
    removeCustomSearchEngine,
    setupStorageListener,
    cleanupStorageListener,
  }
})
