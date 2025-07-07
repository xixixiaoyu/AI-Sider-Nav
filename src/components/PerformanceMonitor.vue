<template>
  <div v-if="showMonitor && isDev" class="performance-monitor">
    <div class="monitor-header">
      <h3>性能监控</h3>
      <button @click="toggleExpanded" class="toggle-btn">
        {{ isExpanded ? '收起' : '展开' }}
      </button>
      <button @click="closeMonitor" class="close-btn">×</button>
    </div>

    <div v-if="isExpanded" class="monitor-content">
      <!-- 内存使用情况 -->
      <div class="metric-section">
        <h4>内存使用</h4>
        <div class="metric-item">
          <span>已用内存:</span>
          <span :class="getMemoryClass(memoryMetrics.usedMB)">
            {{ memoryMetrics.usedMB.toFixed(2) }} MB
          </span>
        </div>
        <div class="metric-item">
          <span>总内存:</span>
          <span>{{ memoryMetrics.totalMB.toFixed(2) }} MB</span>
        </div>
        <div class="metric-item">
          <span>内存限制:</span>
          <span>{{ memoryMetrics.limitMB.toFixed(2) }} MB</span>
        </div>
        <div class="memory-bar">
          <div
            class="memory-usage"
            :style="{ width: memoryUsagePercent + '%' }"
            :class="getMemoryClass(memoryMetrics.usedMB)"
          ></div>
        </div>
      </div>

      <!-- 缓存统计 -->
      <div class="metric-section">
        <h4>缓存统计</h4>
        <div class="metric-item">
          <span>缓存条目:</span>
          <span>{{ cacheStats.totalEntries }}</span>
        </div>
        <div class="metric-item">
          <span>缓存大小:</span>
          <span>{{ (cacheStats.totalSize / 1024 / 1024).toFixed(2) }} MB</span>
        </div>
        <div class="metric-item">
          <span>命中率:</span>
          <span>{{ (cacheStats.hitRate * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <!-- 资源统计 -->
      <div class="metric-section">
        <h4>资源统计</h4>
        <div class="metric-item">
          <span>定时器:</span>
          <span>{{ resourceStats.timers }}</span>
        </div>
        <div class="metric-item">
          <span>事件监听器:</span>
          <span>{{ resourceStats.listeners }}</span>
        </div>
        <div class="metric-item">
          <span>观察者:</span>
          <span>{{ resourceStats.observers }}</span>
        </div>
        <div class="metric-item">
          <span>DOM 节点:</span>
          <span>{{ domNodeCount }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="monitor-actions">
        <button @click="triggerGC" class="action-btn">触发GC</button>
        <button @click="clearCache" class="action-btn">清理缓存</button>
        <button @click="generateReport" class="action-btn">生成报告</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { memoryMonitor } from '@/utils/memoryMonitor'
  import { cacheManager } from '@/utils/cacheManager'
  import { resourceManager } from '@/utils/resourceManager'

  const showMonitor = ref(false)
  const isExpanded = ref(false)
  const isDev = (import.meta as any).env.DEV

  // 监控数据
  const memoryMetrics = ref({
    usedMB: 0,
    totalMB: 0,
    limitMB: 0,
  })

  const cacheStats = ref({
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
  })

  const resourceStats = ref({
    timers: 0,
    listeners: 0,
    observers: 0,
  })

  const domNodeCount = ref(0)

  // 计算属性
  const memoryUsagePercent = computed(() => {
    if (memoryMetrics.value.limitMB === 0) return 0
    return (memoryMetrics.value.usedMB / memoryMetrics.value.limitMB) * 100
  })

  // 更新监控数据
  const updateMetrics = () => {
    // 更新内存指标
    const memory = memoryMonitor.getCurrentMemoryUsage()
    if (memory) {
      memoryMetrics.value = {
        usedMB: memory.usedJSHeapSize / 1024 / 1024,
        totalMB: memory.totalJSHeapSize / 1024 / 1024,
        limitMB: memory.jsHeapSizeLimit / 1024 / 1024,
      }
    }

    // 更新缓存统计
    cacheStats.value = cacheManager.getStats()

    // 更新资源统计
    resourceStats.value = resourceManager.getResourceStats()

    // 更新DOM节点数量
    domNodeCount.value = document.querySelectorAll('*').length
  }

  // 获取内存状态样式类
  const getMemoryClass = (usedMB: number) => {
    if (usedMB > 150) return 'critical'
    if (usedMB > 100) return 'warning'
    return 'normal'
  }

  // 操作方法
  const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
  }

  const closeMonitor = () => {
    showMonitor.value = false
  }

  const triggerGC = () => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      ;(window as any).gc()
      console.log('🗑️ 手动触发垃圾回收')
      setTimeout(updateMetrics, 1000) // 延迟更新指标
    } else {
      console.warn('垃圾回收功能不可用')
    }
  }

  const clearCache = () => {
    cacheManager.clear()
    console.log('🧹 缓存已清理')
    updateMetrics()
  }

  const generateReport = () => {
    const report = memoryMonitor.generateMemoryReport()
    console.log('📊 性能报告:', report)

    // 可以将报告保存到文件或发送到服务器
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 键盘快捷键
  const handleKeydown = (event: KeyboardEvent) => {
    // Ctrl+Shift+P 切换性能监控器
    if (event.ctrlKey && event.shiftKey && event.key === 'P') {
      event.preventDefault()
      showMonitor.value = !showMonitor.value
      if (showMonitor.value) {
        updateMetrics()
      }
    }
  }

  let updateTimer: number | null = null

  onMounted(() => {
    if (isDev) {
      // 添加键盘监听
      document.addEventListener('keydown', handleKeydown)

      // 定期更新指标
      updateTimer = window.setInterval(updateMetrics, 2000)

      // 初始显示（开发环境）
      showMonitor.value = true
      updateMetrics()
    }
  })

  onUnmounted(() => {
    if (updateTimer) {
      clearInterval(updateTimer)
    }
    document.removeEventListener('keydown', handleKeydown)
  })
</script>

<style scoped>
  .performance-monitor {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    border-radius: 8px;
    padding: 12px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .monitor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .monitor-header h3 {
    margin: 0;
    font-size: 14px;
    color: #00ff88;
  }

  .toggle-btn,
  .close-btn {
    background: none;
    border: 1px solid #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 10px;
  }

  .toggle-btn:hover,
  .close-btn:hover {
    background: #333;
  }

  .metric-section {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #333;
  }

  .metric-section h4 {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: #66ccff;
  }

  .metric-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .memory-bar {
    width: 100%;
    height: 8px;
    background: #333;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 8px;
  }

  .memory-usage {
    height: 100%;
    transition: width 0.3s ease;
  }

  .memory-usage.normal {
    background: #00ff88;
  }

  .memory-usage.warning {
    background: #ffaa00;
  }

  .memory-usage.critical {
    background: #ff4444;
  }

  .normal {
    color: #00ff88;
  }

  .warning {
    color: #ffaa00;
  }

  .critical {
    color: #ff4444;
  }

  .monitor-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .action-btn {
    background: #333;
    border: 1px solid #555;
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 10px;
    flex: 1;
  }

  .action-btn:hover {
    background: #555;
  }
</style>
