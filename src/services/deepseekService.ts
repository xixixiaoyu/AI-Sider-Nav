import i18n from '../i18n'
import { logger } from '../utils/logger'
import { getAIModel, getApiKey } from './configService'
import { AIStreamResponse, Message, SystemPrompt } from '../types'

// 获取系统提示词配置
const getSystemPromptConfig = () => {
  try {
    const config = localStorage.getItem('system_prompt_config')
    if (config) {
      const parsedConfig = JSON.parse(config)
      return {
        enabled: parsedConfig.enabled || false,
        activePromptId: parsedConfig.activePromptId || null,
      }
    }
  } catch (error) {
    logger.warn('获取系统提示词配置失败', error, 'DeepSeekService')
  }
  return {
    enabled: false,
    activePromptId: null,
  }
}

// 获取所有激活的系统提示词消息
const getSystemMessages = async (): Promise<Message[]> => {
  const systemMessages: Message[] = []

  // 1. 获取用户自定义的系统提示词
  const config = getSystemPromptConfig()
  if (config.enabled && config.activePromptId) {
    try {
      const prompts = localStorage.getItem('system_prompts')
      if (prompts) {
        const promptList = JSON.parse(prompts)
        const activePrompt = promptList.find(
          (p: SystemPrompt) => p.id === config.activePromptId && p.isActive
        )
        if (activePrompt && activePrompt.content.trim()) {
          systemMessages.push({
            role: 'system',
            content: activePrompt.content.trim(),
          })
          logger.debug(
            '添加用户自定义系统提示词',
            {
              name: activePrompt.name,
              contentLength: activePrompt.content.length,
            },
            'DeepSeekService'
          )
        }
      }
    } catch (error) {
      logger.warn('获取用户系统提示词失败', error, 'DeepSeekService')
    }
  }

  logger.debug(
    '系统消息构建完成',
    {
      totalSystemMessages: systemMessages.length,
      messages: systemMessages.map((msg) => ({
        role: msg.role,
        contentLength: msg.content.length,
      })),
    },
    'DeepSeekService'
  )

  return systemMessages
}

// 错误处理函数
function handleError(error: unknown, context: string, source: string) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  logger.error(`${context}: ${errorMessage}`, error, source)
}

const API_URL = 'https://api.deepseek.com/chat/completions'

// 请求管理器
class RequestManager {
  private activeRequests = new Map<string, AbortController>()
  // private requestQueue: Array<{ id: string; request: () => Promise<any> }> = []
  // private maxConcurrentRequests = 3
  // private activeRequestCount = 0

  // 创建新的请求控制器
  createRequest(id: string): AbortController {
    // 取消同类型的旧请求
    this.abortRequest(id)

    const controller = new AbortController()
    this.activeRequests.set(id, controller)
    return controller
  }

  // 取消特定请求
  abortRequest(id: string) {
    const controller = this.activeRequests.get(id)
    if (controller) {
      controller.abort()
      this.activeRequests.delete(id)
    }
  }

  // 取消所有请求
  abortAllRequests() {
    this.activeRequests.forEach((controller) => {
      controller.abort()
    })
    this.activeRequests.clear()
  }

  // 清理完成的请求
  cleanupRequest(id: string) {
    this.activeRequests.delete(id)
  }

  // 获取活跃请求数量
  getActiveRequestCount(): number {
    return this.activeRequests.size
  }
}

const requestManager = new RequestManager()

export function abortCurrentRequest() {
  requestManager.abortAllRequests()
}

const getHeaders = async () => {
  const apiKey = await getApiKey()
  if (!apiKey) {
    throw new Error(i18n.global.t('configureApiKey'))
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

export async function getAIStreamResponse(
  messages: Message[],
  onChunk: (chunk: string) => void,
  onThinking?: (thinking: string) => void,
  temperature = 0.3
): Promise<void> {
  let buffer = ''
  let isReading = true
  const requestId = `stream-${Date.now()}`

  // Buffer 管理配置
  const MAX_BUFFER_SIZE = 1024 * 1024 // 1MB
  const BUFFER_WARNING_SIZE = 512 * 1024 // 512KB
  let bufferOverflowCount = 0

  // 创建可复用的 TextDecoder
  const decoder = new TextDecoder()

  try {
    const abortController = requestManager.createRequest(requestId)
    const signal = abortController.signal

    // 构建包含所有系统提示词的消息列表
    const systemMessages = await getSystemMessages()
    const messagesWithSystemPrompts: Message[] = [...systemMessages, ...messages]

    logger.debug(
      '构建完整消息列表',
      {
        systemMessagesCount: systemMessages.length,
        userMessagesCount: messages.length,
        totalMessages: messagesWithSystemPrompts.length,
      },
      'DeepSeekService'
    )

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        model: await getAIModel(),
        messages: messagesWithSystemPrompts,
        temperature,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error(i18n.global.t('httpError', { status: response.status }))
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error(i18n.global.t('streamError'))
    }

    while (isReading) {
      const { done, value } = await reader.read()
      if (done) {
        isReading = false
        break
      }

      // 使用可复用的 decoder
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // 检查 buffer 大小，防止内存过度使用
      if (buffer.length > MAX_BUFFER_SIZE) {
        bufferOverflowCount++
        console.warn(
          `Stream buffer 超过限制 (${Math.round(buffer.length / 1024)}KB)，执行部分处理 (第${bufferOverflowCount}次)`
        )

        // 处理当前 buffer 的前半部分，保留后半部分
        const midPoint = Math.floor(buffer.length / 2)
        const lastNewlineIndex = buffer.lastIndexOf('\n', midPoint)
        const processPoint = lastNewlineIndex > 0 ? lastNewlineIndex : midPoint

        const bufferToProcess = buffer.substring(0, processPoint)
        buffer = buffer.substring(processPoint)

        // 处理截取的部分
        const lines = bufferToProcess.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            processStreamLine(line, onChunk, onThinking)
          }
        }

        // 如果 buffer 仍然过大，强制清理
        if (buffer.length > BUFFER_WARNING_SIZE) {
          console.warn('Buffer 仍然过大，强制重置')
          buffer = ''
        }

        continue
      }

      // 正常处理逻辑
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const result = processStreamLine(line, onChunk, onThinking)
          if (result === 'DONE') {
            isReading = false
            requestManager.cleanupRequest(requestId)
            return
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn(i18n.global.t('requestAborted'), error, 'DeepSeekService')
      onChunk('[ABORTED]')
    } else {
      handleError(error, i18n.global.t('aiResponseError'), 'DeepSeekService')
      throw error
    }
  } finally {
    // 确保清理
    buffer = ''
    requestManager.cleanupRequest(requestId)

    if (bufferOverflowCount > 0) {
      console.log(`流式响应完成，共处理了 ${bufferOverflowCount} 次 buffer 溢出`)
    }
  }
}

// 提取流式数据处理逻辑，减少重复代码
function processStreamLine(
  line: string,
  onChunk: (chunk: string) => void,
  onThinking?: (thinking: string) => void
): 'DONE' | 'CONTINUE' {
  const jsonData = line.slice(6)
  if (jsonData === '[DONE]') {
    onChunk('[DONE]')
    return 'DONE'
  }

  try {
    const parsedData: AIStreamResponse = JSON.parse(jsonData)
    const content = parsedData.choices[0]?.delta?.content
    const reasoningContent = parsedData.choices[0]?.delta?.reasoning_content

    if (content) {
      onChunk(content)
    }

    if (reasoningContent && onThinking) {
      onThinking(reasoningContent)
    }
  } catch (error) {
    handleError(error, i18n.global.t('jsonParseError'), 'DeepSeekService')
  }

  return 'CONTINUE'
}

export async function getAIResponse(userMessage: string, temperature = 0.3): Promise<string> {
  try {
    // 构建包含所有系统提示词的消息列表
    const systemMessages = await getSystemMessages()
    const userMessages = [
      {
        role: 'user' as const,
        content: userMessage,
      },
    ]

    const messages = [...systemMessages, ...userMessages]

    logger.debug(
      '构建 AI 响应消息列表',
      {
        systemMessagesCount: systemMessages.length,
        userMessagesCount: userMessages.length,
        totalMessages: messages.length,
      },
      'DeepSeekService'
    )

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        model: await getAIModel(),
        messages,
        temperature,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(i18n.global.t('httpError', { status: response.status }))
    }

    const data = await response.json()

    if (data && data.choices && data.choices.length > 0) {
      return data.choices[0].message?.content || ''
    } else {
      throw new Error(i18n.global.t('invalidAiResponse'))
    }
  } catch (error) {
    handleError(error, i18n.global.t('aiResponseError'), 'DeepSeekService')
    if (error instanceof Error) {
      if (error.message === i18n.global.t('configureApiKey')) {
        throw error
      } else if (error.message.startsWith('HTTP 错误')) {
        throw new Error(i18n.global.t('apiError', { error: error.message }))
      } else if (error.message === i18n.global.t('invalidAiResponse')) {
        throw error
      } else {
        throw new Error(i18n.global.t('networkConnectionError'))
      }
    }
    throw new Error(i18n.global.t('unknownError'))
  }
}

export async function optimizeText(text: string): Promise<string> {
  try {
    // 文本优化使用专门的系统提示词，不受用户自定义系统提示词影响
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        model: await getAIModel(),
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的文本优化助手，擅长提升文本质量。请按以下要求优化文本：\n1. 使表达更自然流畅、逻辑清晰\n2. 修正语法错误和标点符号使用\n3. 保持原意的同时提升表达效果\n4. 确保语言风格一致且符合语境\n5. 直接返回优化后的文本，无需返回其他任何多余内容',
          },
          {
            role: 'user',
            content: `请优化文本：\n"${text}"`,
          },
        ],
        temperature: 0.3,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(i18n.global.t('httpError', { status: response.status }))
    }

    const data = await response.json()

    if (data && data.choices && data.choices.length > 0) {
      return data.choices[0].message?.content || ''
    } else {
      throw new Error(i18n.global.t('invalidAiResponse'))
    }
  } catch (error) {
    handleError(error, i18n.global.t('textOptimizationError'), 'DeepSeekService')
    throw error
  }
}
