import browser from 'webextension-polyfill'
import type { ExtensionMessage, ExtensionResponse } from '@/types'

// 插件安装时的初始化
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('AI Sider Nav installed')
    
    // 设置默认设置
    await browser.storage.sync.set({
      settings: {
        aiProvider: 'openai',
        defaultSearchEngine: 'Google',
        sidebarPosition: 'right',
        autoSummarize: false,
        theme: 'auto'
      }
    })
    
    // 创建右键菜单
    createContextMenus()
  }
})

// 创建右键菜单
const createContextMenus = () => {
  browser.contextMenus.create({
    id: 'ai-summarize',
    title: '用 AI 总结选中内容',
    contexts: ['selection']
  })
  
  browser.contextMenus.create({
    id: 'ai-explain',
    title: '用 AI 解释选中内容',
    contexts: ['selection']
  })
  
  browser.contextMenus.create({
    id: 'ai-translate',
    title: '用 AI 翻译选中内容',
    contexts: ['selection']
  })
  
  browser.contextMenus.create({
    id: 'toggle-sidebar',
    title: '打开/关闭 AI 侧边栏',
    contexts: ['page']
  })
}

// 右键菜单点击处理
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return
  
  try {
    switch (info.menuItemId) {
      case 'ai-summarize':
        await handleContextMenuAction(tab.id, 'summarize', info.selectionText)
        break
      case 'ai-explain':
        await handleContextMenuAction(tab.id, 'explain', info.selectionText)
        break
      case 'ai-translate':
        await handleContextMenuAction(tab.id, 'translate', info.selectionText)
        break
      case 'toggle-sidebar':
        await browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' })
        break
    }
  } catch (error) {
    console.error('Context menu action failed:', error)
  }
})

// 处理右键菜单操作
const handleContextMenuAction = async (tabId: number, action: string, text?: string) => {
  if (!text) return
  
  // 先打开侧边栏
  await browser.tabs.sendMessage(tabId, { type: 'TOGGLE_SIDEBAR' })
  
  // 等待侧边栏加载
  setTimeout(async () => {
    let prompt = ''
    switch (action) {
      case 'summarize':
        prompt = `请总结以下内容：\n\n${text}`
        break
      case 'explain':
        prompt = `请解释以下内容：\n\n${text}`
        break
      case 'translate':
        prompt = `请将以下内容翻译成中文：\n\n${text}`
        break
    }
    
    if (prompt) {
      await browser.tabs.sendMessage(tabId, {
        type: 'SEND_AI_MESSAGE',
        payload: { message: prompt }
      })
    }
  }, 1000)
}

// 监听来自内容脚本和弹窗的消息
browser.runtime.onMessage.addListener(async (message: ExtensionMessage, sender) => {
  try {
    const response: ExtensionResponse = { success: true }
    
    switch (message.type) {
      case 'GET_PAGE_CONTENT':
        if (sender.tab?.id) {
          const pageContent = await extractPageContent(sender.tab.id)
          response.data = pageContent
        }
        break
        
      case 'UPDATE_SETTINGS':
        await browser.storage.sync.set({ settings: message.payload })
        break
        
      case 'SEND_AI_MESSAGE':
        // 这里可以处理 AI API 调用
        response.data = await processAIMessage(message.payload)
        break
        
      default:
        response.success = false
        response.error = 'Unknown message type'
    }
    
    return response
  } catch (error) {
    console.error('Background script error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

// 提取页面内容
const extractPageContent = async (tabId: number) => {
  try {
    const results = await browser.scripting.executeScript({
      target: { tabId },
      func: () => {
        return {
          title: document.title,
          url: window.location.href,
          selectedText: window.getSelection()?.toString() || '',
          fullText: document.body.innerText || ''
        }
      }
    })
    
    return results[0]?.result
  } catch (error) {
    console.error('Failed to extract page content:', error)
    return null
  }
}

// 处理 AI 消息（这里应该调用实际的 AI API）
const processAIMessage = async (payload: any) => {
  // 模拟 AI 响应
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        response: `这是对"${payload.message}"的 AI 响应。在实际项目中，这里应该调用真实的 AI API。`
      })
    }, 1000)
  })
}

// 快捷键处理
browser.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-sidebar') {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (tab.id) {
        await browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' })
      }
    } catch (error) {
      console.error('Failed to toggle sidebar via shortcut:', error)
    }
  }
})

// 标签页更新监听（用于自动总结功能）
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const { settings } = await browser.storage.sync.get(['settings'])
      if (settings?.autoSummarize) {
        // 自动总结页面内容
        setTimeout(async () => {
          try {
            await browser.tabs.sendMessage(tabId, {
              type: 'AUTO_SUMMARIZE_PAGE'
            })
          } catch (error) {
            // 忽略错误，可能是页面不支持内容脚本
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Auto summarize error:', error)
    }
  }
})

console.log('AI Sider Nav background script loaded')
