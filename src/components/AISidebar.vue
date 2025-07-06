<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <Transition name="overlay">
      <div
        v-if="aiStore.sidebarState.isOpen"
        class="ai-sidebar-overlay"
        @click="handleOverlayClick"
      />
    </Transition>

    <!-- 侧边栏 -->
    <Transition name="sidebar" :appear="true">
      <div
        v-if="aiStore.sidebarState.isOpen"
        class="ai-sidebar"
        :class="`ai-sidebar--${aiStore.sidebarState.position}`"
        :style="sidebarStyle"
      >
        <!-- 拖拽调整手柄 -->
        <div
          class="ai-sidebar-resize-handle"
          :class="`ai-sidebar-resize-handle--${aiStore.sidebarState.position}`"
          @mousedown="startResize"
        ></div>
        <!-- 侧边栏头部 -->
        <div class="ai-sidebar-header">
          <div class="ai-sidebar-title">
            <div class="ai-sidebar-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
            <h2>{{ $t('aiAssistant') }}</h2>
          </div>

          <div class="ai-sidebar-controls">
            <!-- 设置按钮 -->
            <button
              class="ai-sidebar-btn ai-sidebar-btn--icon"
              :title="$t('settings')"
              @click="showSettings = true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
                <path
                  d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
                  stroke="currentColor"
                  stroke-width="2"
                />
              </svg>
            </button>

            <!-- 新对话按钮 -->
            <button
              class="ai-sidebar-btn ai-sidebar-btn--icon"
              :title="$t('newChat')"
              @click="handleNewChat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <!-- 总结页面按钮 -->
            <button
              class="ai-sidebar-btn ai-sidebar-btn--icon"
              :class="{ 'ai-sidebar-btn--loading': isSummarizing }"
              :title="$t('summarizePage')"
              :disabled="isSummarizing"
              @click="handleSummarizePage"
            >
              <svg v-if="!isSummarizing" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <polyline
                  points="14,2 14,8 20,8"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  x1="16"
                  y1="13"
                  x2="8"
                  y2="13"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  x1="16"
                  y1="17"
                  x2="8"
                  y2="17"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <polyline
                  points="10,9 9,9 8,9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div v-else class="ai-sidebar-spinner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-dasharray="31.416"
                    stroke-dashoffset="31.416"
                  >
                    <animate
                      attributeName="stroke-dasharray"
                      dur="2s"
                      values="0 31.416;15.708 15.708;0 31.416;0 31.416"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-dashoffset"
                      dur="2s"
                      values="0;-15.708;-31.416;-31.416"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>
            </button>

            <!-- 关闭按钮 -->
            <button
              class="ai-sidebar-btn ai-sidebar-btn--icon ai-sidebar-btn--close"
              :title="$t('close')"
              @click="aiStore.closeSidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- 侧边栏内容 -->
        <div class="ai-sidebar-content">
          <!-- 聊天界面组件将在这里 -->
          <AIChatInterface />
        </div>

        <!-- 调整大小手柄 -->
        <div
          class="ai-sidebar-resize-handle"
          :class="`ai-sidebar-resize-handle--${aiStore.sidebarState.position}`"
          @mousedown="startResize"
        />
      </div>
    </Transition>

    <!-- AI 设置模态框 -->
    <AISettingsModal :visible="showSettings" @close="showSettings = false" />
  </Teleport>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import { useAIAssistantStore } from '@/stores'
  import { i18n } from '@/i18n'
  import AIChatInterface from './AIChatInterface.vue'
  import AISettingsModal from './AISettingsModal.vue'

  const aiStore = useAIAssistantStore()
  const showSettings = ref(false)

  // 计算侧边栏样式
  const sidebarStyle = computed(() => {
    const { width, position } = aiStore.sidebarState
    return {
      width: `${width}px`,
      [position]: '0',
    }
  })

  // 国际化
  const $t = (key: string) => i18n.t(key)

  // 处理遮罩层点击
  const handleOverlayClick = () => {
    aiStore.closeSidebar()
  }

  // 处理新对话
  const handleNewChat = () => {
    aiStore.createNewSession()
  }

  // 总结相关计算属性
  const isSummarizing = computed(() => {
    return aiStore.summaryState.isExtracting || aiStore.summaryState.isSummarizing
  })

  // 处理页面总结
  const handleSummarizePage = async () => {
    try {
      await aiStore.startPageSummary()
    } catch (error) {
      console.error('启动页面总结失败:', error)
    }
  }

  // 调整大小相关
  let isResizing = false
  let startX = 0
  let startWidth = 0

  const startResize = (e: MouseEvent) => {
    isResizing = true
    startX = e.clientX
    startWidth = aiStore.sidebarState.width

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    // 添加拖拽样式类
    const sidebar = document.querySelector('.ai-sidebar')
    if (sidebar) {
      sidebar.classList.add('resizing')
    }
  }

  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return

    const { position } = aiStore.sidebarState
    const deltaX = position === 'right' ? startX - e.clientX : e.clientX - startX
    const newWidth = startWidth + deltaX

    aiStore.setSidebarWidth(newWidth)
  }

  const stopResize = () => {
    isResizing = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    // 移除拖拽样式类
    const sidebar = document.querySelector('.ai-sidebar')
    if (sidebar) {
      sidebar.classList.remove('resizing')
    }
  }

  // 快捷键处理
  const handleKeydown = (e: KeyboardEvent) => {
    const { key, ctrlKey, altKey, shiftKey, metaKey } = e
    const shortcuts = aiStore.shortcuts

    // 检查切换侧边栏快捷键
    const toggleShortcut = shortcuts.toggleSidebar
    if (
      key.toLowerCase() === toggleShortcut.key.toLowerCase() &&
      ctrlKey === !!toggleShortcut.ctrlKey &&
      altKey === !!toggleShortcut.altKey &&
      shiftKey === !!toggleShortcut.shiftKey &&
      metaKey === !!toggleShortcut.metaKey
    ) {
      e.preventDefault()
      aiStore.toggleSidebar()
      return
    }

    // 检查新对话快捷键
    const newChatShortcut = shortcuts.newChat
    if (
      aiStore.sidebarState.isOpen &&
      key.toLowerCase() === newChatShortcut.key.toLowerCase() &&
      ctrlKey === !!newChatShortcut.ctrlKey &&
      altKey === !!newChatShortcut.altKey &&
      shiftKey === !!newChatShortcut.shiftKey &&
      metaKey === !!newChatShortcut.metaKey
    ) {
      e.preventDefault()
      handleNewChat()
      return
    }

    // ESC 键关闭侧边栏
    if (key === 'Escape' && aiStore.sidebarState.isOpen) {
      e.preventDefault()
      aiStore.closeSidebar()
    }
  }

  // 生命周期
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
  })
</script>

<style scoped>
  /* 遮罩层 */
  .ai-sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(2px);
    z-index: 9998;
  }

  /* 侧边栏 */
  .ai-sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    background: white;
    border-left: 1px solid #e5e7eb;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    min-width: 300px;
    max-width: 800px;
  }

  .ai-sidebar--left {
    left: 0;
    border-left: none;
    border-right: 1px solid #e5e7eb;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  }

  /* 拖拽调整手柄 */
  .ai-sidebar-resize-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: col-resize;
    background: transparent;
    z-index: 10;
    transition: background-color 0.2s ease;
  }

  .ai-sidebar-resize-handle:hover {
    background-color: #14b8a6;
  }

  .ai-sidebar-resize-handle--right {
    left: 0;
  }

  .ai-sidebar-resize-handle--left {
    right: 0;
  }

  /* 拖拽时的视觉反馈 */
  .ai-sidebar-resize-handle:active {
    background-color: #0d9488;
  }

  /* 拖拽时禁用文本选择 */
  .ai-sidebar.resizing {
    user-select: none;
  }

  .ai-sidebar.resizing * {
    pointer-events: none;
  }

  .ai-sidebar.resizing .ai-sidebar-resize-handle {
    pointer-events: auto;
  }

  /* 侧边栏头部 */
  .ai-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    min-height: 64px;
  }

  .ai-sidebar-title {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .ai-sidebar-icon {
    color: #14b8a6;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ai-sidebar-title h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .ai-sidebar-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ai-sidebar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ai-sidebar-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .ai-sidebar-btn--close:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  /* 侧边栏内容 */
  .ai-sidebar-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* 调整大小手柄 */
  .ai-sidebar-resize-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: col-resize;
    background: transparent;
    transition: background-color 0.2s ease;
  }

  .ai-sidebar-resize-handle:hover {
    background: #14b8a6;
  }

  .ai-sidebar-resize-handle--right {
    left: -2px;
  }

  .ai-sidebar-resize-handle--left {
    right: -2px;
  }

  /* 动画 */
  .overlay-enter-active,
  .overlay-leave-active {
    transition: opacity 0.3s ease;
  }

  .overlay-enter-from,
  .overlay-leave-to {
    opacity: 0;
  }

  .sidebar-enter-active,
  .sidebar-leave-active {
    transition: transform 0.3s ease;
  }

  .sidebar-enter-from {
    transform: translateX(100%);
  }

  .sidebar-leave-to {
    transform: translateX(100%);
  }

  .ai-sidebar--left .sidebar-enter-from,
  .ai-sidebar--left .sidebar-leave-to {
    transform: translateX(-100%);
  }

  /* 响应式 */
  @media (max-width: 768px) {
    .ai-sidebar {
      width: 100vw !important;
      max-width: 100vw;
    }

    .ai-sidebar-resize-handle {
      display: none;
    }
  }
</style>
