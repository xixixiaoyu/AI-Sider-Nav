/**
 * 性能测试工具
 * 用于测试和验证性能优化效果
 */

import { memoryMonitor } from './memoryMonitor'
import { cacheManager } from './cacheManager'
import { resourceManager } from './resourceManager'

export interface TestResult {
  testName: string
  duration: number
  memoryBefore: number
  memoryAfter: number
  memoryDelta: number
  success: boolean
  error?: string
}

export interface PerformanceTestSuite {
  name: string
  tests: TestResult[]
  totalDuration: number
  passedTests: number
  failedTests: number
  averageMemoryDelta: number
}

class PerformanceTestRunner {
  private results: TestResult[] = []

  /**
   * 运行单个性能测试
   */
  async runTest(testName: string, testFn: () => Promise<void> | void): Promise<TestResult> {
    console.log(`🧪 开始测试: ${testName}`)

    const startTime = performance.now()
    const memoryBefore = this.getCurrentMemoryUsage()

    let success = true
    let error: string | undefined

    try {
      await testFn()
    } catch (e) {
      success = false
      error = e instanceof Error ? e.message : String(e)
      console.error(`❌ 测试失败: ${testName}`, e)
    }

    const endTime = performance.now()
    const memoryAfter = this.getCurrentMemoryUsage()

    const result: TestResult = {
      testName,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter - memoryBefore,
      success,
      error,
    }

    this.results.push(result)

    if (success) {
      console.log(`✅ 测试通过: ${testName} (${result.duration.toFixed(2)}ms)`)
    }

    return result
  }

  /**
   * 运行测试套件
   */
  async runTestSuite(
    suiteName: string,
    tests: Array<{ name: string; fn: () => Promise<void> | void }>
  ): Promise<PerformanceTestSuite> {
    console.log(`🚀 开始测试套件: ${suiteName}`)

    const suiteStartTime = performance.now()
    const suiteResults: TestResult[] = []

    for (const test of tests) {
      const result = await this.runTest(test.name, test.fn)
      suiteResults.push(result)

      // 在测试之间稍作延迟，让垃圾回收有机会运行
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const suiteEndTime = performance.now()
    const passedTests = suiteResults.filter((r) => r.success).length
    const failedTests = suiteResults.filter((r) => !r.success).length
    const averageMemoryDelta =
      suiteResults.reduce((sum, r) => sum + r.memoryDelta, 0) / suiteResults.length

    const suite: PerformanceTestSuite = {
      name: suiteName,
      tests: suiteResults,
      totalDuration: suiteEndTime - suiteStartTime,
      passedTests,
      failedTests,
      averageMemoryDelta,
    }

    console.log(`📊 测试套件完成: ${suiteName}`)
    console.log(`   通过: ${passedTests}, 失败: ${failedTests}`)
    console.log(`   总耗时: ${suite.totalDuration.toFixed(2)}ms`)
    console.log(`   平均内存变化: ${averageMemoryDelta.toFixed(2)}MB`)

    return suite
  }

  /**
   * 获取当前内存使用量（MB）
   */
  private getCurrentMemoryUsage(): number {
    const memory = memoryMonitor.getCurrentMemoryUsage()
    return memory ? memory.usedJSHeapSize / 1024 / 1024 : 0
  }

  /**
   * 清理测试结果
   */
  clearResults(): void {
    this.results = []
  }

  /**
   * 获取所有测试结果
   */
  getResults(): TestResult[] {
    return [...this.results]
  }
}

// 创建测试运行器实例
export const testRunner = new PerformanceTestRunner()

/**
 * 预定义的性能测试
 */
export const performanceTests = {
  /**
   * 内存管理测试
   */
  async memoryManagement() {
    await testRunner.runTestSuite('内存管理测试', [
      {
        name: '大量对象创建和销毁',
        fn: async () => {
          const objects: any[] = []

          // 创建大量对象
          for (let i = 0; i < 10000; i++) {
            objects.push({
              id: i,
              data: new Array(100).fill(Math.random()),
              timestamp: Date.now(),
            })
          }

          // 清理对象
          objects.length = 0

          // 等待垃圾回收
          await new Promise((resolve) => setTimeout(resolve, 100))
        },
      },

      {
        name: '缓存压力测试',
        fn: async () => {
          // 添加大量缓存项
          for (let i = 0; i < 1000; i++) {
            cacheManager.set(`test-key-${i}`, {
              data: new Array(100).fill(i),
              timestamp: Date.now(),
            })
          }

          // 读取缓存项
          for (let i = 0; i < 1000; i++) {
            cacheManager.get(`test-key-${i}`)
          }

          // 清理缓存
          cacheManager.clear()
        },
      },

      {
        name: '资源管理器压力测试',
        fn: async () => {
          const timerIds: number[] = []
          const listenerIds: string[] = []

          // 创建大量定时器
          for (let i = 0; i < 100; i++) {
            const timerId = resourceManager.setTimeout(() => {}, 1000)
            timerIds.push(timerId)
          }

          // 创建大量事件监听器
          for (let i = 0; i < 100; i++) {
            const listenerId = resourceManager.addEventListener(document, 'click', () => {})
            listenerIds.push(listenerId)
          }

          // 清理资源
          timerIds.forEach((id) => resourceManager.clearTimer(id))
          listenerIds.forEach((id) => resourceManager.removeEventListener(id))
        },
      },
    ])
  },

  /**
   * DOM 操作测试
   */
  async domOperations() {
    await testRunner.runTestSuite('DOM 操作测试', [
      {
        name: '大量 DOM 节点创建',
        fn: async () => {
          const container = document.createElement('div')
          container.style.display = 'none'
          document.body.appendChild(container)

          // 创建大量 DOM 节点
          for (let i = 0; i < 1000; i++) {
            const element = document.createElement('div')
            element.textContent = `Node ${i}`
            element.className = 'test-node'
            container.appendChild(element)
          }

          // 清理 DOM 节点
          document.body.removeChild(container)
        },
      },

      {
        name: 'DOM 查询性能',
        fn: async () => {
          // 执行大量 DOM 查询
          for (let i = 0; i < 1000; i++) {
            document.querySelectorAll('div')
            document.querySelectorAll('.test-class')
            document.getElementById('non-existent-id')
          }
        },
      },
    ])
  },

  /**
   * 异步操作测试
   */
  async asyncOperations() {
    await testRunner.runTestSuite('异步操作测试', [
      {
        name: '并发 Promise 处理',
        fn: async () => {
          const promises: Promise<any>[] = []

          // 创建大量并发 Promise
          for (let i = 0; i < 100; i++) {
            promises.push(
              new Promise((resolve) => {
                setTimeout(() => resolve(i), Math.random() * 10)
              })
            )
          }

          // 等待所有 Promise 完成
          await Promise.all(promises)
        },
      },

      {
        name: '模拟网络请求',
        fn: async () => {
          const requests: Promise<any>[] = []

          // 模拟多个网络请求
          for (let i = 0; i < 20; i++) {
            requests.push(
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    id: i,
                    data: new Array(1000).fill(Math.random()),
                  })
                }, Math.random() * 50)
              })
            )
          }

          await Promise.all(requests)
        },
      },
    ])
  },

  /**
   * 运行所有测试
   */
  async runAll() {
    console.log('🚀 开始运行所有性能测试')

    await this.memoryManagement()
    await this.domOperations()
    await this.asyncOperations()

    console.log('✅ 所有性能测试完成')

    // 生成测试报告
    const results = testRunner.getResults()
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passedTests: results.filter((r) => r.success).length,
      failedTests: results.filter((r) => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      averageMemoryDelta: results.reduce((sum, r) => sum + r.memoryDelta, 0) / results.length,
      results,
    }

    console.log('📊 测试报告:', report)
    return report
  },
}

// 在开发环境下提供全局访问
if (import.meta.env.DEV) {
  ;(window as any).performanceTests = performanceTests
  ;(window as any).testRunner = testRunner
}
