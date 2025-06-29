import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function postBuild() {
  console.log('📋 执行构建后处理...')

  const srcDir = path.resolve(__dirname, '../src')
  const distDir = path.resolve(__dirname, '../dist')
  const publicDir = path.resolve(__dirname, '../public')

  try {
    // 复制 manifest.json
    const manifestSrc = path.join(srcDir, 'manifest.json')
    const manifestDest = path.join(distDir, 'manifest.json')
    fs.copyFileSync(manifestSrc, manifestDest)
    console.log('✅ 复制 manifest.json')

    // 复制图标文件
    const iconsDir = path.join(distDir, 'icons')
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true })
    }

    const publicIconsDir = path.join(publicDir, 'icons')
    if (fs.existsSync(publicIconsDir)) {
      const iconFiles = fs.readdirSync(publicIconsDir)
      for (const file of iconFiles) {
        if (file.endsWith('.png') || file.endsWith('.svg')) {
          fs.copyFileSync(path.join(publicIconsDir, file), path.join(iconsDir, file))
        }
      }
      console.log('✅ 复制图标文件')
    }

    // 复制内容脚本样式
    const contentStyleSrc = path.join(srcDir, 'content-script/style.css')
    const contentStyleDest = path.join(distDir, 'content-script.css')
    if (fs.existsSync(contentStyleSrc)) {
      fs.copyFileSync(contentStyleSrc, contentStyleDest)
      console.log('✅ 复制内容脚本样式')
    }

    // 移动 HTML 文件到正确位置
    const htmlFiles = [
      { from: 'src/popup/index.html', to: 'popup/index.html' },
      { from: 'src/options/index.html', to: 'options/index.html' },
      { from: 'src/sidebar/index.html', to: 'sidebar/index.html' },
    ]

    for (const { from, to } of htmlFiles) {
      const srcPath = path.join(distDir, from)
      const destPath = path.join(distDir, to)

      if (fs.existsSync(srcPath)) {
        // 确保目标目录存在
        const destDir = path.dirname(destPath)
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }

        fs.copyFileSync(srcPath, destPath)
        console.log(`✅ 移动 ${to}`)
      }
    }

    // 清理临时的 src 目录
    const tempSrcDir = path.join(distDir, 'src')
    if (fs.existsSync(tempSrcDir)) {
      fs.rmSync(tempSrcDir, { recursive: true, force: true })
      console.log('✅ 清理临时文件')
    }

    console.log('🎉 构建后处理完成！')
  } catch (error) {
    console.error('❌ 构建后处理失败:', error)
    process.exit(1)
  }
}

postBuild()
