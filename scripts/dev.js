import { createServer } from 'vite'
import { resolve } from 'path'
import fs from 'fs'
import chokidar from 'chokidar'

const __dirname = new URL('.', import.meta.url).pathname

async function startDevServer() {
  console.log('🚀 启动开发服务器...')
  
  try {
    // 创建 Vite 开发服务器
    const server = await createServer({
      // 开发服务器配置
      server: {
        port: 3000,
        open: false
      }
    })
    
    await server.listen()
    
    console.log('✅ 开发服务器已启动')
    console.log('🌐 访问地址: http://localhost:3000')
    
    // 监听文件变化
    watchFiles()
    
    // 显示开发提示
    showDevTips()
    
  } catch (error) {
    console.error('❌ 启动失败:', error)
    process.exit(1)
  }
}

function watchFiles() {
  console.log('👀 监听文件变化...')
  
  // 监听 manifest.json 变化
  const manifestPath = resolve(__dirname, '../src/manifest.json')
  chokidar.watch(manifestPath).on('change', () => {
    console.log('📝 manifest.json 已更新，请重新加载插件')
  })
  
  // 监听内容脚本变化
  const contentScriptPath = resolve(__dirname, '../src/content-script')
  chokidar.watch(contentScriptPath).on('change', () => {
    console.log('🔄 内容脚本已更新，请刷新页面')
  })
  
  // 监听后台脚本变化
  const backgroundPath = resolve(__dirname, '../src/background')
  chokidar.watch(backgroundPath).on('change', () => {
    console.log('⚡ 后台脚本已更新，请重新加载插件')
  })
}

function showDevTips() {
  console.log('\n📋 开发提示:')
  console.log('1. 在 Chrome 中打开 chrome://extensions/')
  console.log('2. 启用"开发者模式"')
  console.log('3. 点击"加载已解压的扩展程序"')
  console.log('4. 选择项目的 dist 目录')
  console.log('5. 修改代码后，刷新页面或重新加载插件')
  console.log('\n🔧 有用的命令:')
  console.log('- npm run build: 构建生产版本')
  console.log('- npm run test: 运行测试')
  console.log('- npm run lint: 检查代码规范')
  console.log('')
}

// 启动开发服务器
startDevServer()
