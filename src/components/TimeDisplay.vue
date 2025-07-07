<template>
  <div class="time-display">
    <div
      class="time clickable"
      :class="{ 'calendar-enabled': settingsStore.settings.calendar.enabled }"
      @click="handleTimeClick"
      :title="settingsStore.settings.calendar.enabled ? '点击查看日历' : ''"
    >
      {{ formattedTime }}
    </div>
    <div class="date">{{ formattedDate }}</div>

    <!-- 日历模态框 -->
    <CalendarModal v-model:visible="showCalendar" @date-selected="handleDateSelected" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, computed, ref } from 'vue'
  import { useAppStore, useSettingsStore } from '@/stores'
  import CalendarModal from './CalendarModal.vue'
  import { resourceManager } from '@/utils/resourceManager'

  const appStore = useAppStore()
  const settingsStore = useSettingsStore()

  // 日历相关状态
  const showCalendar = ref(false)

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

  // 方法
  const handleTimeClick = () => {
    if (settingsStore.settings.calendar.enabled) {
      showCalendar.value = true
    }
  }

  const handleDateSelected = (date: Date) => {
    console.log('Selected date:', date)
    // 这里可以添加日期选择后的逻辑
  }

  let timeInterval: number | null = null

  onMounted(() => {
    // 立即更新一次时间
    appStore.updateTime()

    // 使用资源管理器创建定时器
    timeInterval = resourceManager.setInterval(() => {
      appStore.updateTime()
    }, 1000)
  })

  onUnmounted(() => {
    if (timeInterval) {
      resourceManager.clearTimer(timeInterval)
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
    transition: all 0.2s ease;
  }

  .time.clickable.calendar-enabled {
    cursor: pointer;
  }

  .time.clickable.calendar-enabled:hover {
    transform: scale(1.02);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
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
