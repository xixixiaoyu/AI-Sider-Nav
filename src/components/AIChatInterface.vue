<template>
  <div class="ai-chat-interface">
    <!-- 会话选择器 -->
    <div v-if="aiStore.hasActiveSessions" class="chat-session-selector">
      <select
        :value="aiStore.currentSessionId"
        @change="handleSessionChange"
        class="session-select"
      >
        <option v-for="session in aiStore.chatSessions" :key="session.id" :value="session.id">
          {{ session.title }}
        </option>
      </select>

      <button
        v-if="aiStore.currentSessionId"
        class="session-delete-btn"
        :title="$t('deleteSession')"
        @click="handleDeleteSession"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.4477 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- 消息列表 -->
    <div class="chat-messages-container">
      <MessageList
        :messages="currentMessages"
        :is-loading="aiStore.isAIResponding"
        :current-response="aiStore.responseState.currentResponse"
        :thinking-content="aiStore.responseState.thinkingContent"
        :show-thinking="aiStore.settings.showThinking"
        @message-action="handleMessageAction"
      />
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-container">
      <!-- 错误提示 -->
      <div v-if="aiStore.responseState.error" class="chat-error">
        <div class="error-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" />
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" />
          </svg>
          <span>{{ aiStore.responseState.error }}</span>
        </div>
        <button class="error-dismiss" @click="aiStore.setResponseError(null)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" />
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" />
          </svg>
        </button>
      </div>

      <!-- 输入框 -->
      <ChatInput
        :disabled="aiStore.isAIResponding"
        :placeholder="inputPlaceholder"
        @send="handleSendMessage"
        @stop="handleStopGeneration"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="!aiStore.hasActiveSessions" class="chat-empty-state">
      <div class="empty-state-content">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h3>{{ $t('welcomeToAI') }}</h3>
        <p>{{ $t('startNewConversation') }}</p>
        <button class="start-chat-btn" @click="handleStartNewChat">
          {{ $t('newChat') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useAIAssistantStore } from '@/stores'
  import { getAIStreamResponse, abortCurrentRequest } from '@/services/deepseekService'
  import { i18n } from '@/i18n'
  import MessageList from './MessageList.vue'
  import ChatInput from './ChatInput.vue'

  const aiStore = useAIAssistantStore()

  // 计算属性
  const currentMessages = computed(() => {
    return aiStore.currentSession?.messages || []
  })

  const inputPlaceholder = computed(() => {
    if (aiStore.responseState.isLoading) {
      return $t('aiIsResponding')
    }
    if (aiStore.responseState.isThinking) {
      return $t('aiIsThinking')
    }
    return $t('typeMessage')
  })

  // 国际化
  const $t = (key: string) => i18n.t(key)

  // 方法
  const handleSessionChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    aiStore.switchToSession(target.value)
  }

  const handleDeleteSession = () => {
    if (aiStore.currentSessionId && confirm($t('confirmDeleteSession'))) {
      aiStore.deleteSession(aiStore.currentSessionId)
    }
  }

  const handleStartNewChat = () => {
    aiStore.createNewSession()
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || aiStore.isAIResponding) return

    try {
      // 确保有当前会话
      if (!aiStore.currentSessionId) {
        aiStore.createNewSession()
      }

      // 添加用户消息
      aiStore.addMessage({
        role: 'user',
        content: content.trim(),
      })

      // 开始 AI 响应
      aiStore.setResponseLoading(true)
      aiStore.setResponseError(null)

      // 准备消息历史
      const messages = aiStore.currentSession?.messages || []

      // 调用流式 API
      await getAIStreamResponse(
        messages, // 使用完整的消息历史
        (chunk: string) => {
          if (chunk === '[DONE]') {
            // 流式响应完成，将内容保存到消息历史
            const finalContent = aiStore.responseState.currentResponse.trim()
            aiStore.setResponseLoading(false)
            aiStore.setResponseThinking(false)

            if (finalContent) {
              aiStore.addMessage({
                role: 'assistant',
                content: finalContent,
              })
            }
            return
          }

          if (chunk === '[ABORTED]') {
            aiStore.setResponseLoading(false)
            aiStore.setResponseThinking(false)
            aiStore.setResponseError($t('requestAborted'))
            return
          }

          // 累积响应内容，但不立即保存到消息历史
          aiStore.appendResponseContent(chunk)
        },
        (thinking: string) => {
          aiStore.setResponseThinking(true)
          aiStore.setThinkingContent(thinking)
        },
        aiStore.settings.temperature
      )
    } catch (error) {
      console.error('发送消息失败:', error)
      aiStore.setResponseError(error instanceof Error ? error.message : $t('unknownError'))
    } finally {
      aiStore.setResponseLoading(false)
      aiStore.setResponseThinking(false)
    }
  }

  const handleStopGeneration = () => {
    abortCurrentRequest()
    aiStore.setResponseLoading(false)
    aiStore.setResponseThinking(false)
  }

  const handleMessageAction = (action: string, messageId: string) => {
    switch (action) {
      case 'copy':
        handleCopyMessage(messageId)
        break
      case 'delete':
        handleDeleteMessage(messageId)
        break
      case 'regenerate':
        handleRegenerateMessage(messageId)
        break
    }
  }

  const handleCopyMessage = async (messageId: string) => {
    const session = aiStore.currentSession
    if (!session) return

    const message = session.messages.find((m) => m.id === messageId)
    if (!message) return

    try {
      await navigator.clipboard.writeText(message.content)
      // 可以添加复制成功的提示
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const handleDeleteMessage = (messageId: string) => {
    if (confirm($t('confirmDeleteMessage'))) {
      aiStore.deleteMessage(messageId)
    }
  }

  const handleRegenerateMessage = async (messageId: string) => {
    const session = aiStore.currentSession
    if (!session) return

    const messageIndex = session.messages.findIndex((m) => m.id === messageId)
    if (messageIndex === -1 || messageIndex === 0) return

    // 获取前一条用户消息
    const previousMessage = session.messages[messageIndex - 1]
    if (previousMessage.role !== 'user') return

    // 删除当前助手消息
    aiStore.deleteMessage(messageId)

    // 重新发送前一条用户消息
    await handleSendMessage(previousMessage.content)
  }
</script>

<style scoped>
  .ai-chat-interface {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;
  }

  /* 会话选择器 */
  .chat-session-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .session-select {
    flex: 1;
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    font-size: 14px;
    color: #374151;
  }

  .session-delete-btn {
    padding: 6px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .session-delete-btn:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  /* 消息容器 */
  .chat-messages-container {
    flex: 1;
    overflow: hidden;
  }

  /* 输入容器 */
  .chat-input-container {
    border-top: 1px solid #e5e7eb;
    background: #ffffff;
  }

  /* 错误提示 */
  .chat-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #fef2f2;
    border-bottom: 1px solid #fecaca;
    color: #dc2626;
  }

  .error-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .error-dismiss {
    padding: 4px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #dc2626;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .error-dismiss:hover {
    background: rgba(220, 38, 38, 0.1);
  }

  /* 空状态 */
  .chat-empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }

  .empty-state-content {
    text-align: center;
    max-width: 300px;
  }

  .empty-state-icon {
    color: #14b8a6;
    margin-bottom: 16px;
  }

  .empty-state-content h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .empty-state-content p {
    margin: 0 0 20px 0;
    color: #6b7280;
    line-height: 1.5;
  }

  .start-chat-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .start-chat-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  }
</style>
