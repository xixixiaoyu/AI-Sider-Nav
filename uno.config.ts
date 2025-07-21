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
      // 轻快动画 - 更短的持续时间和流畅的缓动
      'fade-in': 'fadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'fade-in-fast': 'fadeIn 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'slide-up': 'slideUp 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'slide-down': 'slideDown 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'slide-left': 'slideLeft 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'slide-right': 'slideRight 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'bounce-in': 'bounceIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      'zoom-in': 'zoomIn 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'zoom-in-fast': 'zoomIn 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      pulse: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      float: 'float 2s ease-in-out infinite',
      'float-slow': 'float 3s ease-in-out infinite',
      shake: 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
      spin: 'spin 1s linear infinite',
      'spin-fast': 'spin 0.5s linear infinite',
      'spin-slow': 'spin 2s linear infinite',
    },

    // 轻快的过渡时间
    transitionDuration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },

    // 优化的缓动函数
    transitionTimingFunction: {
      'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      'ease-in-out-circ': 'cubic-bezier(0.85, 0, 0.15, 1)',
      'ease-spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  shortcuts: {
    // 常用组合样式
    'btn-primary':
      'bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-fast hover:scale-105 active:scale-95 gpu-accelerated',
    'btn-secondary':
      'bg-secondary-200 hover:bg-secondary-300 text-secondary-800 px-4 py-2 rounded-lg transition-fast hover:scale-105 active:scale-95 gpu-accelerated',
    card: 'bg-white rounded-lg shadow-md p-4 transition-smooth hover:shadow-lg hover:-translate-y-1 gpu-accelerated',
    'card-interactive':
      'bg-white rounded-lg shadow-md p-4 transition-bounce hover:shadow-xl hover:-translate-y-2 hover:scale-102 cursor-pointer gpu-accelerated',
    'input-field':
      'border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-fast focus:scale-102 gpu-accelerated',

    // 轻快动画组合
    'animate-enter': 'animate-fade-in animate-slide-up',
    'animate-enter-fast': 'animate-fade-in-fast animate-zoom-in-fast',
    'animate-hover': 'transition-fast hover:scale-105 hover:-translate-y-1',
    'animate-hover-bounce': 'transition-bounce hover:scale-110 hover:-translate-y-2',
    'animate-click': 'transition-fast active:scale-95',

    // 性能优化组合
    'smooth-transform': 'transition-fast will-change-transform gpu-accelerated',
    'smooth-opacity': 'transition-fast will-change-opacity',
    'smooth-all': 'transition-smooth will-change-auto gpu-accelerated',
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
