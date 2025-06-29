import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAIStore } from '@/stores/ai'

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      set: vi.fn(),
      get: vi.fn().mockResolvedValue({})
    }
  }
}

// @ts-ignore
global.chrome = mockChrome

describe('AI Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with empty conversations', () => {
    const store = useAIStore()
    
    expect(store.conversations).toHaveLength(0)
    expect(store.currentConversationId).toBeNull()
    expect(store.hasConversations).toBe(false)
  })

  it('should create new conversation', () => {
    const store = useAIStore()
    
    const conversationId = store.createConversation('Test Conversation')
    
    expect(store.conversations).toHaveLength(1)
    expect(store.currentConversationId).toBe(conversationId)
    expect(store.currentConversation?.title).toBe('Test Conversation')
    expect(store.hasConversations).toBe(true)
  })

  it('should create conversation with default title', () => {
    const store = useAIStore()
    
    store.createConversation()
    
    expect(store.currentConversation?.title).toBe('对话 1')
  })

  it('should add message to current conversation', () => {
    const store = useAIStore()
    
    store.createConversation()
    store.addMessage({ role: 'user', content: 'Hello' })
    
    expect(store.currentConversation?.messages).toHaveLength(1)
    expect(store.currentConversation?.messages[0].content).toBe('Hello')
    expect(store.currentConversation?.messages[0].role).toBe('user')
  })

  it('should create conversation when adding message without current conversation', () => {
    const store = useAIStore()
    
    store.addMessage({ role: 'user', content: 'Hello' })
    
    expect(store.conversations).toHaveLength(1)
    expect(store.currentConversation?.messages).toHaveLength(1)
  })

  it('should update conversation title from first user message', () => {
    const store = useAIStore()
    
    store.createConversation()
    store.addMessage({ role: 'user', content: 'This is a long message that should be truncated for the title' })
    
    expect(store.currentConversation?.title).toBe('This is a long message that sho...')
  })

  it('should delete conversation', () => {
    const store = useAIStore()
    
    const id1 = store.createConversation('Conversation 1')
    const id2 = store.createConversation('Conversation 2')
    
    expect(store.conversations).toHaveLength(2)
    expect(store.currentConversationId).toBe(id2)
    
    store.deleteConversation(id1)
    
    expect(store.conversations).toHaveLength(1)
    expect(store.conversations[0].id).toBe(id2)
    expect(store.currentConversationId).toBe(id2)
  })

  it('should switch to another conversation when deleting current conversation', () => {
    const store = useAIStore()
    
    const id1 = store.createConversation('Conversation 1')
    const id2 = store.createConversation('Conversation 2')
    
    store.deleteConversation(id2)
    
    expect(store.currentConversationId).toBe(id1)
  })

  it('should set current conversation to null when deleting last conversation', () => {
    const store = useAIStore()
    
    const id = store.createConversation()
    store.deleteConversation(id)
    
    expect(store.conversations).toHaveLength(0)
    expect(store.currentConversationId).toBeNull()
  })

  it('should set page content', () => {
    const store = useAIStore()
    const pageContent = {
      title: 'Test Page',
      url: 'https://example.com',
      selectedText: 'Selected text',
      fullText: 'Full page text'
    }
    
    store.setPageContent(pageContent)
    
    expect(store.pageContent).toEqual(pageContent)
  })

  it('should clear all conversations', () => {
    const store = useAIStore()
    
    store.createConversation('Conversation 1')
    store.createConversation('Conversation 2')
    
    expect(store.conversations).toHaveLength(2)
    
    store.clearAllConversations()
    
    expect(store.conversations).toHaveLength(0)
    expect(store.currentConversationId).toBeNull()
  })

  it('should save conversations to storage', () => {
    const store = useAIStore()
    
    const id = store.createConversation('Test')
    store.addMessage({ role: 'user', content: 'Hello' })
    
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
      aiConversations: store.conversations,
      currentConversationId: id
    })
  })
})
