<template>
  <div>
    <!-- 简单的复制按钮测试 -->
    <div v-if="showButton" class="simple-copy-button" :style="buttonStyle" @click="copyText">
      复制
    </div>

    <!-- 成功提示 -->
    <div v-if="showToast" class="success-toast">已复制！</div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useSettingsStore } from '@/stores/settings'

  const settingsStore = useSettingsStore()
  const settings = computed(() => settingsStore.settings)
  const isEnabled = computed(() => settings.value.textSelection?.enabled ?? true)

  const showButton = ref(false)
  const showToast = ref(false)
  const selectedText = ref('')
  const buttonStyle = ref({
    position: 'fixed',
    top: '100px',
    left: '100px',
    zIndex: 9999,
  })

  let toastTimer: number | null = null

  const handleSelection = () => {
    console.log('SimpleTextCopy: Selection event triggered', { enabled: isEnabled.value })

    if (!isEnabled.value) {
      console.log('SimpleTextCopy: Feature disabled')
      return
    }

    setTimeout(() => {
      const selection = window.getSelection()
      console.log('SimpleTextCopy: Selection object:', selection)

      if (selection && selection.toString().trim()) {
        const text = selection.toString().trim()
        console.log('SimpleTextCopy: Selected text:', text)

        selectedText.value = text

        // 获取选择位置
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          console.log('SimpleTextCopy: Selection rect:', rect)

          buttonStyle.value = {
            position: 'fixed' as const,
            top: `${rect.top - 40}px`,
            left: `${rect.left + rect.width / 2 - 25}px`,
            zIndex: 9999,
          }

          showButton.value = true
          console.log('SimpleTextCopy: Button shown')
        }
      } else {
        showButton.value = false
        console.log('SimpleTextCopy: No text selected, button hidden')
      }
    }, 50)
  }

  const copyText = async () => {
    console.log('SimpleTextCopy: Copy button clicked')

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(selectedText.value)
        console.log('SimpleTextCopy: Text copied using Clipboard API')
      } else {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = selectedText.value
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        console.log('SimpleTextCopy: Text copied using execCommand')
      }

      // 显示成功提示
      showToast.value = true
      if (toastTimer) clearTimeout(toastTimer)
      toastTimer = window.setTimeout(() => {
        showToast.value = false
      }, 2000)

      // 隐藏按钮
      showButton.value = false

      // 清除选择
      window.getSelection()?.removeAllRanges()
    } catch (error) {
      console.error('SimpleTextCopy: Copy failed:', error)
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.simple-copy-button')) {
      showButton.value = false
    }
  }

  onMounted(async () => {
    console.log('SimpleTextCopy: Component mounted')

    // 等待设置加载
    await settingsStore.loadSettings()
    console.log('SimpleTextCopy: Settings loaded:', settings.value.textSelection)
    console.log('SimpleTextCopy: Feature enabled:', isEnabled.value)

    document.addEventListener('selectionchange', handleSelection)
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    console.log('SimpleTextCopy: Component unmounted')
    document.removeEventListener('selectionchange', handleSelection)
    document.removeEventListener('mouseup', handleSelection)
    document.removeEventListener('click', handleClickOutside)
    if (toastTimer) clearTimeout(toastTimer)
  })
</script>

<style scoped>
  .simple-copy-button {
    background: #2196f3;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    user-select: none;
  }

  .simple-copy-button:hover {
    background: #1976d2;
  }

  .success-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #4caf50;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    z-index: 10000;
    font-size: 14px;
  }
</style>
