// Background script for AI Sider Nav extension
// 处理扩展的后台逻辑和消息通信

console.log('AI Sider Nav: Background script loaded')

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background: Received message', message)

  try {
    switch (message.type) {
      case 'PAGE_CONTENT_EXTRACTED':
        // 处理页面内容提取完成的消息
        console.log('Background: Page content extracted', message.content)
        // 这里可以进行进一步处理，比如存储或转发
        sendResponse({ success: true, received: true })
        break

      case 'GET_API_KEY':
        // 获取 API Key - 支持多种存储格式
        chrome.storage.sync.get(
          ['aiSiderNavSettings', 'deepseek_api_key', 'deepseekApiKey'],
          (result) => {
            let apiKey = ''

            // 优先从新的统一设置结构中获取
            if (result.aiSiderNavSettings?.aiAssistant?.apiKey) {
              apiKey = result.aiSiderNavSettings.aiAssistant.apiKey
            }
            // 然后尝试从旧的独立键获取
            else if (result.deepseek_api_key) {
              apiKey = result.deepseek_api_key
            }
            // 最后尝试旧版本的键名
            else if (result.deepseekApiKey) {
              apiKey = result.deepseekApiKey
            }

            console.log('Background: API Key retrieved:', apiKey ? 'Found' : 'Not found')
            sendResponse({ apiKey })
          }
        )
        return true // 保持消息通道开放以进行异步响应

      case 'SAVE_API_KEY':
        // 保存 API Key - 使用统一的键名
        chrome.storage.sync.set({ deepseek_api_key: message.apiKey }, () => {
          console.log('Background: API Key saved')
          sendResponse({ success: true })
        })
        return true

      case 'HEALTH_CHECK':
        // 健康检查
        sendResponse({ status: 'ok', timestamp: Date.now() })
        break

      default:
        console.log('Background: Unknown message type', message.type)
        sendResponse({ success: false, error: 'Unknown message type' })
    }
  } catch (error) {
    console.error('Background: Error handling message', error)
    sendResponse({ success: false, error: error.message })
  }
})

// 监听扩展安装/更新事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AI Sider Nav: Extension installed/updated', details)

  if (details.reason === 'install') {
    // 首次安装时的初始化
    console.log('AI Sider Nav: First time installation')
  } else if (details.reason === 'update') {
    // 更新时的处理
    console.log('AI Sider Nav: Extension updated from', details.previousVersion)
  }
})

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 当标签页完成加载时
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('AI Sider Nav: Tab updated', tabId, tab.url)
  }
})

// 错误处理
chrome.runtime.onSuspend.addListener(() => {
  console.log('AI Sider Nav: Background script suspending')
})

// 保持 service worker 活跃（Manifest V3）
class ServiceWorkerManager {
  constructor() {
    this.keepAliveInterval = null
    this.isActive = false
    this.lastActivity = Date.now()
    this.maxIdleTime = 4 * 60 * 1000 // 4分钟
    this.keepAliveInterval = 25000 // 25秒

    this.startKeepAlive()
    this.setupActivityTracking()
  }

  startKeepAlive() {
    if (this.keepAliveInterval) return

    this.isActive = true
    this.keepAliveInterval = setInterval(() => {
      this.performKeepAlive()
    }, this.keepAliveInterval)

    console.log('🔄 Service Worker 保活机制已启动')
  }

  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
      this.isActive = false
      console.log('⏹️ Service Worker 保活机制已停止')
    }
  }

  performKeepAlive() {
    const now = Date.now()

    // 如果长时间无活动，减少保活频率
    if (now - this.lastActivity > this.maxIdleTime) {
      console.log('🔄 Service Worker 空闲状态，执行轻量保活')
      // 执行轻量级保活操作
      chrome.runtime.getPlatformInfo(() => {
        // 简单的操作来保持活跃
      })
    } else {
      // 正常保活操作
      chrome.runtime.getPlatformInfo(() => {
        // 简单的操作来保持活跃
      })
    }
  }

  setupActivityTracking() {
    // 监听各种活动事件来更新最后活动时间
    const updateActivity = () => {
      this.lastActivity = Date.now()
    }

    // 监听消息
    chrome.runtime.onMessage.addListener(updateActivity)

    // 监听标签页更新
    if (chrome.tabs && chrome.tabs.onUpdated) {
      chrome.tabs.onUpdated.addListener(updateActivity)
    }

    // 监听扩展图标点击
    if (chrome.action && chrome.action.onClicked) {
      chrome.action.onClicked.addListener(updateActivity)
    }
  }

  cleanup() {
    this.stopKeepAlive()
  }
}

// 创建 Service Worker 管理器实例
const swManager = new ServiceWorkerManager()

// 在 Service Worker 关闭前清理资源
self.addEventListener('beforeunload', () => {
  swManager.cleanup()
})
