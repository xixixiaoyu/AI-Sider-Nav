import { vi } from 'vitest'

// 模拟浏览器 API
Object.defineProperty(window, 'chrome', {
  value: {
    storage: {
      sync: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      },
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    runtime: {
      sendMessage: vi.fn().mockResolvedValue({}),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    tabs: {
      query: vi.fn().mockResolvedValue([]),
      sendMessage: vi.fn().mockResolvedValue({}),
    },
  },
  writable: true,
})

// 模拟 localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// 模拟 performance API
Object.defineProperty(window, 'performance', {
  value: {
    memory: {
      usedJSHeapSize: 1024 * 1024 * 10, // 10MB
      totalJSHeapSize: 1024 * 1024 * 50, // 50MB
      jsHeapSizeLimit: 1024 * 1024 * 100, // 100MB
    },
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
  },
  writable: true,
})

// 模拟 PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}))

// 模拟 fetch
global.fetch = vi.fn()

// 模拟 AbortController
global.AbortController = vi.fn().mockImplementation(() => ({
  signal: { aborted: false },
  abort: vi.fn(),
}))

// 模拟 console 方法（避免测试时输出过多日志）
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'debug').mockImplementation(() => {})
vi.spyOn(console, 'info').mockImplementation(() => {})

// 模拟定时器
vi.useFakeTimers()

// 每个测试后清理
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})
