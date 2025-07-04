<template>
  <div class="app-container">
    <!-- 背景容器 -->
    <div class="background-container">
      <div class="background-gradient"></div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 时间显示组件 -->
      <TimeDisplay />

      <!-- 搜索组件 -->
      <SearchBox />

      <!-- 底部提示 -->
      <div class="footer-hint">"第一个人类本性，第二是文学天赋的问题。"</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import TimeDisplay from '@/components/TimeDisplay.vue'
  import SearchBox from '@/components/SearchBox.vue'
  import { useAppStore, useSettingsStore } from '@/stores'

  const appStore = useAppStore()
  const settingsStore = useSettingsStore()

  // 应用初始化
  onMounted(async () => {
    // 加载用户设置
    await settingsStore.loadSettings()

    // 加载搜索历史
    await appStore.loadSearchHistory()
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
    background:
      radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      linear-gradient(
        180deg,
        #87ceeb 0%,
        #98d8e8 20%,
        #a8e6cf 40%,
        #79b4a6 60%,
        #6ba3a0 80%,
        #5a9b95 100%
      );
    background-size:
      400% 400%,
      300% 300%,
      200% 200%,
      100% 100%;
    animation: gradientShift 20s ease infinite;
    position: relative;
  }

  .background-gradient::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(ellipse at 30% 70%, rgba(34, 139, 34, 0.1) 0%, transparent 70%),
      radial-gradient(ellipse at 70% 30%, rgba(34, 139, 34, 0.08) 0%, transparent 60%);
    animation: cloudFloat 25s ease-in-out infinite;
  }

  @keyframes gradientShift {
    0% {
      background-position:
        0% 50%,
        0% 0%,
        0% 0%,
        0% 0%;
    }
    25% {
      background-position:
        50% 25%,
        25% 25%,
        25% 25%,
        0% 0%;
    }
    50% {
      background-position:
        100% 50%,
        50% 50%,
        50% 50%,
        0% 0%;
    }
    75% {
      background-position:
        50% 75%,
        75% 75%,
        75% 75%,
        0% 0%;
    }
    100% {
      background-position:
        0% 50%,
        0% 0%,
        0% 0%,
        0% 0%;
    }
  }

  @keyframes cloudFloat {
    0%,
    100% {
      transform: translateX(0) translateY(0);
      opacity: 0.6;
    }
    25% {
      transform: translateX(10px) translateY(-5px);
      opacity: 0.8;
    }
    50% {
      transform: translateX(-5px) translateY(10px);
      opacity: 0.7;
    }
    75% {
      transform: translateX(-10px) translateY(-8px);
      opacity: 0.9;
    }
  }

  .main-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 2rem;
    z-index: 1;
    animation: fadeInUp 1s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .footer-hint {
    position: absolute;
    bottom: 2rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
    text-align: center;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    animation: fadeIn 1s ease-out 1s both;
    max-width: 90%;
    padding: 0 1rem;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .main-content {
      padding: 1.5rem 1rem;
    }

    .footer-hint {
      bottom: 1.5rem;
      font-size: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .main-content {
      padding: 1rem 0.75rem;
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
</style>
