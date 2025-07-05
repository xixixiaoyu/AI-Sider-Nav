// AI 分析服务

/**
 * 分析用户消息意图
 */
export function analyzeUserIntent(message: string): {
  intent: 'question' | 'general' | 'help'
  confidence: number
  keywords: string[]
} {
  const lowerMessage = message.toLowerCase()

  const questionKeywords = ['什么', '如何', '为什么', '怎么', '?', '？']
  const helpKeywords = ['帮助', 'help', '不知道', '不会', '教我']

  let intent: 'question' | 'general' | 'help' = 'general'
  let confidence = 0.5
  const foundKeywords: string[] = []

  // 检查问题关键词
  const questionMatches = questionKeywords.filter((keyword) => lowerMessage.includes(keyword))
  if (questionMatches.length > 0) {
    intent = 'question'
    confidence = Math.min(0.8, 0.5 + questionMatches.length * 0.1)
    foundKeywords.push(...questionMatches)
  }

  // 检查帮助关键词
  const helpMatches = helpKeywords.filter((keyword) => lowerMessage.includes(keyword))
  if (helpMatches.length > 0) {
    intent = 'help'
    confidence = Math.max(confidence, Math.min(0.9, 0.7 + helpMatches.length * 0.1))
    foundKeywords.push(...helpMatches)
  }

  return {
    intent,
    confidence,
    keywords: foundKeywords,
  }
}

/**
 * 生成对话标题
 */
export function generateChatTitle(firstMessage: string): string {
  // 简单的标题生成逻辑
  const cleanMessage = firstMessage.trim().slice(0, 30)

  if (cleanMessage.length < firstMessage.trim().length) {
    return cleanMessage + '...'
  }

  return cleanMessage || '新对话'
}

/**
 * 格式化消息内容
 */
export function formatMessageContent(content: string): string {
  // 基本的 Markdown 格式化
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

/**
 * 检查消息是否包含敏感内容
 */
export function checkSensitiveContent(message: string): {
  isSafe: boolean
  reason?: string
} {
  // 简单的敏感内容检查
  const sensitivePatterns = [
    /密码|password/i,
    /身份证|id card/i,
    /银行卡|bank card/i,
    /信用卡|credit card/i,
  ]

  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return {
        isSafe: false,
        reason: '消息可能包含敏感信息',
      }
    }
  }

  return { isSafe: true }
}
