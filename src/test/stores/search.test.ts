import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearchStore } from '@/stores/search'

// Mock Chrome APIs
const mockChrome = {
  tabs: {
    create: vi.fn()
  },
  storage: {
    local: {
      set: vi.fn(),
      get: vi.fn().mockResolvedValue({})
    }
  }
}

// @ts-ignore
global.chrome = mockChrome

describe('Search Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with default search engines', () => {
    const store = useSearchStore()
    
    expect(store.searchEngines).toHaveLength(2)
    expect(store.searchEngines[0].name).toBe('Google')
    expect(store.searchEngines[1].name).toBe('Bing')
  })

  it('should have Google as default engine', () => {
    const store = useSearchStore()
    
    expect(store.defaultEngine).toBe('Google')
    expect(store.currentEngine.name).toBe('Google')
  })

  it('should perform search with default engine', () => {
    const store = useSearchStore()
    const query = 'test query'
    
    store.search(query)
    
    expect(mockChrome.tabs.create).toHaveBeenCalledWith({
      url: 'https://www.google.com/search?q=test%20query'
    })
  })

  it('should perform search with specific engine', () => {
    const store = useSearchStore()
    const query = 'test query'
    
    store.search(query, 'Bing')
    
    expect(mockChrome.tabs.create).toHaveBeenCalledWith({
      url: 'https://www.bing.com/search?q=test%20query'
    })
  })

  it('should add query to search history', () => {
    const store = useSearchStore()
    const query = 'test query'
    
    store.search(query)
    
    expect(store.searchHistory).toContain(query)
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
      searchHistory: [query]
    })
  })

  it('should not add empty query to history', () => {
    const store = useSearchStore()
    
    store.search('   ')
    
    expect(store.searchHistory).toHaveLength(0)
    expect(mockChrome.tabs.create).not.toHaveBeenCalled()
  })

  it('should limit search history to 10 items', () => {
    const store = useSearchStore()
    
    // Add 12 queries
    for (let i = 1; i <= 12; i++) {
      store.addToHistory(`query ${i}`)
    }
    
    expect(store.searchHistory).toHaveLength(10)
    expect(store.searchHistory[0]).toBe('query 12')
    expect(store.searchHistory[9]).toBe('query 3')
  })

  it('should clear search history', () => {
    const store = useSearchStore()
    
    store.addToHistory('test query')
    expect(store.searchHistory).toHaveLength(1)
    
    store.clearHistory()
    
    expect(store.searchHistory).toHaveLength(0)
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
      searchHistory: []
    })
  })

  it('should set default engine', () => {
    const store = useSearchStore()
    
    store.setDefaultEngine('Bing')
    
    expect(store.defaultEngine).toBe('Bing')
    expect(store.currentEngine.name).toBe('Bing')
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
      defaultEngine: 'Bing'
    })
  })

  it('should not set invalid engine as default', () => {
    const store = useSearchStore()
    const originalEngine = store.defaultEngine
    
    store.setDefaultEngine('InvalidEngine')
    
    expect(store.defaultEngine).toBe(originalEngine)
  })
})
