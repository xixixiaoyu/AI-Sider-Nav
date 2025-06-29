import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ExtensionSettings } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  // 默认设置
  const defaultSettings: ExtensionSettings = {
    aiProvider: 'openai',
    defaultSearchEngine: 'Google',
    sidebarPosition: 'right',
    autoSummarize: false,
    theme: 'auto'
  }

  // 当前设置
  const settings = ref<ExtensionSettings>({ ...defaultSettings })

  // 方法
  const updateSettings = async (newSettings: Partial<ExtensionSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    await saveSettings()
  }

  const saveSettings = async () => {
    try {
      await chrome.storage.sync.set({ settings: settings.value })
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get(['settings'])
      if (result.settings) {
        settings.value = { ...defaultSettings, ...result.settings }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      settings.value = { ...defaultSettings }
    }
  }

  const resetSettings = async () => {
    settings.value = { ...defaultSettings }
    await saveSettings()
  }

  return {
    settings,
    updateSettings,
    saveSettings,
    loadSettings,
    resetSettings
  }
})
