/**
 * QuickCopy - 轻量级文本选择复制工具
 */
;(function () {
  // 避免重复注入
  if (window.aiSiderNavTextCopyInjected) {
    return
  }
  window.aiSiderNavTextCopyInjected = true

  // 统一配置管理
  const CONFIG = {
    buttonId: 'quick-copy-button',
    transitionDuration: 1000, // 状态消息显示时长(毫秒)
    scrollDebounce: 100, // 滚动防抖时间(毫秒)
    offset: { x: 5, y: 5 }, // 按钮相对选中文本右下角的偏移
    labels: {
      copy: '复制',
      copied: '已复制',
      error: '失败',
    },
  }

  class QuickCopyButton {
    constructor() {
      this.button = null
      this.isEnabled = false
      this.settings = null

      // 预绑定事件处理函数，便于后续移除
      this.boundHandleMouseUp = this.handleMouseUp.bind(this)
      this.boundHandleMouseDown = this.handleMouseDown.bind(this)
      this.boundHandleClick = this.handleClick.bind(this)
      this.debouncedHide = this.debounce(this.hide.bind(this), CONFIG.scrollDebounce)

      this.init()
    }

    /**
     * 初始化复制按钮和事件监听
     */
    async init() {
      await this.loadSettings()
      if (this.isEnabled) {
        this.createButton()
        this.setupEventListeners()
      }
      this.setupStorageListener()
    }

    /**
     * 加载用户设置
     */
    async loadSettings() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.sync.get('aiSiderNavSettings')
          const settingsData = result.aiSiderNavSettings || {}
          // 从统一设置结构中提取用户设置
          this.settings = settingsData.userSettings || settingsData
        } else {
          // 开发环境使用 localStorage
          const stored = localStorage.getItem('aiSiderNavSettings')
          if (stored) {
            const data = JSON.parse(stored)
            this.settings = data.userSettings || data
          } else {
            this.settings = {}
          }
        }

        // 检查文本选择复制功能是否启用
        this.isEnabled = this.settings.textSelection?.enabled !== false
      } catch (error) {
        console.error('Failed to load settings:', error)
        // 默认启用
        this.isEnabled = true
      }
    }

    /**
     * 设置存储监听器
     */
    setupStorageListener() {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.addListener((changes, namespace) => {
          if (namespace === 'sync' && changes.aiSiderNavSettings) {
            const newData = changes.aiSiderNavSettings.newValue
            if (newData) {
              // 从统一设置结构中提取用户设置
              const newSettings = newData.userSettings || newData
              this.settings = newSettings
              const newEnabled = newSettings.textSelection?.enabled !== false

              if (newEnabled !== this.isEnabled) {
                this.isEnabled = newEnabled
                if (this.isEnabled) {
                  // 启用功能
                  if (!this.button) {
                    this.createButton()
                    this.setupEventListeners()
                  }
                } else {
                  // 禁用功能
                  this.hide()
                  this.destroy()
                }
              }
            }
          }
        })
      }
    }

    /**
     * 创建复制按钮元素
     */
    createButton() {
      this.button = document.createElement('div')
      this.button.id = CONFIG.buttonId
      this.button.textContent = CONFIG.labels.copy
      this.button.style.display = 'none'
      document.body.appendChild(this.button)

      // 使用全局资源管理器添加点击事件监听器
      if (typeof globalResourceManager !== 'undefined') {
        globalResourceManager.addListener(this.button, 'click', this.boundHandleClick)
      } else {
        this.button.addEventListener('click', this.boundHandleClick)
      }
    }

    /**
     * 处理按钮点击事件
     */
    handleClick(e) {
      e.stopPropagation()
      const selectedText = window.getSelection().toString().trim()
      if (!selectedText) return

      this.copyToClipboard(selectedText)
    }

    /**
     * 复制文本到剪贴板
     */
    copyToClipboard(text) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.updateButtonState(true)
        })
        .catch((err) => {
          console.error('复制失败:', err)
          this.updateButtonState(false)
        })
    }

    /**
     * 更新按钮状态
     */
    updateButtonState(success) {
      if (success) {
        this.button.textContent = CONFIG.labels.copied
        this.button.classList.add('copied')
      } else {
        this.button.textContent = CONFIG.labels.error
        this.button.classList.add('error')
      }

      // 使用用户设置的自动隐藏延迟
      const hideDelay = this.settings.textSelection?.autoHideDelay || 2000

      // 使用全局资源管理器管理定时器
      if (typeof globalResourceManager !== 'undefined') {
        globalResourceManager.addTimer(
          setTimeout(() => {
            this.button.textContent = CONFIG.labels.copy
            this.button.classList.remove('copied', 'error')
            this.hide()
          }, hideDelay)
        )
      } else {
        setTimeout(() => {
          this.button.textContent = CONFIG.labels.copy
          this.button.classList.remove('copied', 'error')
          this.hide()
        }, hideDelay)
      }
    }

    /**
     * 在选中文本右下角显示按钮
     */
    show(selection, rect) {
      const selectedText = selection.toString().trim()
      if (!selectedText) {
        this.hide()
        return
      }

      // 计算位置 - 选中文本右下角
      let buttonTop = rect.bottom + window.scrollY + CONFIG.offset.y
      let buttonLeft = rect.right + window.scrollX + CONFIG.offset.x

      // 边界检查，防止按钮超出视窗
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const buttonWidth = this.button.offsetWidth || 50 // 首次获取可能为0，提供默认值
      const buttonHeight = this.button.offsetHeight || 30

      // 防止超出右侧边界
      if (buttonLeft + buttonWidth > viewportWidth + window.scrollX) {
        buttonLeft = viewportWidth + window.scrollX - buttonWidth - 10
      }

      // 防止超出底部边界
      if (buttonTop + buttonHeight > viewportHeight + window.scrollY) {
        buttonTop = rect.top + window.scrollY - buttonHeight - CONFIG.offset.y // 改为显示在选中文本上方
      }

      this.button.style.top = `${buttonTop}px`
      this.button.style.left = `${buttonLeft}px`
      this.button.style.display = 'block'
    }

    /**
     * 隐藏按钮
     */
    hide() {
      if (this.button) {
        this.button.style.display = 'none'
      }
    }

    /**
     * 设置所有事件监听器
     */
    setupEventListeners() {
      // 使用全局资源管理器添加事件监听器
      if (typeof globalResourceManager !== 'undefined') {
        globalResourceManager.addListener(document, 'mouseup', this.boundHandleMouseUp)
        globalResourceManager.addListener(document, 'mousedown', this.boundHandleMouseDown)
        globalResourceManager.addListener(window, 'scroll', this.debouncedHide)
        globalResourceManager.addListener(window, 'resize', this.debouncedHide)
      } else {
        // 回退到直接添加（如果全局资源管理器不可用）
        document.addEventListener('mouseup', this.boundHandleMouseUp)
        document.addEventListener('mousedown', this.boundHandleMouseDown)
        window.addEventListener('scroll', this.debouncedHide)
        window.addEventListener('resize', this.debouncedHide)
      }
    }

    /**
     * 处理鼠标抬起事件
     */
    handleMouseUp(event) {
      if (!this.isEnabled || event.target === this.button) return

      // 使用全局资源管理器管理定时器
      if (typeof globalResourceManager !== 'undefined') {
        globalResourceManager.addTimer(
          setTimeout(() => {
            const selection = window.getSelection()
            if (selection.toString().trim()) {
              // 检查是否显示复制按钮
              const showButton = this.settings.textSelection?.showCopyButton !== false
              if (showButton) {
                // 获取选择区域的位置
                if (selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0)
                  const rect = range.getBoundingClientRect()
                  this.show(selection, rect)
                }
              }
            } else {
              this.hide()
            }
          }, 10)
        ) // 短暂延迟确保选择完成
      } else {
        setTimeout(() => {
          const selection = window.getSelection()
          if (selection.toString().trim()) {
            // 检查是否显示复制按钮
            const showButton = this.settings.textSelection?.showCopyButton !== false
            if (showButton) {
              // 获取选择区域的位置
              if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                const rect = range.getBoundingClientRect()
                this.show(selection, rect)
              }
            }
          } else {
            this.hide()
          }
        }, 10) // 短暂延迟确保选择完成
      }
    }

    /**
     * 处理鼠标按下事件
     */
    handleMouseDown(event) {
      if (event.target !== this.button) {
        this.hide()
      }
    }

    /**
     * 防抖函数
     */
    debounce(func, wait) {
      let timeout
      return function (...args) {
        if (timeout) {
          clearTimeout(timeout)
          // 如果使用了全局资源管理器，从中移除旧的定时器
          if (typeof globalResourceManager !== 'undefined') {
            globalResourceManager.timers.delete(timeout)
          }
        }

        timeout = setTimeout(() => func.apply(this, args), wait)

        // 如果使用了全局资源管理器，添加新的定时器
        if (typeof globalResourceManager !== 'undefined') {
          globalResourceManager.addTimer(timeout)
        }
      }
    }

    /**
     * 清理资源方法
     */
    destroy() {
      // 注意：如果使用了全局资源管理器，事件监听器会在页面卸载时自动清理
      // 这里只需要清理按钮特定的资源

      // 如果全局资源管理器不可用，手动移除事件监听器
      if (typeof globalResourceManager === 'undefined') {
        document.removeEventListener('mouseup', this.boundHandleMouseUp)
        document.removeEventListener('mousedown', this.boundHandleMouseDown)
        window.removeEventListener('scroll', this.debouncedHide)
        window.removeEventListener('resize', this.debouncedHide)
      }

      if (this.button) {
        // 如果全局资源管理器不可用，手动移除按钮事件监听器
        if (typeof globalResourceManager === 'undefined') {
          this.button.removeEventListener('click', this.boundHandleClick)
        }
        if (this.button.parentNode) {
          this.button.parentNode.removeChild(this.button)
        }
        this.button = null
      }

      console.log('✅ QuickCopyButton 实例已销毁')
    }
  }

  // 异步初始化并暴露实例到全局作用域（如有需要）
  ;(async () => {
    window.quickCopy = new QuickCopyButton()
  })()
})()

// AI Sider Nav - AI 助手功能
;(function () {
  'use strict'

  // 防止重复注入 AI 助手
  if (window.aiSiderNavAIInjected) {
    return
  }
  window.aiSiderNavAIInjected = true

  // 检查是否是新标签页（避免重复）
  const isNewTabPage =
    window.location.href.includes('chrome-extension://') ||
    window.location.href.includes('moz-extension://') ||
    window.location.href.includes('edge-extension://')

  if (isNewTabPage) {
    return // 新标签页已经有 AI 助手了
  }

  // AI 助手状态
  let aiAssistantState = {
    isOpen: false,
    width: 400, // 默认宽度
    settings: {
      showTriggerButton: true,
      globalAccess: true,
      enabled: true,
    },
  }

  // 拖拽调整相关状态
  let isResizing = false
  let startX = 0
  let startWidth = 0

  // 加载侧边栏宽度
  async function loadSidebarWidth() {
    try {
      let savedWidth = 400 // 默认宽度

      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          const result = await chrome.storage.sync.get('aiSidebarWidth')
          if (result.aiSidebarWidth) {
            savedWidth = result.aiSidebarWidth
          }
        } catch (chromeError) {
          console.warn('从 chrome.storage 获取侧边栏宽度失败，回退到 localStorage:', chromeError)
        }
      }

      // 回退到 localStorage
      if (savedWidth === 400) {
        const stored = localStorage.getItem('aiSidebarWidth')
        if (stored) {
          savedWidth = parseInt(stored, 10)
        }
      }

      // 应用宽度限制
      const minWidth = 300
      const maxWidth = Math.min(800, window.innerWidth * 0.8)
      aiAssistantState.width = Math.max(minWidth, Math.min(maxWidth, savedWidth))
    } catch (error) {
      console.error('加载侧边栏宽度失败:', error)
    }
  }

  // 保存侧边栏宽度
  async function saveSidebarWidth(width) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({ aiSidebarWidth: width })
      } else {
        localStorage.setItem('aiSidebarWidth', width.toString())
      }
    } catch (error) {
      console.error('保存侧边栏宽度失败:', error)
    }
  }

  // 设置拖拽调整处理器
  function setupResizeHandlers(sidebar, resizeHandle) {
    const startResize = (e) => {
      isResizing = true
      startX = e.clientX
      startWidth = aiAssistantState.width

      // 使用全局资源管理器添加动态事件监听器
      if (typeof globalResourceManager !== 'undefined') {
        globalResourceManager.addListener(document, 'mousemove', handleResize)
        globalResourceManager.addListener(document, 'mouseup', stopResize)
      } else {
        document.addEventListener('mousemove', handleResize)
        document.addEventListener('mouseup', stopResize)
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      // 拖拽时的视觉反馈
      resizeHandle.style.backgroundColor = '#0d9488'

      e.preventDefault()
    }

    const handleResize = (e) => {
      if (!isResizing) return

      const deltaX = startX - e.clientX // 右侧侧边栏，向左拖拽增加宽度
      const newWidth = startWidth + deltaX

      // 应用宽度限制
      const minWidth = 300
      const maxWidth = Math.min(800, window.innerWidth * 0.8)
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))

      // 更新状态和样式
      aiAssistantState.width = clampedWidth
      sidebar.style.width = `${clampedWidth}px`

      // 如果侧边栏是打开的，也要更新 right 位置
      if (aiAssistantState.isOpen) {
        sidebar.style.right = '0'
      } else {
        sidebar.style.right = `-${clampedWidth}px`
      }
    }

    const stopResize = () => {
      if (!isResizing) return

      isResizing = false

      // 注意：如果使用了全局资源管理器，这些动态事件监听器会在页面卸载时自动清理
      // 但为了立即停止拖拽，我们仍需要手动移除
      if (typeof globalResourceManager === 'undefined') {
        document.removeEventListener('mousemove', handleResize)
        document.removeEventListener('mouseup', stopResize)
      }

      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      // 恢复手柄样式
      resizeHandle.style.backgroundColor = 'transparent'

      // 保存新的宽度
      saveSidebarWidth(aiAssistantState.width)
    }

    // 绑定事件
    globalResourceManager.addListener(resizeHandle, 'mousedown', startResize)
  }

  // 从存储加载设置
  async function loadSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['aiSiderNavSettings'])
        if (result.aiSiderNavSettings && result.aiSiderNavSettings.aiAssistant) {
          aiAssistantState.settings = {
            ...aiAssistantState.settings,
            ...result.aiSiderNavSettings.aiAssistant,
          }
        }
      }
    } catch (error) {
      console.error('加载 AI 助手设置失败:', error)
    }
  }

  // 创建触发按钮
  function createTriggerButton() {
    if (!aiAssistantState.settings.showTriggerButton || !aiAssistantState.settings.globalAccess) {
      return
    }

    const button = document.createElement('div')
    button.id = 'ai-sider-nav-trigger'
    button.innerHTML = `
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
    `

    // 应用样式
    Object.assign(button.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '36px',
      height: '36px',
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
      zIndex: '999999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      fontSize: '0',
      userSelect: 'none',
    })

    // 悬停效果
    const mouseEnterHandler = () => {
      button.style.transform = 'scale(1.1)'
      button.style.boxShadow = '0 6px 20px rgba(20, 184, 166, 0.4)'
    }

    const mouseLeaveHandler = () => {
      button.style.transform = 'scale(1)'
      button.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.3)'
    }

    globalResourceManager.addListener(button, 'mouseenter', mouseEnterHandler)
    globalResourceManager.addListener(button, 'mouseleave', mouseLeaveHandler)

    // 点击事件
    globalResourceManager.addListener(button, 'click', toggleAISidebar)

    document.body.appendChild(button)
    return button
  }

  // 加载调试工具
  function loadDebugTools() {
    if (!window.debugApiKey) {
      const script = document.createElement('script')
      script.src = chrome.runtime.getURL('scripts/debug-api-key.js')
      script.onload = () => {
        console.log('🔧 API Key 调试工具已加载，使用 debugApiKey.runDiagnostics() 进行诊断')
      }
      document.head.appendChild(script)
    }
  }

  // 创建并注入侧边栏
  function createSidebar() {
    const sidebar = document.createElement('div')
    sidebar.id = 'ai-sider-nav-sidebar'

    Object.assign(sidebar.style, {
      position: 'fixed',
      top: '0',
      right: `-${aiAssistantState.width}px`,
      width: `${aiAssistantState.width}px`,
      height: '100vh',
      background: 'white',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
      zIndex: '999998',
      transition: 'right 0.3s ease',
      borderLeft: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
    })

    // 创建拖拽调整手柄
    const resizeHandle = document.createElement('div')
    resizeHandle.id = 'ai-resize-handle'
    Object.assign(resizeHandle.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      bottom: '0',
      width: '4px',
      cursor: 'col-resize',
      background: 'transparent',
      zIndex: '10',
      transition: 'background-color 0.2s ease',
    })

    // 手柄悬停效果
    const handleMouseEnter = () => {
      resizeHandle.style.backgroundColor = '#14b8a6'
    }

    const handleMouseLeave = () => {
      if (!isResizing) {
        resizeHandle.style.backgroundColor = 'transparent'
      }
    }

    globalResourceManager.addListener(resizeHandle, 'mouseenter', handleMouseEnter)
    globalResourceManager.addListener(resizeHandle, 'mouseleave', handleMouseLeave)

    sidebar.appendChild(resizeHandle)

    sidebar.innerHTML += `
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        min-height: 64px;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="color: #14b8a6;">
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
          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">AI 助手</h2>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="ai-open-newtab" style="
            padding: 6px;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s ease;
          " title="在新标签页中打开完整版">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M15 3h6v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button id="ai-sidebar-close" style="
            padding: 6px;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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

      <!-- 总结功能区域（仅非新标签页显示） -->
      <div id="ai-summary-section" style="
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        background: #f8fafc;
        display: ${isNewTabPage ? 'none' : 'block'};
      ">
        <button id="ai-summarize-btn" style="
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #14b8a6;
          border-radius: 6px;
          background: white;
          color: #14b8a6;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          总结当前页面
        </button>
      </div>

      <!-- 消息列表区域 -->
      <div id="ai-messages-container" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      ">
        <!-- 欢迎消息 -->
        <div style="
          padding: 16px;
          background: #f0fdfa;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          text-align: center;
        ">
          <div style="color: #14b8a6; margin-bottom: 8px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="margin: 0 auto;">
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
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            你好！我是 AI 助手
          </h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.4;">
            有什么可以帮助你的吗？
          </p>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div style="
        border-top: 1px solid #e5e7eb;
        padding: 16px;
        background: white;
      ">
        <div style="
          display: flex;
          gap: 8px;
          align-items: flex-end;
        ">
          <textarea
            id="ai-input"
            placeholder="输入你的问题..."
            style="
              flex: 1;
              height: 40px;
              min-height: 40px;
              max-height: 120px;
              padding: 10px 12px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              resize: none;
              font-family: inherit;
              font-size: 14px;
              line-height: 1.4;
              outline: none;
              transition: all 0.2s ease;
              overflow-y: hidden;
            "
          ></textarea>
          <button
            id="ai-send-btn"
            style="
              width: 40px;
              height: 40px;
              padding: 0;
              border: none;
              border-radius: 8px;
              background: linear-gradient(135deg, #14b8a6, #0d9488);
              color: white;
              cursor: pointer;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            "
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    `

    // 关闭按钮事件
    const closeBtn = sidebar.querySelector('#ai-sidebar-close')
    globalResourceManager.addListener(closeBtn, 'click', toggleAISidebar)

    // 打开新标签页按钮事件
    const newTabBtn = sidebar.querySelector('#ai-open-newtab')
    const newTabHandler = () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: 'chrome://newtab/' })
      } else {
        window.open('about:newtab', '_blank')
      }
    }
    globalResourceManager.addListener(newTabBtn, 'click', newTabHandler)

    // 设置拖拽调整功能
    setupResizeHandlers(sidebar, resizeHandle)

    // 设置对话功能
    setupChatInterface(sidebar)

    document.body.appendChild(sidebar)
    return sidebar
  }

  // 切换侧边栏
  function toggleAISidebar() {
    const sidebar = document.getElementById('ai-sider-nav-sidebar')
    const button = document.getElementById('ai-sider-nav-trigger')

    if (!sidebar) return

    aiAssistantState.isOpen = !aiAssistantState.isOpen

    if (aiAssistantState.isOpen) {
      sidebar.style.right = '0'
      if (button) {
        button.style.background = 'linear-gradient(135deg, #0d9488, #0f766e)'
        // 隐藏触发按钮
        button.style.display = 'none'
      }
    } else {
      sidebar.style.right = `-${aiAssistantState.width}px`
      if (button) {
        button.style.background = 'linear-gradient(135deg, #14b8a6, #0d9488)'
        // 显示触发按钮
        button.style.display = 'flex'
      }
    }
  }

  // 全局快捷键监听
  function setupKeyboardShortcuts() {
    const keydownHandler = (e) => {
      // Command+K 切换侧边栏 (Mac) 或 Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleAISidebar()
      }

      // ESC 关闭侧边栏
      if (e.key === 'Escape' && aiAssistantState.isOpen) {
        e.preventDefault()
        toggleAISidebar()
      }
    }

    globalResourceManager.addListener(document, 'keydown', keydownHandler)
  }

  // 监听设置变化
  function setupSettingsListener() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const settingsChangeHandler = (changes, namespace) => {
        if (namespace === 'sync' && changes.aiSiderNavSettings) {
          const newSettings = changes.aiSiderNavSettings.newValue
          if (newSettings && newSettings.aiAssistant) {
            aiAssistantState.settings = { ...aiAssistantState.settings, ...newSettings.aiAssistant }
            updateUI()
          }
        }
      }

      chrome.storage.onChanged.addListener(settingsChangeHandler)

      // 将监听器添加到资源管理器（Chrome API 监听器需要特殊处理）
      globalResourceManager.listeners.add({
        element: chrome.storage.onChanged,
        event: 'changed',
        handler: settingsChangeHandler,
        cleanup: () => chrome.storage.onChanged.removeListener(settingsChangeHandler),
      })
    }
  }

  // 更新 UI
  function updateUI() {
    const button = document.getElementById('ai-sider-nav-trigger')
    const sidebar = document.getElementById('ai-sider-nav-sidebar')

    if (!aiAssistantState.settings.showTriggerButton || !aiAssistantState.settings.globalAccess) {
      if (button) button.style.display = 'none'
      if (sidebar && aiAssistantState.isOpen) toggleAISidebar()
    } else {
      if (button) button.style.display = 'flex'
    }
  }

  // 加载 marked.js 用于 Markdown 渲染
  function loadMarkedScript() {
    return new Promise((resolve, reject) => {
      // 如果已经加载，则直接返回
      if (typeof window.marked === 'function') {
        return resolve()
      }
      const existingScript = document.getElementById('marked-script')
      if (existingScript) {
        // 如果脚本已存在但 marked 对象还不可用，等待加载完成
        const loadHandler = () => resolve()
        const errorHandler = (e) => reject(e)

        if (typeof globalResourceManager !== 'undefined') {
          globalResourceManager.addListener(existingScript, 'load', loadHandler)
          globalResourceManager.addListener(existingScript, 'error', errorHandler)
        } else {
          existingScript.addEventListener('load', loadHandler)
          existingScript.addEventListener('error', errorHandler)
        }
        return
      }

      const script = document.createElement('script')
      script.id = 'marked-script'
      // 使用本地版本避免 CSP 问题
      script.src = chrome.runtime.getURL('libs/marked.min.js')

      const loadHandler = () => resolve()
      const errorHandler = (e) => reject(e)

      if (typeof globalResourceManager !== 'undefined') {
        globalResourceManager.addListener(script, 'load', loadHandler)
        globalResourceManager.addListener(script, 'error', errorHandler)
      } else {
        script.onload = loadHandler
        script.onerror = errorHandler
      }

      document.head.appendChild(script)
    })
  }

  // 初始化
  async function init() {
    try {
      console.log('🚀 AI Sider Nav: 开始初始化...')
      await loadMarkedScript()
      console.log('✅ AI Sider Nav: Markdown 渲染器加载成功')

      // 验证 marked.js 是否正确加载
      if (typeof window.marked === 'function') {
        console.log('✅ window.marked 函数可用')
      } else {
        console.warn('⚠️ window.marked 函数不可用，Markdown 渲染将回退到纯文本')
      }
    } catch (error) {
      console.error('❌ AI Sider Nav: Markdown 渲染器加载失败', error)
    }

    await loadSettings()
    await loadSidebarWidth()

    // 加载调试工具
    loadDebugTools()

    if (aiAssistantState.settings.enabled && aiAssistantState.settings.globalAccess) {
      createTriggerButton()
      createSidebar()
      setupKeyboardShortcuts()
      setupSettingsListener()
    }

    console.log('🎉 AI Sider Nav: 初始化完成')
  }

  // 设置对话界面功能
  function setupChatInterface(sidebar) {
    const messagesContainer = sidebar.querySelector('#ai-messages-container')
    const input = sidebar.querySelector('#ai-input')
    const sendBtn = sidebar.querySelector('#ai-send-btn')

    let isResponding = false
    let conversationHistory = []

    // 添加消息到界面
    function addMessage(content, isUser = false) {
      const messageDiv = document.createElement('div')
      messageDiv.style.cssText = `
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        padding: 0 4px;
        ${isUser ? 'flex-direction: row-reverse;' : ''}
        animation: messageSlideIn 0.3s ease-out;
      `
      if (!isUser) {
        messageDiv.classList.add('ai-message')
      }

      const avatar = document.createElement('div')
      avatar.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
        ${
          isUser
            ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;'
            : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;'
        }
      `
      avatar.innerHTML = isUser
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

      const messageWrapper = document.createElement('div')
      messageWrapper.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        ${isUser ? 'align-items: flex-end;' : 'align-items: flex-start;'}
        max-width: calc(100% - 48px);
      `

      const messageContent = document.createElement('div')
      messageContent.style.cssText = `
        max-width: 85%;
        padding: 14px 18px;
        font-size: 14px;
        line-height: 1.6;
        word-wrap: break-word;
        position: relative;
        transition: all 0.2s ease;
        ${
          isUser
            ? `
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 20px 20px 6px 20px;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            `
            : `
              background: #ffffff;
              color: #2d3748;
              border-radius: 20px 20px 20px 6px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            `
        }
      `

      // 添加时间戳
      const timestamp = document.createElement('div')
      timestamp.style.cssText = `
        font-size: 11px;
        color: #a0aec0;
        margin-top: 4px;
        ${isUser ? 'text-align: right;' : 'text-align: left;'}
      `
      timestamp.textContent = new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })

      // For user messages, use textContent to prevent XSS.
      // For AI messages, we will use innerHTML to render Markdown.
      if (isUser) {
        messageContent.textContent = content
      } else {
        // 确保 marked.js 已加载后再进行 markdown 渲染
        if (typeof window.marked === 'function') {
          console.log('✅ marked.js 已加载，正在渲染 markdown')
          try {
            messageContent.innerHTML = window.marked(content)
            // 优化 AI 消息中的代码块样式
            const codeBlocks = messageContent.querySelectorAll('pre code')
            codeBlocks.forEach((block) => {
              block.style.cssText = `
                background: #f7fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 13px;
                line-height: 1.4;
                overflow-x: auto;
              `
            })
            // 优化行内代码样式
            const inlineCodes = messageContent.querySelectorAll('code:not(pre code)')
            inlineCodes.forEach((code) => {
              code.style.cssText = `
                background: #f7fafc;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                padding: 2px 6px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 12px;
                color: #e53e3e;
              `
            })
          } catch (error) {
            console.error('❌ Markdown 渲染失败:', error)
            messageContent.textContent = content // Fallback
          }
        } else {
          console.warn('⚠️ marked.js 未加载，尝试重新加载...')
          // 尝试重新加载 marked.js
          loadMarkedScript()
            .then(() => {
              if (typeof window.marked === 'function') {
                console.log('✅ marked.js 重新加载成功，正在渲染 markdown')
                try {
                  messageContent.innerHTML = window.marked(content)
                  // 重新应用样式
                  const codeBlocks = messageContent.querySelectorAll('pre code')
                  codeBlocks.forEach((block) => {
                    block.style.cssText = `
                    background: #f7fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 13px;
                    line-height: 1.4;
                    overflow-x: auto;
                  `
                  })
                  const inlineCodes = messageContent.querySelectorAll('code:not(pre code)')
                  inlineCodes.forEach((code) => {
                    code.style.cssText = `
                    background: #f7fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 12px;
                    color: #e53e3e;
                  `
                  })
                } catch (error) {
                  console.error('❌ Markdown 重新渲染失败:', error)
                  messageContent.textContent = content // Fallback
                }
              } else {
                console.error('❌ marked.js 重新加载失败，使用纯文本显示')
                messageContent.textContent = content // Fallback
              }
            })
            .catch((error) => {
              console.error('❌ marked.js 重新加载出错:', error)
              messageContent.textContent = content // Fallback
            })
          // 临时显示纯文本，等待重新加载完成
          messageContent.textContent = content
        }
      }

      messageWrapper.appendChild(messageContent)
      messageWrapper.appendChild(timestamp)
      messageDiv.appendChild(avatar)
      messageDiv.appendChild(messageWrapper)

      // 移除欢迎消息（如果存在）
      const welcomeMsg = messagesContainer.querySelector('div[style*="background: #f0fdfa"]')
      if (welcomeMsg && conversationHistory.length === 0) {
        welcomeMsg.remove()
      }

      messagesContainer.appendChild(messageDiv)
      messagesContainer.scrollTop = messagesContainer.scrollHeight

      return messageDiv
    }

    // 显示加载状态
    function showLoadingMessage() {
      const loadingDiv = document.createElement('div')
      loadingDiv.id = 'ai-loading-message'
      loadingDiv.style.cssText = `
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        padding: 0 4px;
        animation: messageSlideIn 0.3s ease-out;
      `

      const avatar = document.createElement('div')
      avatar.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: avatarPulse 2s ease-in-out infinite;
      `
      avatar.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

      const messageWrapper = document.createElement('div')
      messageWrapper.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        max-width: calc(100% - 48px);
      `

      const loadingContent = document.createElement('div')
      loadingContent.style.cssText = `
        max-width: 85%;
        padding: 14px 18px;
        border-radius: 20px 20px 20px 6px;
        font-size: 14px;
        line-height: 1.6;
        background: #ffffff;
        color: #2d3748;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;
      `
      loadingContent.innerHTML = `
        <div style="
          display: flex;
          gap: 4px;
          align-items: center;
        ">
          <div style="
            width: 8px; 
            height: 8px; 
            border-radius: 50%; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            animation: dotPulse 1.4s ease-in-out infinite;
          "></div>
          <div style="
            width: 8px; 
            height: 8px; 
            border-radius: 50%; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            animation: dotPulse 1.4s ease-in-out infinite 0.2s;
          "></div>
          <div style="
            width: 8px; 
            height: 8px; 
            border-radius: 50%; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            animation: dotPulse 1.4s ease-in-out infinite 0.4s;
          "></div>
        </div>
        <span style="color: #718096; font-weight: 500;">AI 正在思考...</span>
      `

      const timestamp = document.createElement('div')
      timestamp.style.cssText = `
        font-size: 11px;
        color: #a0aec0;
        margin-top: 4px;
        text-align: left;
      `
      timestamp.textContent = new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })

      messageWrapper.appendChild(loadingContent)
      messageWrapper.appendChild(timestamp)
      loadingDiv.appendChild(avatar)
      loadingDiv.appendChild(messageWrapper)
      messagesContainer.appendChild(loadingDiv)
      messagesContainer.scrollTop = messagesContainer.scrollHeight

      return loadingDiv
    }

    // 移除加载状态
    function removeLoadingMessage() {
      const loadingMsg = messagesContainer.querySelector('#ai-loading-message')
      if (loadingMsg) {
        loadingMsg.remove()
      }
    }

    // DeepSeek API 配置
    const API_URL = 'https://api.deepseek.com/chat/completions'
    const DEFAULT_MODEL = 'deepseek-chat'

    // 获取 API Key
    async function getApiKey() {
      try {
        console.log('开始获取 API Key...')

        // 优先从 chrome.storage 直接获取（与主应用保持一致）
        if (typeof chrome !== 'undefined' && chrome.storage) {
          try {
            console.log('从 chrome.storage 获取 API Key...')
            const result = await chrome.storage.sync.get('deepseek_api_key')
            if (result.deepseek_api_key) {
              console.log('从 chrome.storage 获取到 API Key')
              return result.deepseek_api_key
            }
            console.log('chrome.storage 中未找到 API Key')
          } catch (chromeError) {
            console.warn(
              '从 chrome.storage 获取 API Key 失败，尝试 background script:',
              chromeError
            )

            // 回退到通过 background script 获取
            try {
              console.log('通过 background script 获取 API Key...')
              const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'GET_API_KEY' }, (response) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message))
                  } else {
                    resolve(response)
                  }
                })
              })

              if (response && response.apiKey) {
                console.log('从 background script 获取到 API Key')
                return response.apiKey
              }
            } catch (runtimeError) {
              console.error('通过 background script 获取 API Key 失败:', runtimeError)
            }
          }
        }

        // 最后尝试从 localStorage 获取（降级方案）
        console.log('尝试从 localStorage 获取 API Key...')
        const localApiKey = localStorage.getItem('deepseek_api_key')
        console.log('localStorage 结果:', localApiKey ? '找到 API Key' : '未找到 API Key')
        return localApiKey
      } catch (error) {
        console.error('获取 API Key 失败:', error)
        return null
      }
    }

    // 获取 AI 模型
    async function getAIModel() {
      try {
        // 优先从 chrome.storage 获取
        if (typeof chrome !== 'undefined' && chrome.storage) {
          try {
            const result = await chrome.storage.sync.get('deepseek_model')
            if (result.deepseek_model) {
              return result.deepseek_model
            }
          } catch (chromeError) {
            console.warn('从 chrome.storage 获取 AI 模型失败，回退到 localStorage:', chromeError)
          }
        }

        // 回退到 localStorage
        return localStorage.getItem('deepseek_model') || DEFAULT_MODEL
      } catch (error) {
        console.error('获取 AI 模型失败:', error)
        return DEFAULT_MODEL
      }
    }

    // 流式渲染 AI 回复
    async function streamAIResponse(messages, onChunk) {
      console.log('streamAIResponse: 开始获取 API Key...')
      const apiKey = await getApiKey()
      console.log(
        'streamAIResponse: API Key 获取结果:',
        apiKey ? `成功 (${apiKey.substring(0, 10)}...)` : '失败'
      )
      if (!apiKey) {
        console.error('streamAIResponse: API Key 为空，抛出错误')
        // 添加更详细的调试信息
        console.log('streamAIResponse: 尝试直接从存储获取调试信息...')
        try {
          if (typeof chrome !== 'undefined' && chrome.storage) {
            const debugResult = await chrome.storage.sync.get([
              'aiSiderNavSettings',
              'deepseek_api_key',
              'deepseekApiKey',
            ])
            console.log('streamAIResponse: Chrome Storage 调试结果:', debugResult)
          }
          const localDebug = localStorage.getItem('deepseek_api_key')
          console.log(
            'streamAIResponse: localStorage 调试结果:',
            localDebug ? `找到 (${localDebug.substring(0, 10)}...)` : '未找到'
          )
        } catch (debugError) {
          console.error('streamAIResponse: 调试信息获取失败:', debugError)
        }
        throw new Error(
          '❌ 请先在新标签页的 AI 助手设置中配置 DeepSeek API Key，然后刷新页面重试。\n\n💡 提示：\n1. 点击浏览器工具栏的扩展图标打开设置\n2. 或者打开新标签页进入 AI 助手设置\n3. 配置完成后刷新当前页面'
        )
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: await getAIModel(),
          messages: messages,
          temperature: 0.3,
          stream: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      let buffer = ''
      let isReading = true

      while (isReading) {
        const { done, value } = await reader.read()
        if (done) {
          isReading = false
          break
        }

        buffer += new TextDecoder().decode(value)
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonData = line.slice(6)
            if (jsonData === '[DONE]') {
              isReading = false
              return
            }
            try {
              const parsedData = JSON.parse(jsonData)
              const content = parsedData.choices[0]?.delta?.content
              if (content) {
                onChunk(content)
              }
            } catch (error) {
              console.error('解析流数据失败:', error)
            }
          }
        }
      }
    }

    // 发送消息
    async function sendMessage() {
      const message = input.value.trim()
      if (!message || isResponding) return

      // 添加用户消息
      addMessage(message, true)
      conversationHistory.push({ role: 'user', content: message })

      // 清空输入框并重置高度
      input.value = ''
      input.style.height = '40px'
      input.style.overflowY = 'hidden'

      // 设置响应状态
      isResponding = true
      sendBtn.disabled = true
      sendBtn.style.opacity = '0.5'

      // 显示加载状态
      const loadingMsg = showLoadingMessage()

      try {
        // 检查是否配置了 API Key
        const apiKey = await getApiKey()
        if (!apiKey) {
          removeLoadingMessage()
          addMessage(
            '❌ 请先在新标签页的 AI 助手设置中配置 DeepSeek API Key，然后刷新页面重试。\n\n💡 提示：\n1. 点击浏览器工具栏的扩展图标打开设置\n2. 或者打开新标签页进入 AI 助手设置\n3. 配置完成后刷新当前页面',
            false
          )
          return
        }

        // 移除加载状态，准备流式渲染
        removeLoadingMessage()

        // 创建 AI 消息容器
        const aiMessageDiv = addMessage('', false)
        const aiMessageContent = aiMessageDiv.querySelector('div:last-child')
        let fullResponse = ''

        // 流式渲染回复
        await streamAIResponse(conversationHistory, (chunk) => {
          fullResponse += chunk
          // 确保 marked.js 已加载后再进行 markdown 渲染
          if (typeof window.marked === 'function') {
            try {
              aiMessageContent.innerHTML = window.marked(fullResponse)
            } catch (error) {
              console.error('❌ 流式渲染 Markdown 失败:', error)
              aiMessageContent.textContent = fullResponse
            }
          } else {
            // 如果 marked.js 未加载，尝试重新加载
            console.log('⚠️ marked.js 未加载，尝试重新加载...')
            loadMarkedScript()
              .then(() => {
                if (typeof window.marked === 'function') {
                  try {
                    aiMessageContent.innerHTML = window.marked(fullResponse)
                    console.log('✅ marked.js 重新加载成功，Markdown 渲染完成')
                  } catch (error) {
                    console.error('❌ 重新加载后 Markdown 渲染失败:', error)
                    aiMessageContent.textContent = fullResponse
                  }
                } else {
                  console.error('❌ marked.js 重新加载失败，使用纯文本显示')
                  aiMessageContent.textContent = fullResponse
                }
              })
              .catch((error) => {
                console.error('❌ 重新加载 marked.js 失败:', error)
                aiMessageContent.textContent = fullResponse
              })
          }
          // 自动滚动到底部
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        })

        // 更新对话历史
        conversationHistory.push({ role: 'assistant', content: fullResponse })
      } catch (error) {
        removeLoadingMessage()
        console.error('AI 响应错误:', error)

        let errorMessage = '抱歉，我现在无法回复。请稍后再试。'
        if (error.message.includes('API Key') || error.message.includes('请先在新标签页')) {
          errorMessage = error.message // 使用完整的错误信息，包含详细提示
        } else if (error.message.includes('401')) {
          errorMessage =
            '❌ API Key 无效，请检查设置。\n\n💡 提示：\n1. 确认 API Key 格式正确\n2. 检查 API Key 是否已过期\n3. 重新获取并配置新的 API Key'
        } else if (error.message.includes('429')) {
          errorMessage = '❌ 请求过于频繁，请稍后再试。'
        } else if (error.message.includes('500')) {
          errorMessage = '❌ 服务器错误，请稍后再试。'
        }

        addMessage(errorMessage, false)
      } finally {
        // 重置状态
        isResponding = false
        sendBtn.disabled = false
        sendBtn.style.opacity = '1'
      }
    }

    // 备用回复函数（当 API 不可用时使用）
    function getFallbackResponse(userMessage) {
      return `❌ 我现在无法连接到 AI 服务。请确保：\n\n🔑 **API Key 配置**\n1. 点击浏览器工具栏的扩展图标打开设置\n2. 或者打开新标签页进入 AI 助手设置\n3. 配置有效的 DeepSeek API Key\n4. 保存设置后刷新当前页面\n\n🌐 **其他检查项**\n• 网络连接正常\n• API 服务可用\n• 浏览器允许扩展访问此网站\n\n💬 **你的问题：** "${userMessage}"\n\n🔧 **调试工具：** 在控制台运行 \`debugApiKey.runDiagnostics()\` 进行详细诊断\n\n请完成配置后重试，或使用完整版 AI 助手。`
    }

    // 输入框事件
    const inputHandler = () => {
      // 自动调整高度
      input.style.height = '40px'
      const newHeight = Math.min(input.scrollHeight, 120)
      input.style.height = newHeight + 'px'

      // 如果内容超过一行，显示滚动条
      if (input.scrollHeight > 120) {
        input.style.overflowY = 'auto'
      } else {
        input.style.overflowY = 'hidden'
      }
    }

    const keydownHandler = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    }

    globalResourceManager.addListener(input, 'input', inputHandler)
    globalResourceManager.addListener(input, 'keydown', keydownHandler)

    // 发送按钮事件
    globalResourceManager.addListener(sendBtn, 'click', sendMessage)

    // 总结按钮事件
    const summarizeBtn = sidebar.querySelector('#ai-summarize-btn')
    if (summarizeBtn) {
      globalResourceManager.addListener(summarizeBtn, 'click', summarizePage)
    }

    // 总结页面功能
    async function summarizePage() {
      if (isResponding) return

      // 设置按钮状态
      summarizeBtn.disabled = true
      summarizeBtn.style.opacity = '0.5'
      summarizeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        正在分析页面...
      `

      try {
        // 提取页面内容
        const pageContent = extractPageContent()
        if (!pageContent) {
          throw new Error('无法提取页面内容')
        }

        // 构建总结提示
        const summaryPrompt = `请帮我总结以下网页内容，包括主要观点、关键信息和结构概述：

**页面标题：** ${pageContent.title}
**页面URL：** ${pageContent.url}
**字数统计：** ${pageContent.metadata.wordCount} 字
**预计阅读时间：** ${pageContent.metadata.readingTime} 分钟

**主要内容：**
${pageContent.mainContent.substring(0, 3000)}${pageContent.mainContent.length > 3000 ? '...' : ''}

${
  pageContent.structure.headings.length > 0
    ? `**页面结构：**
${pageContent.structure.headings.map((h) => `${'  '.repeat(h.level - 1)}- ${h.text}`).join('\n')}`
    : ''
}

请用中文提供一个简洁而全面的总结，包括：
1. 页面主题和核心内容
2. 主要观点或信息要点
3. 内容结构概述
4. 如果有的话，提及重要的数据、图表或列表信息`

        // 添加总结消息到对话
        addMessage('📄 正在总结当前页面内容...', false)
        conversationHistory.push({ role: 'user', content: summaryPrompt })

        // 设置响应状态
        isResponding = true
        sendBtn.disabled = true
        sendBtn.style.opacity = '0.5'

        // 创建 AI 消息容器
        const aiMessageDiv = addMessage('', false)
        const aiMessageContent = aiMessageDiv.querySelector('div:last-child')
        let fullResponse = ''

        // 流式渲染回复
        await streamAIResponse(conversationHistory, (chunk) => {
          fullResponse += chunk
          // 确保 marked.js 已加载后再进行 markdown 渲染
          if (typeof window.marked === 'function') {
            try {
              aiMessageContent.innerHTML = window.marked(fullResponse)
            } catch (error) {
              console.error('❌ 流式渲染 Markdown 失败:', error)
              aiMessageContent.textContent = fullResponse
            }
          } else {
            // 如果 marked.js 未加载，尝试重新加载
            console.log('⚠️ marked.js 未加载，尝试重新加载...')
            loadMarkedScript()
              .then(() => {
                if (typeof window.marked === 'function') {
                  try {
                    aiMessageContent.innerHTML = window.marked(fullResponse)
                    console.log('✅ marked.js 重新加载成功，Markdown 渲染完成')
                  } catch (error) {
                    console.error('❌ 重新加载后 Markdown 渲染失败:', error)
                    aiMessageContent.textContent = fullResponse
                  }
                } else {
                  console.error('❌ marked.js 重新加载失败，使用纯文本显示')
                  aiMessageContent.textContent = fullResponse
                }
              })
              .catch((error) => {
                console.error('❌ 重新加载 marked.js 失败:', error)
                aiMessageContent.textContent = fullResponse
              })
          }
          // 自动滚动到底部
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        })

        // 更新对话历史
        conversationHistory.push({ role: 'assistant', content: fullResponse })
      } catch (error) {
        console.error('页面总结失败:', error)
        addMessage(`❌ 页面总结失败：${error.message}`, false)
      } finally {
        // 重置按钮状态
        summarizeBtn.disabled = false
        summarizeBtn.style.opacity = '1'
        summarizeBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          总结当前页面
        `

        // 重置响应状态
        isResponding = false
        sendBtn.disabled = false
        sendBtn.style.opacity = '1'
      }
    }

    // 添加 CSS 动画
    if (!document.querySelector('#ai-chat-styles')) {
      const style = document.createElement('style')
      style.id = 'ai-chat-styles'
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        
        #ai-input:focus {
          border-color: #14b8a6 !important;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1) !important;
        }
        
        #ai-send-btn:hover {
          background: linear-gradient(135deg, #0d9488, #0f766e) !important;
          transform: scale(1.05);
        }
        
        #ai-open-newtab:hover {
          background: #f3f4f6 !important;
        }
        
        #ai-sidebar-close:hover {
          background: #f3f4f6 !important;
        }

        #ai-summarize-btn:hover {
          background: #14b8a6 !important;
          color: white !important;
        }

        #ai-summarize-btn:disabled {
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }

        /* Markdown 渲染样式 */
        .ai-message p {
          margin-top: 0;
          margin-bottom: 1em;
        }
        .ai-message h1, .ai-message h2, .ai-message h3, .ai-message h4, .ai-message h5, .ai-message h6 {
          margin-top: 1.2em;
          margin-bottom: 0.6em;
          font-weight: 600;
        }
        .ai-message h1 { font-size: 1.5em; }
        .ai-message h2 { font-size: 1.3em; }
        .ai-message h3 { font-size: 1.2em; }
        .ai-message ul, .ai-message ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }
        .ai-message li {
          margin-bottom: 0.4em;
        }
        .ai-message blockquote {
          margin: 1em 0;
          padding: 0.5em 1em;
          border-left: 4px solid #10b981;
          background-color: #f0fdfa;
          color: #1f2937;
        }
        .ai-message pre {
          background-color: #1f2937; /* 深色代码块背景 */
          color: #f3f4f6; /* 亮色代码文本 */
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9em;
          margin-bottom: 1em;
        }
        .ai-message code {
          font-family: 'Courier New', Courier, monospace;
          background-color: #e5e7eb;
          color: #ef4444;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .ai-message pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          border-radius: 0;
        }
        .ai-message table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1em;
          border: 1px solid #e5e7eb;
        }
        .ai-message th, .ai-message td {
          border: 1px solid #e5e7eb;
          padding: 0.6em 0.8em;
          text-align: left;
        }
        .ai-message th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        .ai-message tr:nth-child(even) {
          background-color: #f9fafb;
        }
      `
      document.head.appendChild(style)
    }
  }

  // 页面内容提取功能（优化内存使用）
  function extractPageContent() {
    try {
      // 基本页面信息
      const title = document.title || document.querySelector('h1')?.textContent?.trim() || '无标题'
      const url = window.location.href

      // 限制内容提取的大小以避免内存问题
      const MAX_CONTENT_LENGTH = 50000 // 50KB
      const MAX_IMAGES = 20
      const MAX_TABLES = 10
      const MAX_LISTS = 15

      // 提取主要内容（限制长度）
      let mainContent = extractMainContent()
      if (mainContent.length > MAX_CONTENT_LENGTH) {
        mainContent = mainContent.substring(0, MAX_CONTENT_LENGTH) + '...[内容已截断]'
      }

      // 提取图片信息（限制数量）
      const images = extractImages().slice(0, MAX_IMAGES)

      // 提取表格信息（限制数量）
      const tables = extractTables().slice(0, MAX_TABLES)

      // 提取列表信息（限制数量）
      const lists = extractLists().slice(0, MAX_LISTS)

      // 提取页面结构
      const structure = extractPageStructure()

      // 计算元数据
      const wordCount = countWords(mainContent)
      const readingTime = Math.ceil(wordCount / 200)

      return {
        title,
        url,
        mainContent,
        images,
        tables,
        lists,
        metadata: {
          description:
            document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
          keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
          author: document.querySelector('meta[name="author"]')?.getAttribute('content') || '',
          language: document.documentElement.lang || 'zh-CN',
          wordCount,
          readingTime,
        },
        structure,
      }
    } catch (error) {
      console.error('提取页面内容失败:', error)
      return null
    }
  }

  // 提取主要内容
  function extractMainContent() {
    const excludeSelectors = [
      'nav',
      'header',
      'footer',
      '.navigation',
      '.nav',
      '.menu',
      '.sidebar',
      '.advertisement',
      '.ads',
      '.ad',
      '.social',
      '.share',
      '.comments',
      '.comment',
      '.related',
      '.popup',
      '.modal',
      '.overlay',
      'script',
      'style',
      'noscript',
    ]

    // 尝试找到主要内容区域
    const mainSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      'article',
      '.article',
    ]

    let mainElement = null
    for (const selector of mainSelectors) {
      mainElement = document.querySelector(selector)
      if (mainElement) break
    }

    if (!mainElement) {
      mainElement = document.body
    }

    // 克隆元素以避免修改原始 DOM
    const clone = mainElement.cloneNode(true)

    // 移除不需要的元素
    excludeSelectors.forEach((selector) => {
      const elements = clone.querySelectorAll(selector)
      elements.forEach((el) => el.remove())
    })

    // 提取文本并清理
    let text = clone.textContent || ''
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()

    return text
  }

  // 提取图片信息
  function extractImages() {
    const images = []
    const imgElements = document.querySelectorAll('img')

    imgElements.forEach((img) => {
      if (!img.src || img.src.startsWith('data:')) return

      const imageInfo = {
        src: img.src,
        alt: img.alt || '',
        title: img.title || '',
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      }

      // 查找图片说明
      const figure = img.closest('figure')
      if (figure) {
        const figcaption = figure.querySelector('figcaption')
        if (figcaption) {
          imageInfo.caption = figcaption.textContent?.trim()
        }
      }

      images.push(imageInfo)
    })

    return images.slice(0, 10) // 限制图片数量
  }

  // 提取表格信息
  function extractTables() {
    const tables = []
    const tableElements = document.querySelectorAll('table')

    tableElements.forEach((table) => {
      const headers = []
      const rows = []

      // 提取表头
      const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th')
      headerCells.forEach((cell) => {
        headers.push(cell.textContent?.trim() || '')
      })

      // 提取数据行
      const dataRows = table.querySelectorAll('tbody tr, tr')
      dataRows.forEach((row, index) => {
        if (index === 0 && headerCells.length > 0) return

        const cells = row.querySelectorAll('td, th')
        const rowData = []
        cells.forEach((cell) => {
          rowData.push(cell.textContent?.trim() || '')
        })
        if (rowData.length > 0) {
          rows.push(rowData)
        }
      })

      if (headers.length > 0 || rows.length > 0) {
        const tableInfo = { headers, rows }

        // 查找表格标题
        const caption = table.querySelector('caption')
        if (caption) {
          tableInfo.caption = caption.textContent?.trim()
        }

        tables.push(tableInfo)
      }
    })

    return tables.slice(0, 5) // 限制表格数量
  }

  // 提取列表信息
  function extractLists() {
    const lists = []
    const listElements = document.querySelectorAll('ul, ol')

    listElements.forEach((list) => {
      const items = []
      const listItems = list.querySelectorAll('li')

      listItems.forEach((item) => {
        const text = item.textContent?.trim()
        if (text) {
          items.push(text)
        }
      })

      if (items.length > 0) {
        const listInfo = {
          type: list.tagName.toLowerCase() === 'ol' ? 'ordered' : 'unordered',
          items: items.slice(0, 10), // 限制列表项数量
        }

        // 查找列表标题
        const prevElement = list.previousElementSibling
        if (prevElement && /^h[1-6]$/i.test(prevElement.tagName)) {
          listInfo.title = prevElement.textContent?.trim()
        }

        lists.push(listInfo)
      }
    })

    return lists.slice(0, 5) // 限制列表数量
  }

  // 提取页面结构
  function extractPageStructure() {
    const headings = []
    const sections = []

    // 提取标题
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headingElements.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1))
      const text = heading.textContent?.trim()
      if (text) {
        headings.push({
          level,
          text,
          id: heading.id || '',
        })
      }
    })

    return { headings, sections }
  }

  // 计算字数
  function countWords(text) {
    if (!text) return 0

    // 中文字符按字计算，英文按单词计算
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 0).length

    return chineseChars + englishWords
  }

  // 监听来自扩展的消息
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    const messageHandler = (message, sender, sendResponse) => {
      if (message.type === 'EXTRACT_PAGE_CONTENT') {
        const content = extractPageContent()
        if (content) {
          // 发送提取的内容回扩展
          chrome.runtime.sendMessage({
            type: 'PAGE_CONTENT_EXTRACTED',
            content: content,
          })
          sendResponse({ success: true })

          // 清理临时变量以释放内存
          content = null
        } else {
          sendResponse({ success: false, error: '内容提取失败' })
        }
      }
      return true
    }

    chrome.runtime.onMessage.addListener(messageHandler)

    // 将监听器添加到资源管理器
    globalResourceManager.listeners.add({
      element: chrome.runtime.onMessage,
      event: 'message',
      handler: messageHandler,
      cleanup: () => chrome.runtime.onMessage.removeListener(messageHandler),
    })
  }

  // 全局资源管理器
  const globalResourceManager = {
    timers: new Set(),
    listeners: new Set(),
    observers: new Set(),
    intervals: new Set(),

    // 添加定时器
    addTimer(timerId) {
      this.timers.add(timerId)
    },

    // 添加事件监听器
    addListener(element, event, handler, options) {
      const listenerInfo = { element, event, handler, options }
      this.listeners.add(listenerInfo)
      element.addEventListener(event, handler, options)
      return listenerInfo
    },

    // 添加观察者
    addObserver(observer) {
      this.observers.add(observer)
    },

    // 添加间隔定时器
    addInterval(intervalId) {
      this.intervals.add(intervalId)
    },

    // 清理所有资源
    cleanup() {
      console.log('🧹 开始清理全局资源...')

      // 清理定时器
      this.timers.forEach((timerId) => {
        clearTimeout(timerId)
      })
      this.timers.clear()

      // 清理间隔定时器
      this.intervals.forEach((intervalId) => {
        clearInterval(intervalId)
      })
      this.intervals.clear()

      // 清理事件监听器
      this.listeners.forEach((listenerInfo) => {
        try {
          if (listenerInfo.cleanup) {
            // 使用自定义清理函数（如 Chrome API 监听器）
            listenerInfo.cleanup()
          } else {
            // 标准 DOM 事件监听器
            const { element, event, handler, options } = listenerInfo
            element.removeEventListener(event, handler, options)
          }
        } catch (error) {
          console.warn('清理事件监听器失败:', error)
        }
      })
      this.listeners.clear()

      // 清理观察者
      this.observers.forEach((observer) => {
        try {
          if (observer.disconnect) {
            observer.disconnect()
          }
        } catch (error) {
          console.warn('清理观察者失败:', error)
        }
      })
      this.observers.clear()

      console.log('✅ 全局资源清理完成')
    },

    // 获取资源统计
    getStats() {
      return {
        timers: this.timers.size,
        listeners: this.listeners.size,
        observers: this.observers.size,
        intervals: this.intervals.size,
      }
    },
  }

  // 页面卸载时清理资源
  const beforeUnloadHandler = () => {
    console.log('🔄 页面即将卸载，开始清理资源...')

    // 清理全局资源管理器
    globalResourceManager.cleanup()

    // 清理 QuickCopyButton 实例
    if (window.quickCopyButton && typeof window.quickCopyButton.destroy === 'function') {
      window.quickCopyButton.destroy()
    }

    // 清理 AI 助手相关资源
    const sidebar = document.getElementById('ai-sider-nav-sidebar')
    const triggerButton = document.getElementById('ai-sider-nav-trigger')

    if (sidebar) {
      sidebar.remove()
    }
    if (triggerButton) {
      triggerButton.remove()
    }

    // 清理可能的内存引用
    if (typeof gc === 'function') {
      gc() // 如果可用，触发垃圾回收
    }

    console.log('✅ 页面卸载清理完成')
  }

  globalResourceManager.addListener(window, 'beforeunload', beforeUnloadHandler)

  // 定期清理内存和检查资源使用（每5分钟）
  const memoryCheckInterval = setInterval(() => {
    const domNodeCount = document.querySelectorAll('*').length
    const resourceStats = globalResourceManager.getStats()

    console.log('📊 内存检查:', {
      domNodes: domNodeCount,
      resources: resourceStats,
    })

    // 检查DOM节点数量
    if (domNodeCount > 10000) {
      console.warn('⚠️ 检测到大量DOM节点，可能存在内存泄露', domNodeCount)
    }

    // 检查资源数量
    const totalResources = Object.values(resourceStats).reduce((sum, count) => sum + count, 0)
    if (totalResources > 100) {
      console.warn('⚠️ 检测到大量未清理资源:', resourceStats)
    }

    // 如果内存压力过大，执行清理
    if (domNodeCount > 15000 || totalResources > 200) {
      console.log('🧹 执行紧急内存清理...')

      // 清理过期的缓存
      if (
        window.cacheManager &&
        typeof window.cacheManager.performAggressiveCleanup === 'function'
      ) {
        window.cacheManager.performAggressiveCleanup()
      }

      // 触发垃圾回收
      if (typeof gc === 'function') {
        gc()
      }
    }
  }, 300000)

  // 将内存检查间隔定时器添加到资源管理器
  globalResourceManager.addInterval(memoryCheckInterval)

  // 等待 DOM 加载完成
  if (document.readyState === 'loading') {
    globalResourceManager.addListener(document, 'DOMContentLoaded', init)
  } else {
    init()
  }
})()
