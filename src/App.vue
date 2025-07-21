<template>
  <div class="app-container">
    <!-- 背景容器 -->
    <div class="background-container">
      <div class="background-gradient"></div>
    </div>

    <!-- 文本选择复制功能 -->
    <TextSelectionCopy />

    <!-- AI 助手侧边栏 -->
    <AISidebar />

    <!-- AI 助手触发按钮 -->
    <AISidebarTrigger />

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 时间显示区域 -->
      <div class="time-section">
        <!-- 时间显示组件 -->
        <TimeDisplay />
      </div>

      <!-- 搜索组件 -->
      <SearchBox />

      <!-- 底部提示 -->
      <div class="footer-hint">"第一个人类本性，第二是文学天赋的问题。"</div>
    </div>

    <!-- 性能监控组件（仅开发环境） -->
    <PerformanceMonitor />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted } from 'vue'
  import TimeDisplay from '@/components/TimeDisplay.vue'
  import SearchBox from '@/components/SearchBox.vue'
  import TextSelectionCopy from '@/components/TextSelectionCopy.vue'
  import AISidebar from '@/components/AISidebar.vue'
  import AISidebarTrigger from '@/components/AISidebarTrigger.vue'
  import PerformanceMonitor from '@/components/PerformanceMonitor.vue'
  import { useAppStore, useSettingsStore, useAIAssistantStore } from '@/stores'
  import { memoryMonitor } from '@/utils/memoryMonitor'
  import { resourceManager } from '@/utils/resourceManager'

  const appStore = useAppStore()
  const settingsStore = useSettingsStore()
  const aiAssistantStore = useAIAssistantStore()

  // 应用初始化
  onMounted(async () => {
    try {
      // 启动内存监控
      if (import.meta.env.DEV) {
        memoryMonitor.startMonitoring()
        console.log('🔍 内存监控已启动')
      }

      // 加载用户设置
      await settingsStore.loadSettings()

      // 加载搜索历史
      await appStore.loadSearchHistory()

      // 初始化 AI 助手
      await aiAssistantStore.initialize()

      console.log('✅ 应用初始化完成')
    } catch (error) {
      console.error('❌ 应用初始化失败:', error)
    }
  })

  // 应用清理
  onUnmounted(() => {
    try {
      // 清理 AI 助手资源
      aiAssistantStore.cleanup()

      // 清理设置存储监听器
      settingsStore.cleanupStorageListener()

      // 清理资源管理器
      resourceManager.cleanup()

      // 停止内存监控
      memoryMonitor.cleanup()

      console.log('✅ 应用清理完成')
    } catch (error) {
      console.error('❌ 应用清理失败:', error)
    }
  })
</script>

<style scoped>
  .app-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .background-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }

  .background-gradient {
    width: 100%;
    height: 100%;
    background-image: url('/images/background.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
  }

  /* 添加一个轻微的覆盖层以保持文字可读性 */
  .background-gradient::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(121, 180, 166, 0.1);
    pointer-events: none;
  }

  .main-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: 100vh;
    padding: 8rem 2rem 2rem;
    z-index: 1;
    animation: fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    transform: translateZ(0);
    backface-visibility: hidden;
  }

  .time-section {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    width: 100%;
    max-width: 800px;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate3d(0, 20px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  .footer-hint {
    position: absolute;
    bottom: 2rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
    text-align: center;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    animation: fadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s both;
    max-width: 90%;
    padding: 0 1rem;
    transform: translateZ(0);
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .main-content {
      padding: 6rem 1rem 1.5rem;
    }

    .time-section {
      margin-bottom: 1.5rem;
    }

    .footer-hint {
      bottom: 1.5rem;
      font-size: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .main-content {
      padding: 5rem 0.75rem 1rem;
    }

    .footer-hint {
      bottom: 1rem;
      font-size: 0.75rem;
    }
  }

  @media (max-height: 600px) {
    .main-content {
      justify-content: flex-start;
      padding-top: 3rem;
    }

    .footer-hint {
      position: relative;
      bottom: auto;
      margin-top: 2rem;
    }
  }

  @media (max-height: 500px) {
    .main-content {
      padding-top: 2rem;
    }
  }
</style>
