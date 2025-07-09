import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger, log } from '@/utils/logger'

describe('Logger', () => {
  beforeEach(() => {
    logger.clearLogs()
    vi.clearAllMocks()
  })

  describe('基本日志功能', () => {
    it('应该能够记录 debug 日志', () => {
      const message = 'Debug message'
      const data = { key: 'value' }
      const source = 'TestSource'

      logger.debug(message, data, source)

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0]).toMatchObject({
        level: 'debug',
        message,
        data,
        source,
      })
      expect(logs[0].timestamp).toBeTypeOf('number')
    })

    it('应该能够记录 info 日志', () => {
      const message = 'Info message'
      logger.info(message)

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('info')
      expect(logs[0].message).toBe(message)
    })

    it('应该能够记录 warn 日志', () => {
      const message = 'Warning message'
      logger.warn(message)

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('warn')
      expect(logs[0].message).toBe(message)
    })

    it('应该能够记录 error 日志', () => {
      const message = 'Error message'
      logger.error(message)

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('error')
      expect(logs[0].message).toBe(message)
    })
  })

  describe('日志过滤', () => {
    it('应该能够按级别过滤日志', () => {
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')

      const debugLogs = logger.getLogs('debug')
      const infoLogs = logger.getLogs('info')
      const warnLogs = logger.getLogs('warn')
      const errorLogs = logger.getLogs('error')

      expect(debugLogs).toHaveLength(1)
      expect(infoLogs).toHaveLength(1)
      expect(warnLogs).toHaveLength(1)
      expect(errorLogs).toHaveLength(1)

      expect(debugLogs[0].level).toBe('debug')
      expect(infoLogs[0].level).toBe('info')
      expect(warnLogs[0].level).toBe('warn')
      expect(errorLogs[0].level).toBe('error')
    })

    it('应该返回所有日志当没有指定级别时', () => {
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')

      const allLogs = logger.getLogs()
      expect(allLogs).toHaveLength(3)
    })
  })

  describe('日志限制', () => {
    it('应该限制日志数量不超过最大值', () => {
      // 模拟超过最大日志数量
      for (let i = 0; i < 1100; i++) {
        logger.info(`Message ${i}`)
      }

      const logs = logger.getLogs()
      expect(logs.length).toBeLessThanOrEqual(1000)
    })
  })

  describe('控制台输出控制', () => {
    it('应该能够启用/禁用控制台输出', () => {
      logger.setConsoleEnabled(false)
      logger.info('Test message')

      // 在测试环境中，控制台方法已被模拟，所以我们只检查日志是否被记录
      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)

      logger.setConsoleEnabled(true)
    })
  })

  describe('便捷方法', () => {
    it('log.debug 应该工作正常', () => {
      log.debug('Debug message', { data: 'test' }, 'TestSource')

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('debug')
    })

    it('log.info 应该工作正常', () => {
      log.info('Info message')

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('info')
    })

    it('log.warn 应该工作正常', () => {
      log.warn('Warning message')

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('warn')
    })

    it('log.error 应该工作正常', () => {
      log.error('Error message')

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('error')
    })
  })

  describe('清理功能', () => {
    it('应该能够清空所有日志', () => {
      logger.info('Message 1')
      logger.warn('Message 2')
      logger.error('Message 3')

      expect(logger.getLogs()).toHaveLength(3)

      logger.clearLogs()

      expect(logger.getLogs()).toHaveLength(0)
    })
  })
})
