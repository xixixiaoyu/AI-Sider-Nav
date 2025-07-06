import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PopupApp from './PopupApp.vue'

// 样式导入
import 'virtual:uno.css'
import '@/styles/popup.css'

// 存储
import { useSettingsStore, useAIAssistantStore } from '@/stores'

async function initializePopupApp() {
  const app = createApp(PopupApp)
  const pinia = createPinia()

  app.use(pinia)

  // 初始化存储
  const settingsStore = useSettingsStore()
  const aiAssistantStore = useAIAssistantStore()

  // 设置存储监听器
  settingsStore.setupStorageListener()

  // 加载初始数据
  await settingsStore.loadSettings()
  await aiAssistantStore.loadSettings()

  // 挂载应用
  app.mount('#app')
}

// 启动应用
initializePopupApp().catch(console.error)
