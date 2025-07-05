// AI 相关类型定义

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
  id?: string
}

export interface AIStreamResponse {
  choices: Array<{
    delta?: {
      content?: string
      reasoning_content?: string
    }
    message?: {
      content?: string
      role?: string
    }
    finish_reason?: string
  }>
  model?: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface SystemPrompt {
  id: string
  name: string
  content: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

// AI 助手相关类型
export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface AIAssistantSettings {
  enabled: boolean
  autoFocus: boolean
  showThinking: boolean
  temperature: number
  maxTokens: number
  model: string
  apiKey: string
  showTriggerButton: boolean // 是否显示触发按钮
  globalAccess: boolean // 是否在所有页面显示
}

// 侧边栏状态
export interface SidebarState {
  isOpen: boolean
  width: number
  position: 'left' | 'right'
}

// 快捷键配置
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
}

// AI 响应状态
export interface AIResponseState {
  isLoading: boolean
  isThinking: boolean
  currentResponse: string
  thinkingContent: string
  error: string | null
}
