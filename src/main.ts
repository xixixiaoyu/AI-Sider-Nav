import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 样式导入
import 'virtual:uno.css'
import '@/styles/global.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
