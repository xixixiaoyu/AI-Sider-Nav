import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('SettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()

    // 重置 localStorage mock 方法
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
    localStorage.removeItem = vi.fn()

    // 重置 chrome.storage mock
    const chromeStorageMock = window.chrome.storage.sync
    chromeStorageMock.get.mockClear().mockResolvedValue({})
    chromeStorageMock.set.mockClear().mockResolvedValue(undefined)
    chromeStorageMock.remove.mockClear().mockResolvedValue(undefined)
  })

  describe('初始状态', () => {
    it('应该有正确的默认设置', () => {
      const store = useSettingsStore()

      expect(store.settings).toMatchObject({
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
      })
    })

    it('应该初始状态为未加载', () => {
      const store = useSettingsStore()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('设置更新', () => {
    it('应该能够更新单个设置项', async () => {
      const store = useSettingsStore()

      await store.updateSetting('searchEngine', 'bing')
      expect(store.settings.searchEngine).toBe('bing')

      await store.updateSetting('timeFormat', '12h')
      expect(store.settings.timeFormat).toBe('12h')

      await store.updateSetting('showSeconds', true)
      expect(store.settings.showSeconds).toBe(true)
    })

    it('应该能够更新嵌套设置项', async () => {
      const store = useSettingsStore()

      // 由于 updateSetting 不支持点号路径，我们需要更新整个对象
      await store.updateSetting('calendar', {
        ...store.settings.calendar,
        enabled: false,
        weekStartsOn: 'sunday',
      })

      expect(store.settings.calendar.enabled).toBe(false)
      expect(store.settings.calendar.weekStartsOn).toBe('sunday')

      await store.updateSetting('textSelection', {
        ...store.settings.textSelection,
        enabled: false,
      })

      expect(store.settings.textSelection.enabled).toBe(false)
    })

    it('应该在更新设置时保存到存储', async () => {
      const store = useSettingsStore()

      await store.updateSetting('searchEngine', 'baidu')

      expect(window.chrome.storage.sync.set).toHaveBeenCalledWith({
        aiSiderNavSettings: expect.objectContaining({
          searchEngine: 'baidu',
        }),
      })
    })

    it('应该能够批量更新设置', async () => {
      const store = useSettingsStore()

      // 由于没有 updateSettings 方法，我们使用多次 updateSetting 调用
      await store.updateSetting('searchEngine', 'bing')
      await store.updateSetting('timeFormat', '12h')
      await store.updateSetting('showSeconds', true)

      expect(store.settings.searchEngine).toBe('bing')
      expect(store.settings.timeFormat).toBe('12h')
      expect(store.settings.showSeconds).toBe(true)
    })
  })

  describe('自定义搜索引擎', () => {
    it('应该能够添加自定义搜索引擎', async () => {
      const store = useSettingsStore()

      const customEngine = {
        name: 'DuckDuckGo',
        url: 'https://duckduckgo.com/?q={query}',
        icon: 'https://duckduckgo.com/favicon.ico',
      }

      await store.addCustomSearchEngine(customEngine)

      expect(store.settings.customSearchEngines).toHaveLength(1)
      expect(store.settings.customSearchEngines[0]).toEqual(customEngine)
    })

    it('应该能够移除自定义搜索引擎', async () => {
      const store = useSettingsStore()

      const customEngine = {
        name: 'DuckDuckGo',
        url: 'https://duckduckgo.com/?q={query}',
      }

      await store.addCustomSearchEngine(customEngine)
      expect(store.settings.customSearchEngines).toHaveLength(1)

      await store.removeCustomSearchEngine(0)
      expect(store.settings.customSearchEngines).toHaveLength(0)
    })

    it('应该能够更新自定义搜索引擎', async () => {
      const store = useSettingsStore()

      const originalEngine = {
        name: 'DuckDuckGo',
        url: 'https://duckduckgo.com/?q={query}',
      }

      await store.addCustomSearchEngine(originalEngine)

      const updatedEngine = {
        name: 'Updated DuckDuckGo',
        url: 'https://duckduckgo.com/search?q={query}',
        icon: 'https://duckduckgo.com/favicon.ico',
      }

      // 由于没有 updateCustomSearchEngine 方法，我们先删除再添加
      await store.removeCustomSearchEngine(0)
      await store.addCustomSearchEngine(updatedEngine)

      expect(store.settings.customSearchEngines[0]).toEqual(updatedEngine)
    })
  })

  describe('数据持久化', () => {
    it('应该能够保存设置到存储', async () => {
      const store = useSettingsStore()

      await store.saveSettings()

      expect(window.chrome.storage.sync.set).toHaveBeenCalledWith({
        aiSiderNavSettings: expect.objectContaining(store.settings),
      })
    })

    it('应该能够从存储加载设置', async () => {
      const savedSettings = {
        searchEngine: 'bing',
        timeFormat: '12h',
        showSeconds: true,
        language: 'en-US',
      }

      window.chrome.storage.sync.get.mockResolvedValue({
        aiSiderNavSettings: savedSettings,
      })

      const store = useSettingsStore()
      await store.loadSettings()

      expect(store.settings.searchEngine).toBe('bing')
      expect(store.settings.timeFormat).toBe('12h')
      expect(store.settings.showSeconds).toBe(true)
      expect(store.settings.language).toBe('en-US')
    })

    it('应该在加载设置时显示加载状态', async () => {
      const store = useSettingsStore()

      // 模拟异步加载
      let resolvePromise: (value: any) => void
      const loadPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      window.chrome.storage.sync.get.mockReturnValue(loadPromise)

      const loadSettingsPromise = store.loadSettings()
      expect(store.isLoading).toBe(true)

      resolvePromise!({})
      await loadSettingsPromise

      expect(store.isLoading).toBe(false)
    })

    it('应该处理存储加载错误', async () => {
      const store = useSettingsStore()

      window.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'))

      await store.loadSettings()

      // 应该保持默认设置
      expect(store.settings.searchEngine).toBe('google')
      expect(store.isLoading).toBe(false)
    })

    it('应该在没有 chrome.storage 时使用 localStorage', async () => {
      const store = useSettingsStore()

      // 临时移除 chrome.storage
      const originalStorage = window.chrome.storage
      // @ts-ignore
      window.chrome.storage = undefined

      // localStorage 有数据
      const localStorageSettings = {
        searchEngine: 'baidu',
        timeFormat: '12h',
      }
      localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(localStorageSettings))

      await store.loadSettings()

      expect(store.settings.searchEngine).toBe('baidu')
      expect(store.settings.timeFormat).toBe('12h')

      // 恢复 chrome.storage
      window.chrome.storage = originalStorage
    })
  })

  describe('存储监听器', () => {
    it('应该能够设置存储变化监听器', () => {
      const store = useSettingsStore()

      store.setupStorageListener()

      // 验证监听器被添加（这里主要是确保不抛出错误）
      expect(() => store.setupStorageListener()).not.toThrow()
    })

    it('应该能够清理存储监听器', () => {
      const store = useSettingsStore()

      store.setupStorageListener()

      expect(() => store.cleanupStorageListener()).not.toThrow()
    })
  })

  describe('重置功能', () => {
    it('应该能够重置设置到默认值', async () => {
      const store = useSettingsStore()

      // 先修改一些设置
      await store.updateSetting('searchEngine', 'bing')
      await store.updateSetting('timeFormat', '12h')
      await store.updateSetting('showSeconds', true)

      // 重置设置
      await store.resetSettings()

      // 验证设置被重置为默认值
      expect(store.settings.searchEngine).toBe('google')
      expect(store.settings.timeFormat).toBe('24h')
      expect(store.settings.showSeconds).toBe(false)
    })

    it('应该在重置后保存到存储', async () => {
      const store = useSettingsStore()

      // 确保 mock 是干净的
      window.chrome.storage.sync.set.mockClear()

      await store.resetSettings()

      // 验证 saveSettings 被调用
      expect(window.chrome.storage.sync.set).toHaveBeenCalled()

      // 验证保存的数据包含重置后的设置
      const callArgs = window.chrome.storage.sync.set.mock.calls[0][0]
      expect(callArgs.aiSiderNavSettings).toMatchObject({
        searchEngine: 'google',
        timeFormat: '24h',
        showSeconds: false,
      })
    })
  })
})
