// 简单的图标生成脚本
// 在实际项目中，建议使用专业的图标生成工具

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 创建简单的 base64 编码的 PNG 图标
const createIcon = (size) => {
  // 使用青绿色主题的图标设计
  const canvas = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size/5}" fill="#79b4a6"/>
      <rect x="${size/4}" y="${size/4}" width="${size/2}" height="${size/2}" rx="${size/10}" fill="white"/>
      <circle cx="${size/2.5}" cy="${size/2.2}" r="${size/20}" fill="#79b4a6"/>
      <circle cx="${size/1.7}" cy="${size/2.2}" r="${size/20}" fill="#79b4a6"/>
      <circle cx="${size/1.3}" cy="${size/2.2}" r="${size/20}" fill="#79b4a6"/>
    </svg>
  `
  return canvas
}

const sizes = [16, 32, 48, 128]
const iconsDir = path.join(__dirname, '../public/icons')

// 确保图标目录存在
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// 生成不同尺寸的图标
sizes.forEach(size => {
  const iconSvg = createIcon(size)
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), iconSvg)
})

console.log('Icons generated successfully!')
console.log('Note: For production, please use professional icon generation tools to convert SVG to PNG.')
