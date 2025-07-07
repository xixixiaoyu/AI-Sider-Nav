import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  Message,
  ChatSession,
  AIAssistantSettings,
  SidebarState,
  KeyboardShortcut,
  AIResponseState,
} from '../types'
import { generateChatTitle } from '../services/aiAnalysisService'
import { SummaryResult } from '../services/summaryService'
import { performanceConfig } from '../utils/performanceConfig'

export const useAIAssistantStore = defineStore('aiAssistant', () => {
  // 侧边栏状态
  const sidebarState = ref<SidebarState>({
    isOpen: false,
    width: 400,
    position: 'right',
  })

  // AI 助手设置
  const settings = ref<AIAssistantSettings>({
    enabled: true,
    autoFocus: true,
    showThinking: true,
    temperature: 0.3,
    maxTokens: 4000,
    model: 'deepseek-chat',
    apiKey: '',
    showTriggerButton: true, // 是否显示触发按钮
    globalAccess: true, // 是否在所有页面显示
  })

  // 快捷键配置
  const shortcuts = ref<Record<string, KeyboardShortcut>>({
    toggleSidebar: {
      key: 'k',
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    },
    newChat: {
      key: 'n',
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: false,
    },
    focusInput: {
      key: '/',
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    },
  })

  // 聊天会话
  const chatSessions = ref<ChatSession[]>([])
  const currentSessionId = ref<string | null>(null)

  // 会话管理配置（从性能配置中获取）
  const getSessionLimits = () => performanceConfig.get('sessions')

  // AI 响应状态
  const responseState = ref<AIResponseState>({
    isLoading: false,
    isThinking: false,
    currentResponse: '',
    thinkingContent: '',
    error: null,
  })

  // 页面总结状态
  const summaryState = ref({
    isExtracting: false,
    isSummarizing: false,
    currentSummary: null as SummaryResult | null,
    error: null as string | null,
  })

  // 消息监听器清理函数
  let messageListenerCleanup: (() => void) | null = null

  // 计算属性
  const currentSession = computed(() => {
    if (!currentSessionId.value) return null
    return chatSessions.value.find((session) => session.id === currentSessionId.value) || null
  })

  const hasActiveSessions = computed(() => chatSessions.value.length > 0)

  const isAIResponding = computed(
    () => responseState.value.isLoading || responseState.value.isThinking
  )

  // 侧边栏操作
  const toggleSidebar = () => {
    sidebarState.value.isOpen = !sidebarState.value.isOpen
  }

  const openSidebar = () => {
    sidebarState.value.isOpen = true
  }

  const closeSidebar = () => {
    sidebarState.value.isOpen = false
  }

  const setSidebarWidth = (width: number) => {
    const minWidth = 300
    const maxWidth = Math.min(800, window.innerWidth * 0.8)
    sidebarState.value.width = Math.max(minWidth, Math.min(maxWidth, width))

    // 保存宽度设置
    saveSidebarWidth(sidebarState.value.width)
  }

  // 保存侧边栏宽度到存储
  const saveSidebarWidth = async (width: number) => {
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

  // 从存储加载侧边栏宽度
  const loadSidebarWidth = async () => {
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
      sidebarState.value.width = Math.max(minWidth, Math.min(maxWidth, savedWidth))
    } catch (error) {
      console.error('加载侧边栏宽度失败:', error)
    }
  }

  const setSidebarPosition = (position: 'left' | 'right') => {
    sidebarState.value.position = position
  }

  // 聊天会话操作
  const createNewSession = (): string => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newSession: ChatSession = {
      id: sessionId,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    chatSessions.value.unshift(newSession)
    currentSessionId.value = sessionId

    // 自动打开侧边栏
    if (!sidebarState.value.isOpen) {
      openSidebar()
    }

    return sessionId
  }

  const switchToSession = (sessionId: string) => {
    const session = chatSessions.value.find((s) => s.id === sessionId)
    if (session) {
      currentSessionId.value = sessionId
    }
  }

  const deleteSession = (sessionId: string) => {
    const index = chatSessions.value.findIndex((s) => s.id === sessionId)
    if (index !== -1) {
      chatSessions.value.splice(index, 1)

      // 如果删除的是当前会话，切换到其他会话或创建新会话
      if (currentSessionId.value === sessionId) {
        if (chatSessions.value.length > 0) {
          currentSessionId.value = chatSessions.value[0].id
        } else {
          currentSessionId.value = null
        }
      }
    }
  }

  const clearAllSessions = () => {
    chatSessions.value = []
    currentSessionId.value = null
  }

  // 清理旧消息（保留最近的消息）
  const cleanupSessionMessages = (sessionId: string) => {
    const session = chatSessions.value.find((s) => s.id === sessionId)
    if (!session) return

    const limits = getSessionLimits()
    if (session.messages.length > limits.messageCleanupThreshold) {
      // 保留最近的消息，删除旧消息
      const keepCount = limits.maxMessagesPerSession
      session.messages = session.messages.slice(-keepCount)
      session.updatedAt = Date.now()
      console.log(`清理会话 ${sessionId} 的旧消息，保留最近 ${keepCount} 条`)
    }
  }

  // 自动清理旧会话
  const autoCleanupSessions = () => {
    const limits = getSessionLimits()
    if (chatSessions.value.length > limits.autoCleanupThreshold) {
      // 按更新时间排序，删除最旧的会话
      const sortedSessions = [...chatSessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
      const keepCount = limits.maxSessions
      const sessionsToKeep = sortedSessions.slice(0, keepCount)

      chatSessions.value = sessionsToKeep
      console.log(`自动清理旧会话，保留最近 ${keepCount} 个会话`)
    }
  }

  // 消息操作
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>): string => {
    if (!currentSessionId.value) {
      createNewSession()
    }

    const session = currentSession.value
    if (!session) return ''

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newMessage: Message = {
      ...message,
      id: messageId,
      timestamp: Date.now(),
    }

    session.messages.push(newMessage)
    session.updatedAt = Date.now()

    // 如果是第一条用户消息，更新会话标题
    if (session.messages.length === 1 && message.role === 'user') {
      session.title = generateChatTitle(message.content)
    }

    // 检查是否需要清理消息
    cleanupSessionMessages(session.id)

    // 检查是否需要清理会话
    autoCleanupSessions()

    return messageId
  }

  const updateMessage = (messageId: string, content: string) => {
    const session = currentSession.value
    if (!session) return

    const message = session.messages.find((m) => m.id === messageId)
    if (message) {
      message.content = content
      session.updatedAt = Date.now()
    }
  }

  const deleteMessage = (messageId: string) => {
    const session = currentSession.value
    if (!session) return

    const index = session.messages.findIndex((m) => m.id === messageId)
    if (index !== -1) {
      session.messages.splice(index, 1)
      session.updatedAt = Date.now()
    }
  }

  // AI 响应状态操作
  const setResponseLoading = (loading: boolean) => {
    responseState.value.isLoading = loading
    if (loading) {
      // 开始新的响应时清空之前的内容
      responseState.value.currentResponse = ''
      responseState.value.error = null
    } else {
      // 响应结束时清空当前响应内容
      responseState.value.currentResponse = ''
      responseState.value.error = null
    }
  }

  const setResponseThinking = (thinking: boolean) => {
    responseState.value.isThinking = thinking
    if (!thinking) {
      responseState.value.thinkingContent = ''
    }
  }

  const appendResponseContent = (content: string) => {
    responseState.value.currentResponse += content
  }

  const setThinkingContent = (content: string) => {
    responseState.value.thinkingContent = content
  }

  const setResponseError = (error: string | null) => {
    responseState.value.error = error
    if (error) {
      responseState.value.isLoading = false
      responseState.value.isThinking = false
    }
  }

  // 设置操作
  const updateSettings = (newSettings: Partial<AIAssistantSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
  }

  const updateShortcut = (action: string, shortcut: KeyboardShortcut) => {
    shortcuts.value[action] = shortcut
    saveSettings()
  }

  // 持久化
  const saveSettings = async () => {
    try {
      // 获取现有的完整设置
      let existingSettings = {}
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['aiSiderNavSettings'])
        existingSettings = result.aiSiderNavSettings || {}
      } else {
        const stored = localStorage.getItem('aiSiderNavSettings')
        existingSettings = stored ? JSON.parse(stored) : {}
      }

      // 更新 AI 助手相关设置
      const updatedSettings = {
        ...existingSettings,
        aiAssistant: settings.value,
        aiAssistantShortcuts: shortcuts.value,
        aiAssistantSidebarState: sidebarState.value,
      }

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({ aiSiderNavSettings: updatedSettings })
      } else {
        localStorage.setItem('aiSiderNavSettings', JSON.stringify(updatedSettings))
      }
    } catch (error) {
      console.error('保存 AI 助手设置失败:', error)
    }
  }

  const saveSessions = async () => {
    try {
      const data = {
        sessions: chatSessions.value,
        currentSessionId: currentSessionId.value,
      }

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ aiAssistantSessions: data })
      } else {
        localStorage.setItem('aiAssistantSessions', JSON.stringify(data))
      }
    } catch (error) {
      console.error('保存聊天会话失败:', error)
    }
  }

  const loadSettings = async () => {
    try {
      let data
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['aiSiderNavSettings'])
        data = result.aiSiderNavSettings
      } else {
        const stored = localStorage.getItem('aiSiderNavSettings')
        data = stored ? JSON.parse(stored) : null
      }

      if (data) {
        // 从新的统一设置结构中加载 AI 助手设置
        if (data.aiAssistant) settings.value = { ...settings.value, ...data.aiAssistant }
        if (data.aiAssistantShortcuts)
          shortcuts.value = { ...shortcuts.value, ...data.aiAssistantShortcuts }
        if (data.aiAssistantSidebarState) {
          // 恢复侧边栏设置，但不强制关闭状态（让用户控制）
          const { isOpen: _isOpen, ...otherSidebarState } = data.aiAssistantSidebarState
          // _isOpen 用于解构但不使用，避免 lint 错误
          void _isOpen // 明确标记为已使用
          sidebarState.value = {
            ...sidebarState.value,
            ...otherSidebarState,
            // 保持当前的 isOpen 状态，不强制覆盖
          }
        }

        // 兼容旧的设置格式
        if (data.settings) settings.value = { ...settings.value, ...data.settings }
        if (data.shortcuts) shortcuts.value = { ...shortcuts.value, ...data.shortcuts }
        if (data.sidebarState) {
          // 兼容旧格式，但不强制关闭状态
          const { isOpen: _isOpenOld, ...otherSidebarState } = data.sidebarState
          // _isOpenOld 用于解构但不使用，避免 lint 错误
          void _isOpenOld // 明确标记为已使用
          sidebarState.value = {
            ...sidebarState.value,
            ...otherSidebarState,
            // 保持当前的 isOpen 状态，不强制覆盖
          }
        }
      }
    } catch (error) {
      console.error('加载 AI 助手设置失败:', error)
    }
  }

  const loadSessions = async () => {
    try {
      let data
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['aiAssistantSessions'])
        data = result.aiAssistantSessions
      } else {
        const stored = localStorage.getItem('aiAssistantSessions')
        data = stored ? JSON.parse(stored) : null
      }

      if (data) {
        if (data.sessions) chatSessions.value = data.sessions
        if (data.currentSessionId) currentSessionId.value = data.currentSessionId
      }
    } catch (error) {
      console.error('加载聊天会话失败:', error)
    }
  }

  // 页面总结操作
  const setSummaryExtracting = (isExtracting: boolean) => {
    summaryState.value.isExtracting = isExtracting
  }

  const setSummarizing = (isSummarizing: boolean) => {
    summaryState.value.isSummarizing = isSummarizing
  }

  const setSummaryResult = (summary: SummaryResult | null) => {
    summaryState.value.currentSummary = summary
  }

  const setSummaryError = (error: string | null) => {
    summaryState.value.error = error
  }

  const clearSummary = () => {
    summaryState.value.currentSummary = null
    summaryState.value.error = null
    summaryState.value.isExtracting = false
    summaryState.value.isSummarizing = false
  }

  // 开始页面总结
  const startPageSummary = async () => {
    try {
      // 清除之前的状态
      clearSummary()
      setSummaryExtracting(true)

      // 向 content script 发送消息请求提取页面内容
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PAGE_CONTENT' })
        }
      } else {
        // 开发环境或无权限时的处理
        setSummaryError('无法访问当前页面内容')
        setSummaryExtracting(false)
      }
    } catch (error) {
      console.error('开始页面总结失败:', error)
      setSummaryError(error instanceof Error ? error.message : '未知错误')
      setSummaryExtracting(false)
    }
  }

  // 处理提取的页面内容
  const handleExtractedContent = async (content: any) => {
    try {
      setSummaryExtracting(false)
      setSummarizing(true)

      // 动态导入总结服务
      const { createSummaryService } = await import('../services/summaryService')
      const summaryService = createSummaryService()

      // 进行总结
      const result = await summaryService.summarizeContent(content, (chunk) => {
        // 可以在这里处理流式更新
        console.log('Summary chunk:', chunk)
      })

      setSummaryResult(result)
      setSummarizing(false)

      // 将总结结果添加到当前对话中
      if (result.summary) {
        addMessage({
          role: 'assistant',
          content: `📄 **页面总结**\n\n**${result.title}**\n\n${result.summary}\n\n**关键要点：**\n${result.keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}`,
        })
      }
    } catch (error) {
      console.error('处理页面内容失败:', error)
      setSummaryError(error instanceof Error ? error.message : '总结失败')
      setSummarizing(false)
    }
  }

  // 初始化
  const initialize = async () => {
    await loadSettings()
    await loadSessions()
    await loadSidebarWidth()

    // 确保新标签页打开时侧边栏是关闭的
    sidebarState.value.isOpen = false

    // 智能恢复会话：如果有历史会话但没有当前会话，恢复最近的会话
    if (chatSessions.value.length > 0 && !currentSessionId.value) {
      // 按更新时间排序，选择最近的会话
      const sortedSessions = [...chatSessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
      currentSessionId.value = sortedSessions[0].id
    }

    // 监听来自 content script 的消息
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const messageListener = (message: any, sender: any, sendResponse: any) => {
        if (message.type === 'PAGE_CONTENT_EXTRACTED') {
          handleExtractedContent(message.content)
          sendResponse({ success: true })
        }
        return true
      }

      chrome.runtime.onMessage.addListener(messageListener)

      // 设置清理函数
      messageListenerCleanup = () => {
        chrome.runtime.onMessage.removeListener(messageListener)
      }
    }
  }

  // 清理所有监听器和资源
  const cleanup = () => {
    // 清理消息监听器
    if (messageListenerCleanup) {
      messageListenerCleanup()
      messageListenerCleanup = null
    }
  }

  return {
    // 状态
    sidebarState,
    settings,
    shortcuts,
    chatSessions,
    currentSessionId,
    responseState,
    summaryState,

    // 计算属性
    currentSession,
    hasActiveSessions,
    isAIResponding,

    // 侧边栏操作
    toggleSidebar,
    openSidebar,
    closeSidebar,
    setSidebarWidth,
    setSidebarPosition,
    loadSidebarWidth,

    // 会话操作
    createNewSession,
    switchToSession,
    deleteSession,
    clearAllSessions,

    // 消息操作
    addMessage,
    updateMessage,
    deleteMessage,

    // 响应状态操作
    setResponseLoading,
    setResponseThinking,
    appendResponseContent,
    setThinkingContent,
    setResponseError,

    // 页面总结操作
    setSummaryExtracting,
    setSummarizing,
    setSummaryResult,
    setSummaryError,
    clearSummary,
    startPageSummary,
    handleExtractedContent,

    // 设置操作
    updateSettings,
    updateShortcut,

    // 持久化
    saveSettings,
    saveSessions,
    loadSettings,
    loadSessions,

    // 初始化和清理
    initialize,
    cleanup,
  }
})
