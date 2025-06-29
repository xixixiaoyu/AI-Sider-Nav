import { build } from 'vite'
import { resolve } from 'path'
import fs from 'fs'
import archiver from 'archiver'

const __dirname = new URL('.', import.meta.url).pathname

async function buildExtension() {
  console.log('🚀 开始构建浏览器插件...')
  
  try {
    // 构建项目
    await build()
    
    console.log('✅ 构建完成')
    
    // 复制必要的文件
    await copyAssets()
    
    // 创建插件包
    if (process.argv.includes('--zip')) {
      await createZipPackage()
    }
    
    console.log('🎉 插件构建完成！')
    console.log('📁 构建文件位于: dist/')
    
    if (process.argv.includes('--zip')) {
      console.log('📦 插件包已创建: ai-sider-nav.zip')
    }
    
  } catch (error) {
    console.error('❌ 构建失败:', error)
    process.exit(1)
  }
}

async function copyAssets() {
  console.log('📋 复制资源文件...')
  
  // 确保目标目录存在
  const distDir = resolve(__dirname, '../dist')
  const iconsDir = resolve(distDir, 'icons')
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }
  
  // 复制图标文件
  const publicIconsDir = resolve(__dirname, '../public/icons')
  if (fs.existsSync(publicIconsDir)) {
    const iconFiles = fs.readdirSync(publicIconsDir)
    for (const file of iconFiles) {
      if (file.endsWith('.png') || file.endsWith('.svg')) {
        fs.copyFileSync(
          resolve(publicIconsDir, file),
          resolve(iconsDir, file)
        )
      }
    }
  }
  
  console.log('✅ 资源文件复制完成')
}

async function createZipPackage() {
  console.log('📦 创建插件包...')
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream('ai-sider-nav.zip')
    const archive = archiver('zip', { zlib: { level: 9 } })
    
    output.on('close', () => {
      console.log(`✅ 插件包创建完成 (${archive.pointer()} bytes)`)
      resolve()
    })
    
    archive.on('error', (err) => {
      reject(err)
    })
    
    archive.pipe(output)
    
    // 添加 dist 目录中的所有文件
    archive.directory('dist/', false)
    
    archive.finalize()
  })
}

// 运行构建
buildExtension()
