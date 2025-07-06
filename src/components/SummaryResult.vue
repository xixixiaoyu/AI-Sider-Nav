<template>
  <div class="summary-result">
    <!-- 总结标题 -->
    <div class="summary-header">
      <div class="summary-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="summary-icon">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polyline
            points="14,2 14,8 20,8"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line
            x1="16"
            y1="13"
            x2="8"
            y2="13"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line
            x1="16"
            y1="17"
            x2="8"
            y2="17"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <h3>{{ $t('pageSummary') }}</h3>
      </div>
      <div class="summary-actions">
        <button class="action-btn" :title="$t('copyMessage')" @click="copySummary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect
              x="9"
              y="9"
              width="13"
              height="13"
              rx="2"
              ry="2"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 页面信息 -->
    <div class="page-info">
      <div class="page-title">{{ summary.title }}</div>
      <div class="page-meta">
        <span class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <a :href="summary.metadata.originalUrl" target="_blank" class="page-link">
            {{ $t('originalPage') }}
          </a>
        </span>
        <span class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
            <polyline
              points="12,6 12,12 16,14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ summary.metadata.readingTime }} {{ $t('readingTime') }}
        </span>
        <span class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              points="14,2 14,8 20,8"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ summary.metadata.wordCount }} {{ $t('wordCount') }}
        </span>
      </div>
    </div>

    <!-- 总结内容 -->
    <div class="summary-content">
      <div class="summary-text" v-html="formattedSummary"></div>
    </div>

    <!-- 关键要点 -->
    <div v-if="summary.keyPoints.length > 0" class="key-points">
      <h4 class="key-points-title">{{ $t('keyPoints') }}</h4>
      <ul class="key-points-list">
        <li v-for="(point, index) in summary.keyPoints" :key="index" class="key-point-item">
          {{ point }}
        </li>
      </ul>
    </div>

    <!-- Mermaid 图表 -->
    <div v-if="summary.mermaidDiagram" class="summary-diagram">
      <MermaidDiagram :diagram="summary.mermaidDiagram" />
    </div>

    <!-- 总结统计 -->
    <div class="summary-stats">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">总结时间</div>
          <div class="stat-value">{{ formatTime(summary.metadata.summaryTime) }}</div>
        </div>
        <div v-if="summary.metadata.hasImages" class="stat-item">
          <div class="stat-label">包含图片</div>
          <div class="stat-value">✓</div>
        </div>
        <div v-if="summary.metadata.hasTables" class="stat-item">
          <div class="stat-label">包含表格</div>
          <div class="stat-value">✓</div>
        </div>
        <div v-if="summary.metadata.hasLists" class="stat-item">
          <div class="stat-label">包含列表</div>
          <div class="stat-value">✓</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { SummaryResult } from '@/services/summaryService'
  import { i18n } from '@/i18n'
  import MermaidDiagram from './MermaidDiagram.vue'

  interface Props {
    summary: SummaryResult
  }

  const props = defineProps<Props>()

  // 国际化
  const $t = (key: string) => i18n.t(key)

  // 格式化总结内容
  const formattedSummary = computed(() => {
    return props.summary.summary
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
  })

  // 格式化时间
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    if (seconds < 60) {
      return `${seconds}秒`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  }

  // 复制总结内容
  const copySummary = async () => {
    try {
      const content = `# ${props.summary.title}\n\n${props.summary.summary}\n\n## 关键要点\n${props.summary.keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}\n\n原始页面: ${props.summary.metadata.originalUrl}`

      await navigator.clipboard.writeText(content)
      // 可以添加成功提示
    } catch (error) {
      console.error('复制失败:', error)
      // 可以添加错误提示
    }
  }
</script>

<style scoped>
  .summary-result {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    margin: 16px 0;
  }

  .summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    color: white;
  }

  .summary-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .summary-title h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .summary-icon {
    flex-shrink: 0;
  }

  .summary-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .page-info {
    padding: 20px;
    border-bottom: 1px solid #f3f4f6;
  }

  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .page-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 14px;
    color: #6b7280;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .page-link {
    color: #14b8a6;
    text-decoration: none;
  }

  .page-link:hover {
    text-decoration: underline;
  }

  .summary-content {
    padding: 20px;
    border-bottom: 1px solid #f3f4f6;
  }

  .summary-text {
    font-size: 15px;
    line-height: 1.6;
    color: #374151;
  }

  .summary-text :deep(strong) {
    font-weight: 600;
    color: #1f2937;
  }

  .summary-text :deep(em) {
    font-style: italic;
    color: #6b7280;
  }

  .summary-text :deep(code) {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
  }

  .key-points {
    padding: 20px;
    border-bottom: 1px solid #f3f4f6;
  }

  .key-points-title {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .key-points-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .key-point-item {
    position: relative;
    padding: 8px 0 8px 24px;
    font-size: 14px;
    line-height: 1.5;
    color: #374151;
  }

  .key-point-item::before {
    content: '•';
    position: absolute;
    left: 8px;
    color: #14b8a6;
    font-weight: bold;
  }

  .summary-diagram {
    padding: 20px;
    border-bottom: 1px solid #f3f4f6;
  }

  .summary-stats {
    padding: 16px 20px;
    background: #f9fafb;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
  }

  .stat-item {
    text-align: center;
  }

  .stat-label {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .summary-header {
      padding: 12px 16px;
    }

    .page-info,
    .summary-content,
    .key-points {
      padding: 16px;
    }

    .page-meta {
      flex-direction: column;
      gap: 8px;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
  }
</style>
