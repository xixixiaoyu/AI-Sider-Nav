<template>
  <div class="popup-container">
    <!-- 头部 -->
    <header class="header">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <div class="i-carbon-chat text-white text-lg"></div>
        </div>
        <h1 class="text-lg font-semibold text-gray-800">AI Sider Nav</h1>
      </div>
      <button 
        @click="toggleSidebar"
        class="btn-secondary text-sm"
        title="打开侧边栏"
      >
        <div class="i-carbon-menu mr-1"></div>
        侧边栏
      </button>
    </header>

    <!-- 搜索区域 -->
    <section class="search-section">
      <div class="search-input-container">
        <input
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="搜索任何内容..."
          class="search-input"
        >
        <button 
          @click="handleSearch"
          class="search-btn"
          :disabled="!searchQuery.trim()"
        >
          <div class="i-carbon-search"></div>
        </button>
      </div>

      <!-- 搜索引擎选择 -->
      <div class="search-engines">
        <button
          v-for="engine in searchStore.searchEngines"
          :key="engine.name"
          @click="handleSearch(engine.name)"
          :class="[
            'engine-btn',
            { 'active': engine.name === searchStore.defaultEngine }
          ]"
          :style="{ '--engine-color': engine.color }"
        >
          <div :class="engine.icon" class="text-lg"></div>
          <span>{{ engine.name }}</span>
        </button>
      </div>
    </section>

    <!-- 搜索历史 -->
    <section v-if="searchStore.searchHistory.length > 0" class="history-section">
      <div class="section-header">
        <h3>最近搜索</h3>
        <button @click="searchStore.clearHistory()" class="text-sm text-gray-500 hover:text-gray-700">
          清除
        </button>
      </div>
      <div class="history-list">
        <button
          v-for="query in searchStore.searchHistory.slice(0, 5)"
          :key="query"
          @click="searchFromHistory(query)"
          class="history-item"
        >
          <div class="i-carbon-search text-gray-400"></div>
          <span>{{ query }}</span>
        </button>
      </div>
    </section>

    <!-- 快捷功能 -->
    <section class="shortcuts-section">
      <h3 class="section-title">快捷功能</h3>
      <div class="shortcuts-grid">
        <button @click="openAIChat" class="shortcut-btn">
          <div class="i-carbon-chat text-blue-500"></div>
          <span>AI 对话</span>
        </button>
        <button @click="extractPageContent" class="shortcut-btn">
          <div class="i-carbon-copy text-green-500"></div>
          <span>提取内容</span>
        </button>
        <button @click="openOptions" class="shortcut-btn">
          <div class="i-carbon-settings text-gray-500"></div>
          <span>设置</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSearchStore } from '@/stores'

const searchStore = useSearchStore()
const searchQuery = ref('')

onMounted(async () => {
  await searchStore.loadSettings()
  await searchStore.loadHistory()
})

const handleSearch = (engineName?: string) => {
  if (searchQuery.value.trim()) {
    searchStore.search(searchQuery.value, engineName)
    searchQuery.value = ''
    window.close()
  }
}

const searchFromHistory = (query: string) => {
  searchQuery.value = query
  handleSearch()
}

const toggleSidebar = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab.id) {
      await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' })
    }
  } catch (error) {
    console.error('Failed to toggle sidebar:', error)
  }
  window.close()
}

const openAIChat = async () => {
  await toggleSidebar()
}

const extractPageContent = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab.id) {
      await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_SELECTION' })
      await toggleSidebar()
    }
  } catch (error) {
    console.error('Failed to extract content:', error)
  }
}

const openOptions = () => {
  chrome.runtime.openOptionsPage()
  window.close()
}
</script>

<style scoped>
.popup-container {
  @apply w-full h-full bg-gray-50 flex flex-col;
}

.header {
  @apply flex items-center justify-between p-4 bg-white border-b border-gray-200;
}

.search-section {
  @apply p-4 bg-white;
}

.search-input-container {
  @apply flex gap-2 mb-3;
}

.search-input {
  @apply flex-1 input;
}

.search-btn {
  @apply btn px-3;
}

.search-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.search-engines {
  @apply flex gap-2;
}

.engine-btn {
  @apply flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer bg-white;
}

.engine-btn.active {
  @apply border-2;
  border-color: var(--engine-color);
}

.history-section {
  @apply p-4 bg-white border-t border-gray-100;
}

.section-header {
  @apply flex items-center justify-between mb-2;
}

.section-header h3 {
  @apply text-sm font-medium text-gray-700;
}

.history-list {
  @apply space-y-1;
}

.history-item {
  @apply flex items-center gap-2 w-full px-2 py-1 text-left text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer;
}

.shortcuts-section {
  @apply flex-1 p-4;
}

.section-title {
  @apply text-sm font-medium text-gray-700 mb-3;
}

.shortcuts-grid {
  @apply grid grid-cols-3 gap-2;
}

.shortcut-btn {
  @apply flex flex-col items-center gap-1 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer;
}

.shortcut-btn span {
  @apply text-xs text-gray-600;
}
</style>
