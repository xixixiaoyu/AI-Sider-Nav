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
    return {
      title: this.extractTitle(),
      url: this.document.location?.href || '',
      mainContent: this.extractMainContent(),
      images: this.extractImages(),
      tables: this.extractTables(),
      lists: this.extractLists(),
      metadata: this.extractMetadata(),
      structure: this.extractStructure(),
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

    return this.extractTextFromElement(mainElement)
  }

  /**
   * 从元素中提取文本内容
   */
  private extractTextFromElement(element: Element): string {
    if (!element) return ''

    // 克隆元素以避免修改原始 DOM
    const clone = element.cloneNode(true) as Element

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
  }

  /**
   * 处理特殊元素（如换行、段落等）
   */
  private processSpecialElements(element: Element): void {
    // 为块级元素添加换行
    const blockElements = element.querySelectorAll(
      'p, div, h1, h2, h3, h4, h5, h6, li, br, hr'
    )
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

    imgElements.forEach((img) => {
      const src = img.src
      if (!src || src.startsWith('data:')) return // 跳过 base64 图片

      const imageInfo: ImageInfo = {
        src,
        alt: img.alt || '',
        title: img.title,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      }

      // 查找图片说明
      const figure = img.closest('figure')
      if (figure) {
        const figcaption = figure.querySelector('figcaption')
        if (figcaption) {
          imageInfo.caption = figcaption.textContent?.trim()
        }
      }

      images.push(imageInfo)
    })

    return images
  }

  /**
   * 提取表格信息
   */
  private extractTables(): TableInfo[] {
    const tables: TableInfo[] = []
    const tableElements = this.document.querySelectorAll('table')

    tableElements.forEach((table) => {
      const headers: string[] = []
      const rows: string[][] = []

      // 提取表头
      const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th')
      headerCells.forEach((cell) => {
        headers.push(cell.textContent?.trim() || '')
      })

      // 提取数据行
      const dataRows = table.querySelectorAll('tbody tr, tr')
      dataRows.forEach((row, index) => {
        // 跳过表头行
        if (index === 0 && headerCells.length > 0) return

        const cells = row.querySelectorAll('td, th')
        const rowData: string[] = []
        cells.forEach((cell) => {
          rowData.push(cell.textContent?.trim() || '')
        })
        if (rowData.length > 0) {
          rows.push(rowData)
        }
      })

      // 查找表格标题
      let caption = ''
      const captionElement = table.querySelector('caption')
      if (captionElement) {
        caption = captionElement.textContent?.trim() || ''
      }

      if (headers.length > 0 || rows.length > 0) {
        tables.push({ headers, rows, caption })
      }
    })

    return tables
  }

  /**
   * 提取列表信息
   */
  private extractLists(): ListInfo[] {
    const lists: ListInfo[] = []
    const listElements = this.document.querySelectorAll('ul, ol')

    listElements.forEach((list) => {
      const items: string[] = []
      const listItems = list.querySelectorAll('li')

      listItems.forEach((item) => {
        const text = item.textContent?.trim()
        if (text) {
          items.push(text)
        }
      })

      if (items.length > 0) {
        const listInfo: ListInfo = {
          type: list.tagName.toLowerCase() === 'ol' ? 'ordered' : 'unordered',
          items,
        }

        // 查找列表标题
        const prevElement = list.previousElementSibling
        if (prevElement && /^h[1-6]$/i.test(prevElement.tagName)) {
          listInfo.title = prevElement.textContent?.trim()
        }

        lists.push(listInfo)
      }
    })

    return lists
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
        let nextHeading = headingElements[index + 1]
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
