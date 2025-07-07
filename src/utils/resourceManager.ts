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
  private timers = new Map<number, TimerInfo>()
  private listeners = new Map<string, ListenerInfo>()
  private observers = new Set<any>()
  private cleanupFunctions = new Set<ResourceCleanup>()
  private isDestroyed = false

  /**
   * 创建安全的定时器
   */
  setTimeout(callback: Function, delay: number): number {
    if (this.isDestroyed) {
      console.warn('ResourceManager 已销毁，无法创建新的定时器')
      return -1
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
   * 清理所有资源
   */
  cleanup() {
    if (this.isDestroyed) return

    console.log('🧹 开始清理资源管理器')

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
      listenerInfo.target.removeEventListener(
        listenerInfo.type,
        listenerInfo.listener,
        listenerInfo.options
      )
    })
    this.listeners.clear()

    // 清理观察者
    this.observers.forEach((observer) => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect()
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
