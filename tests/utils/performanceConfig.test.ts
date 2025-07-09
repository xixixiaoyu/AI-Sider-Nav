import { describe, it, expect, beforeEach } from 'vitest'
import {
  performanceConfig,
  defaultPerformanceConfig,
  developmentConfig,
  productionConfig,
  mobileConfig,
  updatePerformanceConfig,
} from '@/utils/performanceConfig'

describe('PerformanceConfig', () => {
  beforeEach(() => {
    performanceConfig.resetConfig()
  })

  describe('默认配置', () => {
    it('应该有正确的默认配置值', () => {
      expect(defaultPerformanceConfig.memory.maxHeapSize).toBe(200)
      expect(defaultPerformanceConfig.memory.warningThreshold).toBe(100)
      expect(defaultPerformanceConfig.memory.criticalThreshold).toBe(150)
      expect(defaultPerformanceConfig.memory.gcInterval).toBe(60000)

      expect(defaultPerformanceConfig.sessions.maxSessions).toBe(50)
      expect(defaultPerformanceConfig.sessions.maxMessagesPerSession).toBe(100)

      expect(defaultPerformanceConfig.network.maxConcurrentRequests).toBe(3)
      expect(defaultPerformanceConfig.network.requestTimeout).toBe(30000)

      expect(defaultPerformanceConfig.cache.maxCacheSize).toBe(50)
      expect(defaultPerformanceConfig.cache.cacheExpiry).toBe(3600000)

      expect(defaultPerformanceConfig.monitoring.enabled).toBe(true)
      expect(defaultPerformanceConfig.monitoring.interval).toBe(5000)
    })
  })

  describe('配置获取', () => {
    it('应该能够获取特定配置项', () => {
      const memoryConfig = performanceConfig.get('memory')
      // 在测试环境中会应用开发环境配置
      expect(memoryConfig.maxHeapSize).toBe(100) // 开发环境值
      expect(memoryConfig.warningThreshold).toBe(50) // 开发环境值

      const sessionsConfig = performanceConfig.get('sessions')
      expect(sessionsConfig.maxSessions).toBe(50)
      expect(sessionsConfig.maxMessagesPerSession).toBe(100)

      const networkConfig = performanceConfig.get('network')
      expect(networkConfig.maxConcurrentRequests).toBe(3)
      expect(networkConfig.requestTimeout).toBe(30000)

      const domConfig = performanceConfig.get('dom')
      expect(domConfig.maxDomNodes).toBe(10000)

      const cacheConfig = performanceConfig.get('cache')
      expect(cacheConfig.maxCacheSize).toBe(50)

      const monitoringConfig = performanceConfig.get('monitoring')
      expect(monitoringConfig.enabled).toBe(true)
      expect(monitoringConfig.interval).toBe(2000) // 开发环境值
    })

    it('应该能够获取完整配置', () => {
      const fullConfig = performanceConfig.getConfig()
      // 验证配置结构正确
      expect(fullConfig).toHaveProperty('memory')
      expect(fullConfig).toHaveProperty('sessions')
      expect(fullConfig).toHaveProperty('network')
      expect(fullConfig).toHaveProperty('dom')
      expect(fullConfig).toHaveProperty('cache')
      expect(fullConfig).toHaveProperty('monitoring')
    })
  })

  describe('配置更新', () => {
    it('应该能够更新部分配置', () => {
      const updates = {
        memory: {
          maxHeapSize: 300,
          warningThreshold: 150,
        },
        sessions: {
          maxSessions: 30,
        },
      }

      updatePerformanceConfig(updates)

      const memoryConfig = performanceConfig.get('memory')
      expect(memoryConfig.maxHeapSize).toBe(300)
      expect(memoryConfig.warningThreshold).toBe(150)
      // 其他值应该保持不变（使用当前配置的值，不是默认配置）
      expect(memoryConfig.criticalThreshold).toBe(80) // 开发环境的值
      expect(memoryConfig.gcInterval).toBe(30000) // 开发环境的值

      const sessionsConfig = performanceConfig.get('sessions')
      expect(sessionsConfig.maxSessions).toBe(30)
      // 其他值应该保持不变
      expect(sessionsConfig.maxMessagesPerSession).toBe(100)
    })

    it('应该能够重置配置到默认值', () => {
      // 先更新配置
      updatePerformanceConfig({
        memory: { maxHeapSize: 500 },
      })

      expect(performanceConfig.get('memory').maxHeapSize).toBe(500)

      // 重置配置
      performanceConfig.resetConfig()

      // 重置后会重新应用环境配置，所以是开发环境的值
      expect(performanceConfig.get('memory').maxHeapSize).toBe(100)
    })
  })

  describe('环境特定配置', () => {
    it('开发环境配置应该有正确的值', () => {
      expect(developmentConfig.monitoring?.enabled).toBe(true)
      expect(developmentConfig.monitoring?.interval).toBe(2000)
      expect(developmentConfig.monitoring?.longTaskThreshold).toBe(16)

      expect(developmentConfig.memory?.maxHeapSize).toBe(100)
      expect(developmentConfig.memory?.warningThreshold).toBe(50)
    })

    it('生产环境配置应该有正确的值', () => {
      expect(productionConfig.monitoring?.enabled).toBe(false)
      expect(productionConfig.monitoring?.interval).toBe(10000)

      expect(productionConfig.memory?.maxHeapSize).toBe(300)
      expect(productionConfig.memory?.warningThreshold).toBe(150)
    })

    it('移动设备配置应该有更严格的限制', () => {
      expect(mobileConfig.memory?.maxHeapSize).toBe(100)
      expect(mobileConfig.memory?.warningThreshold).toBe(50)

      expect(mobileConfig.sessions?.maxSessions).toBe(20)
      expect(mobileConfig.sessions?.maxMessagesPerSession).toBe(50)

      expect(mobileConfig.network?.maxConcurrentRequests).toBe(2)
      expect(mobileConfig.network?.requestTimeout).toBe(20000)

      expect(mobileConfig.dom?.maxDomNodes).toBe(5000)
      expect(mobileConfig.dom?.renderThrottle).toBe(33)
    })
  })

  describe('配置验证', () => {
    it('应该能够处理无效的配置键', () => {
      // @ts-ignore - 故意传入无效键进行测试
      const result = performanceConfig.get('invalid-key')
      expect(result).toBeUndefined()
    })

    it('应该能够处理空的更新对象', () => {
      const originalConfig = performanceConfig.getConfig()

      updatePerformanceConfig({})

      const newConfig = performanceConfig.getConfig()
      expect(newConfig).toEqual(originalConfig)
    })
  })

  describe('配置合并', () => {
    it('应该能够正确合并嵌套配置', () => {
      const originalMemoryConfig = performanceConfig.get('memory')

      updatePerformanceConfig({
        memory: {
          maxHeapSize: 400,
          // 只更新一个字段，其他字段应该保持不变
        },
      })

      const updatedMemoryConfig = performanceConfig.get('memory')

      expect(updatedMemoryConfig.maxHeapSize).toBe(400)
      expect(updatedMemoryConfig.warningThreshold).toBe(originalMemoryConfig.warningThreshold)
      expect(updatedMemoryConfig.criticalThreshold).toBe(originalMemoryConfig.criticalThreshold)
      expect(updatedMemoryConfig.gcInterval).toBe(originalMemoryConfig.gcInterval)
    })

    it('应该能够同时更新多个配置项', () => {
      updatePerformanceConfig({
        memory: {
          maxHeapSize: 250,
          warningThreshold: 125,
        },
        sessions: {
          maxSessions: 40,
          maxMessagesPerSession: 80,
        },
        monitoring: {
          enabled: false,
        },
      })

      const memoryConfig = performanceConfig.get('memory')
      const sessionsConfig = performanceConfig.get('sessions')
      const monitoringConfig = performanceConfig.get('monitoring')

      expect(memoryConfig.maxHeapSize).toBe(250)
      expect(memoryConfig.warningThreshold).toBe(125)
      expect(sessionsConfig.maxSessions).toBe(40)
      expect(sessionsConfig.maxMessagesPerSession).toBe(80)
      expect(monitoringConfig.enabled).toBe(false)
    })
  })
})
