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
