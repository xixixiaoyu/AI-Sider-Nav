// 简单的日志工具

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  source?: string
  timestamp: number
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private enableConsole = true

  constructor() {
    // 在开发环境启用控制台输出
    this.enableConsole = import.meta.env.DEV
  }

  private addLog(level: LogLevel, message: string, data?: any, source?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      source,
      timestamp: Date.now(),
    }

    this.logs.push(entry)

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // 控制台输出
    if (this.enableConsole) {
      const prefix = source ? `[${source}]` : ''
      const logMessage = `${prefix} ${message}`

      switch (level) {
        case 'debug':
          console.debug(logMessage, data)
          break
        case 'info':
          console.info(logMessage, data)
          break
        case 'warn':
          console.warn(logMessage, data)
          break
        case 'error':
          console.error(logMessage, data)
          break
      }
    }
  }

  debug(message: string, data?: any, source?: string) {
    this.addLog('debug', message, data, source)
  }

  info(message: string, data?: any, source?: string) {
    this.addLog('info', message, data, source)
  }

  warn(message: string, data?: any, source?: string) {
    this.addLog('warn', message, data, source)
  }

  error(message: string, data?: any, source?: string) {
    this.addLog('error', message, data, source)
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level)
    }
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  setConsoleEnabled(enabled: boolean) {
    this.enableConsole = enabled
  }
}

// 导出单例实例
export const logger = new Logger()

// 导出便捷方法
export const log = {
  debug: (message: string, data?: any, source?: string) => logger.debug(message, data, source),
  info: (message: string, data?: any, source?: string) => logger.info(message, data, source),
  warn: (message: string, data?: any, source?: string) => logger.warn(message, data, source),
  error: (message: string, data?: any, source?: string) => logger.error(message, data, source),
}
