import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resourceManager } from '@/utils/resourceManager'

describe('ResourceManager', () => {
  beforeEach(() => {
    resourceManager.reset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('定时器管理', () => {
    it('应该能够创建和管理 setTimeout', () => {
      const callback = vi.fn()
      const delay = 1000

      const timerId = resourceManager.setTimeout(callback, delay)

      // 在测试环境中，定时器ID可能是对象或数字
      expect(timerId).toBeDefined()
      expect(callback).not.toHaveBeenCalled()

      // 快进时间
      vi.advanceTimersByTime(delay)

      expect(callback).toHaveBeenCalledOnce()
    })

    it('应该能够创建和管理 setInterval', () => {
      const callback = vi.fn()
      const interval = 1000

      const intervalId = resourceManager.setInterval(callback, interval)

      // 在测试环境中，定时器ID可能是对象或数字
      expect(intervalId).toBeDefined()
      expect(callback).not.toHaveBeenCalled()

      // 快进时间，应该调用多次
      vi.advanceTimersByTime(interval)
      expect(callback).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(interval)
      expect(callback).toHaveBeenCalledTimes(2)

      vi.advanceTimersByTime(interval)
      expect(callback).toHaveBeenCalledTimes(3)
    })

    it('应该能够清除定时器', () => {
      const callback = vi.fn()
      const delay = 1000

      const timerId = resourceManager.setTimeout(callback, delay)
      resourceManager.clearTimer(timerId)

      // 快进时间，回调不应该被调用
      vi.advanceTimersByTime(delay + 100)

      expect(callback).not.toHaveBeenCalled()
    })

    it('应该能够清除间隔定时器', () => {
      const callback = vi.fn()
      const interval = 1000

      const intervalId = resourceManager.setInterval(callback, interval)

      // 第一次调用
      vi.advanceTimersByTime(interval)
      expect(callback).toHaveBeenCalledTimes(1)

      // 清除间隔定时器
      resourceManager.clearTimer(intervalId)

      // 再次快进时间，不应该再次调用
      vi.advanceTimersByTime(interval)
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('事件监听器管理', () => {
    it('应该能够添加和移除事件监听器', () => {
      const target = document.createElement('div')
      const listener = vi.fn()
      const eventType = 'click'

      const listenerId = resourceManager.addEventListener(target, eventType, listener)

      expect(listenerId).toBeTypeOf('string')

      // 触发事件
      const event = new Event(eventType)
      target.dispatchEvent(event)

      expect(listener).toHaveBeenCalledOnce()

      // 移除监听器
      resourceManager.removeEventListener(listenerId)

      // 再次触发事件，不应该被调用
      target.dispatchEvent(event)

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('应该能够处理多个事件监听器', () => {
      const target = document.createElement('div')
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      const listenerId1 = resourceManager.addEventListener(target, 'click', listener1)
      const listenerId2 = resourceManager.addEventListener(target, 'mouseover', listener2)

      // 触发不同事件
      target.dispatchEvent(new Event('click'))
      target.dispatchEvent(new Event('mouseover'))

      expect(listener1).toHaveBeenCalledOnce()
      expect(listener2).toHaveBeenCalledOnce()

      // 移除一个监听器
      resourceManager.removeEventListener(listenerId1)

      // 再次触发事件
      target.dispatchEvent(new Event('click'))
      target.dispatchEvent(new Event('mouseover'))

      expect(listener1).toHaveBeenCalledTimes(1) // 没有增加
      expect(listener2).toHaveBeenCalledTimes(2) // 增加了

      // 移除第二个监听器
      resourceManager.removeEventListener(listenerId2)

      // 再次触发事件，两个监听器都不应该被调用
      target.dispatchEvent(new Event('click'))
      target.dispatchEvent(new Event('mouseover'))

      expect(listener1).toHaveBeenCalledTimes(1) // 仍然没有增加
      expect(listener2).toHaveBeenCalledTimes(2) // 仍然没有增加
    })
  })

  describe('观察者管理', () => {
    it('应该能够添加和移除观察者', () => {
      const observer = {
        disconnect: vi.fn(),
      }

      resourceManager.addObserver(observer)
      resourceManager.removeObserver(observer)

      expect(observer.disconnect).toHaveBeenCalledOnce()
    })

    it('应该能够处理没有 disconnect 方法的观察者', () => {
      const observer = {}

      // 不应该抛出错误
      expect(() => {
        resourceManager.addObserver(observer)
        resourceManager.removeObserver(observer)
      }).not.toThrow()
    })
  })

  describe('清理函数管理', () => {
    it('应该能够添加和执行清理函数', () => {
      const cleanup1 = vi.fn()
      const cleanup2 = vi.fn()

      resourceManager.addCleanup(cleanup1)
      resourceManager.addCleanup(cleanup2)

      resourceManager.cleanup()

      expect(cleanup1).toHaveBeenCalledOnce()
      expect(cleanup2).toHaveBeenCalledOnce()
    })

    it('应该能够移除清理函数', () => {
      const cleanup = vi.fn()

      resourceManager.addCleanup(cleanup)
      resourceManager.removeCleanup(cleanup)

      resourceManager.cleanup()

      expect(cleanup).not.toHaveBeenCalled()
    })
  })

  describe('资源统计', () => {
    it('应该能够获取资源统计信息', () => {
      const callback = vi.fn()
      const target = document.createElement('div')
      const listener = vi.fn()
      const observer = { disconnect: vi.fn() }
      const cleanup = vi.fn()

      resourceManager.setTimeout(callback, 1000)
      resourceManager.setInterval(callback, 1000)
      resourceManager.addEventListener(target, 'click', listener)
      resourceManager.addObserver(observer)
      resourceManager.addCleanup(cleanup)

      const stats = resourceManager.getResourceStats()

      expect(stats.timers).toBe(2)
      expect(stats.listeners).toBe(1)
      expect(stats.observers).toBe(1)
      expect(stats.cleanupFunctions).toBe(1)
    })
  })

  describe('长时间运行资源检测', () => {
    it('应该能够检测长时间运行的资源', () => {
      const callback = vi.fn()

      // 创建一个定时器
      resourceManager.setTimeout(callback, 1000)

      // 快进时间，使资源变成长时间运行
      vi.advanceTimersByTime(60000 + 1000) // 超过1分钟

      // 检查长时间运行的资源（这个方法主要用于日志记录）
      expect(() => {
        resourceManager.checkLongRunningResources()
      }).not.toThrow()
    })
  })

  describe('销毁状态管理', () => {
    it('销毁后不应该能够创建新资源', () => {
      resourceManager.cleanup()

      const callback = vi.fn()
      const timerId = resourceManager.setTimeout(callback, 1000)

      expect(timerId).toBe(-1)
    })

    it('应该能够重置资源管理器', () => {
      const callback = vi.fn()

      // 创建资源
      resourceManager.setTimeout(callback, 1000)

      // 重置
      resourceManager.reset()

      // 应该能够再次创建资源
      const timerId = resourceManager.setTimeout(callback, 1000)
      expect(timerId).toBeDefined()
    })
  })

  describe('全面清理', () => {
    it('应该能够清理所有类型的资源', () => {
      const callback = vi.fn()
      const target = document.createElement('div')
      const listener = vi.fn()
      const observer = { disconnect: vi.fn() }
      const cleanup = vi.fn()

      // 创建各种资源
      resourceManager.setTimeout(callback, 1000)
      resourceManager.setInterval(callback, 1000)
      resourceManager.addEventListener(target, 'click', listener)
      resourceManager.addObserver(observer)
      resourceManager.addCleanup(cleanup)

      // 清理所有资源
      resourceManager.cleanup()

      // 验证清理函数被调用
      expect(cleanup).toHaveBeenCalledOnce()
      expect(observer.disconnect).toHaveBeenCalledOnce()

      // 验证统计信息被重置
      const stats = resourceManager.getResourceStats()
      expect(stats.timers).toBe(0)
      expect(stats.listeners).toBe(0)
      expect(stats.observers).toBe(0)
      expect(stats.cleanupFunctions).toBe(0)
    })
  })
})
