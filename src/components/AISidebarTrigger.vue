<template>
  <div class="ai-sidebar-trigger-container">
    <!-- 浮动触发按钮 -->
    <Transition name="trigger-fade">
      <button
        v-if="showTrigger && aiStore.settings.showTriggerButton && !aiStore.sidebarState.isOpen"
        class="ai-sidebar-trigger"
        :class="[
          `ai-sidebar-trigger--${position}`,
          { 'ai-sidebar-trigger--active': aiStore.sidebarState.isOpen },
        ]"
        :title="triggerTitle"
        @click="handleTriggerClick"
      >
        <div class="ai-sidebar-trigger-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            :class="{ 'rotate-180': aiStore.sidebarState.isOpen }"
          >
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

        <!-- 快捷键提示 -->
        <div v-if="showShortcutHint" class="ai-sidebar-trigger-hint">
          {{ shortcutText }}
        </div>

        <!-- 未读消息指示器 -->
        <div v-if="hasUnreadMessages" class="ai-sidebar-trigger-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </div>
      </button>
    </Transition>

    <!-- 快捷键提示气泡 -->
    <Transition name="tooltip">
      <div
        v-if="showTooltip"
        class="ai-sidebar-trigger-tooltip"
        :class="`ai-sidebar-trigger-tooltip--${position}`"
      >
        <div class="tooltip-content">
          <div class="tooltip-title">{{ $t('aiAssistant') }}</div>
          <div class="tooltip-shortcut">{{ shortcutText }}</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import { useAIAssistantStore } from '@/stores'
  import { i18n } from '@/i18n'

  interface Props {
    position?: 'left' | 'right'
    showShortcutHint?: boolean
    autoHide?: boolean
    hideDelay?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    position: 'right',
    showShortcutHint: true,
    autoHide: false,
    hideDelay: 3000,
  })

  const aiStore = useAIAssistantStore()

  // 状态
  const showTrigger = ref(true)
  const showTooltip = ref(false)
  const isHovered = ref(false)

  // 计算属性
  const triggerTitle = computed(() => {
    const baseTitle = aiStore.sidebarState.isOpen ? '关闭 AI 助手' : '打开 AI 助手'
    return `${baseTitle} (${shortcutText.value})`
  })

  const shortcutText = computed(() => {
    const shortcut = aiStore.shortcuts.toggleSidebar
    const keys = []

    if (shortcut.ctrlKey) keys.push('Ctrl')
    if (shortcut.altKey) keys.push('Alt')
    if (shortcut.shiftKey) keys.push('Shift')
    if (shortcut.metaKey) keys.push('Cmd')
    keys.push(shortcut.key.toUpperCase())

    return keys.join(' + ')
  })

  const hasUnreadMessages = computed(() => {
    // 这里可以实现未读消息逻辑
    return false
  })

  const unreadCount = computed(() => {
    // 这里可以实现未读消息计数逻辑
    return 0
  })

  // 国际化
  const $t = (key: string) => i18n.t(key)

  // 方法
  const handleTriggerClick = () => {
    aiStore.toggleSidebar()
  }

  // const handleMouseEnter = () => {
  //   isHovered.value = true
  //   if (!aiStore.sidebarState.isOpen) {
  //     showTooltip.value = true
  //   }
  // }

  // const handleMouseLeave = () => {
  //   isHovered.value = false
  //   showTooltip.value = false
  // }

  // 自动隐藏逻辑
  let hideTimer: number | null = null

  const startHideTimer = () => {
    if (!props.autoHide) return

    if (hideTimer) {
      clearTimeout(hideTimer)
    }

    hideTimer = window.setTimeout(() => {
      if (!isHovered.value && !aiStore.sidebarState.isOpen) {
        showTrigger.value = false
      }
    }, props.hideDelay)
  }

  const cancelHideTimer = () => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  const showTriggerButton = () => {
    showTrigger.value = true
    cancelHideTimer()
  }

  // 监听鼠标移动以显示触发按钮
  const handleMouseMove = (e: MouseEvent) => {
    if (!props.autoHide) return

    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window

    // 检查鼠标是否在屏幕边缘
    const edgeThreshold = 50
    const isNearEdge =
      (props.position === 'right' && clientX > innerWidth - edgeThreshold) ||
      (props.position === 'left' && clientX < edgeThreshold) ||
      clientY < edgeThreshold ||
      clientY > innerHeight - edgeThreshold

    if (isNearEdge) {
      showTriggerButton()
    } else if (!isHovered.value && !aiStore.sidebarState.isOpen) {
      startHideTimer()
    }
  }

  // 生命周期
  onMounted(() => {
    if (props.autoHide) {
      document.addEventListener('mousemove', handleMouseMove)
      startHideTimer()
    }
  })

  onUnmounted(() => {
    if (props.autoHide) {
      document.removeEventListener('mousemove', handleMouseMove)
    }
    cancelHideTimer()
  })
</script>

<style scoped>
  .ai-sidebar-trigger-container {
    position: fixed;
    z-index: 9997;
  }

  .ai-sidebar-trigger {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    border: none;
    border-radius: 24px;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    color: white;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
  }

  .ai-sidebar-trigger:hover {
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
  }

  .ai-sidebar-trigger--right {
    right: 16px;
  }

  .ai-sidebar-trigger--left {
    left: 16px;
  }

  .ai-sidebar-trigger--active {
    background: linear-gradient(135deg, #0d9488, #0f766e);
  }

  .ai-sidebar-trigger-icon {
    transition: transform 0.3s ease;
  }

  .ai-sidebar-trigger-icon .rotate-180 {
    transform: rotate(180deg);
  }

  .ai-sidebar-trigger-hint {
    position: absolute;
    top: -32px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
  }

  .ai-sidebar-trigger-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ef4444;
    color: white;
    border-radius: 10px;
    min-width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  .ai-sidebar-trigger-tooltip {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 12px;
    pointer-events: none;
    z-index: 9998;
  }

  .ai-sidebar-trigger-tooltip--right {
    right: 80px;
  }

  .ai-sidebar-trigger-tooltip--left {
    left: 80px;
  }

  .tooltip-content {
    text-align: center;
  }

  .tooltip-title {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .tooltip-shortcut {
    font-size: 12px;
    color: #6b7280;
    font-family: monospace;
  }

  /* 动画 */
  .trigger-fade-enter-active,
  .trigger-fade-leave-active {
    transition: all 0.3s ease;
  }

  .trigger-fade-enter-from,
  .trigger-fade-leave-to {
    opacity: 0;
    transform: translateY(-50%) scale(0.8);
  }

  .tooltip-enter-active,
  .tooltip-leave-active {
    transition: all 0.2s ease;
  }

  .tooltip-enter-from,
  .tooltip-leave-to {
    opacity: 0;
    transform: translateY(-50%) scale(0.9);
  }

  /* 响应式 */
  @media (max-width: 768px) {
    .ai-sidebar-trigger {
      width: 44px;
      height: 44px;
      border-radius: 22px;
    }

    .ai-sidebar-trigger--right {
      right: 12px;
    }

    .ai-sidebar-trigger--left {
      left: 12px;
    }

    .ai-sidebar-trigger-tooltip {
      display: none;
    }
  }
</style>
