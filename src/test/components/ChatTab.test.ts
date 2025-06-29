import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ChatTab from '@/sidebar/components/ChatTab.vue'

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

describe('ChatTab Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render empty state when no conversations', () => {
    const wrapper = mount(ChatTab)
    
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('开始新的对话')
  })

  it('should create new chat when clicking new chat button', async () => {
    const wrapper = mount(ChatTab)
    
    await wrapper.find('.new-chat-btn').trigger('click')
    
    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })

  it('should send message when clicking send button', async () => {
    const wrapper = mount(ChatTab)
    
    // Create a conversation first
    await wrapper.find('.new-chat-btn').trigger('click')
    
    // Find input and send button
    const input = wrapper.find('.message-input')
    const sendBtn = wrapper.find('.send-btn')
    
    // Set input value
    await input.setValue('Hello AI')
    
    // Click send button
    await sendBtn.trigger('click')
    
    // Should have user message
    expect(wrapper.find('.user-message').exists()).toBe(true)
    expect(wrapper.text()).toContain('Hello AI')
  })

  it('should send message when pressing Enter', async () => {
    const wrapper = mount(ChatTab)
    
    // Create a conversation first
    await wrapper.find('.new-chat-btn').trigger('click')
    
    const input = wrapper.find('.message-input')
    await input.setValue('Hello AI')
    
    // Press Enter
    await input.trigger('keydown', { key: 'Enter' })
    
    expect(wrapper.find('.user-message').exists()).toBe(true)
  })

  it('should not send empty message', async () => {
    const wrapper = mount(ChatTab)
    
    await wrapper.find('.new-chat-btn').trigger('click')
    
    const input = wrapper.find('.message-input')
    const sendBtn = wrapper.find('.send-btn')
    
    // Try to send empty message
    await input.setValue('   ')
    await sendBtn.trigger('click')
    
    expect(wrapper.find('.user-message').exists()).toBe(false)
  })

  it('should disable send button when loading', async () => {
    const wrapper = mount(ChatTab)
    
    await wrapper.find('.new-chat-btn').trigger('click')
    
    const input = wrapper.find('.message-input')
    await input.setValue('Hello')
    
    // Send message (this will trigger loading state)
    await wrapper.find('.send-btn').trigger('click')
    
    // Wait for next tick
    await wrapper.vm.$nextTick()
    
    const sendBtn = wrapper.find('.send-btn')
    expect(sendBtn.attributes('disabled')).toBeDefined()
  })

  it('should show loading dots when AI is responding', async () => {
    const wrapper = mount(ChatTab)
    
    await wrapper.find('.new-chat-btn').trigger('click')
    
    const input = wrapper.find('.message-input')
    await input.setValue('Hello')
    await wrapper.find('.send-btn').trigger('click')
    
    // Should show loading dots
    expect(wrapper.find('.loading-dots').exists()).toBe(true)
  })

  it('should format time correctly', () => {
    const wrapper = mount(ChatTab)
    const component = wrapper.vm as any
    
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const oneHourAgo = now - 3600000
    const oneDayAgo = now - 86400000
    
    expect(component.formatTime(now - 30000)).toBe('刚刚')
    expect(component.formatTime(oneMinuteAgo)).toBe('1分钟前')
    expect(component.formatTime(oneHourAgo)).toBe('1小时前')
    expect(component.formatTime(oneDayAgo)).toContain('/')
  })
})
