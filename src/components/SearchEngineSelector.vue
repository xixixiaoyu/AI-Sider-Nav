<template>
  <div class="search-engine-selector">
    <!-- 搜索引擎选择器 -->
    <div class="selector-container">
      <div class="current-engine" @click="toggleDropdown">
        <div class="engine-info">
          <span class="engine-icon">{{ currentSearchEngine.icon }}</span>
          <span class="engine-name">{{ currentSearchEngine.name }}</span>
        </div>
        <div class="dropdown-arrow" :class="{ open: isDropdownOpen }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <transition name="dropdown">
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <div
            v-for="engine in searchEngines"
            :key="engine.key"
            class="dropdown-item"
            :class="{ active: engine.key === settings.searchEngine }"
            @click="selectEngine(engine.key)"
          >
            <span class="engine-icon">{{ engine.icon }}</span>
            <span class="engine-name">{{ engine.name }}</span>
            <span v-if="engine.key === settings.searchEngine" class="check-icon">✓</span>
          </div>
        </div>
      </transition>
    </div>

    <!-- 时间格式设置 -->
    <div class="time-format-selector">
      <div class="time-format-label">时间格式</div>
      <div class="time-format-options">
        <button
          class="time-format-btn"
          :class="{ active: settings.timeFormat === '24h' }"
          @click="setTimeFormat('24h')"
        >
          24小时制
        </button>
        <button
          class="time-format-btn"
          :class="{ active: settings.timeFormat === '12h' }"
          @click="setTimeFormat('12h')"
        >
          12小时制
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useSettingsStore } from '@/stores'

  const settingsStore = useSettingsStore()

  const isDropdownOpen = ref(false)

  // 搜索引擎配置
  const searchEngines = [
    {
      key: 'google' as const,
      name: 'Google',
      icon: '🔍',
      url: 'https://www.google.com/search?q=',
    },
    {
      key: 'bing' as const,
      name: 'Bing',
      icon: '🔍',
      url: 'https://www.bing.com/search?q=',
    },
    {
      key: 'baidu' as const,
      name: '百度',
      icon: '🔍',
      url: 'https://www.baidu.com/s?wd=',
    },
  ]

  // 计算属性
  const settings = computed(() => settingsStore.settings)
  const currentSearchEngine = computed(() => settingsStore.currentSearchEngine)

  // 方法
  const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value
  }

  const selectEngine = async (engineKey: 'google' | 'bing' | 'baidu') => {
    await settingsStore.updateSetting('searchEngine', engineKey)
    isDropdownOpen.value = false
  }

  const setTimeFormat = async (format: '12h' | '24h') => {
    await settingsStore.updateSetting('timeFormat', format)
  }

  // 点击外部关闭下拉菜单
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.search-engine-selector')) {
      isDropdownOpen.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
</script>

<style scoped>
  .search-engine-selector {
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 100;
    animation: slideInRight 0.8s ease-out 0.6s both;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .selector-container {
    position: relative;
  }

  .current-engine {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    min-width: 120px;
    cursor: pointer;
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 1px 4px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .current-engine:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.15),
      0 2px 6px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  .engine-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .engine-icon {
    font-size: 1rem;
  }

  .engine-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .dropdown-arrow {
    color: #6b7280;
    transition: transform 0.3s ease;
  }

  .dropdown-arrow.open {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 0.5rem;
    min-width: 140px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .dropdown-item:hover {
    background: rgba(121, 180, 166, 0.1);
  }

  .dropdown-item.active {
    background: rgba(121, 180, 166, 0.15);
    color: #047857;
  }

  .dropdown-item .engine-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .check-icon {
    color: #047857;
    font-weight: 600;
    font-size: 0.875rem;
  }

  /* 动画 */
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dropdown-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }

  .dropdown-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .search-engine-selector {
      top: 1.5rem;
      right: 1.5rem;
    }

    .current-engine {
      padding: 0.625rem 0.875rem;
      min-width: 100px;
    }

    .engine-name {
      font-size: 0.8rem;
    }

    .dropdown-menu {
      min-width: 120px;
    }
  }

  @media (max-width: 480px) {
    .search-engine-selector {
      top: 1rem;
      right: 1rem;
    }

    .current-engine {
      padding: 0.5rem 0.75rem;
      min-width: 90px;
    }

    .engine-name {
      font-size: 0.75rem;
    }

    .dropdown-menu {
      min-width: 110px;
    }

    .dropdown-item {
      padding: 0.625rem;
    }
  }

  /* 时间格式设置样式 */
  .time-format-selector {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 1rem;
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 1px 4px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .time-format-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.75rem;
    text-align: center;
  }

  .time-format-options {
    display: flex;
    gap: 0.5rem;
  }

  .time-format-btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(121, 180, 166, 0.3);
    border-radius: 8px;
    background: transparent;
    color: #374151;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .time-format-btn:hover {
    background: rgba(121, 180, 166, 0.1);
    border-color: rgba(121, 180, 166, 0.5);
  }

  .time-format-btn.active {
    background: rgba(121, 180, 166, 0.2);
    border-color: #79b4a6;
    color: #047857;
  }

  @media (max-width: 768px) {
    .time-format-selector {
      padding: 0.875rem;
    }

    .time-format-label {
      font-size: 0.8rem;
      margin-bottom: 0.625rem;
    }

    .time-format-btn {
      padding: 0.4rem 0.6rem;
      font-size: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .time-format-selector {
      padding: 0.75rem;
    }

    .time-format-label {
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .time-format-btn {
      padding: 0.35rem 0.5rem;
      font-size: 0.7rem;
    }
  }
</style>
