<template>
  <div class="time-display">
    <div class="time">{{ formattedTime }}</div>
    <div class="date">{{ formattedDate }}</div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, computed } from 'vue'
  import { useAppStore, useSettingsStore } from '@/stores'

  const appStore = useAppStore()
  const settingsStore = useSettingsStore()

  // 响应式计算属性
  const formattedTime = computed(() => {
    return appStore.formatTime(
      settingsStore.settings.timeFormat,
      settingsStore.settings.language,
      settingsStore.settings.showSeconds
    )
  })

  const formattedDate = computed(() => {
    return appStore.formatDate(settingsStore.settings.language)
  })

  let timeInterval: number | null = null

  onMounted(() => {
    // 立即更新一次时间
    appStore.updateTime()

    // 每秒更新时间
    timeInterval = window.setInterval(() => {
      appStore.updateTime()
    }, 1000)
  })

  onUnmounted(() => {
    if (timeInterval) {
      clearInterval(timeInterval)
    }
  })
</script>

<style scoped>
  .time-display {
    text-align: center;
    color: white;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    margin-bottom: 3rem;
    animation: slideInDown 0.8s ease-out 0.2s both;
  }

  .time {
    font-size: 4rem;
    font-weight: 300;
    line-height: 1;
    margin-bottom: 0.5rem;
    letter-spacing: 0.05em;
    background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .date {
    font-size: 1.125rem;
    opacity: 0.95;
    font-weight: 400;
    letter-spacing: 0.02em;
  }

  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .time-display {
      margin-bottom: 2.5rem;
    }

    .time {
      font-size: 3.5rem;
    }

    .date {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .time-display {
      margin-bottom: 2rem;
    }

    .time {
      font-size: 2.8rem;
      letter-spacing: 0.03em;
    }

    .date {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 320px) {
    .time {
      font-size: 2.4rem;
    }

    .date {
      font-size: 0.85rem;
    }
  }

  @media (max-height: 600px) {
    .time-display {
      margin-bottom: 1.5rem;
    }

    .time {
      font-size: 3rem;
    }

    .date {
      font-size: 0.95rem;
    }
  }
</style>
