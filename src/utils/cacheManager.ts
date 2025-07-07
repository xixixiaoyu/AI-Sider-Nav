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
  private memoryCache = new Map<string, CacheEntry>()
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  }
  private cleanupTimer: number | null = null

  constructor() {
    this.startCleanupTimer()
  }

  /**
   * 设置缓存项
   */
  set<T>(key: string, value: T, customExpiry?: number): void {
    const config = performanceConfig.get('cache')
    const now = Date.now()
    const expiry = customExpiry || config.cacheExpiry
    const size = this.estimateSize(value)

    // 检查是否需要清理空间
    this.ensureSpace(size)

    const entry: CacheEntry<T> = {
      key,
      value,
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
   * 确保有足够的缓存空间
   */
  private ensureSpace(requiredSize: number): void {
    const config = performanceConfig.get('cache')
    const stats = this.getStats()

    // 检查条目数量限制
    if (stats.totalEntries >= config.maxCacheEntries) {
      this.evictLeastUsed(1)
    }

    // 检查大小限制
    const maxSizeBytes = config.maxCacheSize * 1024 * 1024 // MB to bytes
    if (stats.totalSize + requiredSize > maxSizeBytes) {
      this.evictBySize(stats.totalSize + requiredSize - maxSizeBytes)
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
      this.cleanupExpired()
    }, 60000) // 每分钟清理一次
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
    this.stopCleanupTimer()
    this.clear()
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
