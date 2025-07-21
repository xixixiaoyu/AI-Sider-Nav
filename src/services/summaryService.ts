/**
 * 网页内容总结服务
 * 使用 AI 对提取的网页内容进行智能总结
 */

import { ExtractedContent } from './contentExtractor'
// import { ImageInfo, TableInfo, ListInfo } from './contentExtractor' // 暂时未使用
import { getAIStreamResponse } from './deepseekService'
import { Message } from '../types'

export interface SummaryResult {
  title: string
  summary: string
  keyPoints: string[]
  mermaidDiagram?: string
  metadata: SummaryMetadata
}

export interface SummaryMetadata {
  originalUrl: string
  originalTitle: string
  wordCount: number
  readingTime: number
  summaryTime: number
  hasImages: boolean
  hasTables: boolean
  hasLists: boolean
}

/**
 * 网页内容总结器
 */
export class SummaryService {
  // 内容大小限制
  // private readonly MAX_CONTENT_SIZE = 300 * 1024 // 300KB
  private readonly MAX_PROMPT_LENGTH = 50000 // 50K 字符
  private readonly MAX_IMAGES = 5
  private readonly MAX_TABLES = 3
  private readonly MAX_LISTS = 5
  private readonly MAX_HEADINGS = 20

  /**
   * 对提取的内容进行总结
   */
  async summarizeContent(
    content: ExtractedContent,
    onProgress?: (chunk: string) => void
  ): Promise<SummaryResult> {
    const startTime = Date.now()
    console.log('📝 开始内容总结')

    // 预处理内容以控制大小
    const processedContent = this.preprocessContent(content)

    // 构建总结提示词
    const prompt = this.buildSummaryPrompt(processedContent)

    // 检查提示词长度
    if (prompt.length > this.MAX_PROMPT_LENGTH) {
      console.warn(`⚠️ 提示词过长 (${prompt.length} > ${this.MAX_PROMPT_LENGTH})，进行截断`)
      const truncatedContent = this.truncateContent(processedContent)
      const truncatedPrompt = this.buildSummaryPrompt(truncatedContent)
      return this.performSummarization(truncatedPrompt, truncatedContent, startTime, onProgress)
    }

    return this.performSummarization(prompt, processedContent, startTime, onProgress)
  }

  /**
   * 预处理内容以控制大小
   */
  private preprocessContent(content: ExtractedContent): ExtractedContent {
    console.log('🔧 预处理内容')

    return {
      ...content,
      // 限制主要内容长度
      mainContent:
        content.mainContent.length > 20000
          ? content.mainContent.substring(0, 20000) + '\n\n[内容已截断]'
          : content.mainContent,

      // 限制图片数量
      images: content.images.slice(0, this.MAX_IMAGES),

      // 限制表格数量和大小
      tables: content.tables.slice(0, this.MAX_TABLES).map((table) => ({
        ...table,
        headers: table.headers.slice(0, 8),
        rows: table.rows.slice(0, 10).map((row) => row.slice(0, 8)),
      })),

      // 限制列表数量和项目
      lists: content.lists.slice(0, this.MAX_LISTS).map((list) => ({
        ...list,
        items: list.items.slice(0, 20),
      })),

      // 限制标题数量
      structure: {
        ...content.structure,
        headings: content.structure.headings.slice(0, this.MAX_HEADINGS),
        sections: content.structure.sections.slice(0, 10),
      },
    }
  }

  /**
   * 截断内容以适应提示词长度限制
   */
  private truncateContent(content: ExtractedContent): ExtractedContent {
    console.log('✂️ 截断内容以适应长度限制')

    return {
      ...content,
      mainContent: content.mainContent.substring(0, 10000) + '\n\n[内容已大幅截断]',
      images: content.images.slice(0, 2),
      tables: content.tables.slice(0, 1).map((table) => ({
        ...table,
        headers: table.headers.slice(0, 5),
        rows: table.rows.slice(0, 5).map((row) => row.slice(0, 5)),
      })),
      lists: content.lists.slice(0, 2).map((list) => ({
        ...list,
        items: list.items.slice(0, 10),
      })),
      structure: {
        headings: content.structure.headings.slice(0, 10),
        sections: content.structure.sections.slice(0, 5),
      },
    }
  }

  /**
   * 执行总结
   */
  private async performSummarization(
    prompt: string,
    content: ExtractedContent,
    startTime: number,
    onProgress?: (chunk: string) => void
  ): Promise<SummaryResult> {
    // 准备消息
    const messages: Message[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
      {
        role: 'user',
        content: prompt,
      },
    ]

    // 调用 AI 进行总结
    let fullResponse = ''
    let responseSize = 0
    const maxResponseSize = 100 * 1024 // 100KB 响应大小限制

    await getAIStreamResponse(
      messages,
      (chunk: string) => {
        if (chunk === '[DONE]') return
        if (chunk === '[ABORTED]') return

        responseSize += chunk.length * 2 // UTF-16
        if (responseSize > maxResponseSize) {
          console.warn('⚠️ AI 响应过长，停止接收')
          return
        }

        fullResponse += chunk
        onProgress?.(chunk)
      },
      undefined,
      0.3 // 使用较低的温度以获得更一致的结果
    )

    // 解析 AI 响应
    const summaryResult = this.parseAIResponse(fullResponse, content, startTime)

    console.log(
      `📝 总结完成，耗时: ${Date.now() - startTime}ms，响应大小: ${(responseSize / 1024).toFixed(2)}KB`
    )

    return summaryResult
  }

  /**
   * 获取系统提示词
   */
  private getSystemPrompt(): string {
    return `你是一个专业的网页内容总结助手，擅长分析和总结各种类型的网页内容。

你的任务是：
1. 分析提供的网页内容，提取关键信息
2. 生成简洁明了的总结
3. 提取重要观点和要点
4. 如果内容适合，生成相应的 Mermaid 图表来可视化信息结构

输出格式要求：
- 使用 JSON 格式返回结果
- 包含以下字段：title（总结标题）、summary（主要总结）、keyPoints（关键要点数组）、mermaidDiagram（可选的 Mermaid 图表代码）

注意事项：
- 保持总结的客观性和准确性
- 突出最重要的信息
- 如果内容包含流程、关系或结构信息，优先生成 Mermaid 图表
- 总结长度控制在 200-500 字之间
- 关键要点控制在 3-8 个之间

支持的 Mermaid 图表类型：
- flowchart（流程图）
- graph（关系图）  
- mindmap（思维导图）
- timeline（时间线）
- pie（饼图）
- gitgraph（Git 图）`
  }

  /**
   * 构建总结提示词
   */
  private buildSummaryPrompt(content: ExtractedContent): string {
    let prompt = `请总结以下网页内容：

**页面信息：**
- 标题：${content.title}
- URL：${content.url}
- 字数：${content.metadata.wordCount}
- 预计阅读时间：${content.metadata.readingTime} 分钟

**主要内容：**
${content.mainContent}

`

    // 添加结构信息
    if (content.structure.headings.length > 0) {
      prompt += `**页面结构：**
${content.structure.headings.map((h) => `${'  '.repeat(h.level - 1)}- ${h.text}`).join('\n')}

`
    }

    // 添加表格信息
    if (content.tables.length > 0) {
      prompt += `**表格数据：**
${content.tables
  .map((table, index) => {
    let tableText = `表格 ${index + 1}${table.caption ? `（${table.caption}）` : ''}：\n`
    if (table.headers.length > 0) {
      tableText += `表头：${table.headers.join(' | ')}\n`
    }
    tableText += table.rows
      .slice(0, 3) // 只显示前3行
      .map((row) => `数据：${row.join(' | ')}`)
      .join('\n')
    if (table.rows.length > 3) {
      tableText += `\n...（共 ${table.rows.length} 行数据）`
    }
    return tableText
  })
  .join('\n\n')}

`
    }

    // 添加列表信息
    if (content.lists.length > 0) {
      prompt += `**列表信息：**
${content.lists
  .map((list, index) => {
    let listText = `列表 ${index + 1}${list.title ? `（${list.title}）` : ''}：\n`
    listText += list.items
      .slice(0, 5) // 只显示前5项
      .map((item, i) => `${list.type === 'ordered' ? `${i + 1}.` : '-'} ${item}`)
      .join('\n')
    if (list.items.length > 5) {
      listText += `\n...（共 ${list.items.length} 项）`
    }
    return listText
  })
  .join('\n\n')}

`
    }

    // 添加图片信息
    if (content.images.length > 0) {
      prompt += `**图片信息：**
${content.images
  .slice(0, 5) // 只显示前5张图片
  .map((img, index) => {
    return `图片 ${index + 1}：${img.alt || '无描述'}${img.caption ? ` (${img.caption})` : ''}`
  })
  .join('\n')}
${content.images.length > 5 ? `\n...（共 ${content.images.length} 张图片）` : ''}

`
    }

    prompt += `请根据以上内容生成总结，并以 JSON 格式返回结果。如果内容适合用图表展示（如流程、步骤、关系、分类等），请生成相应的 Mermaid 图表代码。`

    return prompt
  }

  /**
   * 解析 AI 响应
   */
  private parseAIResponse(
    response: string,
    originalContent: ExtractedContent,
    startTime: number
  ): SummaryResult {
    const summaryTime = Date.now() - startTime

    try {
      // 尝试提取 JSON 部分
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          title: parsed.title || originalContent.title,
          summary: parsed.summary || response,
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          mermaidDiagram: parsed.mermaidDiagram,
          metadata: {
            originalUrl: originalContent.url,
            originalTitle: originalContent.title,
            wordCount: originalContent.metadata.wordCount,
            readingTime: originalContent.metadata.readingTime,
            summaryTime,
            hasImages: originalContent.images.length > 0,
            hasTables: originalContent.tables.length > 0,
            hasLists: originalContent.lists.length > 0,
          },
        }
      }
    } catch (error) {
      console.warn('解析 AI 响应 JSON 失败，使用文本解析:', error)
    }

    // 如果 JSON 解析失败，使用文本解析
    return this.parseTextResponse(response, originalContent, summaryTime)
  }

  /**
   * 解析文本响应（备用方案）
   */
  private parseTextResponse(
    response: string,
    originalContent: ExtractedContent,
    summaryTime: number
  ): SummaryResult {
    // 简单的文本解析逻辑
    // const lines = response.split('\n') // 暂时未使用.filter((line) => line.trim())

    let title = originalContent.title
    const summary = response
    const keyPoints: string[] = []
    let mermaidDiagram: string | undefined

    // 尝试提取标题
    const titleMatch = response.match(/(?:标题|总结标题|Title)[:：]\s*(.+)/i)
    if (titleMatch) {
      title = titleMatch[1].trim()
    }

    // 尝试提取关键要点
    const keyPointsSection = response.match(
      /(?:关键要点|要点|Key Points)[:：]\s*([\s\S]*?)(?:\n\n|\n(?:[A-Z]|[一二三四五六七八九十]))/i
    )
    if (keyPointsSection) {
      const pointsText = keyPointsSection[1]
      const points = pointsText
        .split('\n')
        .map((line) => line.replace(/^[-*•]\s*/, '').trim())
        .filter((point) => point.length > 0)
      keyPoints.push(...points)
    }

    // 尝试提取 Mermaid 图表
    const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/i)
    if (mermaidMatch) {
      mermaidDiagram = mermaidMatch[1].trim()
    }

    return {
      title,
      summary,
      keyPoints,
      mermaidDiagram,
      metadata: {
        originalUrl: originalContent.url,
        originalTitle: originalContent.title,
        wordCount: originalContent.metadata.wordCount,
        readingTime: originalContent.metadata.readingTime,
        summaryTime,
        hasImages: originalContent.images.length > 0,
        hasTables: originalContent.tables.length > 0,
        hasLists: originalContent.lists.length > 0,
      },
    }
  }

  /**
   * 生成快速总结（用于预览）
   */
  generateQuickSummary(content: ExtractedContent): string {
    const { mainContent, metadata } = content

    // 提取前几句话作为快速总结
    const sentences = mainContent.split(/[。！？.!?]/).filter((s) => s.trim().length > 10)
    const quickSummary = sentences.slice(0, 3).join('。') + '。'

    return `${quickSummary}\n\n📊 页面信息：${metadata.wordCount} 字，预计阅读 ${metadata.readingTime} 分钟`
  }

  /**
   * 验证 Mermaid 图表语法
   */
  validateMermaidDiagram(diagram: string): boolean {
    if (!diagram) return false

    // 基本的语法检查
    const validTypes = ['flowchart', 'graph', 'mindmap', 'timeline', 'pie', 'gitgraph']
    const firstLine = diagram.split('\n')[0].trim().toLowerCase()

    return validTypes.some((type) => firstLine.startsWith(type))
  }
}

/**
 * 创建总结服务实例
 */
export function createSummaryService(): SummaryService {
  return new SummaryService()
}
