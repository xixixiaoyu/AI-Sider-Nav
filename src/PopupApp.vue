<template>
  <div class="popup-container">
    <div class="header">
      <h1>AI Sider Nav 设置</h1>
    </div>

    <div class="content">
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        正在加载设置...
      </div>

      <div v-else class="settings-content">
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

        <!-- AI 助手设置 -->
        <div class="setting-section">
          <div class="section-title">AI 助手</div>

          <!-- 显示触发按钮 -->
          <div class="toggle-option">
            <div class="toggle-info">
              <span class="toggle-label">显示触发按钮</span>
              <span class="toggle-desc">在网页右下角显示 AI 助手触发按钮</span>
            </div>
            <div
              class="toggle-switch"
              :class="{ active: aiSettings.showTriggerButton }"
              @click="toggleTriggerButton"
            >
              <div class="toggle-slider"></div>
            </div>
          </div>
        </div>

        <!-- 文本选择复制功能 -->
        <div class="setting-section">
          <div class="section-title">文本复制</div>

          <!-- 主开关 -->
          <div class="toggle-option">
            <div class="toggle-info">
              <span class="toggle-label">启用文本选择复制</span>
              <span class="toggle-desc">选中文本时显示复制按钮</span>
            </div>
            <div
              class="toggle-switch"
              :class="{ active: settings.textSelection.enabled }"
              @click="toggleTextSelection"
            >
              <div class="toggle-slider"></div>
            </div>
          </div>

          <!-- 详细设置 -->
          <div v-if="settings.textSelection.enabled" class="sub-settings">
            <!-- 显示复制按钮 -->
            <div class="toggle-option small">
              <span class="toggle-label">显示复制按钮</span>
              <div
                class="toggle-switch small"
                :class="{ active: settings.textSelection.showCopyButton }"
                @click="toggleShowCopyButton"
              >
                <div class="toggle-slider"></div>
              </div>
            </div>

            <!-- 自动隐藏延迟 -->
            <div class="range-option">
              <div class="range-info">
                <span class="range-label">按钮自动隐藏延迟</span>
                <span class="range-value">{{ settings.textSelection.autoHideDelay / 1000 }}秒</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                :value="settings.textSelection.autoHideDelay"
                @input="updateAutoHideDelay"
                class="range-slider"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useSettingsStore, useAIAssistantStore } from '@/stores'

  const settingsStore = useSettingsStore()
  const aiAssistantStore = useAIAssistantStore()

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
  const isLoading = computed(() => settingsStore.isLoading)
  const aiSettings = computed(() => aiAssistantStore.settings)

  // 方法
  const selectEngine = async (engineKey: 'google' | 'bing' | 'baidu') => {
    await settingsStore.updateSetting('searchEngine', engineKey)
  }

  const setTimeFormat = async (format: '12h' | '24h') => {
    await settingsStore.updateSetting('timeFormat', format)
  }

  // AI 助手相关方法
  const toggleTriggerButton = async () => {
    await aiAssistantStore.updateSettings({
      showTriggerButton: !aiSettings.value.showTriggerButton,
    })
  }

  // 文本选择复制功能相关方法
  const toggleTextSelection = async () => {
    await settingsStore.updateSetting('textSelection', {
      ...settings.value.textSelection,
      enabled: !settings.value.textSelection.enabled,
    })
  }

  const toggleShowCopyButton = async () => {
    await settingsStore.updateSetting('textSelection', {
      ...settings.value.textSelection,
      showCopyButton: !settings.value.textSelection.showCopyButton,
    })
  }

  const updateAutoHideDelay = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const delay = parseInt(target.value)
    await settingsStore.updateSetting('textSelection', {
      ...settings.value.textSelection,
      autoHideDelay: delay,
    })
  }
</script>

<style scoped>
  .popup-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 480px;
  }

  .header {
    background: linear-gradient(135deg, #79b4a6 0%, #6ba3a0 100%);
    color: white;
    padding: 16px 20px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header h1 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #6b7280;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #79b4a6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .setting-section {
    display: flex;
    flex-direction: column;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* 其他样式将通过全局样式继承 */
</style>
