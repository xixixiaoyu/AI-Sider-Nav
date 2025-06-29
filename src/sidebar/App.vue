<template>
  <div class="sidebar-container">
    <!-- 头部 -->
    <header class="sidebar-header">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 bg-teal-500 rounded flex items-center justify-center">
          <div class="i-carbon-chat text-white text-sm"></div>
        </div>
        <h1 class="text-sm font-semibold text-gray-800">AI 助手</h1>
      </div>
      
      <div class="flex items-center gap-1">
        <!-- 标签切换 -->
        <div class="tab-buttons">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'tab-btn',
              { 'active': activeTab === tab.id }
            ]"
            :title="tab.title"
          >
            <div :class="tab.icon" class="text-sm"></div>
          </button>
        </div>
        
        <!-- 关闭按钮 -->
        <button @click="closeSidebar" class="close-btn" title="关闭侧边栏">
          <div class="i-carbon-close text-sm"></div>
        </button>
      </div>
    </header>

    <!-- 内容区域 -->
    <main class="sidebar-content">
      <!-- AI 对话标签 -->
      <div v-if="activeTab === 'chat'" class="tab-content">
        <ChatTab />
      </div>
      
      <!-- 内容总结标签 -->
      <div v-else-if="activeTab === 'summary'" class="tab-content">
        <SummaryTab />
      </div>
      
      <!-- 设置标签 -->
      <div v-else-if="activeTab === 'settings'" class="tab-content">
        <SettingsTab />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAIStore, useSettingsStore } from '@/stores'
import ChatTab from './components/ChatTab.vue'
import SummaryTab from './components/SummaryTab.vue'
import SettingsTab from './components/SettingsTab.vue'

const aiStore = useAIStore()
const settingsStore = useSettingsStore()

const activeTab = ref<'chat' | 'summary' | 'settings'>('chat')

const tabs = [
  { id: 'chat', title: 'AI 对话', icon: 'i-carbon-chat' },
  { id: 'summary', title: '内容总结', icon: 'i-carbon-copy' },
  { id: 'settings', title: '设置', icon: 'i-carbon-settings' }
]

onMounted(async () => {
  await aiStore.loadConversations()
  await settingsStore.loadSettings()
  
  // 监听来自内容脚本的消息
  window.addEventListener('message', handleMessage)
})

const handleMessage = (event: MessageEvent) => {
  if (event.data.type === 'EXTRACT_SELECTION') {
    // 切换到总结标签并处理选中的内容
    activeTab.value = 'summary'
    if (event.data.payload) {
      aiStore.setPageContent(event.data.payload)
    }
  }
}

const closeSidebar = () => {
  // 发送关闭消息给内容脚本
  window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*')
}
</script>

<style scoped>
.sidebar-container {
  @apply w-full h-full bg-white flex flex-col shadow-lg;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sidebar-header {
  @apply flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50;
}

.tab-buttons {
  @apply flex gap-1;
}

.tab-btn {
  @apply p-1.5 rounded hover:bg-gray-200 transition-colors;
}

.tab-btn.active {
  @apply bg-teal-100 text-teal-600;
}

.close-btn {
  @apply p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700;
}

.sidebar-content {
  @apply flex-1 overflow-hidden;
}

.tab-content {
  @apply w-full h-full;
}
</style>
