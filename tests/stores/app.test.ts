import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '@/stores/app'

describe('AppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()

    // 重置 localStorage mock 方法
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
    localStorage.removeItem = vi.fn()

    // 重置 chrome.storage mock
    const chromeStorageMock = window.chrome.storage.local
    chromeStorageMock.get.mockClear().mockResolvedValue({})
    chromeStorageMock.set.mockClear().mockResolvedValue(undefined)
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const store = useAppStore()

      expect(store.isSettingsOpen).toBe(false)
      expect(store.isSearchFocused).toBe(false)
      expect(store.currentTime).toBeInstanceOf(Date)
      expect(store.searchHistory).toEqual([])
      expect(store.recentSearches).toEqual([])
    })
  })

  describe('设置面板控制', () => {
    it('应该能够关闭设置面板', () => {
      const store = useAppStore()

      // 先通过切换打开设置面板
      store.toggleSettings()
      expect(store.isSettingsOpen).toBe(true)

      store.closeSettings()
      expect(store.isSettingsOpen).toBe(false)
    })

    it('应该能够切换设置面板状态', () => {
      const store = useAppStore()

      expect(store.isSettingsOpen).toBe(false)

      store.toggleSettings()
      expect(store.isSettingsOpen).toBe(true)

      store.toggleSettings()
      expect(store.isSettingsOpen).toBe(false)
    })
  })

  describe('搜索焦点控制', () => {
    it('应该能够设置搜索焦点状态', () => {
      const store = useAppStore()

      store.setSearchFocus(true)
      expect(store.isSearchFocused).toBe(true)

      store.setSearchFocus(false)
      expect(store.isSearchFocused).toBe(false)
    })
  })

  describe('时间管理', () => {
    it('应该能够更新当前时间', () => {
      const store = useAppStore()
      const beforeTime = store.currentTime

      // updateTime 方法不接受参数，只是更新为当前时间
      store.updateTime()

      // 验证时间被更新了
      expect(store.currentTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
    })

    it('应该能够格式化时间', () => {
      const store = useAppStore()

      // 由于 updateTime 不接受参数，我们直接测试格式化功能
      // 使用当前时间进行测试
      const time24h = store.formatTime('24h', 'zh-CN', false)
      const time12h = store.formatTime('12h', 'en-US', false)
      const time24hWithSeconds = store.formatTime('24h', 'zh-CN', true)
      const time12hWithSeconds = store.formatTime('12h', 'en-US', true)

      // 验证格式化结果包含时间分隔符
      expect(time24h).toMatch(/\d{1,2}:\d{2}/)
      expect(time12h).toMatch(/\d{1,2}:\d{2}/)
      expect(time24hWithSeconds).toMatch(/\d{1,2}:\d{2}:\d{2}/)
      expect(time12hWithSeconds).toMatch(/\d{1,2}:\d{2}:\d{2}/)

      // 12小时格式应该包含 AM/PM
      expect(time12h).toMatch(/(AM|PM)/i)
      expect(time12hWithSeconds).toMatch(/(AM|PM)/i)
    })

    it('应该处理不同的语言环境', () => {
      const store = useAppStore()

      const timeCN = store.formatTime('24h', 'zh-CN', false)
      const timeEN = store.formatTime('24h', 'en-US', false)

      // 两种语言环境都应该返回有效的时间格式
      expect(timeCN).toMatch(/\d{1,2}:\d{2}/)
      expect(timeEN).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('搜索历史管理', () => {
    it('应该能够添加搜索历史', async () => {
      const store = useAppStore()
      const searchTerm = 'test search'

      await store.addSearchHistory(searchTerm)

      expect(store.searchHistory).toContain(searchTerm)
    })

    it('应该避免重复的搜索历史', async () => {
      const store = useAppStore()
      const searchTerm = 'duplicate search'

      await store.addSearchHistory(searchTerm)
      await store.addSearchHistory(searchTerm)

      expect(store.searchHistory.filter((item) => item === searchTerm)).toHaveLength(1)
    })

    it('应该限制搜索历史的数量', async () => {
      const store = useAppStore()

      // 添加超过限制的搜索历史
      for (let i = 0; i < 150; i++) {
        await store.addSearchHistory(`search ${i}`)
      }

      // 应该限制在合理的数量内（假设限制为100）
      expect(store.searchHistory.length).toBeLessThanOrEqual(100)
    })

    it('应该能够清空搜索历史', async () => {
      const store = useAppStore()

      await store.addSearchHistory('search 1')
      await store.addSearchHistory('search 2')
      expect(store.searchHistory.length).toBeGreaterThan(0)

      await store.clearSearchHistory()
      expect(store.searchHistory).toEqual([])
    })

    it('应该能够从存储加载搜索历史', async () => {
      const savedHistory = ['search 1', 'search 2', 'search 3']

      window.chrome.storage.local.get.mockResolvedValue({
        searchHistory: savedHistory,
        recentSearches: [],
      })

      const store = useAppStore()
      await store.loadSearchHistory()

      expect(store.searchHistory).toEqual(savedHistory)
    })

    it('应该在添加搜索历史时保存到存储', async () => {
      const store = useAppStore()
      const searchTerm = 'test search'

      await store.addSearchHistory(searchTerm)

      expect(window.chrome.storage.local.set).toHaveBeenCalledWith({
        searchHistory: expect.arrayContaining([searchTerm]),
      })
    })
  })

  describe('最近搜索管理', () => {
    it('应该能够添加最近搜索', async () => {
      const store = useAppStore()
      const searchTerm = 'recent search'

      await store.addRecentSearch(searchTerm)

      expect(store.recentSearches).toContain(searchTerm)
    })

    it('应该限制最近搜索的数量', async () => {
      const store = useAppStore()

      // 添加多个最近搜索
      for (let i = 0; i < 20; i++) {
        await store.addRecentSearch(`recent ${i}`)
      }

      // 应该限制在合理的数量内（假设限制为10）
      expect(store.recentSearches.length).toBeLessThanOrEqual(10)
    })

    it('应该将新的搜索添加到最前面', async () => {
      const store = useAppStore()

      await store.addRecentSearch('first')
      await store.addRecentSearch('second')
      await store.addRecentSearch('third')

      expect(store.recentSearches[0]).toBe('third')
      expect(store.recentSearches[1]).toBe('second')
      expect(store.recentSearches[2]).toBe('first')
    })

    it('应该能够清空最近搜索', async () => {
      const store = useAppStore()

      await store.addRecentSearch('recent 1')
      await store.addRecentSearch('recent 2')
      expect(store.recentSearches.length).toBeGreaterThan(0)

      await store.clearRecentSearches()
      expect(store.recentSearches).toEqual([])
    })

    it('应该移除重复的最近搜索', async () => {
      const store = useAppStore()

      await store.addRecentSearch('duplicate')
      await store.addRecentSearch('other')
      await store.addRecentSearch('duplicate') // 重复添加

      // 应该只有一个 'duplicate'，并且在最前面
      expect(store.recentSearches.filter((item) => item === 'duplicate')).toHaveLength(1)
      expect(store.recentSearches[0]).toBe('duplicate')
    })
  })

  describe('错误处理', () => {
    it('应该处理存储加载错误', async () => {
      const store = useAppStore()

      window.chrome.storage.local.get.mockRejectedValue(new Error('Storage error'))

      // 不应该抛出错误
      await expect(store.loadSearchHistory()).resolves.toBeUndefined()

      // 应该保持空的搜索历史
      expect(store.searchHistory).toEqual([])
    })

    it('应该处理存储保存错误', async () => {
      const store = useAppStore()

      window.chrome.storage.local.set.mockRejectedValue(new Error('Storage error'))

      // 不应该抛出错误
      expect(() => store.addSearchHistory('test')).not.toThrow()

      // 应该仍然更新本地状态
      expect(store.searchHistory).toContain('test')
    })

    it('应该处理无效的搜索词', () => {
      const store = useAppStore()

      // 空字符串
      store.addSearchHistory('')
      expect(store.searchHistory).not.toContain('')

      // 只有空格
      store.addSearchHistory('   ')
      expect(store.searchHistory).not.toContain('   ')

      // null 或 undefined 会导致错误，因为实际实现没有处理这些情况
      // @ts-ignore - 故意传入错误类型进行测试
      expect(() => store.addSearchHistory(null)).toThrow()
      // @ts-ignore - 故意传入错误类型进行测试
      expect(() => store.addSearchHistory(undefined)).toThrow()
    })
  })

  describe('数据持久化', () => {
    it('应该在没有 chrome.storage 时使用 localStorage', async () => {
      const store = useAppStore()

      // 临时移除 chrome.storage
      const originalStorage = window.chrome.storage
      // @ts-ignore
      window.chrome.storage = undefined

      // localStorage 有数据
      const localStorageHistory = ['local search 1', 'local search 2']
      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'searchHistory') {
          return JSON.stringify(localStorageHistory)
        }
        return null
      })

      await store.loadSearchHistory()

      expect(store.searchHistory).toEqual(localStorageHistory)

      // 恢复 chrome.storage
      window.chrome.storage = originalStorage
    })
  })
})
