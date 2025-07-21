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
  private maxMetricsHistory = 50 // 减少历史记录数量
  private warningThreshold = 50 * 1024 * 1024 // 50MB
  private criticalThreshold = 100 * 1024 * 1024 // 100MB
  private emergencyThreshold = 150 * 1024 * 1024 // 150MB 紧急阈值
  private lastCleanupTime = 0
  private cleanupInterval = 60000 // 1分钟清理间隔

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

    // 更严格的历史记录管理
    if (this.metrics.length > this.maxMetricsHistory) {
      // 保留最近的记录，但也保留一些采样点用于趋势分析
      const recentCount = Math.floor(this.maxMetricsHistory * 0.7) // 70% 最近记录
      const sampleCount = this.maxMetricsHistory - recentCount // 30% 采样记录

      const recent = this.metrics.slice(-recentCount)
      const older = this.metrics.slice(0, -recentCount)

      // 从旧记录中采样
      const sampled = older.filter(
        (_, index) => index % Math.ceil(older.length / sampleCount) === 0
      )

      this.metrics = [...sampled, ...recent]
    }

    // 检查内存使用情况
    this.checkMemoryUsage(metrics)

    // 定期清理
    this.performPeriodicCleanup()
  }

  /**
   * 检查内存使用情况
   */
  private checkMemoryUsage(metrics: MemoryMetrics) {
    const usedMB = metrics.usedJSHeapSize / 1024 / 1024
    const totalMB = metrics.totalJSHeapSize / 1024 / 1024
    const limitMB = metrics.jsHeapSizeLimit / 1024 / 1024
    const usagePercent = (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100

    if (usedMB > this.emergencyThreshold / 1024 / 1024 || usagePercent > 80) {
      console.error(
        `🚨 内存使用紧急状态: ${usedMB.toFixed(2)}MB (${usagePercent.toFixed(1)}% of limit)`
      )
      this.emergencyCleanup()
    } else if (usedMB > this.criticalThreshold / 1024 / 1024 || usagePercent > 60) {
      console.error(
        `🚨 内存使用严重超标: ${usedMB.toFixed(2)}MB (${usagePercent.toFixed(1)}% of limit)`
      )
      this.triggerGarbageCollection()
      this.notifyMemoryPressure('critical', { usedMB, totalMB, limitMB, usagePercent })
    } else if (usedMB > this.warningThreshold / 1024 / 1024 || usagePercent > 40) {
      console.warn(`⚠️ 内存使用较高: ${usedMB.toFixed(2)}MB (${usagePercent.toFixed(1)}% of limit)`)
      this.notifyMemoryPressure('warning', { usedMB, totalMB, limitMB, usagePercent })
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
    } else {
      // 如果没有 gc 函数，尝试其他清理方法
      this.forceMemoryCleanup()
    }
  }

  /**
   * 强制内存清理
   */
  private forceMemoryCleanup() {
    console.log('🧹 执行强制内存清理')

    // 清理历史记录
    this.metrics = this.metrics.slice(-10) // 只保留最近 10 条

    // 清理可能的循环引用
    if (typeof window !== 'undefined') {
      // 清理全局变量中的大对象
      Object.keys(window).forEach((key) => {
        if (key.startsWith('temp_') || key.startsWith('cache_') || key.startsWith('_debug')) {
          try {
            delete (window as any)[key]
          } catch (e) {
            // 忽略删除失败
          }
        }
      })
    }

    // 触发浏览器的内存压力事件（如果支持）
    if ('memory' in navigator && 'pressure' in (navigator as any).memory) {
      try {
        ;(navigator as any).memory.pressure.addEventListener('change', () => {
          console.log('浏览器内存压力变化')
        })
      } catch (e) {
        // 忽略不支持的 API
      }
    }
  }

  /**
   * 紧急清理
   */
  private emergencyCleanup() {
    console.error('🚨 执行紧急内存清理')

    // 清理所有历史记录
    this.metrics = []

    // 强制清理
    this.forceMemoryCleanup()

    // 通知应用进行紧急清理
    this.notifyMemoryPressure('emergency', {
      action: 'emergency_cleanup',
      timestamp: Date.now(),
    })

    // 尝试垃圾回收
    this.triggerGarbageCollection()
  }

  /**
   * 定期清理
   */
  private performPeriodicCleanup() {
    const now = Date.now()
    if (now - this.lastCleanupTime < this.cleanupInterval) {
      return
    }

    this.lastCleanupTime = now

    // 清理过期的指标数据
    const cutoffTime = now - 30 * 60 * 1000 // 30分钟前
    this.metrics = this.metrics.filter((metric) => metric.timestamp > cutoffTime)

    console.log(`🧹 定期清理完成，保留 ${this.metrics.length} 条内存记录`)
  }

  /**
   * 通知内存压力
   */
  private notifyMemoryPressure(level: 'warning' | 'critical' | 'emergency', data: any) {
    // 发送自定义事件
    const event = new CustomEvent('memoryPressure', {
      detail: { level, data, timestamp: Date.now() },
    })
    window.dispatchEvent(event)

    // 如果在扩展环境中，通知背景脚本
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          type: 'MEMORY_PRESSURE',
          level,
          data,
        })
      } catch (e) {
        // 忽略发送失败
      }
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
   * 获取内存使用统计
   */
  getMemoryStats() {
    if (this.metrics.length === 0) return null

    const recent = this.metrics.slice(-10)
    const usedSizes = recent.map((m) => m.usedJSHeapSize)

    return {
      current: recent[recent.length - 1],
      average: usedSizes.reduce((a, b) => a + b, 0) / usedSizes.length,
      peak: Math.max(...usedSizes),
      trend: this.calculateMemoryTrend(recent),
      recordCount: this.metrics.length,
    }
  }

  /**
   * 检查内存健康状态
   */
  checkMemoryHealth(): 'healthy' | 'warning' | 'critical' | 'emergency' {
    const current = this.getCurrentMemoryUsage()
    if (!current) return 'healthy'

    const usedMB = current.usedJSHeapSize / 1024 / 1024
    const usagePercent = (current.usedJSHeapSize / current.jsHeapSizeLimit) * 100

    if (usedMB > this.emergencyThreshold / 1024 / 1024 || usagePercent > 80) {
      return 'emergency'
    } else if (usedMB > this.criticalThreshold / 1024 / 1024 || usagePercent > 60) {
      return 'critical'
    } else if (usedMB > this.warningThreshold / 1024 / 1024 || usagePercent > 40) {
      return 'warning'
    }

    return 'healthy'
  }

  /**
   * 清理资源
   */
  cleanup() {
    console.log('🧹 清理内存监控器资源')
    this.stopMonitoring()
    this.metrics = []
    this.lastCleanupTime = 0
  }
}

// 创建全局实例
export const memoryMonitor = new MemoryMonitor()

// 在开发环境下自动启动监控
if (import.meta.env.DEV) {
  memoryMonitor.startMonitoring()
}
