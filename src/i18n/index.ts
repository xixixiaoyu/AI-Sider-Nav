// 简单的国际化支持

interface I18nMessages {
  [key: string]: string
}

const messages: Record<string, I18nMessages> = {
  'zh-CN': {
    // 通用
    ok: '确定',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    close: '关闭',
    loading: '加载中...',
    error: '错误',
    success: '成功',

    // AI 相关
    configureApiKey: '请先配置 API Key',
    httpError: 'HTTP 错误: {status}',
    streamError: '流响应错误',
    jsonParseError: 'JSON 解析错误',
    aiResponseError: 'AI 响应错误',
    requestAborted: '请求已取消',
    invalidAiResponse: '无效的 AI 响应',
    apiError: 'API 错误: {error}',
    networkConnectionError: '网络连接错误',
    unknownError: '未知错误',
    textOptimizationError: '文本优化错误',

    // AI 助手
    aiAssistant: 'AI 助手',
    newChat: '新对话',
    chatHistory: '对话历史',
    clearHistory: '清空历史',
    sendMessage: '发送消息',
    thinking: '思考中...',
    typeMessage: '输入消息...',
    aiIsThinking: 'AI 正在思考...',
    aiIsResponding: 'AI 正在回复...',
    copyMessage: '复制消息',
    deleteMessage: '删除消息',
    regenerateResponse: '重新生成',
    stopGeneration: '停止生成',
    welcomeToAI: '欢迎使用 AI 助手',
    startNewConversation: '开始一个新的对话，我将竭诚为您服务',
    confirmDeleteSession: '确定要删除这个对话吗？',
    confirmDeleteMessage: '确定要删除这条消息吗？',
    deleteSession: '删除对话',

    // 页面总结
    summarizePage: '总结页面',
    extractingContent: '正在提取页面内容...',
    summarizingContent: '正在生成总结...',
    summaryComplete: '总结完成',
    summaryError: '总结失败',
    pageSummary: '页面总结',
    keyPoints: '关键要点',
    originalPage: '原始页面',
    readingTime: '阅读时间',
    wordCount: '字数统计',

    // 设置
    settings: '设置',
    apiKeySettings: 'API Key 设置',
    modelSettings: '模型设置',
    temperatureSettings: '温度设置',
    maxTokensSettings: '最大令牌数',
    shortcutSettings: '快捷键设置',
    sidebarSettings: '侧边栏设置',
    aiAssistantSettings: 'AI 助手设置',
  },

  'en-US': {
    // 通用
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',

    // AI 相关
    configureApiKey: 'Please configure API Key first',
    httpError: 'HTTP Error: {status}',
    streamError: 'Stream response error',
    jsonParseError: 'JSON parse error',
    aiResponseError: 'AI response error',
    requestAborted: 'Request aborted',
    invalidAiResponse: 'Invalid AI response',
    apiError: 'API Error: {error}',
    networkConnectionError: 'Network connection error',
    unknownError: 'Unknown error',
    textOptimizationError: 'Text optimization error',

    // AI 助手
    aiAssistant: 'AI Assistant',
    newChat: 'New Chat',
    chatHistory: 'Chat History',
    clearHistory: 'Clear History',
    sendMessage: 'Send Message',
    thinking: 'Thinking...',
    typeMessage: 'Type a message...',
    aiIsThinking: 'AI is thinking...',
    aiIsResponding: 'AI is responding...',
    copyMessage: 'Copy Message',
    deleteMessage: 'Delete Message',
    regenerateResponse: 'Regenerate',
    stopGeneration: 'Stop Generation',
    welcomeToAI: 'Welcome to AI Assistant',
    startNewConversation: "Start a new conversation, I'm here to help",
    confirmDeleteSession: 'Are you sure you want to delete this conversation?',
    confirmDeleteMessage: 'Are you sure you want to delete this message?',
    deleteSession: 'Delete Session',

    // 页面总结
    summarizePage: 'Summarize Page',
    extractingContent: 'Extracting page content...',
    summarizingContent: 'Generating summary...',
    summaryComplete: 'Summary complete',
    summaryError: 'Summary failed',
    pageSummary: 'Page Summary',
    keyPoints: 'Key Points',
    originalPage: 'Original Page',
    readingTime: 'Reading Time',
    wordCount: 'Word Count',

    // 设置
    settings: 'Settings',
    apiKeySettings: 'API Key Settings',
    modelSettings: 'Model Settings',
    temperatureSettings: 'Temperature Settings',
    maxTokensSettings: 'Max Tokens',
    shortcutSettings: 'Shortcut Settings',
    sidebarSettings: 'Sidebar Settings',
    aiAssistantSettings: 'AI Assistant Settings',
  },
}

class I18n {
  private currentLocale: string = 'zh-CN'

  constructor() {
    // 从 localStorage 获取语言设置
    const savedLocale = localStorage.getItem('language')
    if (savedLocale && messages[savedLocale]) {
      this.currentLocale = savedLocale
    } else {
      // 使用浏览器语言
      const browserLang = navigator.language
      if (messages[browserLang]) {
        this.currentLocale = browserLang
      }
    }
  }

  t(key: string, params?: Record<string, any>): string {
    const message = messages[this.currentLocale]?.[key] || messages['zh-CN'][key] || key

    if (params) {
      return message.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match
      })
    }

    return message
  }

  setLocale(locale: string) {
    if (messages[locale]) {
      this.currentLocale = locale
      localStorage.setItem('language', locale)
    }
  }

  getLocale(): string {
    return this.currentLocale
  }

  getAvailableLocales(): string[] {
    return Object.keys(messages)
  }
}

// 创建全局实例
const i18n = new I18n()

// 导出全局对象，兼容现有代码
export default {
  global: {
    t: (key: string, params?: Record<string, any>) => i18n.t(key, params),
  },
}

// 导出实例
export { i18n }
