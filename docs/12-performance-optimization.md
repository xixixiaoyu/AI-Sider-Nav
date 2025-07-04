# 第十二章：性能优化

## 🎯 学习目标

- 掌握前端性能优化策略
- 实现浏览器扩展性能优化
- 学习代码分割和懒加载技术
- 优化资源加载和缓存策略

## ⚡ 性能优化概述

### 性能指标体系

```typescript
// 性能监控指标
interface PerformanceMetrics {
  // 核心 Web 指标
  LCP: number  // Largest Contentful Paint
  FID: number  // First Input Delay
  CLS: number  // Cumulative Layout Shift
  
  // 自定义指标
  TTI: number  // Time to Interactive
  FCP: number  // First Contentful Paint
  loadTime: number
  memoryUsage: number
}

class PerformanceTracker {
  private metrics: Partial<PerformanceMetrics> = {}
  
  constructor() {
    this.initializeTracking()
  }
  
  private initializeTracking() {
    // 监听 LCP
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.metrics.LCP = lastEntry.startTime
    }).observe({ entryTypes: ['largest-contentful-paint'] })
    
    // 监听 FID
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        this.metrics.FID = entry.processingStart - entry.startTime
      })
    }).observe({ entryTypes: ['first-input'] })
    
    // 监听 CLS
    new PerformanceObserver((entryList) => {
      let clsValue = 0
      entryList.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.metrics.CLS = clsValue
    }).observe({ entryTypes: ['layout-shift'] })
  }
  
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }
  
  reportMetrics() {
    console.log('Performance Metrics:', this.metrics)
    // 可以发送到分析服务
  }
}
```

## 🚀 Vue 应用性能优化

### 组件懒加载

```typescript
// src/router/index.ts - 路由懒加载
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue')
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/Settings.vue')
    }
  ]
})

export default router
```

### 组件异步加载

```vue
<!-- 异步组件示例 -->
<template>
  <div class="app">
    <Suspense>
      <template #default>
        <AsyncComponent />
      </template>
      <template #fallback>
        <LoadingSpinner />
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const AsyncComponent = defineAsyncComponent({
  loader: () => import('@/components/HeavyComponent.vue'),
  delay: 200,
  timeout: 3000,
  errorComponent: () => import('@/components/ErrorComponent.vue'),
  loadingComponent: LoadingSpinner
})
</script>
```

### 计算属性优化

```vue
<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'

// ✅ 使用 computed 缓存复杂计算
const expensiveValue = computed(() => {
  return heavyCalculation(props.data)
})

// ✅ 使用 shallowRef 避免深度响应
const largeObject = shallowRef({})

// ✅ 使用 markRaw 标记不需要响应式的对象
import { markRaw } from 'vue'
const nonReactiveObject = markRaw({
  // 大型对象数据
})

// ❌ 避免在模板中直接调用函数
// <template>{{ heavyCalculation(data) }}</template>

// ✅ 使用计算属性
// <template>{{ expensiveValue }}</template>
</script>
```

## 📦 构建优化

### Vite 构建优化配置

```typescript
// vite.config.ts - 性能优化配置
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 Vue 相关库分离
          vue: ['vue', 'pinia'],
          // 将工具库分离
          utils: ['lodash-es', 'date-fns'],
          // 将 UI 组件分离
          ui: ['@headlessui/vue']
        }
      }
    },
    
    // 压缩配置
    minify: 'esbuild',
    target: 'esnext',
    
    // 移除 console 和 debugger
    esbuild: {
      drop: ['console', 'debugger']
    },
    
    // 设置 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    
    // 生成 sourcemap（开发环境）
    sourcemap: process.env.NODE_ENV === 'development'
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: ['vue', 'pinia'],
    exclude: ['@vueuse/core']
  }
})
```

### 资源优化

```typescript
// 图片懒加载组件
// src/components/LazyImage.vue
<template>
  <div class="lazy-image-container" ref="containerRef">
    <img
      v-if="isLoaded"
      :src="src"
      :alt="alt"
      class="lazy-image"
      @load="onImageLoad"
      @error="onImageError"
    />
    <div v-else-if="isLoading" class="loading-placeholder">
      <LoadingSpinner />
    </div>
    <div v-else-if="hasError" class="error-placeholder">
      加载失败
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  src: string
  alt: string
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 0.1
})

const containerRef = ref<HTMLElement>()
const isLoaded = ref(false)
const isLoading = ref(false)
const hasError = ref(false)

let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage()
          observer?.unobserve(entry.target)
        }
      })
    },
    { threshold: props.threshold }
  )
  
  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

const loadImage = () => {
  isLoading.value = true
  const img = new Image()
  
  img.onload = () => {
    isLoaded.value = true
    isLoading.value = false
  }
  
  img.onerror = () => {
    hasError.value = true
    isLoading.value = false
  }
  
  img.src = props.src
}

const onImageLoad = () => {
  // 图片加载完成后的处理
}

const onImageError = () => {
  hasError.value = true
}
</script>
```

## 🎨 CSS 性能优化

### 关键 CSS 提取

```typescript
// 关键 CSS 内联工具
class CriticalCSSExtractor {
  private criticalCSS: string = ''
  
  constructor() {
    this.extractCriticalCSS()
  }
  
  private extractCriticalCSS() {
    // 提取首屏关键样式
    const criticalStyles = `
      .app-container {
        position: relative;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
      }
      
      .main-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        padding: 2rem;
      }
      
      .time-display {
        text-align: center;
        color: white;
        margin-bottom: 3rem;
      }
      
      .time {
        font-size: 4rem;
        font-weight: 300;
        line-height: 1;
      }
    `
    
    this.criticalCSS = criticalStyles
  }
  
  injectCriticalCSS() {
    const style = document.createElement('style')
    style.textContent = this.criticalCSS
    document.head.appendChild(style)
  }
}
```

### CSS 优化技巧

```css
/* 使用 CSS 自定义属性减少重复 */
:root {
  --primary-color: #79b4a6;
  --transition-duration: 0.3s;
  --border-radius: 0.5rem;
}

/* 使用 transform 和 opacity 进行动画 */
.optimized-animation {
  will-change: transform, opacity;
  transform: translateZ(0); /* 启用硬件加速 */
}

/* 避免昂贵的 CSS 属性 */
.expensive-styles {
  /* ❌ 避免 */
  /* box-shadow: 0 0 50px rgba(0,0,0,0.5); */
  /* filter: blur(10px); */
  
  /* ✅ 使用更轻量的替代方案 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  backdrop-filter: blur(8px);
}

/* 使用 contain 属性优化渲染 */
.contained-component {
  contain: layout style paint;
}

/* 优化字体加载 */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap; /* 优化字体加载 */
}
```

## 🧠 内存优化

### 内存泄漏防护

```typescript
// 内存管理工具
class MemoryManager {
  private timers: Set<number> = new Set()
  private observers: Set<any> = new Set()
  private eventListeners: Map<EventTarget, Map<string, EventListener>> = new Map()
  
  // 安全的定时器管理
  setTimeout(callback: Function, delay: number): number {
    const timerId = window.setTimeout(() => {
      callback()
      this.timers.delete(timerId)
    }, delay)
    
    this.timers.add(timerId)
    return timerId
  }
  
  setInterval(callback: Function, interval: number): number {
    const timerId = window.setInterval(callback, interval)
    this.timers.add(timerId)
    return timerId
  }
  
  clearTimer(timerId: number) {
    clearTimeout(timerId)
    clearInterval(timerId)
    this.timers.delete(timerId)
  }
  
  // 安全的事件监听器管理
  addEventListener(target: EventTarget, type: string, listener: EventListener) {
    target.addEventListener(type, listener)
    
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, new Map())
    }
    this.eventListeners.get(target)!.set(type, listener)
  }
  
  removeEventListener(target: EventTarget, type: string) {
    const listeners = this.eventListeners.get(target)
    if (listeners) {
      const listener = listeners.get(type)
      if (listener) {
        target.removeEventListener(type, listener)
        listeners.delete(type)
      }
    }
  }
  
  // 清理所有资源
  cleanup() {
    // 清理定时器
    this.timers.forEach(timerId => {
      clearTimeout(timerId)
      clearInterval(timerId)
    })
    this.timers.clear()
    
    // 清理观察器
    this.observers.forEach(observer => {
      if (observer.disconnect) {
        observer.disconnect()
      }
    })
    this.observers.clear()
    
    // 清理事件监听器
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, type) => {
        target.removeEventListener(type, listener)
      })
    })
    this.eventListeners.clear()
  }
}

// 在组件中使用
export function useMemoryManager() {
  const memoryManager = new MemoryManager()
  
  onUnmounted(() => {
    memoryManager.cleanup()
  })
  
  return memoryManager
}
```

### 大数据处理优化

```typescript
// 虚拟滚动实现
class VirtualScroller {
  private container: HTMLElement
  private itemHeight: number
  private visibleCount: number
  private startIndex: number = 0
  private endIndex: number = 0
  
  constructor(container: HTMLElement, itemHeight: number) {
    this.container = container
    this.itemHeight = itemHeight
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2
    
    this.setupScrollListener()
  }
  
  private setupScrollListener() {
    this.container.addEventListener('scroll', () => {
      this.updateVisibleRange()
    })
  }
  
  private updateVisibleRange() {
    const scrollTop = this.container.scrollTop
    this.startIndex = Math.floor(scrollTop / this.itemHeight)
    this.endIndex = Math.min(
      this.startIndex + this.visibleCount,
      this.getTotalItems()
    )
    
    this.renderVisibleItems()
  }
  
  private renderVisibleItems() {
    // 只渲染可见区域的项目
    // 实现具体的渲染逻辑
  }
  
  private getTotalItems(): number {
    // 返回总项目数
    return 0
  }
}
```

## 🌐 网络优化

### 资源预加载策略

```typescript
// 资源预加载管理器
class ResourcePreloader {
  private preloadedResources: Set<string> = new Set()
  
  // 预加载关键资源
  preloadCriticalResources() {
    const criticalResources = [
      '/fonts/inter.woff2',
      '/images/background.webp',
      '/css/critical.css'
    ]
    
    criticalResources.forEach(resource => {
      this.preloadResource(resource)
    })
  }
  
  // 预加载单个资源
  preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font' = 'image') {
    if (this.preloadedResources.has(url)) {
      return Promise.resolve()
    }
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = url
      
      switch (type) {
        case 'script':
          link.as = 'script'
          break
        case 'style':
          link.as = 'style'
          break
        case 'font':
          link.as = 'font'
          link.crossOrigin = 'anonymous'
          break
        default:
          link.as = 'image'
      }
      
      link.onload = () => {
        this.preloadedResources.add(url)
        resolve(url)
      }
      
      link.onerror = reject
      
      document.head.appendChild(link)
    })
  }
  
  // 智能预加载（基于用户行为）
  intelligentPreload() {
    // 监听用户交互，预测可能需要的资源
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement
      const href = target.getAttribute('href')
      
      if (href && !this.preloadedResources.has(href)) {
        this.preloadResource(href, 'script')
      }
    })
  }
}
```

### 缓存策略

```typescript
// 智能缓存管理
class CacheManager {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  
  // 设置缓存
  set(key: string, data: any, ttl: number = 300000) { // 默认 5 分钟
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
    
    // 定期清理过期缓存
    this.scheduleCleanup()
  }
  
  // 获取缓存
  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  // 清理过期缓存
  private scheduleCleanup() {
    setTimeout(() => {
      const now = Date.now()
      
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key)
        }
      }
    }, 60000) // 每分钟清理一次
  }
  
  // 清空所有缓存
  clear() {
    this.cache.clear()
  }
}

// 使用示例
const cacheManager = new CacheManager()

// 缓存搜索结果
async function searchWithCache(query: string) {
  const cacheKey = `search:${query}`
  let result = cacheManager.get(cacheKey)
  
  if (!result) {
    result = await performSearch(query)
    cacheManager.set(cacheKey, result, 600000) // 缓存 10 分钟
  }
  
  return result
}
```

## 📊 性能监控和分析

### 实时性能监控

```typescript
// 性能监控仪表板
class PerformanceDashboard {
  private metrics: Map<string, number[]> = new Map()
  private observers: PerformanceObserver[] = []
  
  constructor() {
    this.initializeObservers()
    this.startMonitoring()
  }
  
  private initializeObservers() {
    // 监控长任务
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.recordMetric('longTask', entry.duration)
        
        if (entry.duration > 50) {
          console.warn('Long task detected:', entry.duration + 'ms')
        }
      })
    })
    
    longTaskObserver.observe({ entryTypes: ['longtask'] })
    this.observers.push(longTaskObserver)
    
    // 监控内存使用
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.recordMetric('memoryUsed', memory.usedJSHeapSize)
        this.recordMetric('memoryTotal', memory.totalJSHeapSize)
      }, 5000)
    }
  }
  
  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // 只保留最近 100 个数据点
    if (values.length > 100) {
      values.shift()
    }
  }
  
  private startMonitoring() {
    // 定期报告性能指标
    setInterval(() => {
      this.reportMetrics()
    }, 30000) // 每 30 秒报告一次
  }
  
  private reportMetrics() {
    const report: any = {}
    
    this.metrics.forEach((values, name) => {
      if (values.length > 0) {
        report[name] = {
          current: values[values.length - 1],
          average: values.reduce((a, b) => a + b, 0) / values.length,
          max: Math.max(...values),
          min: Math.min(...values)
        }
      }
    })
    
    console.log('Performance Report:', report)
    
    // 发送到分析服务
    this.sendToAnalytics(report)
  }
  
  private sendToAnalytics(report: any) {
    // 发送性能数据到分析服务
    // 这里可以集成 Google Analytics 或其他分析工具
  }
  
  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics.clear()
  }
}
```

### 性能预算管理

```typescript
// 性能预算配置
interface PerformanceBudget {
  maxBundleSize: number      // 最大包体积 (KB)
  maxLoadTime: number        // 最大加载时间 (ms)
  maxMemoryUsage: number     // 最大内存使用 (MB)
  maxLongTasks: number       // 最大长任务数量
}

class PerformanceBudgetMonitor {
  private budget: PerformanceBudget
  private violations: string[] = []
  
  constructor(budget: PerformanceBudget) {
    this.budget = budget
    this.startMonitoring()
  }
  
  private startMonitoring() {
    // 监控包体积
    this.checkBundleSize()
    
    // 监控加载时间
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
      this.checkLoadTime(loadTime)
    })
    
    // 监控内存使用
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        const memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
        this.checkMemoryUsage(memoryUsage)
      }, 10000)
    }
  }
  
  private checkBundleSize() {
    // 检查包体积（需要构建时配置）
    fetch('/api/bundle-size')
      .then(response => response.json())
      .then(data => {
        if (data.size > this.budget.maxBundleSize) {
          this.addViolation(`Bundle size exceeded: ${data.size}KB > ${this.budget.maxBundleSize}KB`)
        }
      })
  }
  
  private checkLoadTime(loadTime: number) {
    if (loadTime > this.budget.maxLoadTime) {
      this.addViolation(`Load time exceeded: ${loadTime}ms > ${this.budget.maxLoadTime}ms`)
    }
  }
  
  private checkMemoryUsage(memoryUsage: number) {
    if (memoryUsage > this.budget.maxMemoryUsage) {
      this.addViolation(`Memory usage exceeded: ${memoryUsage}MB > ${this.budget.maxMemoryUsage}MB`)
    }
  }
  
  private addViolation(message: string) {
    this.violations.push(message)
    console.warn('Performance Budget Violation:', message)
    
    // 可以发送警报或通知
    this.sendAlert(message)
  }
  
  private sendAlert(message: string) {
    // 发送性能预算违规警报
  }
  
  getViolations(): string[] {
    return [...this.violations]
  }
}

// 使用示例
const performanceBudget: PerformanceBudget = {
  maxBundleSize: 500,    // 500KB
  maxLoadTime: 3000,     // 3 秒
  maxMemoryUsage: 50,    // 50MB
  maxLongTasks: 5        // 5 个长任务
}

const budgetMonitor = new PerformanceBudgetMonitor(performanceBudget)
```

## 📚 扩展阅读

### 性能优化资源
- [Web Vitals](https://web.dev/vitals/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

### 工具和技术
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Chrome DevTools Performance](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance)

---

**下一章：[测试和调试](./13-testing-debugging.md)**
