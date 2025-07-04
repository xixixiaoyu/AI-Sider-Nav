# 第四章：浏览器扩展配置

## 🎯 学习目标

- 理解 Manifest V3 规范
- 配置浏览器扩展基本信息
- 设置权限和安全策略
- 创建扩展入口文件

## 📋 Manifest V3 简介

### 什么是 Manifest？

Manifest 文件是浏览器扩展的配置文件，定义了扩展的基本信息、权限、入口点等。

### V2 vs V3 对比

| 特性 | Manifest V2 | Manifest V3 |
|------|-------------|-------------|
| 安全性 | 较低 | 更高 |
| 性能 | 一般 | 更好 |
| API | 旧版 API | 现代化 API |
| 支持状态 | 即将废弃 | 当前标准 |

### V3 的主要变化

1. **Service Workers 替代 Background Pages**
2. **更严格的内容安全策略 (CSP)**
3. **新的权限模型**
4. **API 命名空间变化**

## 📄 创建 manifest.json

### 基础配置

```json
{
  "manifest_version": 3,
  "name": "AI Sider Nav",
  "version": "1.0.0",
  "description": "A beautiful new tab page with time display and search functionality"
}
```

### 完整配置

```json
{
  "manifest_version": 3,
  "name": "AI Sider Nav",
  "version": "1.0.0",
  "description": "A beautiful new tab page with time display and search functionality",
  
  "permissions": [
    "storage"
  ],
  
  "chrome_url_overrides": {
    "newtab": "index.html"
  },
  
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  
  "action": {
    "default_popup": "popup.html",
    "default_title": "AI Sider Nav Settings"
  },
  
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  },
  
  "web_accessible_resources": [
    {
      "resources": ["assets/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

## 🔧 配置详解

### 基本信息

```json
{
  "manifest_version": 3,        // 必须是 3
  "name": "AI Sider Nav",       // 扩展名称
  "version": "1.0.0",           // 版本号
  "description": "扩展描述"      // 简短描述
}
```

**版本号规范**
- 遵循语义化版本控制
- 格式：`主版本.次版本.修订版本`
- 示例：`1.2.3`

### 权限配置

```json
{
  "permissions": [
    "storage",              // 存储权限
    "activeTab",           // 当前标签页权限
    "scripting"            // 脚本注入权限
  ],
  "optional_permissions": [
    "tabs",                // 可选的标签页权限
    "bookmarks"            // 可选的书签权限
  ]
}
```

**权限类型**
- `storage`: 访问浏览器存储
- `activeTab`: 访问当前活动标签页
- `tabs`: 访问所有标签页信息
- `scripting`: 注入脚本到页面

### 页面覆盖

```json
{
  "chrome_url_overrides": {
    "newtab": "index.html",     // 新标签页
    "bookmarks": "bookmarks.html", // 书签页
    "history": "history.html"   // 历史页
  }
}
```

**注意事项**
- 每个扩展只能覆盖一种页面类型
- 新标签页是最常用的覆盖类型

### 图标配置

```json
{
  "icons": {
    "16": "icons/icon-16.png",   // 扩展列表图标
    "32": "icons/icon-32.png",   // Windows 系统图标
    "48": "icons/icon-48.png",   // 扩展管理页图标
    "128": "icons/icon-128.png"  // Chrome Web Store 图标
  }
}
```

**图标规范**
- 格式：PNG（推荐）或 SVG
- 尺寸：精确匹配指定尺寸
- 设计：简洁明了，易于识别

### 弹出窗口

```json
{
  "action": {
    "default_popup": "popup.html",
    "default_title": "AI Sider Nav Settings",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png"
    }
  }
}
```

**弹出窗口特点**
- 点击扩展图标时显示
- 尺寸限制：最大 800x600 像素
- 自动关闭：失去焦点时关闭

## 🔒 安全策略

### 内容安全策略 (CSP)

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'",
    "sandbox": "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self' 'unsafe-inline' 'unsafe-eval'; child-src 'self';"
  }
}
```

**CSP 规则说明**
- `script-src 'self'`: 只允许加载同源脚本
- `object-src 'self'`: 只允许同源对象
- `'unsafe-inline'`: 允许内联脚本（不推荐）
- `'unsafe-eval'`: 允许 eval（不推荐）

### Web 可访问资源

```json
{
  "web_accessible_resources": [
    {
      "resources": [
        "assets/*",
        "images/*",
        "fonts/*"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

**用途**
- 允许网页访问扩展资源
- 用于内容脚本注入的资源
- 图片、字体等静态资源

## 🎨 创建弹出页面

### popup.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Sider Nav Settings</title>
  <style>
    body {
      width: 300px;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      background: linear-gradient(135deg, #79b4a6 0%, #6ba3a0 100%);
      color: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .setting-item {
      margin-bottom: 15px;
    }
    
    .setting-label {
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .setting-select {
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.9);
      font-size: 14px;
    }
    
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AI Sider Nav</h1>
  </div>
  
  <div class="setting-item">
    <label class="setting-label" for="searchEngine">搜索引擎</label>
    <select id="searchEngine" class="setting-select">
      <option value="google">Google</option>
      <option value="bing">Bing</option>
      <option value="baidu">百度</option>
    </select>
  </div>
  
  <div class="setting-item">
    <label class="setting-label" for="timeFormat">时间格式</label>
    <select id="timeFormat" class="setting-select">
      <option value="24h">24小时制</option>
      <option value="12h">12小时制</option>
    </select>
  </div>
  
  <div class="footer">
    设置会自动保存
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

### popup.js

```javascript
// 简单的设置管理
const searchEngineSelect = document.getElementById('searchEngine');
const timeFormatSelect = document.getElementById('timeFormat');

// 加载设置
chrome.storage.sync.get(['userSettings'], (result) => {
  if (result.userSettings) {
    searchEngineSelect.value = result.userSettings.searchEngine || 'google';
    timeFormatSelect.value = result.userSettings.timeFormat || '24h';
  }
});

// 保存设置
function saveSettings() {
  chrome.storage.sync.get(['userSettings'], (result) => {
    const settings = result.userSettings || {};
    settings.searchEngine = searchEngineSelect.value;
    settings.timeFormat = timeFormatSelect.value;
    
    chrome.storage.sync.set({ userSettings: settings });
  });
}

searchEngineSelect.addEventListener('change', saveSettings);
timeFormatSelect.addEventListener('change', saveSettings);
```

## 🖼️ 创建扩展图标

### 图标设计原则

1. **简洁明了**
   - 避免复杂的细节
   - 使用清晰的轮廓
   - 保持一致的风格

2. **可识别性**
   - 在小尺寸下仍然清晰
   - 与品牌形象一致
   - 区别于其他扩展

3. **适配性**
   - 在不同背景下都清晰
   - 支持深色和浅色主题
   - 考虑无障碍访问

### 图标创建工具

**在线工具**
- [Figma](https://figma.com) - 专业设计工具
- [Canva](https://canva.com) - 简单易用
- [GIMP](https://gimp.org) - 免费图像编辑

**图标库**
- [Heroicons](https://heroicons.com)
- [Feather Icons](https://feathericons.com)
- [Material Icons](https://fonts.google.com/icons)

### 图标优化

```bash
# 使用 ImageOptim 优化 PNG
imageoptim icons/*.png

# 使用 SVGO 优化 SVG
svgo icons/*.svg
```

## 🔍 测试扩展配置

### 加载扩展

1. **打开扩展管理页面**
   ```
   Chrome: chrome://extensions/
   Edge: edge://extensions/
   ```

2. **启用开发者模式**
   - 打开右上角的"开发者模式"开关

3. **加载扩展**
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

### 验证配置

**检查清单**
- [ ] 扩展正确加载
- [ ] 图标显示正常
- [ ] 新标签页被替换
- [ ] 弹出窗口可以打开
- [ ] 设置可以保存

### 调试技巧

**查看扩展详情**
```javascript
// 在控制台中查看扩展信息
chrome.runtime.getManifest()
```

**检查权限**
```javascript
// 检查权限状态
chrome.permissions.getAll((permissions) => {
  console.log(permissions);
});
```

## 🚀 最佳实践

### 权限最小化原则

```json
{
  "permissions": [
    "storage"  // 只请求必要的权限
  ],
  "optional_permissions": [
    "tabs",    // 可选权限，按需请求
    "bookmarks"
  ]
}
```

### 版本管理

```json
{
  "version": "1.0.0",
  "version_name": "1.0.0 Beta"  // 可选的版本名称
}
```

### 国际化支持

```json
{
  "name": "__MSG_extensionName__",
  "description": "__MSG_extensionDescription__",
  "default_locale": "en"
}
```

## 🔧 故障排除

### 常见错误

**1. Manifest 格式错误**
```
错误：Manifest file is invalid
解决：检查 JSON 语法，使用 JSON 验证器
```

**2. 权限不足**
```
错误：Cannot access chrome.storage
解决：在 manifest.json 中添加 "storage" 权限
```

**3. 图标路径错误**
```
错误：Could not load icon
解决：检查图标文件路径和文件是否存在
```

### 调试方法

**使用开发者工具**
```javascript
// 在扩展页面打开开发者工具
// 右键点击扩展 → 检查弹出内容
```

**查看错误日志**
```
Chrome: chrome://extensions/ → 错误
Edge: edge://extensions/ → 错误
```

## 📚 扩展阅读

### 官方文档
- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Edge Extensions Manifest V3](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/)

### 最佳实践
- [扩展安全指南](https://developer.chrome.com/docs/extensions/mv3/security/)
- [用户体验设计](https://developer.chrome.com/docs/extensions/mv3/user_interface/)

---

**下一章：[构建工具配置](./05-build-tools-config.md)**
