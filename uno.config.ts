import { defineConfig, presetUno, presetIcons, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
        mdi: () => import('@iconify-json/mdi/icons.json').then(i => i.default),
      }
    })
  ],
  shortcuts: {
    'btn': 'px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer',
    'btn-secondary': 'px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors cursor-pointer',
    'input': 'px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
    'card': 'bg-white rounded-lg shadow-md p-4',
    'sidebar-item': 'flex items-center px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors'
  },
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8'
      }
    }
  },
  safelist: [
    'i-carbon-search',
    'i-carbon-chat',
    'i-carbon-copy',
    'i-carbon-close',
    'i-carbon-menu',
    'i-mdi-google',
    'i-mdi-microsoft-bing'
  ]
})
