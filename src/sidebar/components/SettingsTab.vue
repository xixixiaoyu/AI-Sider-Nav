<template>
  <div class="settings-container">
    <!-- AI 设置 -->
    <div class="settings-section">
      <h3 class="section-title">AI 设置</h3>
      
      <div class="setting-item">
        <label class="setting-label">AI 服务提供商</label>
        <select 
          v-model="localSettings.aiProvider" 
          @change="updateSettings"
          class="setting-select"
        >
          <option value="openai">OpenAI</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>

      <div class="setting-item">
        <label class="setting-label">API 密钥</label>
        <div class="api-key-input">
          <input
            v-model="localSettings.apiKey"
            :type="showApiKey ? 'text' : 'password'"
            @blur="updateSettings"
            placeholder="输入您的 API 密钥"
            class="setting-input"
          >
          <button 
            @click="showApiKey = !showApiKey"
            class="toggle-btn"
            type="button"
          >
            <div :class="showApiKey ? 'i-carbon-view-off' : 'i-carbon-view'" class="text-sm"></div>
          </button>
        </div>
        <p class="setting-help">API 密钥将安全存储在本地，不会上传到服务器</p>
      </div>
    </div>

    <!-- 界面设置 -->
    <div class="settings-section">
      <h3 class="section-title">界面设置</h3>
      
      <div class="setting-item">
        <label class="setting-label">侧边栏位置</label>
        <div class="radio-group">
          <label class="radio-item">
            <input
              v-model="localSettings.sidebarPosition"
              @change="updateSettings"
              type="radio"
              value="left"
            >
            <span>左侧</span>
          </label>
          <label class="radio-item">
            <input
              v-model="localSettings.sidebarPosition"
              @change="updateSettings"
              type="radio"
              value="right"
            >
            <span>右侧</span>
          </label>
        </div>
      </div>

      <div class="setting-item">
        <label class="setting-label">主题</label>
        <select 
          v-model="localSettings.theme" 
          @change="updateSettings"
          class="setting-select"
        >
          <option value="auto">跟随系统</option>
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
      </div>
    </div>

    <!-- 功能设置 -->
    <div class="settings-section">
      <h3 class="section-title">功能设置</h3>
      
      <div class="setting-item">
        <label class="setting-label">默认搜索引擎</label>
        <select 
          v-model="localSettings.defaultSearchEngine" 
          @change="updateSettings"
          class="setting-select"
        >
          <option value="Google">Google</option>
          <option value="Bing">Bing</option>
        </select>
      </div>

      <div class="setting-item">
        <div class="checkbox-item">
          <input
            v-model="localSettings.autoSummarize"
            @change="updateSettings"
            type="checkbox"
            id="auto-summarize"
          >
          <label for="auto-summarize" class="checkbox-label">
            自动总结页面内容
          </label>
        </div>
        <p class="setting-help">在访问新页面时自动提取和总结内容</p>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="settings-section">
      <h3 class="section-title">数据管理</h3>
      
      <div class="setting-item">
        <button @click="exportData" class="action-btn secondary">
          <div class="i-carbon-download text-sm"></div>
          <span>导出数据</span>
        </button>
        <p class="setting-help">导出对话历史和设置</p>
      </div>

      <div class="setting-item">
        <button @click="importData" class="action-btn secondary">
          <div class="i-carbon-upload text-sm"></div>
          <span>导入数据</span>
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          @change="handleFileImport"
          class="hidden"
        >
        <p class="setting-help">从文件导入数据</p>
      </div>

      <div class="setting-item">
        <button @click="clearAllData" class="action-btn danger">
          <div class="i-carbon-trash-can text-sm"></div>
          <span>清除所有数据</span>
        </button>
        <p class="setting-help">删除所有对话历史、设置和缓存数据</p>
      </div>
    </div>

    <!-- 关于 -->
    <div class="settings-section">
      <h3 class="section-title">关于</h3>
      
      <div class="about-info">
        <div class="app-info">
          <div class="app-icon">
            <div class="i-carbon-chat text-2xl text-blue-500"></div>
          </div>
          <div>
            <div class="app-name">AI Sider Nav</div>
            <div class="app-version">版本 1.0.0</div>
          </div>
        </div>
        
        <div class="links">
          <a href="#" @click.prevent="openLink('https://github.com')" class="link">
            <div class="i-carbon-logo-github text-sm"></div>
            <span>GitHub</span>
          </a>
          <a href="#" @click.prevent="openLink('mailto:support@example.com')" class="link">
            <div class="i-carbon-email text-sm"></div>
            <span>反馈</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useSettingsStore, useAIStore } from '@/stores'
import type { ExtensionSettings } from '@/types'

const settingsStore = useSettingsStore()
const aiStore = useAIStore()

const showApiKey = ref(false)
const fileInput = ref<HTMLInputElement>()

const localSettings = reactive<ExtensionSettings>({
  aiProvider: 'openai',
  defaultSearchEngine: 'Google',
  sidebarPosition: 'right',
  autoSummarize: false,
  theme: 'auto'
})

onMounted(async () => {
  await settingsStore.loadSettings()
  Object.assign(localSettings, settingsStore.settings)
})

const updateSettings = async () => {
  await settingsStore.updateSettings(localSettings)
}

const exportData = async () => {
  try {
    const data = {
      settings: settingsStore.settings,
      conversations: aiStore.conversations,
      timestamp: Date.now()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-sider-nav-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export data:', error)
    alert('导出失败，请稍后重试')
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
      Object.assign(localSettings, data.settings)
    }
    
    if (data.conversations) {
      // 这里应该有导入对话的逻辑
      console.log('Importing conversations:', data.conversations)
    }
    
    alert('导入成功！')
  } catch (error) {
    console.error('Failed to import data:', error)
    alert('导入失败，请检查文件格式')
  }
}

const clearAllData = async () => {
  if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
    try {
      await settingsStore.resetSettings()
      aiStore.clearAllConversations()
      await chrome.storage.local.clear()
      await chrome.storage.sync.clear()
      
      Object.assign(localSettings, settingsStore.settings)
      alert('数据已清除')
    } catch (error) {
      console.error('Failed to clear data:', error)
      alert('清除失败，请稍后重试')
    }
  }
}

const openLink = (url: string) => {
  chrome.tabs.create({ url })
}
</script>

<style scoped>
.settings-container {
  @apply flex flex-col h-full overflow-y-auto p-3 space-y-4;
}

.settings-section {
  @apply bg-gray-50 rounded-lg p-3 space-y-3;
}

.section-title {
  @apply text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2;
}

.setting-item {
  @apply space-y-1;
}

.setting-label {
  @apply block text-xs font-medium text-gray-700;
}

.setting-input {
  @apply w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.setting-select {
  @apply w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.api-key-input {
  @apply flex gap-1;
}

.api-key-input .setting-input {
  @apply flex-1;
}

.toggle-btn {
  @apply px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors;
}

.setting-help {
  @apply text-xs text-gray-500;
}

.radio-group {
  @apply flex gap-3;
}

.radio-item {
  @apply flex items-center gap-1 text-sm;
}

.radio-item input {
  @apply text-blue-500;
}

.checkbox-item {
  @apply flex items-center gap-2;
}

.checkbox-label {
  @apply text-sm text-gray-700 cursor-pointer;
}

.action-btn {
  @apply flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors;
}

.action-btn.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
}

.action-btn.danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.about-info {
  @apply space-y-3;
}

.app-info {
  @apply flex items-center gap-3;
}

.app-icon {
  @apply w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center;
}

.app-name {
  @apply font-semibold text-gray-800;
}

.app-version {
  @apply text-sm text-gray-500;
}

.links {
  @apply flex gap-3;
}

.link {
  @apply flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors;
}

.hidden {
  @apply sr-only;
}
</style>
