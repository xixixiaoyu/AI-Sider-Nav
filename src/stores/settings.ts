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
  // 天气相关设置
  weather: {
    enabled: boolean
    temperatureUnit: 'celsius' | 'fahrenheit'
    city: string
    autoLocation: boolean
    apiKey?: string
  }
  // 日历相关设置
  calendar: {
    enabled: boolean
    weekStartsOn: 'monday' | 'sunday'
    showWeekNumbers: boolean
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
    weather: {
      enabled: true,
      temperatureUnit: 'celsius',
      city: '',
      autoLocation: true,
      apiKey: undefined,
    },
    calendar: {
      enabled: true,
      weekStartsOn: 'monday',
      showWeekNumbers: false,
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
  }
})
