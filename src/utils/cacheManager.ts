/**
 * 缓存管理工具
 * 提供智能缓存管理，包括内存缓存、存储缓存和自动清理
 */

import { performanceConfig } from './performanceConfig'

export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  expiry: number
  size: number // 估算的字节大小
  accessCount: number
  lastAccessed: number
}

export interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  oldestEntry: number
  newestEntry: number
}

class CacheManager {
  // 缓存限制常量
  private readonly MAX_CACHE_ENTRIES = 5000
  private readonly MAX_CACHE_SIZE_MB = 50
  private readonly MAX_ENTRY_SIZE_MB = 5
  private readonly CLEANUP_INTERVAL = 30000 // 30秒
  private readonly AGGRESSIVE_CLEANUP_THRESHOLD = 0.8 // 80%使用率触发激进清理
  private readonly MEMORY_PRESSURE_THRESHOLD = 0.9 // 90%使用率触发内存压力处理

  private memoryCache = new Map<string, CacheEntry>()
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    compressions: 0,
    memoryPressureEvents: 0,
  }
  private cleanupTimer: number | null = null
  private lastCleanupTime = 0
  private compressionEnabled = true

  constructor() {
    this.startCleanupTimer()
    this.setupMemoryPressureHandling()
  }

  /**
   * 设置内存压力处理
   */
  private setupMemoryPressureHandling(): void {
    // 监听内存压力事件（如果支持）
    if ('memory' in performance && 'addEventListener' in performance) {
      try {
        ;(performance as any).addEventListener('memory', () => {
          this.handleMemoryPressure()
        })
      } catch (error) {
        // 忽略不支持的浏览器
      }
    }
  }

  /**
   * 处理内存压力
   */
  private handleMemoryPressure(): void {
    console.warn('🚨 检测到内存压力，执行紧急缓存清理')
    this.cacheStats.memoryPressureEvents++

    // 清理50%的缓存
    const targetSize = Math.floor(this.memoryCache.size / 2)
    this.evictLeastUsed(this.memoryCache.size - targetSize)

    // 强制垃圾回收（如果支持）
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        ;(window as any).gc()
      } catch (error) {
        // 忽略错误
      }
    }
  }

  /**
   * 检查缓存使用率
   */
  private getCacheUsageRatio(): number {
    const stats = this.getStats()
    const maxSizeBytes = this.MAX_CACHE_SIZE_MB * 1024 * 1024
    return stats.totalSize / maxSizeBytes
  }

  /**
   * 压缩缓存值
   */
  private compressValue(value: any): any {
    if (!this.compressionEnabled) return value

    try {
      // 对于大对象，尝试移除不必要的属性
      if (typeof value === 'object' && value !== null) {
        const compressed = this.removeUnnecessaryProperties(value)
        this.cacheStats.compressions++
        return compressed
      }
      return value
    } catch (error) {
      console.warn('缓存压缩失败:', error)
      return value
    }
  }

  /**
   * 移除不必要的属性
   */
  private removeUnnecessaryProperties(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeUnnecessaryProperties(item))
    }

    if (typeof obj === 'object' && obj !== null) {
      const compressed: any = {}
      for (const [key, value] of Object.entries(obj)) {
        // 跳过某些不必要的属性
        if (key.startsWith('_') || key === 'debug' || key === 'metadata') {
          continue
        }
        compressed[key] = this.removeUnnecessaryProperties(value)
      }
      return compressed
    }

    return obj
  }

  /**
   * 设置缓存项
   */
  set<T>(key: string, value: T, customExpiry?: number): void {
    const config = performanceConfig.get('cache')
    const now = Date.now()
    const expiry = customExpiry || config.cacheExpiry

    // 检查单个条目大小限制
    const originalSize = this.estimateSize(value)
    if (originalSize > this.MAX_ENTRY_SIZE_MB * 1024 * 1024) {
      console.warn(`缓存项过大 (${(originalSize / 1024 / 1024).toFixed(2)}MB)，跳过缓存: ${key}`)
      return
    }

    // 压缩值
    const compressedValue = this.compressValue(value)
    const size = this.estimateSize(compressedValue)

    // 检查是否需要清理空间
    this.ensureSpace(size)

    // 检查缓存使用率
    const usageRatio = this.getCacheUsageRatio()
    if (usageRatio > this.MEMORY_PRESSURE_THRESHOLD) {
      this.handleMemoryPressure()
    } else if (usageRatio > this.AGGRESSIVE_CLEANUP_THRESHOLD) {
      this.performAggressiveCleanup()
    }

    const entry: CacheEntry<T> = {
      key,
      value: compressedValue,
      timestamp: now,
      expiry: now + expiry,
      size,
      accessCount: 0,
      lastAccessed: now,
    }

    this.memoryCache.set(key, entry)
  }

  /**
   * 获取缓存项
   */
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)

    if (!entry) {
      this.cacheStats.misses++
      return null
    }

    // 检查是否过期
    if (Date.now() > entry.expiry) {
      this.memoryCache.delete(key)
      this.cacheStats.misses++
      return null
    }

    // 更新访问统计
    entry.accessCount++
    entry.lastAccessed = Date.now()
    this.cacheStats.hits++

    return entry.value as T
  }

  /**
   * 检查缓存项是否存在且未过期
   */
  has(key: string): boolean {
    const entry = this.memoryCache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiry) {
      this.memoryCache.delete(key)
      return false
    }

    return true
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    return this.memoryCache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.memoryCache.clear()
    this.cacheStats = { hits: 0, misses: 0, evictions: 0 }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const entries = Array.from(this.memoryCache.values())
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
    const timestamps = entries.map((entry) => entry.timestamp)

    return {
      totalEntries: entries.length,
      totalSize,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
      missRate: this.cacheStats.misses / (this.cacheStats.hits + this.cacheStats.misses) || 0,
      oldestEntry: Math.min(...timestamps) || 0,
      newestEntry: Math.max(...timestamps) || 0,
    }
  }

  /**
   * 估算对象大小（字节）
   */
  private estimateSize(value: any): number {
    if (value === null || value === undefined) return 0

    if (typeof value === 'string') {
      return value.length * 2 // Unicode 字符大约 2 字节
    }

    if (typeof value === 'number') {
      return 8 // 64位数字
    }

    if (typeof value === 'boolean') {
      return 4
    }

    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + this.estimateSize(item), 0)
    }

    if (typeof value === 'object') {
      return Object.keys(value).reduce((sum, key) => {
        return sum + this.estimateSize(key) + this.estimateSize(value[key])
      }, 0)
    }

    // 默认估算
    return JSON.stringify(value).length * 2
  }

  /**
   * 执行激进清理
   */
  private performAggressiveCleanup(): void {
    console.log('🧹 执行激进缓存清理')

    // 清理过期项
    this.cleanupExpired()

    // 如果仍然超过阈值，清理最少使用的项
    const usageRatio = this.getCacheUsageRatio()
    if (usageRatio > this.AGGRESSIVE_CLEANUP_THRESHOLD) {
      const targetReduction = Math.floor(this.memoryCache.size * 0.3) // 清理30%
      this.evictLeastUsed(targetReduction)
    }
  }

  /**
   * 智能清理策略
   */
  private smartCleanup(): void {
    const now = Date.now()
    // const stats = this.getStats()

    // 避免频繁清理
    if (now - this.lastCleanupTime < this.CLEANUP_INTERVAL / 2) {
      return
    }

    // 清理过期项
    this.cleanupExpired()

    // 检查是否需要进一步清理
    const usageRatio = this.getCacheUsageRatio()
    if (usageRatio > 0.7) {
      // 70%使用率
      // 清理长时间未访问的项
      this.cleanupStaleEntries()
    }

    this.lastCleanupTime = now
  }

  /**
   * 清理陈旧条目
   */
  private cleanupStaleEntries(): void {
    const now = Date.now()
    const staleThreshold = 10 * 60 * 1000 // 10分钟未访问
    const staleKeys: string[] = []

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.lastAccessed > staleThreshold && entry.accessCount < 3) {
        staleKeys.push(key)
      }
    }

    staleKeys.forEach((key) => this.memoryCache.delete(key))

    if (staleKeys.length > 0) {
      console.log(`🧹 清理了 ${staleKeys.length} 个陈旧缓存项`)
    }
  }

  /**
   * 确保有足够的缓存空间
   */
  private ensureSpace(requiredSize: number): void {
    const stats = this.getStats()

    // 检查条目数量限制
    if (stats.totalEntries >= this.MAX_CACHE_ENTRIES) {
      const excess = stats.totalEntries - this.MAX_CACHE_ENTRIES + 1
      this.evictLeastUsed(excess)
    }

    // 检查大小限制
    const maxSizeBytes = this.MAX_CACHE_SIZE_MB * 1024 * 1024
    if (stats.totalSize + requiredSize > maxSizeBytes) {
      const excessSize = stats.totalSize + requiredSize - maxSizeBytes
      this.evictBySize(excessSize)
    }
  }

  /**
   * 驱逐最少使用的缓存项
   */
  private evictLeastUsed(count: number): void {
    const entries = Array.from(this.memoryCache.entries()).sort(([, a], [, b]) => {
      // 按访问次数和最后访问时间排序
      if (a.accessCount !== b.accessCount) {
        return a.accessCount - b.accessCount
      }
      return a.lastAccessed - b.lastAccessed
    })

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const [key] = entries[i]
      this.memoryCache.delete(key)
      this.cacheStats.evictions++
    }
  }

  /**
   * 按大小驱逐缓存项
   */
  private evictBySize(targetSize: number): void {
    const entries = Array.from(this.memoryCache.entries()).sort(([, a], [, b]) => {
      // 按大小和访问频率排序
      const scoreA = a.size / (a.accessCount + 1)
      const scoreB = b.size / (b.accessCount + 1)
      return scoreB - scoreA
    })

    let freedSize = 0
    for (const [key, entry] of entries) {
      if (freedSize >= targetSize) break

      this.memoryCache.delete(key)
      freedSize += entry.size
      this.cacheStats.evictions++
    }
  }

  /**
   * 获取缓存健康状态
   */
  getCacheHealth(): {
    usageRatio: number
    entryCount: number
    totalSize: string
    hitRate: number
    compressionRate: number
    memoryPressureEvents: number
    status: 'healthy' | 'warning' | 'critical'
  } {
    const stats = this.getStats()
    const usageRatio = this.getCacheUsageRatio()
    const compressionRate = this.cacheStats.compressions / Math.max(1, stats.totalEntries)

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (usageRatio > this.MEMORY_PRESSURE_THRESHOLD) {
      status = 'critical'
    } else if (usageRatio > this.AGGRESSIVE_CLEANUP_THRESHOLD) {
      status = 'warning'
    }

    return {
      usageRatio,
      entryCount: stats.totalEntries,
      totalSize: `${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`,
      hitRate: stats.hitRate,
      compressionRate,
      memoryPressureEvents: this.cacheStats.memoryPressureEvents,
      status,
    }
  }

  /**
   * 强制清理缓存
   */
  forceCleanup(): void {
    console.log('🚨 强制清理缓存')

    // 清理过期项
    this.cleanupExpired()

    // 清理陈旧项
    this.cleanupStaleEntries()

    // 如果仍然过多，清理一半
    if (this.memoryCache.size > this.MAX_CACHE_ENTRIES / 2) {
      const targetSize = Math.floor(this.MAX_CACHE_ENTRIES / 2)
      this.evictLeastUsed(this.memoryCache.size - targetSize)
    }
  }

  /**
   * 清理过期的缓存项
   */
  private cleanupExpired(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiry) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach((key) => {
      this.memoryCache.delete(key)
    })

    if (expiredKeys.length > 0) {
      console.log(`🧹 清理了 ${expiredKeys.length} 个过期缓存项`)
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) return

    this.cleanupTimer = window.setInterval(() => {
      this.smartCleanup()
    }, this.CLEANUP_INTERVAL)
  }

  /**
   * 停止清理定时器
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * 获取缓存键列表
   */
  keys(): string[] {
    return Array.from(this.memoryCache.keys())
  }

  /**
   * 获取缓存值列表
   */
  values<T>(): T[] {
    return Array.from(this.memoryCache.values()).map((entry) => entry.value)
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    console.log('🧹 清理缓存管理器资源')
    this.stopCleanupTimer()
    this.clear()

    // 重置统计信息
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0,
      memoryPressureEvents: 0,
    }
    this.lastCleanupTime = 0
  }
}

// 创建全局缓存管理器实例
export const cacheManager = new CacheManager()

// 在页面卸载时清理缓存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cacheManager.cleanup()
  })
}
