<template>
  <div
    class="message-item"
    :class="[`message-item--${message.role}`, { 'message-item--streaming': isStreaming }]"
  >
    <!-- 消息头像 -->
    <div class="message-avatar">
      <div v-if="message.role === 'user'" class="avatar avatar--user">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" />
        </svg>
      </div>
      <div v-else class="avatar avatar--assistant">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
    </div>

    <!-- 消息内容 -->
    <div class="message-content">
      <!-- 消息气泡 -->
      <div class="message-bubble">
        <div class="message-text" v-html="formattedContent"></div>

        <!-- 流式响应光标 -->
        <span v-if="isStreaming" class="streaming-cursor">|</span>
      </div>

      <!-- 消息时间 -->
      <div class="message-time">
        {{ formatTime(message.timestamp) }}
      </div>

      <!-- 消息操作 -->
      <div v-if="!isStreaming" class="message-actions">
        <button class="action-btn" :title="$t('copyMessage')" @click="$emit('action', 'copy')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect
              x="9"
              y="9"
              width="13"
              height="13"
              rx="2"
              ry="2"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
        </button>

        <button
          v-if="message.role === 'assistant'"
          class="action-btn"
          :title="$t('regenerateResponse')"
          @click="$emit('action', 'regenerate')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M1 4V10H7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M23 20V14H17"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M20.49 9C19.9828 7.56678 19.1209 6.28392 17.9845 5.27304C16.8482 4.26216 15.4745 3.55682 13.9917 3.21834C12.5089 2.87986 10.9652 2.91902 9.50481 3.33329C8.04437 3.74757 6.71475 4.52306 5.64 5.59L1 10"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M3.51 15C4.01719 16.4332 4.87906 17.7161 6.01547 18.727C7.15189 19.7378 8.52547 20.4432 10.0083 20.7817C11.4911 21.1201 13.0348 21.081 14.4952 20.6667C15.9556 20.2524 17.2853 19.4769 18.36 18.41L23 14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <button
          class="action-btn action-btn--danger"
          :title="$t('deleteMessage')"
          @click="$emit('action', 'delete')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6H5H21"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.4477 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Message } from '@/types'
  import { i18n } from '@/i18n'
  import { formatMessageContent } from '@/services/aiAnalysisService'

  interface Props {
    message: Message
    isStreaming?: boolean
  }

  // interface Emits {
  //   (e: 'action', action: string): void
  // } // 暂时未使用

  const props = withDefaults(defineProps<Props>(), {
    isStreaming: false,
  })

  // const emit = defineEmits<Emits>() // 暂时未使用

  // 国际化
  const $t = (key: string) => i18n.t(key)

  // 格式化消息内容
  const formattedContent = computed(() => {
    return formatMessageContent(props.message.content)
  })

  // 格式化时间
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''

    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // 如果是今天
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    // 如果是昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.getDate() === yesterday.getDate()) {
      return (
        '昨天 ' +
        date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    }

    // 其他日期
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
</script>

<style scoped>
  .message-item {
    display: flex;
    gap: 12px;
    max-width: 100%;
  }

  .message-item--user {
    flex-direction: row-reverse;
  }

  .message-item--user .message-content {
    align-items: flex-end;
  }

  .message-item--assistant .message-content {
    align-items: flex-start;
  }

  /* 头像 */
  .message-avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
  }

  .avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .avatar--user {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }

  .avatar--assistant {
    background: linear-gradient(135deg, #14b8a6, #0d9488);
  }

  /* 消息内容 */
  .message-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .message-bubble {
    position: relative;
    padding: 12px 16px;
    border-radius: 16px;
    max-width: 80%;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .message-item--user .message-bubble {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border-bottom-right-radius: 4px;
  }

  .message-item--assistant .message-bubble {
    background: #f3f4f6;
    color: #1f2937;
    border-bottom-left-radius: 4px;
  }

  .message-text {
    line-height: 1.5;
  }

  .message-text :deep(strong) {
    font-weight: 600;
  }

  .message-text :deep(em) {
    font-style: italic;
  }

  .message-text :deep(code) {
    background: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 0.9em;
  }

  .message-item--user .message-text :deep(code) {
    background: rgba(255, 255, 255, 0.2);
  }

  /* 流式响应光标 */
  .streaming-cursor {
    display: inline-block;
    animation: blink 1s infinite;
    margin-left: 2px;
  }

  @keyframes blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0;
    }
  }

  /* 消息时间 */
  .message-time {
    font-size: 12px;
    color: #9ca3af;
    padding: 0 4px;
  }

  /* 消息操作 */
  .message-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
    padding: 0 4px;
  }

  .message-item:hover .message-actions {
    opacity: 1;
  }

  .action-btn {
    padding: 4px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .action-btn--danger:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  /* 流式响应动画 */
  .message-item--streaming .message-bubble {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1);
    }
  }

  /* 响应式 */
  @media (max-width: 768px) {
    .message-bubble {
      max-width: 90%;
      padding: 10px 14px;
    }

    .message-avatar {
      width: 28px;
      height: 28px;
    }
  }
</style>
