<template>
  <Teleport to="body">
    <div
      v-if="showCopyButton && isEnabled"
      ref="copyButtonRef"
      class="text-selection-copy-button"
      :style="buttonPosition"
      @click="copySelectedText"
      @mousedown.prevent
    >
      <div class="copy-button-content">
        <svg
          v-if="!isCopying"
          class="copy-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <svg
          v-else
          class="check-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
        <span class="copy-text">{{ isCopying ? '已复制' : '复制' }}</span>
      </div>
    </div>

    <!-- 复制成功提示 -->
    <Transition name="toast">
      <div
        v-if="showSuccessToast && settings.textSelection.showSuccessMessage"
        class="copy-success-toast"
      >
        <svg
          class="toast-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
        <span>文本已复制到剪贴板</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useSettingsStore } from '@/stores/settings'

  const settingsStore = useSettingsStore()
  const settings = computed(() => settingsStore.settings)
  const isEnabled = computed(() => settings.value.textSelection.enabled)

  // 状态管理
  const showCopyButton = ref(false)
  const isCopying = ref(false)
  const showSuccessToast = ref(false)
  const selectedText = ref('')
  const copyButtonRef = ref<HTMLElement>()

  // 按钮位置
  const buttonPosition = ref({
    top: '0px',
    left: '0px',
  })

  // 定时器
  let hideButtonTimer: number | null = null
  let hideToastTimer: number | null = null

  // 处理文本选择事件
  const handleTextSelection = () => {
    if (!isEnabled.value) return

    // 使用 setTimeout 确保选择状态已更新
    setTimeout(() => {
      const selection = window.getSelection()

      if (!selection || selection.rangeCount === 0) {
        hideCopyButton()
        return
      }

      const text = selection.toString().trim()

      if (text.length < settings.value.textSelection.minSelectionLength) {
        hideCopyButton()
        return
      }

      selectedText.value = text

      // 获取选择区域的位置
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      if (rect.width === 0 && rect.height === 0) {
        hideCopyButton()
        return
      }

      // 计算按钮位置 - 放在选中文本的右下角
      const buttonTop = rect.bottom + window.scrollY + 8
      const buttonLeft = rect.right + window.scrollX + 8

      buttonPosition.value = {
        top: `${Math.max(10, Math.min(window.innerHeight - 60, buttonTop))}px`,
        left: `${Math.max(10, Math.min(window.innerWidth - 90, buttonLeft))}px`,
      }

      showCopyButton.value = true

      // 清除之前的定时器
      if (hideButtonTimer) {
        clearTimeout(hideButtonTimer)
      }

      // 设置自动隐藏
      if (settings.value.textSelection.autoHideDelay > 0) {
        hideButtonTimer = window.setTimeout(() => {
          hideCopyButton()
        }, settings.value.textSelection.autoHideDelay)
      }
    }, 10)
  }

  // 隐藏复制按钮
  const hideCopyButton = () => {
    showCopyButton.value = false
    isCopying.value = false
    if (hideButtonTimer) {
      clearTimeout(hideButtonTimer)
      hideButtonTimer = null
    }
  }

  // 复制选中的文本
  const copySelectedText = async () => {
    if (!selectedText.value || isCopying.value) return

    try {
      isCopying.value = true

      // 使用 Clipboard API 复制文本
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(selectedText.value)
      } else {
        // 降级方案：使用 execCommand（已弃用但仍作为兼容性方案）
        const textArea = document.createElement('textarea')
        textArea.value = selectedText.value
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        // eslint-disable-next-line
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      // 显示成功提示
      if (settings.value.textSelection.showSuccessMessage) {
        showSuccessToast.value = true

        if (hideToastTimer) {
          clearTimeout(hideToastTimer)
        }

        hideToastTimer = window.setTimeout(() => {
          showSuccessToast.value = false
        }, 2000)
      }

      // 延迟隐藏按钮
      setTimeout(() => {
        hideCopyButton()
        // 清除文本选择
        window.getSelection()?.removeAllRanges()
      }, 500)
    } catch (error) {
      console.error('复制失败:', error)
      isCopying.value = false
    }
  }

  // 处理点击其他区域
  const handleClickOutside = (event: MouseEvent) => {
    if (copyButtonRef.value && !copyButtonRef.value.contains(event.target as Node)) {
      const selection = window.getSelection()
      if (!selection || selection.toString().trim() === '') {
        hideCopyButton()
      }
    }
  }

  // 生命周期
  onMounted(() => {
    document.addEventListener('selectionchange', handleTextSelection)
    document.addEventListener('mouseup', handleTextSelection)
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('selectionchange', handleTextSelection)
    document.removeEventListener('mouseup', handleTextSelection)
    document.removeEventListener('click', handleClickOutside)

    if (hideButtonTimer) {
      clearTimeout(hideButtonTimer)
    }
    if (hideToastTimer) {
      clearTimeout(hideToastTimer)
    }
  })
</script>

<style scoped>
  .text-selection-copy-button {
    position: absolute;
    z-index: 9999;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(121, 180, 166, 0.3);
    border-radius: 12px;
    padding: 10px 16px;
    cursor: pointer;
    user-select: none;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .text-selection-copy-button:hover {
    background: rgba(255, 255, 255, 1);
    border-color: rgba(121, 180, 166, 0.5);
    transform: translateY(-2px) scale(1.02);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.15),
      0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .text-selection-copy-button:active {
    transform: translateY(-1px) scale(1.01);
    transition: all 0.1s ease;
  }

  .copy-button-content {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #374151;
    font-size: 14px;
    font-weight: 600;
  }

  .copy-icon,
  .check-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .copy-text {
    white-space: nowrap;
  }

  .copy-success-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    background: rgba(34, 197, 94, 0.95);
    backdrop-filter: blur(10px);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .toast-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .toast-enter-active,
  .toast-leave-active {
    transition: all 0.3s ease;
  }

  .toast-enter-from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }

  .toast-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .text-selection-copy-button {
      padding: 10px 14px;
    }

    .copy-button-content {
      font-size: 16px;
    }

    .copy-icon,
    .check-icon {
      width: 18px;
      height: 18px;
    }
  }
</style>
