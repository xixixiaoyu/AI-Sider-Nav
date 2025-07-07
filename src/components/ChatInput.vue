<template>
  <div class="chat-input">
    <div class="input-container">
      <!-- 输入框 -->
      <div class="input-wrapper">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          :placeholder="placeholder"
          :disabled="disabled"
          class="input-field"
          rows="1"
          @keydown="handleKeydown"
          @input="handleInput"
          @paste="handlePaste"
        />

        <!-- 字符计数 -->
        <div v-if="showCharCount" class="char-count">{{ inputText.length }}/{{ maxLength }}</div>
      </div>

      <!-- 操作按钮 -->
      <div class="input-actions">
        <!-- 停止生成按钮 -->
        <button
          v-if="disabled"
          class="action-btn stop-btn"
          :title="$t('stopGeneration')"
          @click="$emit('stop')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect
              x="6"
              y="6"
              width="12"
              height="12"
              rx="2"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
        </button>

        <!-- 发送按钮 -->
        <button
          v-else
          class="action-btn send-btn"
          :class="{ 'send-btn--active': canSend }"
          :disabled="!canSend"
          :title="$t('sendMessage')"
          @click="handleSend"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" stroke-width="2" />
            <polygon
              points="22,2 15,22 11,13 2,9"
              stroke="currentColor"
              stroke-width="2"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div v-if="showQuickActions" class="quick-actions">
      <button
        v-for="action in quickActions"
        :key="action.id"
        class="quick-action-btn"
        @click="handleQuickAction(action)"
      >
        {{ action.label }}
      </button>
    </div>

    <!-- 输入提示 -->
    <div v-if="showHints" class="input-hints">
      <div class="hint-item"><kbd>Enter</kbd> 发送消息</div>
      <div class="hint-item"><kbd>Shift</kbd> + <kbd>Enter</kbd> 换行</div>
      <div class="hint-item"><kbd>/</kbd> 快捷命令</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, watch } from 'vue'
  import { i18n } from '@/i18n'

  interface QuickAction {
    id: string
    label: string
    content: string
  }

  interface Props {
    placeholder?: string
    disabled?: boolean
    maxLength?: number
    showCharCount?: boolean
    showQuickActions?: boolean
    showHints?: boolean
  }

  interface Emits {
    (e: 'send', content: string): void
    (e: 'stop'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    placeholder: '',
    disabled: false,
    maxLength: 2000,
    showCharCount: false,
    showQuickActions: false,
    showHints: false,
  })

  const emit = defineEmits<Emits>()

  const textareaRef = ref<HTMLTextAreaElement>()
  const inputText = ref('')

  // 国际化
  const $t = (key: string) => i18n.t(key)

  // 计算属性
  const canSend = computed(() => {
    return (
      inputText.value.trim().length > 0 &&
      inputText.value.length <= props.maxLength &&
      !props.disabled
    )
  })

  // 快捷操作
  const quickActions: QuickAction[] = [
    { id: 'help', label: '帮助', content: '请帮我' },
    { id: 'explain', label: '解释', content: '请解释一下' },
    { id: 'summarize', label: '总结', content: '请总结' },
    { id: 'translate', label: '翻译', content: '请翻译' },
  ]

  // 自动调整高度
  const adjustHeight = () => {
    if (!textareaRef.value) return

    const textarea = textareaRef.value
    textarea.style.height = 'auto'

    const maxHeight = 120 // 最大高度
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)

    textarea.style.height = `${newHeight}px`
  }

  // 处理输入
  const handleInput = () => {
    // 限制字符数
    if (inputText.value.length > props.maxLength) {
      inputText.value = inputText.value.slice(0, props.maxLength)
    }

    nextTick(() => {
      adjustHeight()
    })
  }

  // 处理键盘事件
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift + Enter 换行
        return
      } else {
        // Enter 发送
        event.preventDefault()
        handleSend()
      }
    }

    // 快捷命令
    if (event.key === '/' && inputText.value === '') {
      event.preventDefault()
      showCommandPalette()
    }
  }

  // 处理粘贴
  const handlePaste = (event: ClipboardEvent) => {
    const pastedText = event.clipboardData?.getData('text') || ''

    // 检查粘贴后是否超过长度限制
    const newText = inputText.value + pastedText
    if (newText.length > props.maxLength) {
      event.preventDefault()
      inputText.value = newText.slice(0, props.maxLength)
      nextTick(() => {
        adjustHeight()
      })
    }
  }

  // 发送消息
  const handleSend = () => {
    if (!canSend.value) return

    const content = inputText.value.trim()
    if (content) {
      emit('send', content)
      inputText.value = ''
      nextTick(() => {
        adjustHeight()
      })
    }
  }

  // 快捷操作
  const handleQuickAction = (action: QuickAction) => {
    inputText.value = action.content
    nextTick(() => {
      textareaRef.value?.focus()
      adjustHeight()
    })
  }

  // 显示命令面板
  const showCommandPalette = () => {
    // 这里可以实现命令面板功能
    console.log('显示命令面板')
  }

  // 监听禁用状态变化
  watch(
    () => props.disabled,
    (newValue) => {
      if (!newValue) {
        nextTick(() => {
          textareaRef.value?.focus()
        })
      }
    }
  )

  // 自动聚焦
  const focusInput = () => {
    nextTick(() => {
      textareaRef.value?.focus()
    })
  }

  // 暴露方法
  defineExpose({
    focusInput,
    clear: () => {
      inputText.value = ''
      adjustHeight()
    },
  })
</script>

<style scoped>
  .chat-input {
    padding: 16px;
    background: #ffffff;
  }

  .input-container {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px;
    transition: all 0.2s ease;
  }

  .input-container:focus-within {
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }

  .input-wrapper {
    flex: 1;
    position: relative;
  }

  .input-field {
    width: 100%;
    border: none;
    background: transparent;
    resize: none;
    outline: none;
    font-size: 14px;
    line-height: 1.5;
    color: #1f2937;
    min-height: 20px;
    max-height: 120px;
    overflow-y: auto;
  }

  .input-field::placeholder {
    color: #9ca3af;
  }

  .input-field:disabled {
    color: #6b7280;
    cursor: not-allowed;
  }

  .char-count {
    position: absolute;
    bottom: -20px;
    right: 0;
    font-size: 12px;
    color: #6b7280;
  }

  .input-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .send-btn {
    background: #e5e7eb;
    color: #6b7280;
  }

  .send-btn--active {
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    color: white;
  }

  .send-btn--active:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  }

  .send-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .stop-btn {
    background: #fee2e2;
    color: #dc2626;
  }

  .stop-btn:hover {
    background: #fecaca;
  }

  /* 快捷操作 */
  .quick-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
  }

  .quick-action-btn {
    padding: 6px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    background: white;
    color: #6b7280;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .quick-action-btn:hover {
    border-color: #14b8a6;
    color: #14b8a6;
    background: #f0fdfa;
  }

  /* 输入提示 */
  .input-hints {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    font-size: 12px;
    color: #9ca3af;
  }

  .hint-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  kbd {
    padding: 2px 6px;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 11px;
    font-family: monospace;
  }

  /* 滚动条样式 */
  .input-field::-webkit-scrollbar {
    width: 4px;
  }

  .input-field::-webkit-scrollbar-track {
    background: transparent;
  }

  .input-field::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }

  /* 响应式 */
  @media (max-width: 768px) {
    .chat-input {
      padding: 12px;
    }

    .input-container {
      padding: 10px;
    }

    .action-btn {
      width: 32px;
      height: 32px;
    }

    .input-hints {
      display: none;
    }
  }
</style>
