/**
 * 性能优化配置
 * 统一管理应用的性能相关配置
 */

export interface PerformanceConfig {
  // 内存管理
  memory: {
    maxHeapSize: number // MB
    warningThreshold: number // MB
    criticalThreshold: number // MB
    gcInterval: number // ms
  }

  // 会话管理
  sessions: {
    maxSessions: number
    maxMessagesPerSession: number
    autoCleanupThreshold: number
    messageCleanupThreshold: number
  }

  // 网络请求
  network: {
    maxConcurrentRequests: number
    requestTimeout: number // ms
    retryAttempts: number
    retryDelay: number // ms
  }

  // DOM 操作
  dom: {
    maxDomNodes: number
    observerThrottle: number // ms
    renderThrottle: number // ms
  }

  // 缓存策略
  cache: {
    maxCacheSize: number // MB
    cacheExpiry: number // ms
    maxCacheEntries: number
  }

  // 监控配置
  monitoring: {
    enabled: boolean
    interval: number // ms
    longTaskThreshold: number // ms
    memoryCheckInterval: number // ms
  }
}

// 默认配置
export const defaultPerformanceConfig: PerformanceConfig = {
  memory: {
    maxHeapSize: 200, // 200MB
    warningThreshold: 100, // 100MB
    criticalThreshold: 150, // 150MB
    gcInterval: 60000, // 1分钟
  },

  sessions: {
    maxSessions: 50,
    maxMessagesPerSession: 100,
    autoCleanupThreshold: 60,
    messageCleanupThreshold: 120,
  },

  network: {
    maxConcurrentRequests: 3,
    requestTimeout: 30000, // 30秒
    retryAttempts: 3,
    retryDelay: 1000, // 1秒
  },

  dom: {
    maxDomNodes: 10000,
    observerThrottle: 100, // 100ms
    renderThrottle: 16, // ~60fps
  },

  cache: {
    maxCacheSize: 50, // 50MB
    cacheExpiry: 3600000, // 1小时
    maxCacheEntries: 1000,
  },

  monitoring: {
    enabled: true,
    interval: 5000, // 5秒
    longTaskThreshold: 50, // 50ms
    memoryCheckInterval: 30000, // 30秒
  },
}

// 开发环境配置
export const developmentConfig: Partial<PerformanceConfig> = {
  monitoring: {
    enabled: true,
    interval: 2000, // 更频繁的监控
    longTaskThreshold: 16, // 更严格的长任务检测
    memoryCheckInterval: 10000, // 更频繁的内存检查
  },

  memory: {
    maxHeapSize: 100, // 更低的内存限制
    warningThreshold: 50,
    criticalThreshold: 80,
    gcInterval: 30000, // 更频繁的GC
  },
}

// 生产环境配置
export const productionConfig: Partial<PerformanceConfig> = {
  monitoring: {
    enabled: false, // 生产环境关闭详细监控
    interval: 10000,
    longTaskThreshold: 100,
    memoryCheckInterval: 60000,
  },

  memory: {
    maxHeapSize: 300, // 更高的内存限制
    warningThreshold: 150,
    criticalThreshold: 250,
    gcInterval: 120000, // 较少的GC频率
  },
}

// 移动设备配置
export const mobileConfig: Partial<PerformanceConfig> = {
  memory: {
    maxHeapSize: 100, // 移动设备内存限制更严格
    warningThreshold: 50,
    criticalThreshold: 80,
    gcInterval: 30000,
  },

  sessions: {
    maxSessions: 20, // 减少会话数量
    maxMessagesPerSession: 50,
    autoCleanupThreshold: 25,
    messageCleanupThreshold: 60,
  },

  network: {
    maxConcurrentRequests: 2, // 减少并发请求
    requestTimeout: 20000,
    retryAttempts: 2,
    retryDelay: 2000,
  },

  dom: {
    maxDomNodes: 5000, // 减少DOM节点限制
    observerThrottle: 200,
    renderThrottle: 33, // ~30fps
  },
}

class PerformanceConfigManager {
  private config: PerformanceConfig

  constructor() {
    this.config = { ...defaultPerformanceConfig }
    this.applyEnvironmentConfig()
  }

  /**
   * 应用环境特定配置
   */
  private applyEnvironmentConfig() {
    if (import.meta.env.DEV) {
      this.mergeConfig(developmentConfig)
    } else {
      this.mergeConfig(productionConfig)
    }

    // 检测移动设备
    if (this.isMobileDevice()) {
      this.mergeConfig(mobileConfig)
    }
  }

  /**
   * 检测是否为移动设备
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }

  /**
   * 合并配置
   */
  private mergeConfig(partialConfig: Partial<PerformanceConfig>) {
    this.config = {
      ...this.config,
      ...partialConfig,
      memory: { ...this.config.memory, ...partialConfig.memory },
      sessions: { ...this.config.sessions, ...partialConfig.sessions },
      network: { ...this.config.network, ...partialConfig.network },
      dom: { ...this.config.dom, ...partialConfig.dom },
      cache: { ...this.config.cache, ...partialConfig.cache },
      monitoring: { ...this.config.monitoring, ...partialConfig.monitoring },
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): PerformanceConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(partialConfig: Partial<PerformanceConfig>) {
    this.mergeConfig(partialConfig)
  }

  /**
   * 重置为默认配置
   */
  resetConfig() {
    this.config = { ...defaultPerformanceConfig }
    this.applyEnvironmentConfig()
  }

  /**
   * 获取特定配置项
   */
  get<K extends keyof PerformanceConfig>(key: K): PerformanceConfig[K] {
    return this.config[key]
  }

  /**
   * 设置特定配置项
   */
  set<K extends keyof PerformanceConfig>(key: K, value: PerformanceConfig[K]) {
    this.config[key] = value
  }
}

// 创建全局配置管理器实例
export const performanceConfig = new PerformanceConfigManager()

// 导出便捷访问函数
export const getPerformanceConfig = () => performanceConfig.getConfig()
export const updatePerformanceConfig = (config: Partial<PerformanceConfig>) =>
  performanceConfig.updateConfig(config)
