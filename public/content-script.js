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
          const result = await chrome.storage.sync.get('userSettings')
          this.settings = result.userSettings || {}
        } else {
          // 开发环境使用 localStorage
          const stored = localStorage.getItem('userSettings')
          this.settings = stored ? JSON.parse(stored) : {}
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
          if (namespace === 'sync' && changes.userSettings) {
            const newSettings = changes.userSettings.newValue
            if (newSettings) {
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
      this.button.addEventListener('click', this.boundHandleClick)
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
      setTimeout(() => {
        this.button.textContent = CONFIG.labels.copy
        this.button.classList.remove('copied', 'error')
        this.hide()
      }, hideDelay)
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
      document.addEventListener('mouseup', this.boundHandleMouseUp)
      document.addEventListener('mousedown', this.boundHandleMouseDown)
      window.addEventListener('scroll', this.debouncedHide)
      window.addEventListener('resize', this.debouncedHide)
    }

    /**
     * 处理鼠标抬起事件
     */
    handleMouseUp(event) {
      if (!this.isEnabled || event.target === this.button) return

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
        clearTimeout(timeout)
        timeout = setTimeout(() => func.apply(this, args), wait)
      }
    }

    /**
     * 清理资源方法
     */
    destroy() {
      // 移除所有事件监听
      document.removeEventListener('mouseup', this.boundHandleMouseUp)
      document.removeEventListener('mousedown', this.boundHandleMouseDown)
      window.removeEventListener('scroll', this.debouncedHide)
      window.removeEventListener('resize', this.debouncedHide)

      if (this.button) {
        this.button.removeEventListener('click', this.boundHandleClick)
        if (this.button.parentNode) {
          this.button.parentNode.removeChild(this.button)
        }
        this.button = null
      }
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
    settings: {
      showTriggerButton: true,
      globalAccess: true,
      enabled: true,
    },
  }

  // 从存储加载设置
  async function loadSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['aiAssistantSettings'])
        if (result.aiAssistantSettings && result.aiAssistantSettings.settings) {
          aiAssistantState.settings = {
            ...aiAssistantState.settings,
            ...result.aiAssistantSettings.settings,
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
      width: '48px',
      height: '48px',
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
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)'
      button.style.boxShadow = '0 6px 20px rgba(20, 184, 166, 0.4)'
    })

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)'
      button.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.3)'
    })

    // 点击事件
    button.addEventListener('click', toggleAISidebar)

    document.body.appendChild(button)
    return button
  }

  // 创建侧边栏
  function createSidebar() {
    const sidebar = document.createElement('div')
    sidebar.id = 'ai-sider-nav-sidebar'

    Object.assign(sidebar.style, {
      position: 'fixed',
      top: '0',
      right: '-400px',
      width: '400px',
      height: '100vh',
      background: 'white',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
      zIndex: '999998',
      transition: 'right 0.3s ease',
      borderLeft: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
    })

    sidebar.innerHTML = `
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
        <button id="ai-sidebar-close" style="
          padding: 8px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        ">
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
      <div style="
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        color: #6b7280;
      ">
        <div>
          <div style="color: #14b8a6; margin-bottom: 16px;">
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
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
            AI 助手已就绪
          </h3>
          <p style="margin: 0 0 20px 0; line-height: 1.5;">
            点击新标签页中的 AI 助手图标<br>开始完整的对话体验
          </p>
          <button id="ai-open-newtab" style="
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            background: linear-gradient(135deg, #14b8a6, #0d9488);
            color: white;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            打开新标签页
          </button>
        </div>
      </div>
    `

    // 关闭按钮事件
    const closeBtn = sidebar.querySelector('#ai-sidebar-close')
    closeBtn.addEventListener('click', toggleAISidebar)

    // 打开新标签页按钮事件
    const newTabBtn = sidebar.querySelector('#ai-open-newtab')
    newTabBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: 'chrome://newtab/' })
      } else {
        window.open('about:newtab', '_blank')
      }
      toggleAISidebar()
    })

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
      }
    } else {
      sidebar.style.right = '-400px'
      if (button) {
        button.style.background = 'linear-gradient(135deg, #14b8a6, #0d9488)'
      }
    }
  }

  // 全局快捷键监听
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K 切换侧边栏
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleAISidebar()
      }

      // ESC 关闭侧边栏
      if (e.key === 'Escape' && aiAssistantState.isOpen) {
        e.preventDefault()
        toggleAISidebar()
      }
    })
  }

  // 监听设置变化
  function setupSettingsListener() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.aiAssistantSettings) {
          const newSettings = changes.aiAssistantSettings.newValue
          if (newSettings && newSettings.settings) {
            aiAssistantState.settings = { ...aiAssistantState.settings, ...newSettings.settings }
            updateUI()
          }
        }
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

  // 初始化
  async function init() {
    await loadSettings()

    if (aiAssistantState.settings.enabled && aiAssistantState.settings.globalAccess) {
      createTriggerButton()
      createSidebar()
      setupKeyboardShortcuts()
      setupSettingsListener()
    }
  }

  // 等待 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
