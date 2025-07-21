/**
 * 网页内容提取服务
 * 用于提取网页的主要内容，包括文本、图片、表格等信息
 */

export interface ExtractedContent {
  title: string
  url: string
  mainContent: string
  images: ImageInfo[]
  tables: TableInfo[]
  lists: ListInfo[]
  metadata: PageMetadata
  structure: PageStructure
}

export interface ImageInfo {
  src: string
  alt: string
  title?: string
  caption?: string
  width?: number
  height?: number
}

export interface TableInfo {
  headers: string[]
  rows: string[][]
  caption?: string
}

export interface ListInfo {
  type: 'ordered' | 'unordered'
  items: string[]
  title?: string
}

export interface PageMetadata {
  description?: string
  keywords?: string
  author?: string
  publishDate?: string
  language?: string
  wordCount: number
  readingTime: number
}

export interface PageStructure {
  headings: HeadingInfo[]
  sections: SectionInfo[]
}

export interface HeadingInfo {
  level: number
  text: string
  id?: string
}

export interface SectionInfo {
  title: string
  content: string
  level: number
}

/**
 * 网页内容提取器类
 */
export class ContentExtractor {
  private document: Document

  // 内容大小限制
  private readonly MAX_CONTENT_SIZE = 500 * 1024 // 500KB
  private readonly MAX_IMAGES = 10
  private readonly MAX_TABLES = 5
  private readonly MAX_LISTS = 8
  private readonly MAX_HEADINGS = 50
  private readonly MAX_SECTIONS = 20

  // 单个元素大小限制
  private readonly MAX_TEXT_LENGTH = 100 * 1024 // 100KB
  private readonly MAX_TABLE_CELLS = 1000
  private readonly MAX_LIST_ITEMS = 200

  private excludeSelectors = [
    'nav',
    'header',
    'footer',
    '.navigation',
    '.nav',
    '.menu',
    '.sidebar',
    '.advertisement',
    '.ads',
    '.ad',
    '.social',
    '.share',
    '.comments',
    '.comment',
    '.related',
    '.popup',
    '.modal',
    '.overlay',
    'script',
    'style',
    'noscript',
    '[role="banner"]',
    '[role="navigation"]',
    '[role="complementary"]',
    '[role="contentinfo"]',
  ]

  constructor(document: Document) {
    this.document = document
  }

  /**
   * 提取完整的页面内容
   */
  extractContent(): ExtractedContent {
    const startTime = Date.now()
    console.log('🔍 开始提取页面内容')

    try {
      const content: ExtractedContent = {
        title: this.extractTitle(),
        url: this.document.location?.href || '',
        mainContent: this.extractMainContent(),
        images: this.extractImages(),
        tables: this.extractTables(),
        lists: this.extractLists(),
        metadata: this.extractMetadata(),
        structure: this.extractStructure(),
      }

      // 检查总内容大小
      const contentSize = this.estimateContentSize(content)
      console.log(
        `📊 内容提取完成，大小: ${(contentSize / 1024).toFixed(2)}KB，耗时: ${Date.now() - startTime}ms`
      )

      if (contentSize > this.MAX_CONTENT_SIZE) {
        console.warn(
          `⚠️ 内容大小超限 (${(contentSize / 1024).toFixed(2)}KB > ${(this.MAX_CONTENT_SIZE / 1024).toFixed(2)}KB)，进行压缩`
        )
        return this.compressContent(content)
      }

      return content
    } catch (error) {
      console.error('❌ 内容提取失败:', error)
      // 返回基本内容
      return {
        title: this.extractTitle(),
        url: this.document.location?.href || '',
        mainContent: '内容提取失败',
        images: [],
        tables: [],
        lists: [],
        metadata: { wordCount: 0, readingTime: 0 },
        structure: { headings: [], sections: [] },
      }
    }
  }

  /**
   * 提取页面标题
   */
  private extractTitle(): string {
    // 优先级：h1 > title > og:title
    const h1 = this.document.querySelector('h1')
    if (h1?.textContent?.trim()) {
      return h1.textContent.trim()
    }

    const title = this.document.querySelector('title')
    if (title?.textContent?.trim()) {
      return title.textContent.trim()
    }

    const ogTitle = this.document.querySelector('meta[property="og:title"]')
    if (ogTitle?.getAttribute('content')?.trim()) {
      return ogTitle.getAttribute('content')!.trim()
    }

    return '无标题'
  }

  /**
   * 提取主要内容
   */
  private extractMainContent(): string {
    // 尝试找到主要内容区域
    const mainSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      'article',
      '.article',
    ]

    let mainElement: Element | null = null
    for (const selector of mainSelectors) {
      mainElement = this.document.querySelector(selector)
      if (mainElement) break
    }

    // 如果没找到主要内容区域，使用 body
    if (!mainElement) {
      mainElement = this.document.body
    }

    const content = this.extractTextFromElement(mainElement)

    // 限制文本长度
    if (content.length > this.MAX_TEXT_LENGTH) {
      console.warn(`⚠️ 主要内容过长 (${content.length} > ${this.MAX_TEXT_LENGTH})，进行截断`)
      return content.substring(0, this.MAX_TEXT_LENGTH) + '\n\n[内容已截断以节省内存]'
    }

    return content
  }

  /**
   * 从元素中提取文本内容
   */
  private extractTextFromElement(element: Element): string {
    if (!element) return ''

    // 克隆元素以避免修改原始 DOM
    const clone = element.cloneNode(true) as Element

    try {
      // 移除不需要的元素
      this.excludeSelectors.forEach((selector) => {
        const elements = clone.querySelectorAll(selector)
        elements.forEach((el) => el.remove())
      })

      // 处理特殊元素
      this.processSpecialElements(clone)

      // 提取文本并清理
      const text = clone.textContent || ''
      return this.cleanText(text)
    } finally {
      // 清理克隆的元素以释放内存
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone)
      }
      // 清理所有子节点引用
      while (clone.firstChild) {
        clone.removeChild(clone.firstChild)
      }
    }
  }

  /**
   * 处理特殊元素（如换行、段落等）
   */
  private processSpecialElements(element: Element): void {
    // 为块级元素添加换行
    const blockElements = element.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, br, hr')
    blockElements.forEach((el) => {
      if (el.tagName === 'BR' || el.tagName === 'HR') {
        el.textContent = '\n'
      } else {
        el.textContent = (el.textContent || '') + '\n'
      }
    })
  }

  /**
   * 清理文本内容
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/\n\s*\n/g, '\n\n') // 合并多个换行
      .trim()
  }

  /**
   * 提取图片信息
   */
  private extractImages(): ImageInfo[] {
    const images: ImageInfo[] = []
    const imgElements = this.document.querySelectorAll('img')
    let processedCount = 0

    for (const img of imgElements) {
      if (processedCount >= this.MAX_IMAGES) {
        console.warn(`⚠️ 图片数量超限，只处理前 ${this.MAX_IMAGES} 张`)
        break
      }

      const src = img.src
      if (!src || src.startsWith('data:')) continue // 跳过 base64 图片

      // 跳过小图片和装饰性图片
      const width = img.naturalWidth || img.width || 0
      const height = img.naturalHeight || img.height || 0
      if (width < 50 || height < 50) continue

      const imageInfo: ImageInfo = {
        src,
        alt: (img.alt || '').substring(0, 200), // 限制 alt 文本长度
        title: (img.title || '').substring(0, 200),
        width,
        height,
      }

      // 查找图片说明
      const figure = img.closest('figure')
      if (figure) {
        const figcaption = figure.querySelector('figcaption')
        if (figcaption) {
          imageInfo.caption = (figcaption.textContent?.trim() || '').substring(0, 300)
        }
      }

      images.push(imageInfo)
      processedCount++
    }

    return images
  }

  /**
   * 提取表格信息
   */
  private extractTables(): TableInfo[] {
    const tables: TableInfo[] = []
    const tableElements = this.document.querySelectorAll('table')
    let processedCount = 0

    for (const table of tableElements) {
      if (processedCount >= this.MAX_TABLES) {
        console.warn(`⚠️ 表格数量超限，只处理前 ${this.MAX_TABLES} 个`)
        break
      }

      const headers: string[] = []
      const rows: string[][] = []
      let cellCount = 0

      // 提取表头
      const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th')
      for (const cell of headerCells) {
        if (cellCount >= this.MAX_TABLE_CELLS) break
        const text = (cell.textContent?.trim() || '').substring(0, 200)
        headers.push(text)
        cellCount++
      }

      // 提取数据行
      const dataRows = table.querySelectorAll('tbody tr, tr')
      let rowIndex = 0
      for (const row of dataRows) {
        if (cellCount >= this.MAX_TABLE_CELLS) {
          console.warn(`⚠️ 表格单元格数量超限，停止处理`)
          break
        }

        // 跳过表头行
        if (rowIndex === 0 && headerCells.length > 0) {
          rowIndex++
          continue
        }

        const cells = row.querySelectorAll('td, th')
        const rowData: string[] = []
        for (const cell of cells) {
          if (cellCount >= this.MAX_TABLE_CELLS) break
          const text = (cell.textContent?.trim() || '').substring(0, 200)
          rowData.push(text)
          cellCount++
        }

        if (rowData.length > 0) {
          rows.push(rowData)
        }
        rowIndex++
      }

      // 查找表格标题
      let caption = ''
      const captionElement = table.querySelector('caption')
      if (captionElement) {
        caption = (captionElement.textContent?.trim() || '').substring(0, 200)
      }

      if (headers.length > 0 || rows.length > 0) {
        tables.push({ headers, rows, caption })
        processedCount++
      }
    }

    return tables
  }

  /**
   * 提取列表信息
   */
  private extractLists(): ListInfo[] {
    const lists: ListInfo[] = []
    const listElements = this.document.querySelectorAll('ul, ol')
    let processedCount = 0

    for (const list of listElements) {
      if (processedCount >= this.MAX_LISTS) {
        console.warn(`⚠️ 列表数量超限，只处理前 ${this.MAX_LISTS} 个`)
        break
      }

      const items: string[] = []
      const listItems = list.querySelectorAll('li')
      let itemCount = 0

      for (const item of listItems) {
        if (itemCount >= this.MAX_LIST_ITEMS) {
          console.warn(`⚠️ 列表项数量超限，只处理前 ${this.MAX_LIST_ITEMS} 项`)
          break
        }

        const text = (item.textContent?.trim() || '').substring(0, 300)
        if (text) {
          items.push(text)
          itemCount++
        }
      }

      if (items.length > 0) {
        const listInfo: ListInfo = {
          type: list.tagName.toLowerCase() === 'ol' ? 'ordered' : 'unordered',
          items,
        }

        // 查找列表标题
        const prevElement = list.previousElementSibling
        if (prevElement && /^h[1-6]$/i.test(prevElement.tagName)) {
          listInfo.title = (prevElement.textContent?.trim() || '').substring(0, 200)
        }

        lists.push(listInfo)
        processedCount++
      }
    }

    return lists
  }

  /**
   * 估算内容大小（字节）
   */
  private estimateContentSize(content: ExtractedContent): number {
    let size = 0

    // 文本内容
    size += (content.title?.length || 0) * 2 // UTF-16
    size += (content.url?.length || 0) * 2
    size += (content.mainContent?.length || 0) * 2

    // 图片信息
    content.images.forEach((img) => {
      size += (img.src?.length || 0) * 2
      size += (img.alt?.length || 0) * 2
      size += (img.title?.length || 0) * 2
      size += (img.caption?.length || 0) * 2
      size += 32 // 数字字段
    })

    // 表格信息
    content.tables.forEach((table) => {
      table.headers.forEach((header) => (size += (header?.length || 0) * 2))
      table.rows.forEach((row) => {
        row.forEach((cell) => (size += (cell?.length || 0) * 2))
      })
      size += (table.caption?.length || 0) * 2
    })

    // 列表信息
    content.lists.forEach((list) => {
      list.items.forEach((item) => (size += (item?.length || 0) * 2))
      size += (list.title?.length || 0) * 2
    })

    // 结构信息
    content.structure.headings.forEach((heading) => {
      size += (heading.text?.length || 0) * 2
      size += (heading.id?.length || 0) * 2
    })

    content.structure.sections.forEach((section) => {
      size += (section.title?.length || 0) * 2
      size += (section.content?.length || 0) * 2
    })

    // 元数据
    const metadata = content.metadata
    size += (metadata.description?.length || 0) * 2
    size += (metadata.keywords?.length || 0) * 2
    size += (metadata.author?.length || 0) * 2
    size += (metadata.publishDate?.length || 0) * 2
    size += (metadata.language?.length || 0) * 2

    return size
  }

  /**
   * 压缩内容以减少内存使用
   */
  private compressContent(content: ExtractedContent): ExtractedContent {
    console.log('🗜️ 开始压缩内容')

    const compressed: ExtractedContent = {
      ...content,
      // 压缩主要内容
      mainContent:
        content.mainContent.length > this.MAX_TEXT_LENGTH / 2
          ? content.mainContent.substring(0, this.MAX_TEXT_LENGTH / 2) + '\n\n[内容已压缩]'
          : content.mainContent,

      // 减少图片数量
      images: content.images.slice(0, Math.floor(this.MAX_IMAGES / 2)),

      // 减少表格数量和大小
      tables: content.tables.slice(0, Math.floor(this.MAX_TABLES / 2)).map((table) => ({
        ...table,
        headers: table.headers.slice(0, 10),
        rows: table.rows.slice(0, 20).map((row) => row.slice(0, 10)),
      })),

      // 减少列表数量和项目
      lists: content.lists.slice(0, Math.floor(this.MAX_LISTS / 2)).map((list) => ({
        ...list,
        items: list.items.slice(0, Math.floor(this.MAX_LIST_ITEMS / 2)),
      })),

      // 压缩结构信息
      structure: {
        headings: content.structure.headings.slice(0, Math.floor(this.MAX_HEADINGS / 2)),
        sections: content.structure.sections
          .slice(0, Math.floor(this.MAX_SECTIONS / 2))
          .map((section) => ({
            ...section,
            content:
              section.content.length > 500
                ? section.content.substring(0, 500) + '...'
                : section.content,
          })),
      },
    }

    const originalSize = this.estimateContentSize(content)
    const compressedSize = this.estimateContentSize(compressed)
    const compressionRatio = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)

    console.log(
      `🗜️ 内容压缩完成，压缩率: ${compressionRatio}% (${(originalSize / 1024).toFixed(2)}KB → ${(compressedSize / 1024).toFixed(2)}KB)`
    )

    return compressed
  }

  /**
   * 提取页面元数据
   */
  private extractMetadata(): PageMetadata {
    const metadata: PageMetadata = {
      wordCount: 0,
      readingTime: 0,
    }

    // 描述
    const description = this.document.querySelector('meta[name="description"]')
    if (description) {
      metadata.description = description.getAttribute('content')?.trim()
    }

    // 关键词
    const keywords = this.document.querySelector('meta[name="keywords"]')
    if (keywords) {
      metadata.keywords = keywords.getAttribute('content')?.trim()
    }

    // 作者
    const author = this.document.querySelector('meta[name="author"]')
    if (author) {
      metadata.author = author.getAttribute('content')?.trim()
    }

    // 语言
    metadata.language = this.document.documentElement.lang || 'zh-CN'

    // 计算字数和阅读时间
    const mainContent = this.extractMainContent()
    metadata.wordCount = this.countWords(mainContent)
    metadata.readingTime = Math.ceil(metadata.wordCount / 200) // 假设每分钟阅读 200 字

    return metadata
  }

  /**
   * 提取页面结构
   */
  private extractStructure(): PageStructure {
    const headings: HeadingInfo[] = []
    const sections: SectionInfo[] = []

    // 提取标题
    const headingElements = this.document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headingElements.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1))
      const text = heading.textContent?.trim()
      if (text) {
        headings.push({
          level,
          text,
          id: heading.id,
        })
      }
    })

    // 基于标题创建章节
    let currentSection: SectionInfo | null = null
    headingElements.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))
      const title = heading.textContent?.trim() || ''

      if (level <= 2) {
        // 新的主要章节
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = {
          title,
          content: '',
          level,
        }
      }

      // 收集章节内容
      if (currentSection) {
        const nextHeading = headingElements[index + 1]
        let element = heading.nextElementSibling

        while (element && element !== nextHeading) {
          if (!this.isExcludedElement(element)) {
            const text = element.textContent?.trim()
            if (text) {
              currentSection.content += text + '\n'
            }
          }
          element = element.nextElementSibling
        }
      }
    })

    if (currentSection) {
      sections.push(currentSection)
    }

    return { headings, sections }
  }

  /**
   * 检查元素是否应该被排除
   */
  private isExcludedElement(element: Element): boolean {
    return this.excludeSelectors.some((selector) => {
      try {
        return element.matches(selector)
      } catch {
        return false
      }
    })
  }

  /**
   * 计算文本字数
   */
  private countWords(text: string): number {
    // 中文字符按字计算，英文按单词计算
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 0).length

    return chineseChars + englishWords
  }
}

/**
 * 创建内容提取器实例
 */
export function createContentExtractor(document: Document): ContentExtractor {
  return new ContentExtractor(document)
}
