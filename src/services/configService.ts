// AI 配置服务

const DEFAULT_MODEL = 'deepseek-chat'
const DEFAULT_API_KEY_STORAGE_KEY = 'deepseek_api_key'
const DEFAULT_MODEL_STORAGE_KEY = 'deepseek_model'

/**
 * 获取 API Key
 */
export async function getApiKey(): Promise<string | null> {
  try {
    // 优先从环境变量获取
    if (import.meta.env.VITE_DEEPSEEK_API_KEY) {
      return import.meta.env.VITE_DEEPSEEK_API_KEY
    }

    // 优先从 chrome.storage 获取（支持跨域访问）
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        const result = await chrome.storage.sync.get(DEFAULT_API_KEY_STORAGE_KEY)
        if (result[DEFAULT_API_KEY_STORAGE_KEY]) {
          return result[DEFAULT_API_KEY_STORAGE_KEY]
        }
      } catch (chromeError) {
        console.warn('从 chrome.storage 获取 API Key 失败，回退到 localStorage:', chromeError)
      }
    }

    // 回退到 localStorage
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
export async function setApiKey(apiKey: string): Promise<void> {
  try {
    const trimmedKey = apiKey?.trim() || ''

    // 优先保存到 chrome.storage（支持跨域访问）
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        if (trimmedKey) {
          await chrome.storage.sync.set({ [DEFAULT_API_KEY_STORAGE_KEY]: trimmedKey })
        } else {
          await chrome.storage.sync.remove(DEFAULT_API_KEY_STORAGE_KEY)
        }
      } catch (chromeError) {
        console.warn('保存到 chrome.storage 失败，回退到 localStorage:', chromeError)
      }
    }

    // 同时保存到 localStorage（兼容性）
    if (trimmedKey) {
      localStorage.setItem(DEFAULT_API_KEY_STORAGE_KEY, trimmedKey)
    } else {
      localStorage.removeItem(DEFAULT_API_KEY_STORAGE_KEY)
    }
  } catch (error) {
    console.error('设置 API Key 失败:', error)
  }
}

/**
 * 删除 API Key
 */
export async function removeApiKey(): Promise<void> {
  try {
    // 从 chrome.storage 删除
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        await chrome.storage.sync.remove(DEFAULT_API_KEY_STORAGE_KEY)
      } catch (chromeError) {
        console.warn('从 chrome.storage 删除失败:', chromeError)
      }
    }

    // 从 localStorage 删除
    localStorage.removeItem(DEFAULT_API_KEY_STORAGE_KEY)
  } catch (error) {
    console.error('删除 API Key 失败:', error)
  }
}

/**
 * 获取 AI 模型
 */
export async function getAIModel(): Promise<string> {
  try {
    // 优先从环境变量获取
    if (import.meta.env.VITE_DEEPSEEK_MODEL) {
      return import.meta.env.VITE_DEEPSEEK_MODEL
    }

    // 优先从 chrome.storage 获取
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        const result = await chrome.storage.sync.get(DEFAULT_MODEL_STORAGE_KEY)
        if (result[DEFAULT_MODEL_STORAGE_KEY]) {
          return result[DEFAULT_MODEL_STORAGE_KEY]
        }
      } catch (chromeError) {
        console.warn('从 chrome.storage 获取 AI 模型失败，回退到 localStorage:', chromeError)
      }
    }

    // 回退到 localStorage
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
export async function setAIModel(model: string): Promise<void> {
  try {
    // 优先保存到 chrome.storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        await chrome.storage.sync.set({ [DEFAULT_MODEL_STORAGE_KEY]: model })
      } catch (chromeError) {
        console.warn('保存到 chrome.storage 失败，回退到 localStorage:', chromeError)
      }
    }

    // 同时保存到 localStorage（兼容性）
    localStorage.setItem(DEFAULT_MODEL_STORAGE_KEY, model)
  } catch (error) {
    console.error('设置 AI 模型失败:', error)
  }
}

/**
 * 验证 API Key 是否有效
 */
export async function validateApiKey(apiKey?: string): Promise<boolean> {
  const keyToValidate = apiKey || (await getApiKey())
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
        model: await getAIModel(),
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
export async function getConfigSummary() {
  return {
    hasApiKey: !!(await getApiKey()),
    model: await getAIModel(),
    timestamp: Date.now(),
  }
}
