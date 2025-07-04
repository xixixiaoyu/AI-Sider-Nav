<template>
  <div class="settings-panel">
    <!-- 设置触发按钮 -->
    <div class="settings-trigger" @click="togglePanel">
      <div class="trigger-content">
        <div class="current-info">
          <span class="engine-icon">{{ currentSearchEngine.icon }}</span>
          <span class="engine-name">{{ currentSearchEngine.name }}</span>
          <span class="separator">·</span>
          <span class="time-format">{{
            settings.timeFormat === '24h' ? '24小时制' : '12小时制'
          }}</span>
        </div>
        <div class="expand-arrow" :class="{ open: isPanelOpen }">
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
    </div>

    <!-- 可展开的设置面板 -->
    <Transition name="panel-slide">
      <div v-if="isPanelOpen" class="settings-content">
        <!-- 搜索引擎选择 -->
        <div class="setting-section">
          <div class="section-title">搜索引擎</div>
          <div class="engine-options">
            <div
              v-for="engine in searchEngines"
              :key="engine.key"
              class="engine-option"
              :class="{ active: engine.key === settings.searchEngine }"
              @click="selectEngine(engine.key)"
            >
              <span class="engine-icon">{{ engine.icon }}</span>
              <span class="engine-name">{{ engine.name }}</span>
              <div v-if="engine.key === settings.searchEngine" class="check-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 时间格式选择 -->
        <div class="setting-section">
          <div class="section-title">时间格式</div>
          <div class="format-buttons">
            <button
              class="format-button"
              :class="{ active: settings.timeFormat === '24h' }"
              @click="setTimeFormat('24h')"
            >
              24小时制
            </button>
            <button
              class="format-button"
              :class="{ active: settings.timeFormat === '12h' }"
              @click="setTimeFormat('12h')"
            >
              12小时制
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useSettingsStore } from '@/stores'

  const settingsStore = useSettingsStore()

  const isPanelOpen = ref(false)

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
  const togglePanel = () => {
    isPanelOpen.value = !isPanelOpen.value
  }

  const selectEngine = async (engineKey: 'google' | 'bing' | 'baidu') => {
    await settingsStore.updateSetting('searchEngine', engineKey)
  }

  const setTimeFormat = async (format: '12h' | '24h') => {
    await settingsStore.updateSetting('timeFormat', format)
  }

  // 点击外部关闭面板
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.settings-panel')) {
      isPanelOpen.value = false
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
  .settings-panel {
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 100;
    animation: slideInRight 0.8s ease-out 0.6s both;
  }

  .settings-trigger {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    cursor: pointer;
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 1px 4px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .settings-trigger:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.15),
      0 2px 6px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  .trigger-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .current-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #374151;
  }

  .engine-icon {
    font-size: 1rem;
  }

  .engine-name {
    font-weight: 500;
  }

  .separator {
    color: #9ca3af;
    font-weight: 300;
  }

  .time-format {
    font-weight: 400;
    color: #6b7280;
  }

  .expand-arrow {
    color: #6b7280;
    transition: transform 0.3s ease;
    flex-shrink: 0;
  }

  .expand-arrow.open {
    transform: rotate(180deg);
  }

  .settings-content {
    position: absolute;
    top: calc(100% + 0.75rem);
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 1rem;
    min-width: 200px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .setting-section {
    margin-bottom: 1rem;
  }

  .setting-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.75rem;
  }

  .engine-options {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .engine-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .engine-option:hover {
    background: rgba(121, 180, 166, 0.1);
  }

  .engine-option.active {
    background: rgba(121, 180, 166, 0.15);
    color: #047857;
  }

  .engine-option .engine-icon {
    margin-right: 0.5rem;
  }

  .engine-option .engine-name {
    flex: 1;
    font-size: 0.875rem;
  }

  .check-icon {
    color: #047857;
    width: 16px;
    height: 16px;
  }

  .format-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .format-button {
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

  .format-button:hover {
    background: rgba(121, 180, 166, 0.1);
    border-color: rgba(121, 180, 166, 0.5);
  }

  .format-button.active {
    background: rgba(121, 180, 166, 0.2);
    border-color: #79b4a6;
    color: #047857;
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

  .panel-slide-enter-active,
  .panel-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .panel-slide-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }

  .panel-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .settings-panel {
      top: 1.5rem;
      right: 1.5rem;
    }

    .settings-trigger {
      padding: 0.625rem 0.875rem;
    }

    .current-info {
      font-size: 0.8rem;
      gap: 0.4rem;
    }

    .engine-name,
    .time-format {
      font-size: 0.75rem;
    }

    .settings-content {
      min-width: 180px;
      padding: 0.875rem;
    }

    .section-title {
      font-size: 0.8rem;
      margin-bottom: 0.625rem;
    }

    .engine-option {
      padding: 0.4rem 0.6rem;
    }

    .engine-option .engine-name {
      font-size: 0.8rem;
    }

    .format-button {
      padding: 0.4rem 0.6rem;
      font-size: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .settings-panel {
      top: 1rem;
      right: 1rem;
    }

    .settings-trigger {
      padding: 0.5rem 0.75rem;
    }

    .current-info {
      font-size: 0.75rem;
      gap: 0.3rem;
    }

    .engine-name,
    .time-format {
      font-size: 0.7rem;
    }

    .settings-content {
      min-width: 160px;
      padding: 0.75rem;
    }

    .section-title {
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .engine-option {
      padding: 0.35rem 0.5rem;
    }

    .engine-option .engine-name {
      font-size: 0.75rem;
    }

    .format-button {
      padding: 0.35rem 0.5rem;
      font-size: 0.7rem;
    }
  }
</style>
