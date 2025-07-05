<template>
  <div class="message-list" ref="messageListRef">
    <div class="message-list-content">
      <!-- 消息项 -->
      <MessageItem
        v-for="message in messages"
        :key="message.id"
        :message="message"
        @action="$emit('messageAction', $event, message.id)"
      />

      <!-- AI 思考指示器 -->
      <ThinkingIndicator v-if="showThinking && thinkingContent" :content="thinkingContent" />

      <!-- 当前响应 -->
      <MessageItem
        v-if="isLoading && currentResponse"
        :message="{
          id: 'current-response',
          role: 'assistant',
          content: currentResponse,
          timestamp: Date.now(),
        }"
        :is-streaming="true"
      />

      <!-- 加载指示器 -->
      <div v-if="isLoading && !currentResponse" class="loading-indicator">
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <span>{{ $t('aiIsThinking') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
  import { Message } from '@/types'
  import { i18n } from '@/i18n'
  import MessageItem from './MessageItem.vue'
  import ThinkingIndicator from './ThinkingIndicator.vue'

  interface Props {
    messages: Message[]
    isLoading?: boolean
    currentResponse?: string
    thinkingContent?: string
    showThinking?: boolean
  }

  interface Emits {
    (e: 'messageAction', action: string, messageId: string): void
  }

  const props = withDefaults(defineProps<Props>(), {
    isLoading: false,
    currentResponse: '',
    thinkingContent: '',
    showThinking: true,
  })

  const emit = defineEmits<Emits>()

  const messageListRef = ref<HTMLElement>()

  // 国际化
  const $t = (key: string) => i18n.t(key)

  // 自动滚动到底部
  const scrollToBottom = (smooth = true) => {
    if (!messageListRef.value) return

    const element = messageListRef.value
    const scrollOptions: ScrollToOptions = {
      top: element.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    }

    element.scrollTo(scrollOptions)
  }

  // 检查是否需要自动滚动
  const shouldAutoScroll = () => {
    if (!messageListRef.value) return true

    const element = messageListRef.value
    const { scrollTop, scrollHeight, clientHeight } = element

    // 如果用户滚动到接近底部（100px 内），则自动滚动
    return scrollHeight - scrollTop - clientHeight < 100
  }

  // 监听消息变化
  watch(
    () => props.messages,
    () => {
      nextTick(() => {
        if (shouldAutoScroll()) {
          scrollToBottom()
        }
      })
    },
    { deep: true }
  )

  // 监听当前响应变化
  watch(
    () => props.currentResponse,
    () => {
      nextTick(() => {
        if (shouldAutoScroll()) {
          scrollToBottom()
        }
      })
    }
  )

  // 监听加载状态变化
  watch(
    () => props.isLoading,
    (newValue) => {
      if (newValue) {
        nextTick(() => {
          scrollToBottom()
        })
      }
    }
  )

  // 处理滚动事件
  let isUserScrolling = false
  let scrollTimeout: number | null = null

  const handleScroll = () => {
    isUserScrolling = true

    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    scrollTimeout = window.setTimeout(() => {
      isUserScrolling = false
    }, 150)
  }

  // 生命周期
  onMounted(() => {
    if (messageListRef.value) {
      messageListRef.value.addEventListener('scroll', handleScroll)
    }

    // 初始滚动到底部
    nextTick(() => {
      scrollToBottom(false)
    })
  })

  onUnmounted(() => {
    if (messageListRef.value) {
      messageListRef.value.removeEventListener('scroll', handleScroll)
    }

    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
  })
</script>

<style scoped>
  .message-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
  }

  .message-list-content {
    padding: 16px;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    color: #6b7280;
    font-size: 14px;
  }

  .loading-dots {
    display: flex;
    gap: 4px;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #14b8a6;
    animation: loading-pulse 1.4s ease-in-out infinite both;
  }

  .dot:nth-child(1) {
    animation-delay: -0.32s;
  }

  .dot:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes loading-pulse {
    0%,
    80%,
    100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .message-list::-webkit-scrollbar {
    width: 6px;
  }

  .message-list::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  .message-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .message-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  @media (max-width: 768px) {
    .message-list-content {
      padding: 12px;
      gap: 12px;
    }
  }
</style>
