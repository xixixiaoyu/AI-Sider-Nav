<template>
  <div class="search-container">
    <div class="search-box">
      <div class="search-icon">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
          <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" />
        </svg>
      </div>
      <input
        ref="searchInputRef"
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
  import { ref, computed, onMounted, nextTick } from 'vue'
  import { useAppStore, useSettingsStore } from '@/stores'

  const appStore = useAppStore()
  const settingsStore = useSettingsStore()

  const searchQuery = ref('')
  const searchInputRef = ref<HTMLInputElement>()

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

  // 组件挂载后自动聚焦到搜索框
  onMounted(async () => {
    await nextTick()

    // 用户交互检测
    let userHasInteracted = false
    const markUserInteraction = () => {
      userHasInteracted = true
    }

    // 监听用户交互事件
    document.addEventListener('keydown', markUserInteraction, { once: true })
    document.addEventListener('mousedown', markUserInteraction, { once: true })
    document.addEventListener('touchstart', markUserInteraction, { once: true })

    // 强力聚焦函数
    const focusInput = () => {
      if (searchInputRef.value && !userHasInteracted) {
        try {
          // 多种聚焦方法组合使用
          searchInputRef.value.focus()
          searchInputRef.value.click()
          searchInputRef.value.select()

          // 确保输入框可见
          searchInputRef.value.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })

          // 设置应用状态
          appStore.setSearchFocus(true)
        } catch (error) {
          console.warn('Focus attempt failed:', error)
        }
      }
    }

    // 使用 requestAnimationFrame 确保渲染完成
    const scheduleFocus = (delay: number) => {
      setTimeout(() => {
        requestAnimationFrame(() => {
          focusInput()
        })
      }, delay)
    }

    // 多次尝试聚焦，延迟时间更长，次数更多
    scheduleFocus(100) // 立即尝试
    scheduleFocus(300) // 第二次尝试
    scheduleFocus(600) // 第三次尝试
    scheduleFocus(1000) // 第四次尝试
    scheduleFocus(1500) // 第五次尝试
    scheduleFocus(2000) // 第六次尝试

    // 监听页面完全加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        scheduleFocus(100)
      })
    }

    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        scheduleFocus(100)
      })
    }

    // 监听页面可见性变化，当页面变为可见时聚焦
    const handleVisibilityChange = () => {
      if (!document.hidden && !userHasInteracted) {
        scheduleFocus(100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 监听窗口焦点事件
    const handleWindowFocus = () => {
      if (!userHasInteracted) {
        scheduleFocus(100)
      }
    }

    window.addEventListener('focus', handleWindowFocus)

    // 监听标签页激活事件
    const handlePageShow = () => {
      if (!userHasInteracted) {
        scheduleFocus(100)
      }
    }

    window.addEventListener('pageshow', handlePageShow)
  })
</script>

<style scoped>
  .search-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    animation: slideInUp 0.3s ease-out 0.1s both;
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

  @media (max-width: 320px) {
    .search-box {
      padding: 0.5rem 1rem;
    }

    .search-input {
      font-size: 0.8rem;
    }
  }

  @media (max-height: 600px) {
    .search-container {
      margin-bottom: 1rem;
    }
  }
</style>
