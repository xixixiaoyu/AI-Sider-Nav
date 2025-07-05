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
  // 日历相关设置
  calendar: {
    enabled: boolean
    weekStartsOn: 'monday' | 'sunday'
    showWeekNumbers: boolean
  }
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
    calendar: {
      enabled: true,
      weekStartsOn: 'monday',
      showWeekNumbers: false,
    },
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

  // 设置存储监听器
  const setupStorageListener = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.userSettings) {
          const newSettings = changes.userSettings.newValue
          if (newSettings) {
            settings.value = { ...defaultSettings, ...newSettings }
          }
        }
      })
    } else {
      // 开发环境使用 localStorage 事件监听
      window.addEventListener('storage', (event) => {
        if (event.key === 'userSettings' && event.newValue) {
          try {
            const newSettings = JSON.parse(event.newValue)
            settings.value = { ...defaultSettings, ...newSettings }
          } catch (error) {
            console.error('Failed to parse settings from storage event:', error)
          }
        }
      })
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
  }
})
