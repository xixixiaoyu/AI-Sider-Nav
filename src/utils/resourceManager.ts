/**
 * 资源管理工具
 * 用于统一管理定时器、事件监听器、观察者等资源
 */

export interface ResourceCleanup {
  (): void
}

export interface TimerInfo {
  id: number
  type: 'timeout' | 'interval'
  callback: Function
  delay: number
  createdAt: number
}

export interface ListenerInfo {
  target: EventTarget
  type: string
  listener: EventListener
  options?: boolean | AddEventListenerOptions
  createdAt: number
}

class ResourceManager {
  // 映射表大小限制
  private readonly MAX_TIMERS = 1000
  private readonly MAX_LISTENERS = 2000
  private readonly MAX_OBSERVERS = 500
  private readonly MAX_CLEANUP_FUNCTIONS = 200

  // 资源过期时间（30分钟）
  private readonly RESOURCE_EXPIRY_TIME = 30 * 60 * 1000

  // 清理间隔（5分钟）
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000

  private timers = new Map<number, TimerInfo>()
  private listeners = new Map<string, ListenerInfo>()
  private observers = new Set<any>()
  private cleanupFunctions = new Set<ResourceCleanup>()
  private isDestroyed = false
  private cleanupTimer: number | null = null
  private lastCleanupTime = 0

  constructor() {
    this.setupPeriodicCleanup()
  }

  /**
   * 设置定期清理
   */
  private setupPeriodicCleanup(): void {
    if (this.cleanupTimer) return

    this.cleanupTimer = window.setInterval(() => {
      this.performPeriodicCleanup()
    }, this.CLEANUP_INTERVAL)
  }

  /**
   * 执行定期清理
   */
  private performPeriodicCleanup(): void {
    const now = Date.now()

    // 避免频繁清理
    if (now - this.lastCleanupTime < this.CLEANUP_INTERVAL / 2) {
      return
    }

    this.cleanupExpiredResources()
    this.enforceResourceLimits()
    this.lastCleanupTime = now
  }

  /**
   * 清理过期资源
   */
  private cleanupExpiredResources(): void {
    const now = Date.now()
    let cleanedCount = 0

    // 清理过期的事件监听器
    for (const [id, listener] of this.listeners.entries()) {
      if (now - listener.createdAt > this.RESOURCE_EXPIRY_TIME) {
        this.removeEventListener(id)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期资源`)
    }
  }

  /**
   * 强制执行资源限制
   */
  private enforceResourceLimits(): void {
    // 限制定时器数量
    if (this.timers.size > this.MAX_TIMERS) {
      const excess = this.timers.size - this.MAX_TIMERS
      const oldestTimers = Array.from(this.timers.entries())
        .sort(([, a], [, b]) => a.createdAt - b.createdAt)
        .slice(0, excess)

      oldestTimers.forEach(([id]) => this.clearTimer(id))
      console.warn(`⚠️ 清理了 ${excess} 个最旧的定时器以控制内存使用`)
    }

    // 限制事件监听器数量
    if (this.listeners.size > this.MAX_LISTENERS) {
      const excess = this.listeners.size - this.MAX_LISTENERS
      const oldestListeners = Array.from(this.listeners.entries())
        .sort(([, a], [, b]) => a.createdAt - b.createdAt)
        .slice(0, excess)

      oldestListeners.forEach(([id]) => this.removeEventListener(id))
      console.warn(`⚠️ 清理了 ${excess} 个最旧的事件监听器以控制内存使用`)
    }

    // 限制观察者数量
    if (this.observers.size > this.MAX_OBSERVERS) {
      const excess = this.observers.size - this.MAX_OBSERVERS
      const observersArray = Array.from(this.observers)
      const toRemove = observersArray.slice(0, excess)

      toRemove.forEach((observer) => this.removeObserver(observer))
      console.warn(`⚠️ 清理了 ${excess} 个观察者以控制内存使用`)
    }

    // 限制清理函数数量
    if (this.cleanupFunctions.size > this.MAX_CLEANUP_FUNCTIONS) {
      const excess = this.cleanupFunctions.size - this.MAX_CLEANUP_FUNCTIONS
      const functionsArray = Array.from(this.cleanupFunctions)
      const toRemove = functionsArray.slice(0, excess)

      toRemove.forEach((fn) => this.cleanupFunctions.delete(fn))
      console.warn(`⚠️ 清理了 ${excess} 个清理函数以控制内存使用`)
    }
  }

  /**
   * 检查资源使用情况
   */
  checkResourceUsage(): {
    timers: { current: number; max: number; usage: number }
    listeners: { current: number; max: number; usage: number }
    observers: { current: number; max: number; usage: number }
    cleanupFunctions: { current: number; max: number; usage: number }
    memoryPressure: boolean
  } {
    const timersUsage = (this.timers.size / this.MAX_TIMERS) * 100
    const listenersUsage = (this.listeners.size / this.MAX_LISTENERS) * 100
    const observersUsage = (this.observers.size / this.MAX_OBSERVERS) * 100
    const cleanupUsage = (this.cleanupFunctions.size / this.MAX_CLEANUP_FUNCTIONS) * 100

    const memoryPressure =
      timersUsage > 80 || listenersUsage > 80 || observersUsage > 80 || cleanupUsage > 80

    return {
      timers: { current: this.timers.size, max: this.MAX_TIMERS, usage: timersUsage },
      listeners: { current: this.listeners.size, max: this.MAX_LISTENERS, usage: listenersUsage },
      observers: { current: this.observers.size, max: this.MAX_OBSERVERS, usage: observersUsage },
      cleanupFunctions: {
        current: this.cleanupFunctions.size,
        max: this.MAX_CLEANUP_FUNCTIONS,
        usage: cleanupUsage,
      },
      memoryPressure,
    }
  }

  /**
   * 创建安全的定时器
   */
  setTimeout(callback: Function, delay: number): number {
    if (this.isDestroyed) {
      console.warn('ResourceManager 已销毁，无法创建新的定时器')
      return -1
    }

    // 检查是否需要清理
    if (this.timers.size >= this.MAX_TIMERS) {
      this.enforceResourceLimits()
    }

    const timerId = window.setTimeout(() => {
      callback()
      this.timers.delete(timerId)
    }, delay)

    this.timers.set(timerId, {
      id: timerId,
      type: 'timeout',
      callback,
      delay,
      createdAt: Date.now(),
    })

    return timerId
  }

  /**
   * 创建安全的间隔定时器
   */
  setInterval(callback: Function, interval: number): number {
    if (this.isDestroyed) {
      console.warn('ResourceManager 已销毁，无法创建新的定时器')
      return -1
    }

    // 检查是否需要清理
    if (this.timers.size >= this.MAX_TIMERS) {
      this.enforceResourceLimits()
    }

    const timerId = window.setInterval(callback, interval)

    this.timers.set(timerId, {
      id: timerId,
      type: 'interval',
      callback,
      delay: interval,
      createdAt: Date.now(),
    })

    return timerId
  }

  /**
   * 清除定时器
   */
  clearTimer(timerId: number) {
    const timerInfo = this.timers.get(timerId)
    if (timerInfo) {
      if (timerInfo.type === 'timeout') {
        clearTimeout(timerId)
      } else {
        clearInterval(timerId)
      }
      this.timers.delete(timerId)
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): string {
    if (this.isDestroyed) {
      console.warn('ResourceManager 已销毁，无法添加新的事件监听器')
      return ''
    }

    // 检查是否需要清理
    if (this.listeners.size >= this.MAX_LISTENERS) {
      this.enforceResourceLimits()
    }

    const listenerId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    target.addEventListener(type, listener, options)

    this.listeners.set(listenerId, {
      target,
      type,
      listener,
      options,
      createdAt: Date.now(),
    })

    return listenerId
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(listenerId: string) {
    const listenerInfo = this.listeners.get(listenerId)
    if (listenerInfo) {
      listenerInfo.target.removeEventListener(
        listenerInfo.type,
        listenerInfo.listener,
        listenerInfo.options
      )
      this.listeners.delete(listenerId)
    }
  }

  /**
   * 添加观察者
   */
  addObserver(observer: any) {
    if (this.isDestroyed) {
      console.warn('ResourceManager 已销毁，无法添加新的观察者')
      return
    }

    // 检查是否需要清理
    if (this.observers.size >= this.MAX_OBSERVERS) {
      this.enforceResourceLimits()
    }

    this.observers.add(observer)
  }

  /**
   * 移除观察者
   */
  removeObserver(observer: any) {
    if (observer && typeof observer.disconnect === 'function') {
      observer.disconnect()
    }
    this.observers.delete(observer)
  }

  /**
   * 添加清理函数
   */
  addCleanup(cleanup: ResourceCleanup) {
    if (this.isDestroyed) {
      console.warn('ResourceManager 已销毁，无法添加新的清理函数')
      return
    }

    // 检查是否需要清理
    if (this.cleanupFunctions.size >= this.MAX_CLEANUP_FUNCTIONS) {
      this.enforceResourceLimits()
    }

    this.cleanupFunctions.add(cleanup)
  }

  /**
   * 移除清理函数
   */
  removeCleanup(cleanup: ResourceCleanup) {
    this.cleanupFunctions.delete(cleanup)
  }

  /**
   * 获取资源统计信息
   */
  getResourceStats() {
    return {
      timers: this.timers.size,
      listeners: this.listeners.size,
      observers: this.observers.size,
      cleanupFunctions: this.cleanupFunctions.size,
      isDestroyed: this.isDestroyed,
    }
  }

  /**
   * 获取详细的资源信息
   */
  getDetailedResourceInfo() {
    return {
      timers: Array.from(this.timers.values()),
      listeners: Array.from(this.listeners.values()),
      observers: Array.from(this.observers),
      cleanupFunctions: this.cleanupFunctions.size,
      isDestroyed: this.isDestroyed,
    }
  }

  /**
   * 检查长时间运行的资源
   */
  checkLongRunningResources(threshold = 300000) {
    // 5分钟
    const now = Date.now()
    const longRunningTimers = Array.from(this.timers.values()).filter(
      (timer) => now - timer.createdAt > threshold
    )
    const longRunningListeners = Array.from(this.listeners.values()).filter(
      (listener) => now - listener.createdAt > threshold
    )

    if (longRunningTimers.length > 0 || longRunningListeners.length > 0) {
      console.warn('检测到长时间运行的资源:', {
        timers: longRunningTimers,
        listeners: longRunningListeners,
      })
    }

    return {
      timers: longRunningTimers,
      listeners: longRunningListeners,
    }
  }

  /**
   * 强制清理所有资源
   */
  forceCleanup(): void {
    console.log('🚨 强制清理所有资源')
    this.cleanupExpiredResources()
    this.enforceResourceLimits()

    // 如果仍然有太多资源，进行更激进的清理
    const usage = this.checkResourceUsage()
    if (usage.memoryPressure) {
      console.warn('⚠️ 内存压力过大，执行激进清理')

      // 清理一半的资源
      const timersToRemove = Math.floor(this.timers.size / 2)
      const listenersToRemove = Math.floor(this.listeners.size / 2)

      Array.from(this.timers.keys())
        .slice(0, timersToRemove)
        .forEach((id) => this.clearTimer(id))
      Array.from(this.listeners.keys())
        .slice(0, listenersToRemove)
        .forEach((id) => this.removeEventListener(id))
    }
  }

  /**
   * 清理所有资源
   */
  cleanup() {
    if (this.isDestroyed) return

    console.log('🧹 开始清理资源管理器')

    // 停止定期清理
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    // 清理定时器
    this.timers.forEach((timerInfo, timerId) => {
      if (timerInfo.type === 'timeout') {
        clearTimeout(timerId)
      } else {
        clearInterval(timerId)
      }
    })
    this.timers.clear()

    // 清理事件监听器
    this.listeners.forEach((listenerInfo) => {
      try {
        listenerInfo.target.removeEventListener(
          listenerInfo.type,
          listenerInfo.listener,
          listenerInfo.options
        )
      } catch (error) {
        console.warn('移除事件监听器失败:', error)
      }
    })
    this.listeners.clear()

    // 清理观察者
    this.observers.forEach((observer) => {
      try {
        if (observer && typeof observer.disconnect === 'function') {
          observer.disconnect()
        }
      } catch (error) {
        console.warn('断开观察者失败:', error)
      }
    })
    this.observers.clear()

    // 执行清理函数
    this.cleanupFunctions.forEach((cleanup) => {
      try {
        cleanup()
      } catch (error) {
        console.error('清理函数执行失败:', error)
      }
    })
    this.cleanupFunctions.clear()

    this.isDestroyed = true
    console.log('✅ 资源管理器清理完成')
  }

  /**
   * 重置资源管理器
   */
  reset() {
    this.cleanup()
    this.isDestroyed = false
    this.lastCleanupTime = 0
    this.setupPeriodicCleanup()
  }
}

// 创建全局实例
export const resourceManager = new ResourceManager()

// 在页面卸载时自动清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    resourceManager.cleanup()
  })
}

// 在开发环境下定期检查长时间运行的资源
if (import.meta.env.DEV) {
  setInterval(() => {
    resourceManager.checkLongRunningResources()
  }, 60000) // 每分钟检查一次
}
