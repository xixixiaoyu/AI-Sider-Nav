import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  theme: {
    colors: {
      primary: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6', // 主色调 - 青绿色
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
      },
      secondary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
      'slide-up': 'slideUp 0.3s ease-out',
      'bounce-in': 'bounceIn 0.6s ease-out',
    },
  },
  shortcuts: {
    // 常用组合样式
    'btn-primary':
      'bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors',
    card: 'bg-white rounded-lg shadow-md p-4',
    'input-field':
      'border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500',
  },
  rules: [
    // 自定义规则
    ['text-shadow-sm', { 'text-shadow': '0 1px 2px rgba(0, 0, 0, 0.1)' }],
    ['text-shadow', { 'text-shadow': '0 2px 4px rgba(0, 0, 0, 0.3)' }],
    ['text-shadow-lg', { 'text-shadow': '0 4px 8px rgba(0, 0, 0, 0.5)' }],
    ['backdrop-blur-sm', { 'backdrop-filter': 'blur(4px)' }],
    ['backdrop-blur', { 'backdrop-filter': 'blur(8px)' }],
    ['backdrop-blur-lg', { 'backdrop-filter': 'blur(16px)' }],
  ],
  safelist: [
    // 确保这些类不会被清除
    'text-shadow',
    'backdrop-blur',
    'bg-primary-500',
    'text-white',
  ],
})
