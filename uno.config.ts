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
    'btn': 'px-4 py-2 rounded bg-teal-500 text-white hover:bg-teal-600 transition-colors cursor-pointer',
    'btn-secondary': 'px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors cursor-pointer',
    'input': 'px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500',
    'card': 'bg-white rounded-lg shadow-md p-4',
    'sidebar-item': 'flex items-center px-3 py-2 rounded-md hover:bg-teal-50 cursor-pointer transition-colors'
  },
  theme: {
    colors: {
      primary: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#79b4a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a'
      },
      teal: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#79b4a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a'
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
