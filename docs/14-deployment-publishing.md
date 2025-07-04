# 第十四章：部署和发布

## 🎯 学习目标

- 掌握浏览器扩展打包和发布流程
- 学习 Chrome Web Store 和 Edge Add-ons 发布
- 实现自动化部署和版本管理
- 建立用户反馈和更新机制

## 📦 构建和打包

### 生产构建配置

```typescript
// vite.config.prod.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), UnoCSS()],
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        popup: resolve(__dirname, 'public/popup.html')
      },
      
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'popup') {
            return 'popup.js'
          }
          return 'assets/[name]-[hash].js'
        },
        
        chunkFileNames: 'assets/[name]-[hash].js',
        
        assetFileNames: (assetInfo) => {
          // 保持 manifest.json 在根目录
          if (assetInfo.name === 'manifest.json') {
            return '[name].[ext]'
          }
          
          // 根据文件类型分类
          const extType = assetInfo.name?.split('.').pop()
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return 'images/[name]-[hash].[ext]'
          }
          
          if (/woff2?|eot|ttf|otf/i.test(extType || '')) {
            return 'fonts/[name]-[hash].[ext]'
          }
          
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    
    // 生产优化
    minify: 'esbuild',
    target: 'esnext',
    sourcemap: false,
    
    // 移除调试代码
    esbuild: {
      drop: ['console', 'debugger'],
      legalComments: 'none'
    }
  },
  
  define: {
    __DEV__: false,
    __PROD__: true
  }
})
```

### 构建脚本优化

```json
{
  "scripts": {
    "build": "vite build --config vite.config.prod.ts",
    "build:dev": "vite build --mode development",
    "build:analyze": "vite build --config vite.config.prod.ts && npx vite-bundle-analyzer dist",
    "prebuild": "npm run lint && npm run type-check",
    "postbuild": "npm run validate-build",
    "validate-build": "node scripts/validate-build.js",
    "package": "npm run build && npm run create-package",
    "create-package": "node scripts/create-package.js"
  }
}
```

### 构建验证脚本

```javascript
// scripts/validate-build.js
const fs = require('fs')
const path = require('path')

class BuildValidator {
  constructor() {
    this.distPath = path.join(__dirname, '../dist')
    this.errors = []
    this.warnings = []
  }
  
  validate() {
    console.log('🔍 Validating build...')
    
    this.checkRequiredFiles()
    this.validateManifest()
    this.checkFileSize()
    this.validateAssets()
    
    this.reportResults()
  }
  
  checkRequiredFiles() {
    const requiredFiles = [
      'manifest.json',
      'index.html',
      'popup.html',
      'popup.js'
    ]
    
    requiredFiles.forEach(file => {
      const filePath = path.join(this.distPath, file)
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing required file: ${file}`)
      }
    })
  }
  
  validateManifest() {
    const manifestPath = path.join(this.distPath, 'manifest.json')
    
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      
      // 检查必需字段
      const requiredFields = ['manifest_version', 'name', 'version', 'description']
      requiredFields.forEach(field => {
        if (!manifest[field]) {
          this.errors.push(`Missing required manifest field: ${field}`)
        }
      })
      
      // 检查版本格式
      if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        this.errors.push('Invalid version format in manifest')
      }
      
      // 检查图标文件
      if (manifest.icons) {
        Object.values(manifest.icons).forEach(iconPath => {
          const fullPath = path.join(this.distPath, iconPath)
          if (!fs.existsSync(fullPath)) {
            this.errors.push(`Missing icon file: ${iconPath}`)
          }
        })
      }
      
    } catch (error) {
      this.errors.push(`Invalid manifest.json: ${error.message}`)
    }
  }
  
  checkFileSize() {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const totalSize = this.calculateDirectorySize(this.distPath)
    
    if (totalSize > maxSize) {
      this.warnings.push(`Build size (${this.formatBytes(totalSize)}) exceeds recommended limit (${this.formatBytes(maxSize)})`)
    }
    
    console.log(`📦 Total build size: ${this.formatBytes(totalSize)}`)
  }
  
  validateAssets() {
    const assetsPath = path.join(this.distPath, 'assets')
    
    if (fs.existsSync(assetsPath)) {
      const files = fs.readdirSync(assetsPath)
      
      // 检查是否有过大的文件
      files.forEach(file => {
        const filePath = path.join(assetsPath, file)
        const stats = fs.statSync(filePath)
        
        if (stats.size > 1024 * 1024) { // 1MB
          this.warnings.push(`Large asset file: ${file} (${this.formatBytes(stats.size)})`)
        }
      })
    }
  }
  
  calculateDirectorySize(dirPath) {
    let totalSize = 0
    
    const files = fs.readdirSync(dirPath)
    files.forEach(file => {
      const filePath = path.join(dirPath, file)
      const stats = fs.statSync(filePath)
      
      if (stats.isDirectory()) {
        totalSize += this.calculateDirectorySize(filePath)
      } else {
        totalSize += stats.size
      }
    })
    
    return totalSize
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  reportResults() {
    console.log('\n📋 Build Validation Results:')
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ Build validation passed!')
      return
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:')
      this.errors.forEach(error => console.log(`  - ${error}`))
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      this.warnings.forEach(warning => console.log(`  - ${warning}`))
    }
    
    if (this.errors.length > 0) {
      process.exit(1)
    }
  }
}

// 运行验证
const validator = new BuildValidator()
validator.validate()
```

## 📋 发布准备

### 版本管理

```javascript
// scripts/version-bump.js
const fs = require('fs')
const path = require('path')

class VersionManager {
  constructor() {
    this.packageJsonPath = path.join(__dirname, '../package.json')
    this.manifestPath = path.join(__dirname, '../public/manifest.json')
  }
  
  bumpVersion(type = 'patch') {
    const packageJson = this.readPackageJson()
    const manifest = this.readManifest()
    
    const currentVersion = packageJson.version
    const newVersion = this.calculateNewVersion(currentVersion, type)
    
    console.log(`🔄 Bumping version from ${currentVersion} to ${newVersion}`)
    
    // 更新 package.json
    packageJson.version = newVersion
    this.writePackageJson(packageJson)
    
    // 更新 manifest.json
    manifest.version = newVersion
    this.writeManifest(manifest)
    
    console.log('✅ Version updated successfully!')
    
    return newVersion
  }
  
  calculateNewVersion(currentVersion, type) {
    const [major, minor, patch] = currentVersion.split('.').map(Number)
    
    switch (type) {
      case 'major':
        return `${major + 1}.0.0`
      case 'minor':
        return `${major}.${minor + 1}.0`
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`
    }
  }
  
  readPackageJson() {
    return JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'))
  }
  
  writePackageJson(data) {
    fs.writeFileSync(this.packageJsonPath, JSON.stringify(data, null, 2) + '\n')
  }
  
  readManifest() {
    return JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'))
  }
  
  writeManifest(data) {
    fs.writeFileSync(this.manifestPath, JSON.stringify(data, null, 2) + '\n')
  }
}

// 命令行使用
const args = process.argv.slice(2)
const versionType = args[0] || 'patch'

const versionManager = new VersionManager()
versionManager.bumpVersion(versionType)
```

### 发布包创建

```javascript
// scripts/create-package.js
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

class PackageCreator {
  constructor() {
    this.distPath = path.join(__dirname, '../dist')
    this.releasePath = path.join(__dirname, '../release')
  }
  
  async createPackages() {
    console.log('📦 Creating release packages...')
    
    // 确保 release 目录存在
    if (!fs.existsSync(this.releasePath)) {
      fs.mkdirSync(this.releasePath, { recursive: true })
    }
    
    const manifest = this.readManifest()
    const version = manifest.version
    
    // 创建 Chrome 包
    await this.createChromePackage(version)
    
    // 创建 Edge 包
    await this.createEdgePackage(version)
    
    console.log('✅ Release packages created successfully!')
  }
  
  async createChromePackage(version) {
    const filename = `ai-sider-nav-chrome-v${version}.zip`
    const outputPath = path.join(this.releasePath, filename)
    
    console.log(`📦 Creating Chrome package: ${filename}`)
    
    await this.createZipArchive(outputPath, this.distPath)
    
    console.log(`✅ Chrome package created: ${outputPath}`)
  }
  
  async createEdgePackage(version) {
    const filename = `ai-sider-nav-edge-v${version}.zip`
    const outputPath = path.join(this.releasePath, filename)
    
    console.log(`📦 Creating Edge package: ${filename}`)
    
    // Edge 可能需要特殊的 manifest 调整
    const tempDir = path.join(this.releasePath, 'temp-edge')
    await this.copyDirectory(this.distPath, tempDir)
    
    // 调整 Edge 特定配置（如果需要）
    // this.adjustManifestForEdge(path.join(tempDir, 'manifest.json'))
    
    await this.createZipArchive(outputPath, tempDir)
    
    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true, force: true })
    
    console.log(`✅ Edge package created: ${outputPath}`)
  }
  
  createZipArchive(outputPath, sourceDir) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath)
      const archive = archiver('zip', { zlib: { level: 9 } })
      
      output.on('close', () => {
        console.log(`📦 Archive created: ${archive.pointer()} total bytes`)
        resolve()
      })
      
      archive.on('error', reject)
      archive.pipe(output)
      
      archive.directory(sourceDir, false)
      archive.finalize()
    })
  }
  
  async copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true })
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }
  
  readManifest() {
    const manifestPath = path.join(this.distPath, 'manifest.json')
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  }
}

// 运行打包
const packageCreator = new PackageCreator()
packageCreator.createPackages().catch(console.error)
```

## 🏪 应用商店发布

### Chrome Web Store 发布

```markdown
# Chrome Web Store 发布指南

## 1. 准备工作

### 开发者账户
- 注册 Chrome Web Store 开发者账户
- 支付一次性注册费用（$5）
- 验证身份信息

### 应用资料准备
- 应用图标（128x128px）
- 应用截图（1280x800px 或 640x400px）
- 应用描述（中英文）
- 隐私政策链接
- 支持邮箱

## 2. 发布流程

### 步骤 1：上传扩展包
1. 访问 Chrome Web Store Developer Dashboard
2. 点击"Add new item"
3. 上传 .zip 文件
4. 等待自动验证

### 步骤 2：填写商店信息
```

```json
{
  "storeInfo": {
    "name": "AI Sider Nav",
    "summary": "A beautiful new tab page with time display and search functionality",
    "description": "Transform your new tab page into a beautiful, functional workspace. AI Sider Nav provides an elegant time display, intelligent search capabilities, and customizable settings to enhance your browsing experience.",
    "category": "Productivity",
    "language": "zh-CN",
    "regions": ["CN", "US", "GB", "CA", "AU"],
    "pricing": "Free",
    "screenshots": [
      "screenshot-1-main-interface.png",
      "screenshot-2-search-functionality.png",
      "screenshot-3-settings-panel.png"
    ],
    "promotional_images": {
      "small_tile": "promotional-440x280.png",
      "large_tile": "promotional-920x680.png",
      "marquee": "promotional-1400x560.png"
    }
  }
}
```

### Edge Add-ons 发布

```markdown
# Microsoft Edge Add-ons 发布指南

## 1. 准备工作

### 合作伙伴中心账户
- 注册 Microsoft 合作伙伴中心账户
- 完成开发者验证
- 无需注册费用

### 应用资料准备
- 与 Chrome Web Store 类似的资料
- 支持 Microsoft 特定的功能描述

## 2. 发布流程

### 步骤 1：创建新提交
1. 访问 Microsoft 合作伙伴中心
2. 选择"扩展"
3. 点击"创建新扩展"

### 步骤 2：上传和配置
```

## 🚀 自动化部署

### GitHub Actions 工作流

```yaml
# .github/workflows/release.yml
name: Release Extension

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'
        
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Run tests
      run: pnpm test
      
    - name: Build extension
      run: pnpm build
      
    - name: Validate build
      run: pnpm run validate-build
      
    - name: Create release packages
      run: pnpm run create-package
      
    - name: Upload to Chrome Web Store
      uses: mnao305/chrome-extension-upload@v4.0.1
      with:
        file-path: release/ai-sider-nav-chrome-${{ github.ref_name }}.zip
        extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
        client-id: ${{ secrets.CHROME_CLIENT_ID }}
        client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
        refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
        
    - name: Create GitHub Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        draft: false
        prerelease: false
        
    - name: Upload Release Assets
      uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ steps.create_release.outputs.upload_url }}
        asset_path: release/ai-sider-nav-chrome-${{ github.ref_name }}.zip
        asset_name: ai-sider-nav-chrome-${{ github.ref_name }}.zip
        asset_content_type: application/zip
```

### 发布脚本

```javascript
// scripts/release.js
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

class ReleaseManager {
  constructor() {
    this.packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
    )
  }
  
  async release(versionType = 'patch') {
    console.log('🚀 Starting release process...')
    
    try {
      // 1. 运行测试
      console.log('🧪 Running tests...')
      execSync('pnpm test', { stdio: 'inherit' })
      
      // 2. 更新版本
      console.log('📝 Updating version...')
      execSync(`node scripts/version-bump.js ${versionType}`, { stdio: 'inherit' })
      
      // 3. 构建项目
      console.log('🔨 Building project...')
      execSync('pnpm build', { stdio: 'inherit' })
      
      // 4. 创建发布包
      console.log('📦 Creating release packages...')
      execSync('pnpm run create-package', { stdio: 'inherit' })
      
      // 5. 提交更改
      const newVersion = this.getCurrentVersion()
      console.log(`📝 Committing version ${newVersion}...`)
      execSync('git add .', { stdio: 'inherit' })
      execSync(`git commit -m "chore: release v${newVersion}"`, { stdio: 'inherit' })
      execSync(`git tag v${newVersion}`, { stdio: 'inherit' })
      
      // 6. 推送到远程
      console.log('📤 Pushing to remote...')
      execSync('git push origin main', { stdio: 'inherit' })
      execSync(`git push origin v${newVersion}`, { stdio: 'inherit' })
      
      console.log(`✅ Release v${newVersion} completed successfully!`)
      
    } catch (error) {
      console.error('❌ Release failed:', error.message)
      process.exit(1)
    }
  }
  
  getCurrentVersion() {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
    )
    return packageJson.version
  }
}

// 命令行使用
const args = process.argv.slice(2)
const versionType = args[0] || 'patch'

const releaseManager = new ReleaseManager()
releaseManager.release(versionType)
```

## 📊 发布后监控

### 用户反馈收集

```typescript
// src/utils/feedback.ts
export class FeedbackCollector {
  private feedbackEndpoint = 'https://api.example.com/feedback'
  
  async submitFeedback(feedback: {
    type: 'bug' | 'feature' | 'general'
    message: string
    rating?: number
    userAgent?: string
    version?: string
  }) {
    try {
      const payload = {
        ...feedback,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        version: chrome.runtime.getManifest().version,
        url: window.location.href
      }
      
      await fetch(this.feedbackEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      console.log('Feedback submitted successfully')
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }
  
  // 自动收集使用统计
  trackUsage(action: string, data?: any) {
    if (import.meta.env.PROD) {
      // 发送使用统计到分析服务
      this.sendAnalytics('usage', { action, data })
    }
  }
  
  private async sendAnalytics(type: string, data: any) {
    try {
      await fetch('https://api.example.com/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
          version: chrome.runtime.getManifest().version
        })
      })
    } catch (error) {
      // 静默失败，不影响用户体验
    }
  }
}

export const feedbackCollector = new FeedbackCollector()
```

### 更新检查机制

```typescript
// src/utils/update-checker.ts
export class UpdateChecker {
  private updateCheckInterval = 24 * 60 * 60 * 1000 // 24 小时
  
  constructor() {
    this.setupUpdateCheck()
  }
  
  private setupUpdateCheck() {
    // 立即检查一次
    this.checkForUpdates()
    
    // 定期检查更新
    setInterval(() => {
      this.checkForUpdates()
    }, this.updateCheckInterval)
  }
  
  private async checkForUpdates() {
    try {
      const currentVersion = chrome.runtime.getManifest().version
      const response = await fetch('https://api.example.com/version-check')
      const { latestVersion, updateInfo } = await response.json()
      
      if (this.isNewerVersion(latestVersion, currentVersion)) {
        this.notifyUpdate(latestVersion, updateInfo)
      }
    } catch (error) {
      console.error('Failed to check for updates:', error)
    }
  }
  
  private isNewerVersion(latest: string, current: string): boolean {
    const latestParts = latest.split('.').map(Number)
    const currentParts = current.split('.').map(Number)
    
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0
      const currentPart = currentParts[i] || 0
      
      if (latestPart > currentPart) return true
      if (latestPart < currentPart) return false
    }
    
    return false
  }
  
  private notifyUpdate(version: string, updateInfo: any) {
    // 显示更新通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'AI Sider Nav 更新可用',
      message: `新版本 ${version} 已发布，包含新功能和改进。`
    })
  }
}
```

## 📈 发布策略

### 渐进式发布

```javascript
// 渐进式发布配置
const releaseConfig = {
  stages: [
    {
      name: 'canary',
      percentage: 5,
      duration: '24h',
      criteria: {
        errorRate: '<1%',
        crashRate: '<0.1%'
      }
    },
    {
      name: 'beta',
      percentage: 25,
      duration: '72h',
      criteria: {
        errorRate: '<0.5%',
        userSatisfaction: '>4.0'
      }
    },
    {
      name: 'stable',
      percentage: 100,
      duration: 'indefinite'
    }
  ]
}
```

### A/B 测试

```typescript
// A/B 测试框架
export class ABTestManager {
  private experiments: Map<string, any> = new Map()
  
  async getVariant(experimentId: string): Promise<string> {
    const userId = await this.getUserId()
    const hash = this.hashString(`${experimentId}-${userId}`)
    const bucket = hash % 100
    
    const experiment = this.experiments.get(experimentId)
    if (!experiment) return 'control'
    
    let cumulativePercentage = 0
    for (const [variant, percentage] of Object.entries(experiment.variants)) {
      cumulativePercentage += percentage as number
      if (bucket < cumulativePercentage) {
        return variant
      }
    }
    
    return 'control'
  }
  
  private async getUserId(): Promise<string> {
    const result = await chrome.storage.local.get('userId')
    if (result.userId) {
      return result.userId
    }
    
    const newUserId = this.generateUserId()
    await chrome.storage.local.set({ userId: newUserId })
    return newUserId
  }
  
  private generateUserId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
  
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}
```

## 📚 扩展阅读

### 发布平台文档
- [Chrome Web Store 开发者文档](https://developer.chrome.com/docs/webstore/)
- [Microsoft Edge Add-ons 文档](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/)

### 自动化工具
- [GitHub Actions](https://docs.github.com/en/actions)
- [Chrome Extension CLI](https://github.com/dutiyesh/chrome-extension-cli)

---

**恭喜！您已完成 AI Sider Nav 项目的完整学习文档。** 🎉

这个项目涵盖了现代前端开发的各个方面，从项目初始化到最终发布，希望对您的学习和开发有所帮助。
