import browser from 'webextension-polyfill'
import type { ExtensionMessage, SidebarState } from '@/types'

class SidebarManager {
  private sidebar: HTMLElement | null = null
  private iframe: HTMLIFrameElement | null = null
  private isVisible = false
  private position: 'left' | 'right' = 'right'
  private width = 400
  private resizeHandle: HTMLElement | null = null
  private isResizing = false

  constructor() {
    this.init()
  }

  private async init() {
    // 加载设置
    await this.loadSettings()
    
    // 监听来自后台脚本和弹窗的消息
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this))
    
    // 监听页面消息（来自侧边栏）
    window.addEventListener('message', this.handleSidebarMessage.bind(this))
    
    // 监听页面变化
    this.observePageChanges()
  }

  private async loadSettings() {
    try {
      const { settings } = await browser.storage.sync.get(['settings'])
      if (settings) {
        this.position = settings.sidebarPosition || 'right'
        // 可以添加更多设置
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  private handleMessage(message: ExtensionMessage) {
    switch (message.type) {
      case 'TOGGLE_SIDEBAR':
        this.toggle()
        break
      case 'EXTRACT_SELECTION':
        this.extractSelection()
        break
      case 'SEND_AI_MESSAGE':
        this.sendMessageToSidebar('AI_MESSAGE', message.payload)
        break
      case 'AUTO_SUMMARIZE_PAGE':
        this.autoSummarizePage()
        break
    }
  }

  private handleSidebarMessage(event: MessageEvent) {
    if (event.source !== this.iframe?.contentWindow) return
    
    switch (event.data.type) {
      case 'CLOSE_SIDEBAR':
        this.hide()
        break
      case 'SWITCH_TAB':
        // 处理标签切换
        break
      case 'EXTRACT_PAGE_CONTENT':
        this.extractPageContent()
        break
    }
  }

  private toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  private show() {
    if (this.isVisible) return
    
    this.createSidebar()
    this.isVisible = true
    
    // 添加页面样式调整
    this.adjustPageLayout(true)
  }

  private hide() {
    if (!this.isVisible) return
    
    if (this.sidebar) {
      this.sidebar.remove()
      this.sidebar = null
      this.iframe = null
      this.resizeHandle = null
    }
    
    this.isVisible = false
    
    // 恢复页面样式
    this.adjustPageLayout(false)
  }

  private createSidebar() {
    // 创建侧边栏容器
    this.sidebar = document.createElement('div')
    this.sidebar.id = 'ai-sider-nav-sidebar'
    this.sidebar.style.cssText = `
      position: fixed;
      top: 0;
      ${this.position}: 0;
      width: ${this.width}px;
      height: 100vh;
      z-index: 2147483647;
      background: white;
      box-shadow: ${this.position === 'right' ? '-2px' : '2px'} 0 10px rgba(0,0,0,0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
    `

    // 创建 iframe
    this.iframe = document.createElement('iframe')
    this.iframe.src = browser.runtime.getURL('sidebar/index.html')
    this.iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    `

    // 创建调整大小的手柄
    this.createResizeHandle()

    this.sidebar.appendChild(this.iframe)
    if (this.resizeHandle) {
      this.sidebar.appendChild(this.resizeHandle)
    }

    document.body.appendChild(this.sidebar)

    // 添加动画效果
    requestAnimationFrame(() => {
      if (this.sidebar) {
        this.sidebar.style.transform = 'translateX(0)'
        this.sidebar.style.transition = 'transform 0.3s ease-out'
      }
    })
  }

  private createResizeHandle() {
    this.resizeHandle = document.createElement('div')
    this.resizeHandle.style.cssText = `
      position: absolute;
      ${this.position === 'right' ? 'left' : 'right'}: -5px;
      top: 0;
      width: 10px;
      height: 100%;
      cursor: ${this.position === 'right' ? 'w-resize' : 'e-resize'};
      background: transparent;
      z-index: 1;
    `

    // 添加调整大小的事件监听
    this.resizeHandle.addEventListener('mousedown', this.startResize.bind(this))
    document.addEventListener('mousemove', this.handleResize.bind(this))
    document.addEventListener('mouseup', this.stopResize.bind(this))
  }

  private startResize(event: MouseEvent) {
    event.preventDefault()
    this.isResizing = true
    document.body.style.cursor = this.position === 'right' ? 'w-resize' : 'e-resize'
  }

  private handleResize(event: MouseEvent) {
    if (!this.isResizing || !this.sidebar) return

    const rect = this.sidebar.getBoundingClientRect()
    let newWidth: number

    if (this.position === 'right') {
      newWidth = window.innerWidth - event.clientX
    } else {
      newWidth = event.clientX
    }

    // 限制最小和最大宽度
    newWidth = Math.max(300, Math.min(800, newWidth))
    
    this.width = newWidth
    this.sidebar.style.width = `${newWidth}px`
    
    // 调整页面布局
    this.adjustPageLayout(true)
  }

  private stopResize() {
    this.isResizing = false
    document.body.style.cursor = ''
  }

  private adjustPageLayout(show: boolean) {
    const body = document.body
    const html = document.documentElement

    if (show) {
      const margin = `${this.width}px`
      if (this.position === 'right') {
        body.style.marginRight = margin
        html.style.marginRight = margin
      } else {
        body.style.marginLeft = margin
        html.style.marginLeft = margin
      }
    } else {
      body.style.marginRight = ''
      body.style.marginLeft = ''
      html.style.marginRight = ''
      html.style.marginLeft = ''
    }
  }

  private extractSelection() {
    const selection = window.getSelection()
    const selectedText = selection?.toString() || ''
    
    if (selectedText) {
      const pageContent = {
        title: document.title,
        url: window.location.href,
        selectedText,
        fullText: document.body.innerText
      }
      
      this.sendMessageToSidebar('EXTRACT_SELECTION', pageContent)
      
      if (!this.isVisible) {
        this.show()
      }
    }
  }

  private extractPageContent() {
    const pageContent = {
      title: document.title,
      url: window.location.href,
      selectedText: window.getSelection()?.toString() || '',
      fullText: document.body.innerText
    }
    
    this.sendMessageToSidebar('PAGE_CONTENT_EXTRACTED', pageContent)
  }

  private autoSummarizePage() {
    // 自动总结页面内容
    const pageContent = {
      title: document.title,
      url: window.location.href,
      fullText: document.body.innerText.slice(0, 2000) // 限制长度
    }
    
    // 发送到后台脚本处理
    browser.runtime.sendMessage({
      type: 'SEND_AI_MESSAGE',
      payload: {
        message: `请总结以下页面内容：\n\n标题：${pageContent.title}\n\n内容：${pageContent.fullText}`
      }
    })
  }

  private sendMessageToSidebar(type: string, payload?: any) {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage({ type, payload }, '*')
    }
  }

  private observePageChanges() {
    // 监听页面内容变化
    const observer = new MutationObserver((mutations) => {
      // 可以在这里处理页面内容变化
      // 例如重新提取内容或更新侧边栏
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    })
  }
}

// 确保页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager()
  })
} else {
  new SidebarManager()
}

console.log('AI Sider Nav content script loaded')
