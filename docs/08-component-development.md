# 第八章：组件开发

## 🎯 学习目标

- 掌握 Vue 3 Composition API 组件开发
- 实现时间显示和搜索组件
- 理解组件设计原则和最佳实践
- 学习组件间通信和状态管理

## 🧩 组件设计原则

### 单一职责原则

每个组件应该只负责一个明确的功能：

```vue
<!-- ✅ 好的设计 - 单一职责 -->
<template>
  <div class="time-display">
    <div class="time">{{ formattedTime }}</div>
    <div class="date">{{ formattedDate }}</div>
  </div>
</template>

<!-- ❌ 避免 - 职责混乱 -->
<template>
  <div class="everything">
    <div class="time">{{ time }}</div>
    <input class="search" v-model="query" />
    <div class="settings">...</div>
  </div>
</template>
```

### 可复用性设计

```vue
<!-- ✅ 可复用的按钮组件 -->
<template>
  <button 
    :class="buttonClasses" 
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => [
  'btn',
  `btn-${props.variant}`,
  `btn-${props.size}`,
  { 'btn-disabled': props.disabled }
])

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>
```

## ⏰ 时间显示组件

### 基础实现

```vue
<!-- src/components/TimeDisplay.vue -->
<template>
  <div class="time-display">
    <div class="time">{{ formattedTime }}</div>
    <div class="date">{{ formattedDate }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores'

const appStore = useAppStore()

// 使用计算属性从 store 获取格式化的时间和日期
const { formattedTime, formattedDate } = appStore

let timeInterval: number | null = null

onMounted(() => {
  // 立即更新一次时间
  appStore.updateTime()
  
  // 每秒更新时间
  timeInterval = window.setInterval(() => {
    appStore.updateTime()
  }, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.time-display {
  text-align: center;
  color: white;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  margin-bottom: 3rem;
  animation: slideInDown 0.8s ease-out 0.2s both;
}

.time {
  font-size: 4rem;
  font-weight: 300;
  line-height: 1;
  margin-bottom: 0.5rem;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.date {
  font-size: 1.125rem;
  opacity: 0.95;
  font-weight: 400;
  letter-spacing: 0.02em;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .time-display {
    margin-bottom: 2.5rem;
  }
  
  .time {
    font-size: 3.5rem;
  }
  
  .date {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .time-display {
    margin-bottom: 2rem;
  }
  
  .time {
    font-size: 2.8rem;
    letter-spacing: 0.03em;
  }
  
  .date {
    font-size: 0.9rem;
  }
}
</style>
```

### 高级功能扩展

```vue
<!-- 支持多种时间格式的时间组件 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore, useSettingsStore } from '@/stores'

const appStore = useAppStore()
const settingsStore = useSettingsStore()

// 根据设置格式化时间
const formattedTime = computed(() => {
  const time = appStore.currentTime
  const format = settingsStore.settings.timeFormat
  const showSeconds = settingsStore.settings.showSeconds
  
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12h'
  }
  
  if (showSeconds) {
    options.second = '2-digit'
  }
  
  return time.toLocaleTimeString(settingsStore.settings.language, options)
})

// 根据语言设置格式化日期
const formattedDate = computed(() => {
  const time = appStore.currentTime
  const language = settingsStore.settings.language
  
  return time.toLocaleDateString(language, {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})
</script>
```

## 🔍 搜索组件

### 基础搜索框

```vue
<!-- src/components/SearchBox.vue -->
<template>
  <div class="search-container">
    <div class="search-box">
      <div class="search-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
          <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2"/>
        </svg>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="输入搜索内容"
        class="search-input"
        @keyup.enter="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore, useSettingsStore } from '@/stores'

const appStore = useAppStore()
const settingsStore = useSettingsStore()

const searchQuery = ref('')

// 计算属性
const isInputFocused = computed(() => appStore.isSearchFocused)
const currentSearchEngine = computed(() => settingsStore.currentSearchEngine)

const handleSearch = () => {
  const query = searchQuery.value.trim()
  if (query) {
    // 添加到搜索历史
    appStore.addSearchHistory(query)
    appStore.addRecentSearch(query)
    
    // 构建搜索 URL
    const searchUrl = `${currentSearchEngine.value.url}${encodeURIComponent(query)}`
    window.open(searchUrl, '_blank')
    
    // 清空搜索框
    searchQuery.value = ''
  }
}

const handleFocus = () => {
  appStore.setSearchFocus(true)
}

const handleBlur = () => {
  appStore.setSearchFocus(false)
}
</script>

<style scoped>
.search-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  animation: slideInUp 0.8s ease-out 0.4s both;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 28px;
  padding: 0.875rem 1.75rem;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-box:hover,
.search-box:focus-within {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px) scale(1.02);
  border-color: rgba(121, 180, 166, 0.3);
}

.search-icon {
  color: #79b4a6;
  margin-right: 0.875rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.search-box:focus-within .search-icon {
  color: #14b8a6;
  transform: scale(1.1);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
  color: #1f2937;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.search-input::placeholder {
  color: #9ca3af;
  font-weight: 300;
}

.search-input:focus::placeholder {
  color: #d1d5db;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-container {
    max-width: 95%;
  }
  
  .search-box {
    padding: 0.75rem 1.5rem;
    border-radius: 24px;
  }
  
  .search-input {
    font-size: 0.9rem;
  }
  
  .search-icon {
    margin-right: 0.75rem;
  }
}

@media (max-width: 480px) {
  .search-container {
    max-width: 100%;
    padding: 0 1rem;
  }
  
  .search-box {
    padding: 0.625rem 1.25rem;
    border-radius: 20px;
  }
  
  .search-input {
    font-size: 0.875rem;
  }
  
  .search-icon {
    margin-right: 0.625rem;
  }
}
</style>
```

### 搜索建议功能

```vue
<!-- 带搜索建议的搜索组件 -->
<template>
  <div class="search-container">
    <div class="search-box">
      <!-- 搜索输入框 -->
      <div class="search-icon">
        <SearchIcon />
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="输入搜索内容"
        class="search-input"
        @keyup.enter="handleSearch"
        @keyup.up="navigateSuggestions(-1)"
        @keyup.down="navigateSuggestions(1)"
        @keyup.esc="hideSuggestions"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
    
    <!-- 搜索建议 -->
    <div v-if="showSuggestions && suggestions.length" class="suggestions">
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        :class="['suggestion-item', { active: index === activeSuggestionIndex }]"
        @click="selectSuggestion(suggestion)"
      >
        <HistoryIcon v-if="suggestion.type === 'history'" />
        <SearchIcon v-else />
        <span>{{ suggestion.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAppStore, useSettingsStore } from '@/stores'
import SearchIcon from '@/components/icons/SearchIcon.vue'
import HistoryIcon from '@/components/icons/HistoryIcon.vue'

interface Suggestion {
  text: string
  type: 'history' | 'suggestion'
}

const appStore = useAppStore()
const settingsStore = useSettingsStore()

const searchQuery = ref('')
const showSuggestions = ref(false)
const activeSuggestionIndex = ref(-1)

// 计算搜索建议
const suggestions = computed<Suggestion[]>(() => {
  if (!searchQuery.value.trim()) {
    // 显示最近搜索
    return appStore.recentSearches.slice(0, 5).map(text => ({
      text,
      type: 'history' as const
    }))
  }
  
  const query = searchQuery.value.toLowerCase()
  
  // 从搜索历史中筛选匹配项
  const historySuggestions = appStore.searchHistory
    .filter(item => item.toLowerCase().includes(query))
    .slice(0, 3)
    .map(text => ({ text, type: 'history' as const }))
  
  // 添加搜索建议（这里可以集成搜索引擎的建议 API）
  const searchSuggestions = [
    `${searchQuery.value} 是什么`,
    `${searchQuery.value} 怎么用`,
    `${searchQuery.value} 教程`
  ].map(text => ({ text, type: 'suggestion' as const }))
  
  return [...historySuggestions, ...searchSuggestions].slice(0, 8)
})

// 监听搜索输入变化
watch(searchQuery, () => {
  activeSuggestionIndex.value = -1
  showSuggestions.value = true
})

const handleFocus = () => {
  appStore.setSearchFocus(true)
  showSuggestions.value = true
}

const handleBlur = () => {
  // 延迟隐藏，允许点击建议项
  setTimeout(() => {
    appStore.setSearchFocus(false)
    showSuggestions.value = false
  }, 200)
}

const hideSuggestions = () => {
  showSuggestions.value = false
  activeSuggestionIndex.value = -1
}

const navigateSuggestions = (direction: number) => {
  if (!showSuggestions.value || !suggestions.value.length) return
  
  const newIndex = activeSuggestionIndex.value + direction
  
  if (newIndex < -1) {
    activeSuggestionIndex.value = suggestions.value.length - 1
  } else if (newIndex >= suggestions.value.length) {
    activeSuggestionIndex.value = -1
  } else {
    activeSuggestionIndex.value = newIndex
  }
  
  // 更新输入框内容
  if (activeSuggestionIndex.value === -1) {
    // 恢复原始输入
  } else {
    searchQuery.value = suggestions.value[activeSuggestionIndex.value].text
  }
}

const selectSuggestion = (suggestion: Suggestion) => {
  searchQuery.value = suggestion.text
  handleSearch()
}

const handleSearch = () => {
  const query = searchQuery.value.trim()
  if (query) {
    appStore.addSearchHistory(query)
    appStore.addRecentSearch(query)
    
    const searchUrl = `${settingsStore.currentSearchEngine.url}${encodeURIComponent(query)}`
    window.open(searchUrl, '_blank')
    
    searchQuery.value = ''
    hideSuggestions()
  }
}
</script>

<style scoped>
.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0 0 16px 16px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-top: none;
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: rgba(121, 180, 166, 0.1);
}

.suggestion-item svg {
  width: 16px;
  height: 16px;
  margin-right: 0.75rem;
  color: #9ca3af;
}

.suggestion-item span {
  color: #374151;
  font-size: 0.9rem;
}
</style>
```

## 🎨 图标组件

### SVG 图标组件

```vue
<!-- src/components/icons/SearchIcon.vue -->
<template>
  <svg 
    :width="size" 
    :height="size" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    :class="iconClass"
  >
    <circle cx="11" cy="11" r="8" stroke="currentColor" :stroke-width="strokeWidth"/>
    <path d="m21 21-4.35-4.35" stroke="currentColor" :stroke-width="strokeWidth"/>
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: number | string
  strokeWidth?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 20,
  strokeWidth: 2,
  class: ''
})

const iconClass = computed(() => [
  'icon',
  'icon-search',
  props.class
])
</script>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  transition: all 0.2s ease;
}

.icon-search {
  color: currentColor;
}
</style>
```

### 图标库组件

```typescript
// src/components/icons/index.ts
export { default as SearchIcon } from './SearchIcon.vue'
export { default as HistoryIcon } from './HistoryIcon.vue'
export { default as SettingsIcon } from './SettingsIcon.vue'
export { default as CloseIcon } from './CloseIcon.vue'

// 图标注册插件
import type { App } from 'vue'
import * as icons from './index'

export function registerIcons(app: App) {
  Object.entries(icons).forEach(([name, component]) => {
    app.component(name, component)
  })
}
```

## 🔧 组件通信

### Props 和 Emits

```vue
<!-- 子组件 -->
<template>
  <button @click="handleClick">
    {{ label }}
  </button>
</template>

<script setup lang="ts">
interface Props {
  label: string
  disabled?: boolean
}

interface Emits {
  click: [event: MouseEvent]
  change: [value: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>
```

### Provide/Inject

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { provide } from 'vue'

const theme = ref('light')
provide('theme', theme)
</script>

<!-- 子组件 -->
<script setup lang="ts">
import { inject } from 'vue'

const theme = inject<Ref<string>>('theme')
</script>
```

### 组合式函数

```typescript
// src/composables/useSearch.ts
import { ref, computed } from 'vue'
import { useAppStore, useSettingsStore } from '@/stores'

export function useSearch() {
  const appStore = useAppStore()
  const settingsStore = useSettingsStore()
  
  const query = ref('')
  const isSearching = ref(false)
  
  const searchEngine = computed(() => settingsStore.currentSearchEngine)
  
  const search = async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    isSearching.value = true
    
    try {
      // 添加到历史记录
      appStore.addSearchHistory(searchQuery)
      appStore.addRecentSearch(searchQuery)
      
      // 执行搜索
      const searchUrl = `${searchEngine.value.url}${encodeURIComponent(searchQuery)}`
      window.open(searchUrl, '_blank')
      
    } finally {
      isSearching.value = false
    }
  }
  
  return {
    query,
    isSearching,
    searchEngine,
    search
  }
}
```

## 🧪 组件测试

### 单元测试

```typescript
// src/components/__tests__/TimeDisplay.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TimeDisplay from '../TimeDisplay.vue'

describe('TimeDisplay', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders time correctly', () => {
    const wrapper = mount(TimeDisplay)
    
    expect(wrapper.find('.time').exists()).toBe(true)
    expect(wrapper.find('.date').exists()).toBe(true)
  })

  it('updates time every second', async () => {
    vi.useFakeTimers()
    
    const wrapper = mount(TimeDisplay)
    const initialTime = wrapper.find('.time').text()
    
    // 前进 1 秒
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()
    
    const updatedTime = wrapper.find('.time').text()
    expect(updatedTime).not.toBe(initialTime)
    
    vi.useRealTimers()
  })
})
```

### 组件快照测试

```typescript
// src/components/__tests__/SearchBox.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBox from '../SearchBox.vue'

describe('SearchBox', () => {
  it('matches snapshot', () => {
    const wrapper = mount(SearchBox)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
```

## 📚 扩展阅读

### Vue 3 官方文档
- [组合式 API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [组件基础](https://vuejs.org/guide/essentials/component-basics.html)

### 最佳实践
- [Vue 3 组件设计模式](https://vuejs.org/guide/reusability/composables.html)
- [TypeScript 与 Vue 3](https://vuejs.org/guide/typescript/overview.html)

---

**下一章：[界面设计实现](./09-ui-design-implementation.md)**
