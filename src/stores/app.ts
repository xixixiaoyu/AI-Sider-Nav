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
      hour12: false,
    })
  })

  const formattedDate = computed(() => {
    return currentTime.value.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
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

  // 添加搜索历史
  const addSearchHistory = (query: string) => {
    // 确保 searchHistory.value 是数组
    if (!Array.isArray(searchHistory.value)) {
      searchHistory.value = []
    }

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
    // 确保 recentSearches.value 是数组
    if (!Array.isArray(recentSearches.value)) {
      recentSearches.value = []
    }

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
        if (result.searchHistory && Array.isArray(result.searchHistory)) {
          searchHistory.value = result.searchHistory
        }
        if (result.recentSearches && Array.isArray(result.recentSearches)) {
          recentSearches.value = result.recentSearches
        }
      } else {
        const storedHistory = localStorage.getItem('searchHistory')
        const storedRecent = localStorage.getItem('recentSearches')

        if (storedHistory) {
          try {
            const parsed = JSON.parse(storedHistory)
            if (Array.isArray(parsed)) {
              searchHistory.value = parsed
            }
          } catch (e) {
            console.warn('Invalid search history data, using empty array')
          }
        }
        if (storedRecent) {
          try {
            const parsed = JSON.parse(storedRecent)
            if (Array.isArray(parsed)) {
              recentSearches.value = parsed
            }
          } catch (e) {
            console.warn('Invalid recent searches data, using empty array')
          }
        }
      }
    } catch (error) {
      console.error('Failed to load search data:', error)
    }
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
    addSearchHistory,
    addRecentSearch,
    clearSearchHistory,
    clearRecentSearches,
    loadSearchHistory,
  }
})
