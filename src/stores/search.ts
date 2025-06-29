import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SearchEngine } from '@/types'

export const useSearchStore = defineStore('search', () => {
  // 搜索引擎配置
  const searchEngines = ref<SearchEngine[]>([
    {
      name: 'Google',
      url: 'https://www.google.com/search?q=',
      icon: 'i-mdi-google',
      color: '#4285f4'
    },
    {
      name: 'Bing',
      url: 'https://www.bing.com/search?q=',
      icon: 'i-mdi-microsoft-bing',
      color: '#0078d4'
    }
  ])

  // 默认搜索引擎
  const defaultEngine = ref('Google')
  
  // 搜索历史
  const searchHistory = ref<string[]>([])

  // 计算属性
  const currentEngine = computed(() => 
    searchEngines.value.find(engine => engine.name === defaultEngine.value) || searchEngines.value[0]
  )

  // 方法
  const search = (query: string, engineName?: string) => {
    if (!query.trim()) return

    const engine = engineName 
      ? searchEngines.value.find(e => e.name === engineName) 
      : currentEngine.value

    if (engine) {
      const searchUrl = engine.url + encodeURIComponent(query)
      chrome.tabs.create({ url: searchUrl })
      
      // 添加到搜索历史
      addToHistory(query)
    }
  }

  const addToHistory = (query: string) => {
    const trimmedQuery = query.trim()
    if (trimmedQuery && !searchHistory.value.includes(trimmedQuery)) {
      searchHistory.value.unshift(trimmedQuery)
      // 限制历史记录数量
      if (searchHistory.value.length > 10) {
        searchHistory.value = searchHistory.value.slice(0, 10)
      }
      saveHistory()
    }
  }

  const clearHistory = () => {
    searchHistory.value = []
    saveHistory()
  }

  const saveHistory = () => {
    chrome.storage.local.set({ searchHistory: searchHistory.value })
  }

  const loadHistory = async () => {
    try {
      const result = await chrome.storage.local.get(['searchHistory'])
      if (result.searchHistory) {
        searchHistory.value = result.searchHistory
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }

  const setDefaultEngine = (engineName: string) => {
    if (searchEngines.value.some(engine => engine.name === engineName)) {
      defaultEngine.value = engineName
      chrome.storage.local.set({ defaultEngine: engineName })
    }
  }

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(['defaultEngine'])
      if (result.defaultEngine) {
        defaultEngine.value = result.defaultEngine
      }
    } catch (error) {
      console.error('Failed to load search settings:', error)
    }
  }

  return {
    searchEngines,
    defaultEngine,
    searchHistory,
    currentEngine,
    search,
    addToHistory,
    clearHistory,
    setDefaultEngine,
    loadHistory,
    loadSettings
  }
})
