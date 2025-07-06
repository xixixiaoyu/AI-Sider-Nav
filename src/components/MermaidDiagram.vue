<template>
  <div class="mermaid-diagram">
    <div v-if="error" class="mermaid-error">
      <div class="error-icon">⚠️</div>
      <div class="error-message">{{ error }}</div>
      <button class="error-retry" @click="renderDiagram">重试</button>
    </div>
    <div v-else-if="isLoading" class="mermaid-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在渲染图表...</div>
    </div>
    <div v-else ref="diagramRef" class="mermaid-container"></div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch, nextTick } from 'vue'
  import mermaid from 'mermaid'

  interface Props {
    diagram: string
    theme?: 'default' | 'dark' | 'forest' | 'neutral'
    width?: string
    height?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    theme: 'default',
    width: '100%',
    height: 'auto',
  })

  const diagramRef = ref<HTMLElement>()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 初始化 Mermaid
  const initMermaid = () => {
    mermaid.initialize({
      startOnLoad: false,
      theme: props.theme,
      securityLevel: 'loose',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
      sequence: {
        useMaxWidth: true,
        wrap: true,
      },
      gantt: {
        useMaxWidth: true,
      },
      journey: {
        useMaxWidth: true,
      },
      pie: {
        useMaxWidth: true,
      },
      mindmap: {
        useMaxWidth: true,
      },
      timeline: {
        useMaxWidth: true,
      },
    })
  }

  // 渲染图表
  const renderDiagram = async () => {
    if (!props.diagram || !diagramRef.value) return

    isLoading.value = true
    error.value = null

    try {
      // 清空容器
      diagramRef.value.innerHTML = ''

      // 生成唯一 ID
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // 验证图表语法
      const isValid = await mermaid.parse(props.diagram)
      if (!isValid) {
        throw new Error('图表语法无效')
      }

      // 渲染图表
      const { svg } = await mermaid.render(id, props.diagram)

      // 插入 SVG
      diagramRef.value.innerHTML = svg

      // 设置样式
      const svgElement = diagramRef.value.querySelector('svg')
      if (svgElement) {
        svgElement.style.width = props.width
        svgElement.style.height = props.height
        svgElement.style.maxWidth = '100%'
        
        // 添加响应式支持
        if (props.width === '100%') {
          svgElement.removeAttribute('width')
          svgElement.style.width = '100%'
        }
      }

      isLoading.value = false
    } catch (err) {
      console.error('Mermaid 渲染失败:', err)
      error.value = err instanceof Error ? err.message : '图表渲染失败'
      isLoading.value = false
    }
  }

  // 监听图表内容变化
  watch(
    () => props.diagram,
    () => {
      nextTick(() => {
        renderDiagram()
      })
    }
  )

  // 监听主题变化
  watch(
    () => props.theme,
    () => {
      initMermaid()
      nextTick(() => {
        renderDiagram()
      })
    }
  )

  // 组件挂载时初始化
  onMounted(() => {
    initMermaid()
    nextTick(() => {
      renderDiagram()
    })
  })
</script>

<style scoped>
  .mermaid-diagram {
    width: 100%;
    margin: 16px 0;
    border-radius: 8px;
    overflow: hidden;
    background: #fafafa;
    border: 1px solid #e5e7eb;
  }

  .mermaid-container {
    padding: 16px;
    text-align: center;
    background: white;
  }

  .mermaid-container :deep(svg) {
    border-radius: 4px;
    background: transparent;
  }

  .mermaid-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    color: #6b7280;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #14b8a6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }

  .loading-text {
    font-size: 14px;
  }

  .mermaid-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    color: #dc2626;
    background: #fef2f2;
  }

  .error-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .error-message {
    font-size: 14px;
    margin-bottom: 16px;
    text-align: center;
  }

  .error-retry {
    padding: 8px 16px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .error-retry:hover {
    background: #b91c1c;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  /* 深色主题支持 */
  .mermaid-diagram.dark {
    background: #1f2937;
    border-color: #374151;
  }

  .mermaid-diagram.dark .mermaid-container {
    background: #111827;
  }

  .mermaid-diagram.dark .mermaid-loading {
    color: #9ca3af;
  }

  .mermaid-diagram.dark .loading-spinner {
    border-color: #374151;
    border-top-color: #14b8a6;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .mermaid-diagram {
      margin: 12px 0;
    }

    .mermaid-container {
      padding: 12px;
    }

    .mermaid-loading,
    .mermaid-error {
      padding: 24px 12px;
    }
  }
</style>
