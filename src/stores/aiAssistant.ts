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

  // AI 响应状态
  const responseState = ref<AIResponseState>({
    isLoading: false,
    isThinking: false,
    currentResponse: '',
    thinkingContent: '',
    error: null,
  })

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
    sidebarState.value.width = Math.max(300, Math.min(800, width))
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
      const data = {
        settings: settings.value,
        shortcuts: shortcuts.value,
        sidebarState: sidebarState.value,
      }

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({ aiAssistantSettings: data })
      } else {
        localStorage.setItem('aiAssistantSettings', JSON.stringify(data))
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
        const result = await chrome.storage.sync.get(['aiAssistantSettings'])
        data = result.aiAssistantSettings
      } else {
        const stored = localStorage.getItem('aiAssistantSettings')
        data = stored ? JSON.parse(stored) : null
      }

      if (data) {
        if (data.settings) settings.value = { ...settings.value, ...data.settings }
        if (data.shortcuts) shortcuts.value = { ...shortcuts.value, ...data.shortcuts }
        if (data.sidebarState) {
          // 恢复侧边栏设置，但确保新标签页打开时侧边栏是关闭状态
          sidebarState.value = { 
            ...sidebarState.value, 
            ...data.sidebarState,
            isOpen: false // 强制设置为关闭状态
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

  // 初始化
  const initialize = async () => {
    await loadSettings()
    await loadSessions()

    // 智能恢复会话：如果有历史会话但没有当前会话，恢复最近的会话
    if (chatSessions.value.length > 0 && !currentSessionId.value) {
      // 按更新时间排序，选择最近的会话
      const sortedSessions = [...chatSessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
      currentSessionId.value = sortedSessions[0].id
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

    // 设置操作
    updateSettings,
    updateShortcut,

    // 持久化
    saveSettings,
    saveSessions,
    loadSettings,
    loadSessions,
    initialize,
  }
})
