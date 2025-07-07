<template>
  <div class="thinking-indicator">
    <div class="thinking-header">
      <div class="thinking-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M9.663 17H7.5C5.567 17 4 15.433 4 13.5C4 11.567 5.567 10 7.5 10C7.5 7.239 9.739 5 12.5 5S17.5 7.239 17.5 10C19.433 10 21 11.567 21 13.5S19.433 17 17.5 17H14.837"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12 14V21M9 18L12 21L15 18"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <span class="thinking-title">{{ $t('aiIsThinking') }}</span>
      <button
        class="thinking-toggle"
        :class="{ 'thinking-toggle--expanded': isExpanded }"
        @click="toggleExpanded"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- 思考内容 -->
    <Transition name="thinking-content">
      <div v-if="isExpanded" class="thinking-content">
        <div class="thinking-text">
          {{ content }}
          <span class="thinking-cursor">|</span>
        </div>
      </div>
    </Transition>

    <!-- 进度条 -->
    <div class="thinking-progress">
      <div class="progress-bar"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { i18n } from '@/i18n'

  // interface Props {
  //   content: string
  // } // 暂时未使用

  // const props = defineProps<Props>() // 暂时未使用

  const isExpanded = ref(false)

  // 国际化
  const $t = (key: string) => i18n.t(key)

  // 切换展开状态
  const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
  }
</script>

<style scoped>
  .thinking-indicator {
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
    border: 1px solid #bae6fd;
    border-radius: 12px;
    padding: 16px;
    margin: 8px 0;
    position: relative;
    overflow: hidden;
  }

  .thinking-header {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }

  .thinking-icon {
    color: #0ea5e9;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: thinking-pulse 2s infinite;
  }

  @keyframes thinking-pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  .thinking-title {
    flex: 1;
    font-weight: 500;
    color: #0c4a6e;
    font-size: 14px;
  }

  .thinking-toggle {
    padding: 4px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #0ea5e9;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .thinking-toggle:hover {
    background: rgba(14, 165, 233, 0.1);
  }

  .thinking-toggle--expanded {
    transform: rotate(180deg);
  }

  .thinking-content {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #bae6fd;
  }

  .thinking-text {
    color: #0c4a6e;
    font-size: 13px;
    line-height: 1.5;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    white-space: pre-wrap;
    word-wrap: break-word;
    background: rgba(255, 255, 255, 0.5);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(186, 230, 253, 0.5);
  }

  .thinking-cursor {
    display: inline-block;
    animation: blink 1s infinite;
    margin-left: 2px;
    color: #0ea5e9;
  }

  @keyframes blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0;
    }
  }

  .thinking-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(186, 230, 253, 0.3);
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #0ea5e9, #06b6d4);
    animation: progress-flow 2s infinite;
    width: 30%;
  }

  @keyframes progress-flow {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(400%);
    }
  }

  /* 展开/收起动画 */
  .thinking-content-enter-active,
  .thinking-content-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .thinking-content-enter-from,
  .thinking-content-leave-to {
    max-height: 0;
    opacity: 0;
    margin-top: 0;
    padding-top: 0;
  }

  .thinking-content-enter-to,
  .thinking-content-leave-from {
    max-height: 200px;
    opacity: 1;
    margin-top: 12px;
    padding-top: 12px;
  }

  /* 响应式 */
  @media (max-width: 768px) {
    .thinking-indicator {
      padding: 12px;
    }

    .thinking-text {
      font-size: 12px;
      padding: 10px;
    }
  }
</style>
