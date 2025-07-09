import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getApiKey,
  setApiKey,
  getAIModel,
  setAIModel,
  validateApiKey,
  getConfigSummary,
} from '@/services/configService'

// 模拟 fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // 清理 localStorage
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

    // 清除环境变量
    vi.unstubAllEnvs()
  })

  describe('API Key 管理', () => {
    it('应该能够从环境变量获取 API Key', async () => {
      // 设置环境变量
      vi.stubEnv('VITE_DEEPSEEK_API_KEY', 'test-api-key')

      const apiKey = await getApiKey()
      expect(apiKey).toBe('test-api-key')
    })

    it('应该能够从 chrome.storage 获取 API Key', async () => {
      // 清除环境变量影响
      vi.stubEnv('VITE_DEEPSEEK_API_KEY', '')

      const testApiKey = 'chrome-storage-api-key'
      window.chrome.storage.sync.get.mockResolvedValue({
        deepseek_api_key: testApiKey,
      })

      const apiKey = await getApiKey()
      expect(apiKey).toBe(testApiKey)
      expect(window.chrome.storage.sync.get).toHaveBeenCalledWith('deepseek_api_key')
    })

    it('应该能够从 localStorage 获取 API Key 作为回退', async () => {
      // 清除环境变量影响
      vi.stubEnv('VITE_DEEPSEEK_API_KEY', '')

      // chrome.storage 返回空结果
      window.chrome.storage.sync.get.mockResolvedValue({})

      const testApiKey = 'localStorage-api-key'
      // 模拟 localStorage.getItem 返回值
      localStorage.getItem = vi.fn().mockReturnValue(testApiKey)

      const apiKey = await getApiKey()
      expect(apiKey).toBe(testApiKey)
    })

    it('应该能够设置 API Key 到 chrome.storage 和 localStorage', async () => {
      const testApiKey = 'new-api-key'
      const setItemSpy = vi.fn()
      localStorage.setItem = setItemSpy

      await setApiKey(testApiKey)

      expect(window.chrome.storage.sync.set).toHaveBeenCalledWith({
        deepseek_api_key: testApiKey,
      })
      expect(setItemSpy).toHaveBeenCalledWith('deepseek_api_key', testApiKey)
    })

    it('应该能够删除 API Key', async () => {
      const removeItemSpy = vi.fn()
      localStorage.removeItem = removeItemSpy

      await setApiKey('')

      expect(window.chrome.storage.sync.remove).toHaveBeenCalledWith('deepseek_api_key')
      expect(removeItemSpy).toHaveBeenCalledWith('deepseek_api_key')
    })

    it('应该处理 chrome.storage 错误并回退到 localStorage', async () => {
      const testApiKey = 'fallback-api-key'
      const setItemSpy = vi.fn()
      localStorage.setItem = setItemSpy

      // 模拟 chrome.storage 错误
      window.chrome.storage.sync.set.mockRejectedValue(new Error('Chrome storage error'))

      await setApiKey(testApiKey)

      // 应该仍然保存到 localStorage
      expect(setItemSpy).toHaveBeenCalledWith('deepseek_api_key', testApiKey)
    })

    it('应该去除 API Key 的首尾空格', async () => {
      const testApiKey = '  trimmed-api-key  '

      await setApiKey(testApiKey)

      expect(window.chrome.storage.sync.set).toHaveBeenCalledWith({
        deepseek_api_key: 'trimmed-api-key',
      })
    })
  })

  describe('AI 模型管理', () => {
    it('应该能够获取默认 AI 模型', async () => {
      const model = await getAIModel()
      expect(model).toBe('deepseek-chat')
    })

    it('应该能够从 chrome.storage 获取自定义 AI 模型', async () => {
      const customModel = 'custom-model'
      window.chrome.storage.sync.get.mockResolvedValue({
        deepseek_model: customModel,
      })

      const model = await getAIModel()
      expect(model).toBe(customModel)
    })

    it('应该能够设置 AI 模型', async () => {
      const newModel = 'new-ai-model'
      const setItemSpy = vi.fn()
      localStorage.setItem = setItemSpy

      await setAIModel(newModel)

      expect(window.chrome.storage.sync.set).toHaveBeenCalledWith({
        deepseek_model: newModel,
      })
      expect(setItemSpy).toHaveBeenCalledWith('deepseek_model', newModel)
    })

    it('应该能够重置 AI 模型到默认值', async () => {
      const setItemSpy = vi.fn()
      localStorage.setItem = setItemSpy

      // 根据实际实现，setAIModel('') 会设置空字符串而不是删除
      await setAIModel('')

      expect(window.chrome.storage.sync.set).toHaveBeenCalledWith({
        deepseek_model: '',
      })
      expect(setItemSpy).toHaveBeenCalledWith('deepseek_model', '')
    })
  })

  describe('API Key 验证', () => {
    it('应该验证有效的 API Key', async () => {
      const validApiKey = 'valid-api-key'

      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
      })

      const isValid = await validateApiKey(validApiKey)

      expect(isValid).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validApiKey}`,
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('应该拒绝无效的 API Key', async () => {
      const invalidApiKey = 'invalid-api-key'

      mockFetch.mockResolvedValue({
        status: 401,
        ok: false,
      })

      const isValid = await validateApiKey(invalidApiKey)

      expect(isValid).toBe(false)
    })

    it('应该处理网络错误', async () => {
      const apiKey = 'test-api-key'

      mockFetch.mockRejectedValue(new Error('Network error'))

      const isValid = await validateApiKey(apiKey)

      expect(isValid).toBe(false)
    })

    it('应该在没有 API Key 时返回 false', async () => {
      const isValid = await validateApiKey()

      expect(isValid).toBe(false)
    })

    it('应该在空 API Key 时返回 false', async () => {
      const isValid = await validateApiKey('')

      expect(isValid).toBe(false)
    })
  })

  describe('配置摘要', () => {
    it('应该返回配置摘要', async () => {
      // 清理之前的 mock 状态
      window.chrome.storage.sync.get.mockResolvedValue({})

      // 设置测试数据
      vi.stubEnv('VITE_DEEPSEEK_API_KEY', 'test-api-key')

      const summary = await getConfigSummary()

      expect(summary).toMatchObject({
        hasApiKey: true,
        model: 'deepseek-chat',
        timestamp: expect.any(Number),
      })
    })

    it('应该正确反映没有 API Key 的状态', async () => {
      // 清除所有 API Key 来源
      vi.stubEnv('VITE_DEEPSEEK_API_KEY', '')
      window.chrome.storage.sync.get.mockResolvedValue({})
      localStorage.getItem = vi.fn().mockReturnValue(null)

      const summary = await getConfigSummary()

      expect(summary.hasApiKey).toBe(false)
    })

    it('应该包含当前时间戳', async () => {
      const beforeTime = Date.now()
      const summary = await getConfigSummary()
      const afterTime = Date.now()

      expect(summary.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(summary.timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('错误处理', () => {
    it('应该处理 getApiKey 中的错误', async () => {
      // 模拟所有存储方法都失败
      vi.stubEnv('VITE_DEEPSEEK_API_KEY', '')
      window.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'))

      // 模拟 localStorage 错误
      const originalGetItem = localStorage.getItem
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const apiKey = await getApiKey()
      expect(apiKey).toBeNull()

      // 恢复 localStorage
      localStorage.getItem = originalGetItem
    })

    it('应该处理 setApiKey 中的错误', async () => {
      // 模拟所有存储方法都失败
      window.chrome.storage.sync.set.mockRejectedValue(new Error('Chrome storage error'))

      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // 不应该抛出错误
      await expect(setApiKey('test-key')).resolves.toBeUndefined()

      // 恢复 localStorage
      localStorage.setItem = originalSetItem
    })
  })
})
