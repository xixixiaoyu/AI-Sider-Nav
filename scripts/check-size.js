import fs from 'fs'
import { resolve } from 'path'

const __dirname = new URL('.', import.meta.url).pathname

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getDirectorySize(dirPath) {
  let totalSize = 0
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath)
    
    if (stats.isFile()) {
      totalSize += stats.size
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath)
      files.forEach(file => {
        calculateSize(resolve(currentPath, file))
      })
    }
  }
  
  if (fs.existsSync(dirPath)) {
    calculateSize(dirPath)
  }
  
  return totalSize
}

function checkExtensionSize() {
  console.log('📏 检查插件大小...')
  
  const distPath = resolve(__dirname, '../dist')
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ dist 目录不存在，请先运行构建')
    process.exit(1)
  }
  
  const totalSize = getDirectorySize(distPath)
  const maxSize = 128 * 1024 * 1024 // 128MB Chrome Web Store 限制
  
  console.log(`📦 插件总大小: ${formatBytes(totalSize)}`)
  console.log(`📊 Chrome Web Store 限制: ${formatBytes(maxSize)}`)
  
  if (totalSize > maxSize) {
    console.error('❌ 插件大小超过 Chrome Web Store 限制！')
    process.exit(1)
  }
  
  // 检查各个组件的大小
  const components = [
    { name: 'Popup', path: 'popup' },
    { name: 'Sidebar', path: 'sidebar' },
    { name: 'Options', path: 'options' },
    { name: 'Content Script', path: 'content-script.js' },
    { name: 'Background Script', path: 'background.js' },
    { name: 'Assets', path: 'assets' },
    { name: 'Icons', path: 'icons' }
  ]
  
  console.log('\n📋 组件大小详情:')
  
  components.forEach(component => {
    const componentPath = resolve(distPath, component.path)
    if (fs.existsSync(componentPath)) {
      const size = getDirectorySize(componentPath)
      console.log(`${component.name}: ${formatBytes(size)}`)
      
      // 警告大文件
      if (size > 1024 * 1024) { // 1MB
        console.warn(`⚠️  ${component.name} 文件较大，考虑优化`)
      }
    }
  })
  
  // 检查是否有未压缩的大文件
  function checkLargeFiles(dirPath, prefix = '') {
    const files = fs.readdirSync(dirPath)
    
    files.forEach(file => {
      const filePath = resolve(dirPath, file)
      const stats = fs.statSync(filePath)
      
      if (stats.isFile()) {
        if (stats.size > 500 * 1024) { // 500KB
          console.warn(`⚠️  大文件: ${prefix}${file} (${formatBytes(stats.size)})`)
        }
      } else if (stats.isDirectory()) {
        checkLargeFiles(filePath, `${prefix}${file}/`)
      }
    })
  }
  
  console.log('\n🔍 检查大文件:')
  checkLargeFiles(distPath)
  
  // 性能建议
  console.log('\n💡 优化建议:')
  console.log('- 压缩图片资源')
  console.log('- 移除未使用的依赖')
  console.log('- 启用代码分割')
  console.log('- 使用 Tree Shaking')
  
  const percentage = (totalSize / maxSize * 100).toFixed(1)
  console.log(`\n✅ 大小检查完成 (使用了 ${percentage}% 的限制)`)
}

// 运行检查
checkExtensionSize()
