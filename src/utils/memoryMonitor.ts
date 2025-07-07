/**
 * 内存监控工具
 * 用于监控和管理应用的内存使用情况
 */

export interface MemoryMetrics {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: number
}

export interface PerformanceMetrics {
  memory: MemoryMetrics | null
  longTasks: number
  domNodes: number
  eventListeners: number
  timestamp: number
}

class MemoryMonitor {
  private metrics: MemoryMetrics[] = []
  private observers: PerformanceObserver[] = []
  private timers: Set<number> = new Set()
  private isMonitoring = false
  private maxMetricsHistory = 100
  private warningThreshold = 50 * 1024 * 1024 // 50MB
  private criticalThreshold = 100 * 1024 * 1024 // 100MB

  /**
   * 开始监控
   */
  startMonitoring(interval = 5000) {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('🔍 开始内存监控')

    // 定期收集内存指标
    const timerId = window.setInterval(() => {
      this.collectMetrics()
    }, interval)
    this.timers.add(timerId)

    // 监控长任务
    this.setupLongTaskObserver()

    // 监控内存泄露
    this.setupMemoryLeakDetection()
  }

  /**
   * 停止监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    console.log('⏹️ 停止内存监控')

    // 清理定时器
    this.timers.forEach((timerId) => {
      clearInterval(timerId)
    })
    this.timers.clear()

    // 清理观察者
    this.observers.forEach((observer) => {
      observer.disconnect()
    })
    this.observers = []
  }

  /**
   * 收集内存指标
   */
  private collectMetrics() {
    if (!('memory' in performance)) return

    const memory = (performance as any).memory
    const metrics: MemoryMetrics = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now(),
    }

    this.metrics.push(metrics)

    // 限制历史记录数量
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }

    // 检查内存使用情况
    this.checkMemoryUsage(metrics)
  }

  /**
   * 检查内存使用情况
   */
  private checkMemoryUsage(metrics: MemoryMetrics) {
    const usedMB = metrics.usedJSHeapSize / 1024 / 1024

    if (usedMB > this.criticalThreshold / 1024 / 1024) {
      console.error(`🚨 内存使用严重超标: ${usedMB.toFixed(2)}MB`)
      this.triggerGarbageCollection()
    } else if (usedMB > this.warningThreshold / 1024 / 1024) {
      console.warn(`⚠️ 内存使用较高: ${usedMB.toFixed(2)}MB`)
    }
  }

  /**
   * 设置长任务观察者
   */
  private setupLongTaskObserver() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`⏱️ 检测到长任务: ${entry.duration.toFixed(2)}ms`)
          }
        })
      })

      observer.observe({ entryTypes: ['longtask'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('无法设置长任务观察者:', error)
    }
  }

  /**
   * 设置内存泄露检测
   */
  private setupMemoryLeakDetection() {
    const timerId = window.setInterval(() => {
      this.detectMemoryLeaks()
    }, 30000) // 每30秒检查一次

    this.timers.add(timerId)
  }

  /**
   * 检测内存泄露
   */
  private detectMemoryLeaks() {
    if (this.metrics.length < 5) return

    const recent = this.metrics.slice(-5)
    const trend = this.calculateMemoryTrend(recent)

    if (trend > 0.1) {
      // 内存持续增长超过10%
      console.warn('🔍 检测到可能的内存泄露，内存持续增长')
      this.generateMemoryReport()
    }
  }

  /**
   * 计算内存趋势
   */
  private calculateMemoryTrend(metrics: MemoryMetrics[]): number {
    if (metrics.length < 2) return 0

    const first = metrics[0].usedJSHeapSize
    const last = metrics[metrics.length - 1].usedJSHeapSize

    return (last - first) / first
  }

  /**
   * 触发垃圾回收（如果可用）
   */
  private triggerGarbageCollection() {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      console.log('🗑️ 触发垃圾回收')
      ;(window as any).gc()
    }
  }

  /**
   * 生成内存报告
   */
  generateMemoryReport(): PerformanceMetrics {
    const memory = 'memory' in performance ? (performance as any).memory : null

    return {
      memory: memory
        ? {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            timestamp: Date.now(),
          }
        : null,
      longTasks: 0, // 这里可以添加长任务计数
      domNodes: document.querySelectorAll('*').length,
      eventListeners: this.estimateEventListeners(),
      timestamp: Date.now(),
    }
  }

  /**
   * 估算事件监听器数量
   */
  private estimateEventListeners(): number {
    // 这是一个简单的估算，实际实现可能需要更复杂的逻辑
    const elements = document.querySelectorAll('*')
    let count = 0

    elements.forEach((element) => {
      // 检查常见的事件属性
      const eventAttributes = ['onclick', 'onload', 'onchange', 'onsubmit']
      eventAttributes.forEach((attr) => {
        if (element.hasAttribute(attr)) {
          count++
        }
      })
    })

    return count
  }

  /**
   * 获取当前内存使用情况
   */
  getCurrentMemoryUsage(): MemoryMetrics | null {
    if (!('memory' in performance)) return null

    const memory = (performance as any).memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now(),
    }
  }

  /**
   * 获取内存历史记录
   */
  getMemoryHistory(): MemoryMetrics[] {
    return [...this.metrics]
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.stopMonitoring()
    this.metrics = []
  }
}

// 创建全局实例
export const memoryMonitor = new MemoryMonitor()

// 在开发环境下自动启动监控
if (import.meta.env.DEV) {
  memoryMonitor.startMonitoring()
}
