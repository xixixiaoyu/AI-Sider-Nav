// AI 配置服务

const DEFAULT_MODEL = 'deepseek-chat'
const DEFAULT_API_KEY_STORAGE_KEY = 'deepseek_api_key'
const DEFAULT_MODEL_STORAGE_KEY = 'deepseek_model'

/**
 * 获取 API Key
 */
export function getApiKey(): string | null {
  try {
    // 优先从环境变量获取
    if (import.meta.env.VITE_DEEPSEEK_API_KEY) {
      return import.meta.env.VITE_DEEPSEEK_API_KEY
    }

    // 从 localStorage 获取
    const apiKey = localStorage.getItem(DEFAULT_API_KEY_STORAGE_KEY)
    return apiKey
  } catch (error) {
    console.error('获取 API Key 失败:', error)
    return null
  }
}

/**
 * 设置 API Key
 */
export function setApiKey(apiKey: string): void {
  try {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem(DEFAULT_API_KEY_STORAGE_KEY, apiKey.trim())
    } else {
      // 如果 API Key 为空，则从 localStorage 中删除
      localStorage.removeItem(DEFAULT_API_KEY_STORAGE_KEY)
    }
  } catch (error) {
    console.error('设置 API Key 失败:', error)
  }
}

/**
 * 删除 API Key
 */
export function removeApiKey(): void {
  try {
    localStorage.removeItem(DEFAULT_API_KEY_STORAGE_KEY)
  } catch (error) {
    console.error('删除 API Key 失败:', error)
  }
}

/**
 * 获取 AI 模型
 */
export function getAIModel(): string {
  try {
    // 优先从环境变量获取
    if (import.meta.env.VITE_DEEPSEEK_MODEL) {
      return import.meta.env.VITE_DEEPSEEK_MODEL
    }

    // 从 localStorage 获取
    const model = localStorage.getItem(DEFAULT_MODEL_STORAGE_KEY)
    return model || DEFAULT_MODEL
  } catch (error) {
    console.error('获取 AI 模型失败:', error)
    return DEFAULT_MODEL
  }
}

/**
 * 设置 AI 模型
 */
export function setAIModel(model: string): void {
  try {
    localStorage.setItem(DEFAULT_MODEL_STORAGE_KEY, model)
  } catch (error) {
    console.error('设置 AI 模型失败:', error)
  }
}

/**
 * 验证 API Key 是否有效
 */
export async function validateApiKey(apiKey?: string): Promise<boolean> {
  const keyToValidate = apiKey || getApiKey()
  if (!keyToValidate) {
    return false
  }

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${keyToValidate}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getAIModel(),
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      }),
    })

    return response.status !== 401
  } catch (error) {
    console.error('验证 API Key 失败:', error)
    return false
  }
}

/**
 * 获取配置摘要
 */
export function getConfigSummary() {
  return {
    hasApiKey: !!getApiKey(),
    model: getAIModel(),
    timestamp: Date.now(),
  }
}
