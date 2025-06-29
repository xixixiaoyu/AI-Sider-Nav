<template>
  <div class="summary-container">
    <!-- 页面信息 -->
    <div class="page-info">
      <h3 class="text-sm font-medium text-gray-700 mb-2">当前页面</h3>
      <div v-if="pageContent" class="page-card">
        <div class="page-title">{{ pageContent.title }}</div>
        <div class="page-url">{{ pageContent.url }}</div>
      </div>
      <div v-else class="empty-page">
        <div class="i-carbon-document text-2xl text-gray-300 mb-1"></div>
        <p class="text-gray-500 text-xs">暂无页面内容</p>
      </div>
    </div>

    <!-- 内容提取 -->
    <div class="content-section">
      <div class="section-header">
        <h3 class="text-sm font-medium text-gray-700">内容提取</h3>
        <button @click="extractContent" class="extract-btn" :disabled="isExtracting">
          <div v-if="isExtracting" class="i-carbon-loading animate-spin text-sm"></div>
          <div v-else class="i-carbon-copy text-sm"></div>
          <span class="ml-1">{{ isExtracting ? '提取中...' : '提取内容' }}</span>
        </button>
      </div>

      <!-- 选中文本 -->
      <div v-if="pageContent?.selectedText" class="content-block">
        <div class="content-label">选中文本</div>
        <div class="content-text">{{ pageContent.selectedText }}</div>
        <div class="content-actions">
          <button @click="summarizeSelection" class="action-btn">
            <div class="i-carbon-chat text-sm"></div>
            <span>总结选中内容</span>
          </button>
          <button @click="copyText(pageContent.selectedText)" class="action-btn">
            <div class="i-carbon-copy text-sm"></div>
            <span>复制</span>
          </button>
        </div>
      </div>

      <!-- 页面全文 -->
      <div v-if="pageContent?.fullText" class="content-block">
        <div class="content-label">页面内容</div>
        <div class="content-text">{{ truncateText(pageContent.fullText, 200) }}</div>
        <div class="content-actions">
          <button @click="summarizePage" class="action-btn">
            <div class="i-carbon-chat text-sm"></div>
            <span>总结页面</span>
          </button>
          <button @click="copyText(pageContent.fullText)" class="action-btn">
            <div class="i-carbon-copy text-sm"></div>
            <span>复制全文</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <h3 class="text-sm font-medium text-gray-700 mb-2">快速操作</h3>
      <div class="actions-grid">
        <button @click="askQuestion" class="quick-action-btn">
          <div class="i-carbon-help text-lg text-blue-500"></div>
          <span>提问</span>
        </button>
        <button @click="translate" class="quick-action-btn">
          <div class="i-carbon-translate text-lg text-green-500"></div>
          <span>翻译</span>
        </button>
        <button @click="explain" class="quick-action-btn">
          <div class="i-carbon-idea text-lg text-yellow-500"></div>
          <span>解释</span>
        </button>
        <button @click="rewrite" class="quick-action-btn">
          <div class="i-carbon-edit text-lg text-purple-500"></div>
          <span>改写</span>
        </button>
      </div>
    </div>

    <!-- 历史总结 -->
    <div v-if="summaryHistory.length > 0" class="history-section">
      <h3 class="text-sm font-medium text-gray-700 mb-2">历史总结</h3>
      <div class="history-list">
        <div
          v-for="item in summaryHistory.slice(0, 3)"
          :key="item.id"
          class="history-item"
        >
          <div class="history-title">{{ item.title }}</div>
          <div class="history-summary">{{ truncateText(item.summary, 100) }}</div>
          <div class="history-time">{{ formatTime(item.timestamp) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAIStore } from '@/stores'

const aiStore = useAIStore()
const isExtracting = ref(false)
const summaryHistory = ref<Array<{
  id: string
  title: string
  summary: string
  timestamp: number
}>>([])

const pageContent = computed(() => aiStore.pageContent)

onMounted(() => {
  loadSummaryHistory()
})

const extractContent = async () => {
  isExtracting.value = true
  try {
    // 发送消息给内容脚本提取页面内容
    window.parent.postMessage({ type: 'EXTRACT_PAGE_CONTENT' }, '*')
    
    // 模拟提取延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.error('Failed to extract content:', error)
  } finally {
    isExtracting.value = false
  }
}

const summarizeSelection = async () => {
  if (pageContent.value?.selectedText) {
    await aiStore.sendMessage(`请总结以下选中的内容：\n\n${pageContent.value.selectedText}`)
    // 切换到对话标签
    switchToChat()
  }
}

const summarizePage = async () => {
  if (pageContent.value?.fullText) {
    const content = truncateText(pageContent.value.fullText, 1000)
    await aiStore.sendMessage(`请总结以下页面内容：\n\n${content}`)
    switchToChat()
  }
}

const askQuestion = async () => {
  const question = prompt('请输入您的问题：')
  if (question && pageContent.value) {
    const context = pageContent.value.selectedText || truncateText(pageContent.value.fullText || '', 500)
    await aiStore.sendMessage(`基于以下内容回答问题：\n\n内容：${context}\n\n问题：${question}`)
    switchToChat()
  }
}

const translate = async () => {
  const text = pageContent.value?.selectedText || pageContent.value?.fullText
  if (text) {
    const content = truncateText(text, 500)
    await aiStore.sendMessage(`请将以下内容翻译成中文：\n\n${content}`)
    switchToChat()
  }
}

const explain = async () => {
  const text = pageContent.value?.selectedText || pageContent.value?.fullText
  if (text) {
    const content = truncateText(text, 500)
    await aiStore.sendMessage(`请解释以下内容：\n\n${content}`)
    switchToChat()
  }
}

const rewrite = async () => {
  const text = pageContent.value?.selectedText
  if (text) {
    await aiStore.sendMessage(`请改写以下内容，使其更加清晰易懂：\n\n${text}`)
    switchToChat()
  }
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('Failed to copy text:', error)
  }
}

const switchToChat = () => {
  // 发送消息给父组件切换标签
  window.parent.postMessage({ type: 'SWITCH_TAB', payload: 'chat' }, '*')
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

const loadSummaryHistory = () => {
  // 从存储中加载历史总结
  // 这里使用模拟数据
  summaryHistory.value = []
}
</script>

<style scoped>
.summary-container {
  @apply flex flex-col h-full overflow-y-auto p-3 space-y-4;
}

.page-info {
  @apply bg-gray-50 rounded-lg p-3;
}

.page-card {
  @apply bg-white rounded border p-2;
}

.page-title {
  @apply font-medium text-sm text-gray-800 mb-1;
}

.page-url {
  @apply text-xs text-gray-500 truncate;
}

.empty-page {
  @apply flex flex-col items-center justify-center py-4 text-center;
}

.content-section {
  @apply space-y-3;
}

.section-header {
  @apply flex items-center justify-between;
}

.extract-btn {
  @apply flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50;
}

.content-block {
  @apply bg-gray-50 rounded-lg p-3 space-y-2;
}

.content-label {
  @apply text-xs font-medium text-gray-600;
}

.content-text {
  @apply text-sm text-gray-800 bg-white rounded p-2 border;
  max-height: 100px;
  overflow-y: auto;
}

.content-actions {
  @apply flex gap-2;
}

.action-btn {
  @apply flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors;
}

.quick-actions {
  @apply bg-gray-50 rounded-lg p-3;
}

.actions-grid {
  @apply grid grid-cols-2 gap-2;
}

.quick-action-btn {
  @apply flex flex-col items-center gap-1 p-2 bg-white rounded border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all;
}

.quick-action-btn span {
  @apply text-xs text-gray-600;
}

.history-section {
  @apply bg-gray-50 rounded-lg p-3;
}

.history-list {
  @apply space-y-2;
}

.history-item {
  @apply bg-white rounded p-2 border;
}

.history-title {
  @apply text-xs font-medium text-gray-800;
}

.history-summary {
  @apply text-xs text-gray-600 mt-1;
}

.history-time {
  @apply text-xs text-gray-400 mt-1;
}
</style>
