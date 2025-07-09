import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cacheManager } from '@/utils/cacheManager'

describe('CacheManager', () => {
  beforeEach(() => {
    cacheManager.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('基本缓存操作', () => {
    it('应该能够设置和获取缓存项', () => {
      const key = 'test-key'
      const value = { data: 'test-value' }

      cacheManager.set(key, value)
      const result = cacheManager.get(key)

      expect(result).toEqual(value)
    })

    it('应该能够检查缓存项是否存在', () => {
      const key = 'test-key'
      const value = 'test-value'

      expect(cacheManager.has(key)).toBe(false)

      cacheManager.set(key, value)
      expect(cacheManager.has(key)).toBe(true)
    })

    it('应该能够删除缓存项', () => {
      const key = 'test-key'
      const value = 'test-value'

      cacheManager.set(key, value)
      expect(cacheManager.has(key)).toBe(true)

      const deleted = cacheManager.delete(key)
      expect(deleted).toBe(true)
      expect(cacheManager.has(key)).toBe(false)
    })

    it('应该能够清空所有缓存', () => {
      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', 'value2')
      cacheManager.set('key3', 'value3')

      const stats = cacheManager.getStats()
      expect(stats.totalEntries).toBe(3)

      cacheManager.clear()

      const newStats = cacheManager.getStats()
      expect(newStats.totalEntries).toBe(0)
    })
  })

  describe('缓存过期', () => {
    it('应该在过期时间后自动删除缓存项', () => {
      const key = 'test-key'
      const value = 'test-value'
      const expiry = 1000 // 1秒

      cacheManager.set(key, value, expiry)
      expect(cacheManager.has(key)).toBe(true)

      // 快进时间到过期后
      vi.advanceTimersByTime(expiry + 100)

      expect(cacheManager.has(key)).toBe(false)
      expect(cacheManager.get(key)).toBeNull()
    })

    it('应该能够使用自定义过期时间', () => {
      const key = 'test-key'
      const value = 'test-value'
      const customExpiry = 2000 // 2秒

      cacheManager.set(key, value, customExpiry)

      // 1秒后仍然存在
      vi.advanceTimersByTime(1000)
      expect(cacheManager.has(key)).toBe(true)

      // 2秒后过期
      vi.advanceTimersByTime(1100)
      expect(cacheManager.has(key)).toBe(false)
    })
  })

  describe('缓存统计', () => {
    it('应该正确计算缓存统计信息', () => {
      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', { data: 'complex-value' })

      const stats = cacheManager.getStats()

      expect(stats.totalEntries).toBe(2)
      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.oldestEntry).toBeTypeOf('number')
      expect(stats.newestEntry).toBeTypeOf('number')
    })

    it('应该正确计算命中率和未命中率', () => {
      const key = 'test-key'
      const value = 'test-value'

      cacheManager.set(key, value)

      // 命中
      cacheManager.get(key)
      cacheManager.get(key)

      // 未命中
      cacheManager.get('non-existent-key')

      const stats = cacheManager.getStats()

      expect(stats.hitRate).toBeCloseTo(2 / 3) // 2 hits out of 3 attempts
      expect(stats.missRate).toBeCloseTo(1 / 3) // 1 miss out of 3 attempts
    })
  })

  describe('缓存键管理', () => {
    it('应该能够获取所有缓存键', () => {
      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', 'value2')
      cacheManager.set('key3', 'value3')

      const keys = cacheManager.keys()

      expect(keys).toHaveLength(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
    })

    it('应该能够获取所有缓存值', () => {
      const value1 = 'value1'
      const value2 = { data: 'value2' }
      const value3 = [1, 2, 3]

      cacheManager.set('key1', value1)
      cacheManager.set('key2', value2)
      cacheManager.set('key3', value3)

      const values = cacheManager.values()

      expect(values).toHaveLength(3)
      expect(values).toContain(value1)
      expect(values).toContainEqual(value2)
      expect(values).toContainEqual(value3)
    })
  })

  describe('错误处理', () => {
    it('应该在获取不存在的键时返回 null', () => {
      const result = cacheManager.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('应该在删除不存在的键时返回 false', () => {
      const result = cacheManager.delete('non-existent-key')
      expect(result).toBe(false)
    })
  })

  describe('内存管理', () => {
    it('应该能够处理大量缓存项', () => {
      // 添加大量缓存项
      for (let i = 0; i < 100; i++) {
        cacheManager.set(`key-${i}`, `value-${i}`)
      }

      const stats = cacheManager.getStats()
      expect(stats.totalEntries).toBe(100)

      // 验证所有项都能正确获取
      for (let i = 0; i < 100; i++) {
        expect(cacheManager.get(`key-${i}`)).toBe(`value-${i}`)
      }
    })
  })
})
