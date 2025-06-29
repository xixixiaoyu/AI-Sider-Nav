// 搜索引擎配置
export interface SearchEngine {
  name: string
  url: string
  icon: string
  color: string
}

// AI 消息类型
export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// AI 对话会话
export interface AIConversation {
  id: string
  title: string
  messages: AIMessage[]
  createdAt: number
  updatedAt: number
}

// 网页内容提取结果
export interface PageContent {
  title: string
  url: string
  selectedText?: string
  fullText?: string
  summary?: string
}

// 侧边栏状态
export interface SidebarState {
  isVisible: boolean
  activeTab: 'chat' | 'summary' | 'settings'
  position: 'left' | 'right'
  width: number
}

// 插件设置
export interface ExtensionSettings {
  aiProvider: 'openai' | 'claude' | 'gemini'
  apiKey?: string
  defaultSearchEngine: string
  sidebarPosition: 'left' | 'right'
  autoSummarize: boolean
  theme: 'light' | 'dark' | 'auto'
}

// 消息通信类型
export type MessageType = 
  | 'TOGGLE_SIDEBAR'
  | 'GET_PAGE_CONTENT'
  | 'SEND_AI_MESSAGE'
  | 'UPDATE_SETTINGS'
  | 'EXTRACT_SELECTION'

export interface ExtensionMessage {
  type: MessageType
  payload?: any
  tabId?: number
}

// 响应类型
export interface ExtensionResponse {
  success: boolean
  data?: any
  error?: string
}
