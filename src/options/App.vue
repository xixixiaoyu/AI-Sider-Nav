<template>
  <div class="options-container">
    <!-- 导航标签 -->
    <nav class="nav-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['nav-tab', { active: activeTab === tab.id }]"
      >
        <div :class="tab.icon" class="mr-2"></div>
        {{ tab.name }}
      </button>
    </nav>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- AI 设置 -->
      <div v-if="activeTab === 'ai'" class="tab-content">
        <h2>AI 设置</h2>
        <div class="settings-grid">
          <div class="setting-card">
            <h3>AI 服务提供商</h3>
            <select v-model="settings.aiProvider" @change="saveSettings" class="setting-select">
              <option value="openai">OpenAI GPT</option>
              <option value="claude">Anthropic Claude</option>
              <option value="gemini">Google Gemini</option>
            </select>
            <p class="setting-description">选择您偏好的 AI 服务提供商</p>
          </div>

          <div class="setting-card">
            <h3>API 密钥</h3>
            <div class="api-key-input">
              <input
                v-model="settings.apiKey"
                :type="showApiKey ? 'text' : 'password'"
                @blur="saveSettings"
                placeholder="输入您的 API 密钥"
                class="setting-input"
              >
              <button @click="showApiKey = !showApiKey" class="toggle-btn">
                <div :class="showApiKey ? 'i-carbon-view-off' : 'i-carbon-view'"></div>
              </button>
            </div>
            <p class="setting-description">API 密钥将安全存储在本地，不会上传到服务器</p>
          </div>
        </div>
      </div>

      <!-- 界面设置 -->
      <div v-if="activeTab === 'interface'" class="tab-content">
        <h2>界面设置</h2>
        <div class="settings-grid">
          <div class="setting-card">
            <h3>侧边栏位置</h3>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  v-model="settings.sidebarPosition"
                  @change="saveSettings"
                  type="radio"
                  value="left"
                >
                <span>左侧</span>
              </label>
              <label class="radio-option">
                <input
                  v-model="settings.sidebarPosition"
                  @change="saveSettings"
                  type="radio"
                  value="right"
                >
                <span>右侧</span>
              </label>
            </div>
          </div>

          <div class="setting-card">
            <h3>主题设置</h3>
            <select v-model="settings.theme" @change="saveSettings" class="setting-select">
              <option value="auto">跟随系统</option>
              <option value="light">浅色主题</option>
              <option value="dark">深色主题</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 功能设置 -->
      <div v-if="activeTab === 'features'" class="tab-content">
        <h2>功能设置</h2>
        <div class="settings-grid">
          <div class="setting-card">
            <h3>默认搜索引擎</h3>
            <select v-model="settings.defaultSearchEngine" @change="saveSettings" class="setting-select">
              <option value="Google">Google</option>
              <option value="Bing">Bing</option>
            </select>
          </div>

          <div class="setting-card">
            <h3>自动功能</h3>
            <div class="checkbox-group">
              <label class="checkbox-option">
                <input
                  v-model="settings.autoSummarize"
                  @change="saveSettings"
                  type="checkbox"
                >
                <span>自动总结页面内容</span>
              </label>
            </div>
            <p class="setting-description">在访问新页面时自动提取和总结内容</p>
          </div>
        </div>
      </div>

      <!-- 数据管理 -->
      <div v-if="activeTab === 'data'" class="tab-content">
        <h2>数据管理</h2>
        <div class="settings-grid">
          <div class="setting-card">
            <h3>导出数据</h3>
            <button @click="exportData" class="action-btn primary">
              <div class="i-carbon-download mr-2"></div>
              导出所有数据
            </button>
            <p class="setting-description">导出对话历史、设置和其他数据</p>
          </div>

          <div class="setting-card">
            <h3>导入数据</h3>
            <button @click="importData" class="action-btn secondary">
              <div class="i-carbon-upload mr-2"></div>
              从文件导入
            </button>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              @change="handleFileImport"
              class="hidden"
            >
            <p class="setting-description">从备份文件恢复数据</p>
          </div>

          <div class="setting-card danger">
            <h3>清除数据</h3>
            <button @click="clearAllData" class="action-btn danger">
              <div class="i-carbon-trash-can mr-2"></div>
              清除所有数据
            </button>
            <p class="setting-description">删除所有对话历史、设置和缓存数据（不可恢复）</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存状态提示 -->
    <div v-if="saveStatus" :class="['save-status', saveStatus.type]">
      {{ saveStatus.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useSettingsStore } from '@/stores'

const settingsStore = useSettingsStore()
const activeTab = ref('ai')
const showApiKey = ref(false)
const fileInput = ref<HTMLInputElement>()
const saveStatus = ref<{ type: 'success' | 'error', message: string } | null>(null)

const tabs = [
  { id: 'ai', name: 'AI 设置', icon: 'i-carbon-chat' },
  { id: 'interface', name: '界面设置', icon: 'i-carbon-settings' },
  { id: 'features', name: '功能设置', icon: 'i-carbon-tools' },
  { id: 'data', name: '数据管理', icon: 'i-carbon-data-base' }
]

const settings = reactive({
  aiProvider: 'openai' as 'openai' | 'claude' | 'gemini',
  apiKey: '',
  defaultSearchEngine: 'Google',
  sidebarPosition: 'right' as 'left' | 'right',
  autoSummarize: false,
  theme: 'auto' as 'auto' | 'light' | 'dark'
})

onMounted(async () => {
  await settingsStore.loadSettings()
  Object.assign(settings, settingsStore.settings)
})

const saveSettings = async () => {
  try {
    await settingsStore.updateSettings(settings)
    showSaveStatus('success', '设置已保存')
  } catch (error) {
    showSaveStatus('error', '保存失败，请重试')
  }
}

const exportData = async () => {
  try {
    const data = {
      settings: settingsStore.settings,
      timestamp: Date.now(),
      version: '1.0.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-sider-nav-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    URL.revokeObjectURL(url)
    showSaveStatus('success', '数据导出成功')
  } catch (error) {
    showSaveStatus('error', '导出失败，请重试')
  }
}

const importData = () => {
  fileInput.value?.click()
}

const handleFileImport = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    if (data.settings) {
      await settingsStore.updateSettings(data.settings)
      Object.assign(settings, data.settings)
      showSaveStatus('success', '数据导入成功')
    } else {
      showSaveStatus('error', '文件格式不正确')
    }
  } catch (error) {
    showSaveStatus('error', '导入失败，请检查文件格式')
  }
}

const clearAllData = async () => {
  if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
    try {
      await chrome.storage.local.clear()
      await chrome.storage.sync.clear()
      await settingsStore.resetSettings()
      Object.assign(settings, settingsStore.settings)
      showSaveStatus('success', '所有数据已清除')
    } catch (error) {
      showSaveStatus('error', '清除失败，请重试')
    }
  }
}

const showSaveStatus = (type: 'success' | 'error', message: string) => {
  saveStatus.value = { type, message }
  setTimeout(() => {
    saveStatus.value = null
  }, 3000)
}
</script>

<style scoped>
.options-container {
  @apply relative;
}

.nav-tabs {
  @apply flex border-b border-gray-200 bg-gray-50 px-6;
}

.nav-tab {
  @apply flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 transition-colors;
}

.nav-tab.active {
  @apply text-blue-600 border-blue-600;
}

.content-area {
  @apply p-6;
}

.tab-content h2 {
  @apply text-2xl font-semibold text-gray-800 mb-6;
}

.settings-grid {
  @apply grid gap-6;
}

.setting-card {
  @apply bg-white border border-gray-200 rounded-lg p-6;
}

.setting-card.danger {
  @apply border-red-200 bg-red-50;
}

.setting-card h3 {
  @apply text-lg font-medium text-gray-800 mb-3;
}

.setting-select,
.setting-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.api-key-input {
  @apply flex gap-2;
}

.api-key-input .setting-input {
  @apply flex-1;
}

.toggle-btn {
  @apply px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors;
}

.radio-group,
.checkbox-group {
  @apply space-y-2;
}

.radio-option,
.checkbox-option {
  @apply flex items-center gap-2 text-sm;
}

.setting-description {
  @apply text-sm text-gray-600 mt-2;
}

.action-btn {
  @apply flex items-center px-4 py-2 rounded-md font-medium transition-colors;
}

.action-btn.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.action-btn.secondary {
  @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
}

.action-btn.danger {
  @apply bg-red-600 text-white hover:bg-red-700;
}

.save-status {
  @apply fixed bottom-4 right-4 px-4 py-2 rounded-md text-white font-medium;
}

.save-status.success {
  @apply bg-green-600;
}

.save-status.error {
  @apply bg-red-600;
}

.hidden {
  @apply sr-only;
}
</style>
