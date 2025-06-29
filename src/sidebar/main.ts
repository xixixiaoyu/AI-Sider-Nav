import { createApp } from 'vue'
import { pinia } from '@/stores'
import App from './App.vue'
import 'virtual:uno.css'

const app = createApp(App)
app.use(pinia)
app.mount('#app')
