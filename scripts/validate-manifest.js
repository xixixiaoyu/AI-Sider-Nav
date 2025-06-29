import fs from 'fs'
import { resolve } from 'path'

const __dirname = new URL('.', import.meta.url).pathname

function validateManifest() {
  console.log('🔍 验证 manifest.json...')
  
  try {
    const manifestPath = resolve(__dirname, '../src/manifest.json')
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)
    
    // 基本字段验证
    const requiredFields = [
      'manifest_version',
      'name',
      'version',
      'description'
    ]
    
    const missingFields = requiredFields.filter(field => !manifest[field])
    if (missingFields.length > 0) {
      throw new Error(`缺少必需字段: ${missingFields.join(', ')}`)
    }
    
    // Manifest V3 特定验证
    if (manifest.manifest_version !== 3) {
      throw new Error('必须使用 Manifest V3')
    }
    
    // 权限验证
    if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
      console.warn('⚠️  未定义权限或权限格式不正确')
    }
    
    // 内容脚本验证
    if (manifest.content_scripts) {
      for (const script of manifest.content_scripts) {
        if (!script.matches || !Array.isArray(script.matches)) {
          throw new Error('内容脚本必须定义 matches 字段')
        }
        if (!script.js || !Array.isArray(script.js)) {
          throw new Error('内容脚本必须定义 js 字段')
        }
      }
    }
    
    // 后台脚本验证
    if (manifest.background) {
      if (!manifest.background.service_worker) {
        throw new Error('Manifest V3 必须使用 service_worker')
      }
    }
    
    // 图标验证
    if (manifest.icons) {
      const iconSizes = Object.keys(manifest.icons)
      const requiredSizes = ['16', '32', '48', '128']
      const missingSizes = requiredSizes.filter(size => !iconSizes.includes(size))
      
      if (missingSizes.length > 0) {
        console.warn(`⚠️  建议添加以下尺寸的图标: ${missingSizes.join(', ')}`)
      }
    }
    
    // 版本格式验证
    const versionRegex = /^\d+\.\d+\.\d+$/
    if (!versionRegex.test(manifest.version)) {
      console.warn('⚠️  版本号建议使用 x.y.z 格式')
    }
    
    console.log('✅ manifest.json 验证通过')
    
    // 显示摘要信息
    console.log('\n📋 Manifest 摘要:')
    console.log(`名称: ${manifest.name}`)
    console.log(`版本: ${manifest.version}`)
    console.log(`描述: ${manifest.description}`)
    console.log(`权限: ${manifest.permissions?.length || 0} 个`)
    console.log(`内容脚本: ${manifest.content_scripts?.length || 0} 个`)
    console.log(`后台脚本: ${manifest.background ? '是' : '否'}`)
    
  } catch (error) {
    console.error('❌ manifest.json 验证失败:', error.message)
    process.exit(1)
  }
}

// 运行验证
validateManifest()
