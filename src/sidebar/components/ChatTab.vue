<template>
  <div class="chat-container">
    <!-- 对话列表头部 -->
    <div class="chat-header">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-700">对话历史</h3>
        <button @click="createNewChat" class="new-chat-btn" title="新建对话">
          <div class="i-carbon-add text-sm"></div>
        </button>
      </div>
      
      <!-- 对话列表 -->
      <div v-if="aiStore.hasConversations" class="conversation-list">
        <button
          v-for="conversation in aiStore.conversations.slice(0, 3)"
          :key="conversation.id"
          @click="selectConversation(conversation.id)"
          :class="[
            'conversation-item',
            { 'active': conversation.id === aiStore.currentConversationId }
          ]"
        >
          <div class="conversation-title">{{ conversation.title }}</div>
          <div class="conversation-time">
            {{ formatTime(conversation.updatedAt) }}
          </div>
        </button>
      </div>
    </div>

    <!-- 消息区域 -->
    <div class="messages-container" ref="messagesContainer">
      <div v-if="!currentConversation || currentConversation.messages.length === 0" class="empty-state">
        <div class="i-carbon-chat text-4xl text-gray-300 mb-2"></div>
        <p class="text-gray-500 text-sm text-center">开始新的对话</p>
        <p class="text-gray-400 text-xs text-center mt-1">输入消息开始与 AI 助手对话</p>
      </div>
      
      <div v-else class="messages-list">
        <div
          v-for="message in currentConversation.messages"
          :key="message.id"
          :class="[
            'message',
            message.role === 'user' ? 'user-message' : 'assistant-message'
          ]"
        >
          <div class="message-avatar">
            <div v-if="message.role === 'user'" class="i-carbon-user text-sm"></div>
            <div v-else class="i-carbon-chat text-sm"></div>
          </div>
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="aiStore.isLoading" class="message assistant-message">
          <div class="message-avatar">
            <div class="i-carbon-chat text-sm"></div>
          </div>
          <div class="message-content">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          v-model="inputMessage"
          @keydown="handleKeydown"
          placeholder="输入消息..."
          class="message-input"
          rows="1"
          ref="inputRef"
        ></textarea>
        <button
          @click="sendMessage"
          :disabled="!inputMessage.trim() || aiStore.isLoading"
          class="send-btn"
        >
          <div class="i-carbon-send text-sm"></div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useAIStore } from '@/stores'

const aiStore = useAIStore()
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()

const currentConversation = computed(() => aiStore.currentConversation)

// 监听消息变化，自动滚动到底部
watch(
  () => currentConversation.value?.messages.length,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  }
)

const createNewChat = () => {
  aiStore.createConversation()
  inputRef.value?.focus()
}

const selectConversation = (id: string) => {
  aiStore.currentConversationId = id
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || aiStore.isLoading) return
  
  const message = inputMessage.value.trim()
  inputMessage.value = ''
  
  await aiStore.sendMessage(message)
  
  // 自动调整输入框高度
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
  
  // 自动调整输入框高度
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto'
      inputRef.value.style.height = inputRef.value.scrollHeight + 'px'
    }
  })
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return date.toLocaleDateString()
}
</script>

<style scoped>
.chat-container {
  @apply flex flex-col h-full;
}

.chat-header {
  @apply p-3 border-b border-gray-200 bg-gray-50;
}

.new-chat-btn {
  @apply p-1 rounded hover:bg-gray-200 transition-colors text-gray-600;
}

.conversation-list {
  @apply mt-2 space-y-1;
}

.conversation-item {
  @apply w-full text-left p-2 rounded text-xs hover:bg-gray-100 transition-colors;
}

.conversation-item.active {
  @apply bg-teal-50 border border-teal-200;
}

.conversation-title {
  @apply font-medium text-gray-800 truncate;
}

.conversation-time {
  @apply text-gray-500 mt-1;
}

.messages-container {
  @apply flex-1 overflow-y-auto p-3;
}

.empty-state {
  @apply flex flex-col items-center justify-center h-full;
}

.messages-list {
  @apply space-y-3;
}

.message {
  @apply flex gap-2;
}

.user-message {
  @apply flex-row-reverse;
}

.message-avatar {
  @apply w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-600;
}

.user-message .message-avatar {
  @apply bg-teal-500 text-white;
}

.message-content {
  @apply max-w-[80%];
}

.user-message .message-content {
  @apply text-right;
}

.message-text {
  @apply bg-gray-100 rounded-lg px-3 py-2 text-sm;
}

.user-message .message-text {
  @apply bg-teal-500 text-white;
}

.message-time {
  @apply text-xs text-gray-500 mt-1;
}

.loading-dots {
  @apply bg-gray-100 rounded-lg px-3 py-2 flex gap-1;
}

.loading-dots span {
  @apply w-1 h-1 bg-gray-400 rounded-full animate-pulse;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.input-container {
  @apply p-3 border-t border-gray-200 bg-white;
}

.input-wrapper {
  @apply flex gap-2 items-end;
}

.message-input {
  @apply flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent;
  max-height: 100px;
}

.send-btn {
  @apply p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
