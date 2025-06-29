import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AIConversation, AIMessage, PageContent } from '@/types'

export const useAIStore = defineStore('ai', () => {
  // 状态
  const conversations = ref<AIConversation[]>([])
  const currentConversationId = ref<string | null>(null)
  const isLoading = ref(false)
  const pageContent = ref<PageContent | null>(null)

  // 计算属性
  const currentConversation = computed(() => 
    conversations.value.find(conv => conv.id === currentConversationId.value)
  )

  const hasConversations = computed(() => conversations.value.length > 0)

  // 方法
  const createConversation = (title?: string): string => {
    const id = generateId()
    const conversation: AIConversation = {
      id,
      title: title || `对话 ${conversations.value.length + 1}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    conversations.value.unshift(conversation)
    currentConversationId.value = id
    saveConversations()
    
    return id
  }

  const deleteConversation = (id: string) => {
    const index = conversations.value.findIndex(conv => conv.id === id)
    if (index !== -1) {
      conversations.value.splice(index, 1)
      
      // 如果删除的是当前对话，切换到其他对话或创建新对话
      if (currentConversationId.value === id) {
        if (conversations.value.length > 0) {
          currentConversationId.value = conversations.value[0].id
        } else {
          currentConversationId.value = null
        }
      }
      
      saveConversations()
    }
  }

  const addMessage = (message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    if (!currentConversationId.value) {
      createConversation()
    }

    const conversation = currentConversation.value
    if (conversation) {
      const newMessage: AIMessage = {
        ...message,
        id: generateId(),
        timestamp: Date.now()
      }
      
      conversation.messages.push(newMessage)
      conversation.updatedAt = Date.now()
      
      // 如果是第一条用户消息，更新对话标题
      if (conversation.messages.length === 1 && message.role === 'user') {
        conversation.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
      }
      
      saveConversations()
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading.value) return

    // 添加用户消息
    addMessage({ role: 'user', content: content.trim() })
    
    isLoading.value = true
    
    try {
      // 这里应该调用实际的 AI API
      // 目前使用模拟响应
      const response = await simulateAIResponse(content)
      addMessage({ role: 'assistant', content: response })
    } catch (error) {
      console.error('Failed to send message:', error)
      addMessage({ 
        role: 'assistant', 
        content: '抱歉，发生了错误。请稍后再试。' 
      })
    } finally {
      isLoading.value = false
    }
  }

  const setPageContent = (content: PageContent) => {
    pageContent.value = content
  }

  const summarizePageContent = async () => {
    if (!pageContent.value || isLoading.value) return

    const content = pageContent.value.selectedText || pageContent.value.fullText
    if (!content) return

    const prompt = `请总结以下内容：\n\n${content}`
    await sendMessage(prompt)
  }

  const saveConversations = () => {
    chrome.storage.local.set({ 
      aiConversations: conversations.value,
      currentConversationId: currentConversationId.value
    })
  }

  const loadConversations = async () => {
    try {
      const result = await chrome.storage.local.get(['aiConversations', 'currentConversationId'])
      if (result.aiConversations) {
        conversations.value = result.aiConversations
      }
      if (result.currentConversationId) {
        currentConversationId.value = result.currentConversationId
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const clearAllConversations = () => {
    conversations.value = []
    currentConversationId.value = null
    saveConversations()
  }

  return {
    conversations,
    currentConversationId,
    currentConversation,
    hasConversations,
    isLoading,
    pageContent,
    createConversation,
    deleteConversation,
    addMessage,
    sendMessage,
    setPageContent,
    summarizePageContent,
    loadConversations,
    clearAllConversations
  }
})

// 辅助函数
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 模拟 AI 响应（实际项目中应该调用真实的 AI API）
async function simulateAIResponse(message: string): Promise<string> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // 简单的模拟响应
  const responses = [
    '这是一个很有趣的问题。让我来帮你分析一下...',
    '根据你提供的信息，我认为...',
    '这个话题很值得深入探讨。从我的角度来看...',
    '让我为你总结一下要点...',
    '这确实是一个需要仔细考虑的问题...'
  ]
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  return `${randomResponse}\n\n针对"${message}"，我的建议是继续深入研究相关资料，并考虑多个角度的观点。如果你需要更具体的帮助，请提供更多详细信息。`
}
