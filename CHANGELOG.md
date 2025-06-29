# 更新日志

本文档记录了 AI Sider Nav 的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- Firefox 浏览器支持
- Safari 浏览器支持
- 更多 AI 服务提供商支持
- 自定义搜索引擎
- 主题定制功能
- 语音输入支持

## [1.0.0] - 2024-01-XX

### 新增
- 🎉 首次发布
- ✨ 简洁导航页面
  - 支持 Google、Bing 搜索引擎
  - 搜索历史记录
  - 快速搜索功能
- 🤖 AI 全局侧边栏
  - 智能对话功能
  - 网页内容总结
  - 文本翻译、解释、改写
  - 支持 OpenAI、Claude、Gemini
- 🛠️ 高级功能
  - 右键菜单集成
  - 键盘快捷键 (Ctrl+Shift+S)
  - 自动页面总结
  - 数据导入导出
- 🎨 用户界面
  - 响应式设计
  - 深色模式支持
  - 可调整侧边栏大小
  - 样式隔离保护
- 🔧 技术特性
  - Manifest V3 规范
  - Vue 3 + TypeScript
  - Vite 构建系统
  - UnoCSS 样式框架
  - Pinia 状态管理
  - Vitest 测试框架

### 技术栈
- **前端**: Vue 3.4.0, TypeScript 5.3.0
- **构建**: Vite 5.0.0, vite-plugin-web-extension 4.1.0
- **样式**: UnoCSS 0.58.0
- **状态**: Pinia 2.1.7
- **测试**: Vitest 1.0.0, Vue Test Utils 2.4.0
- **代码质量**: ESLint 8.55.0, Prettier 3.1.0

### 浏览器支持
- ✅ Chrome 88+
- ✅ Edge 88+
- ⏳ Firefox (计划中)
- ⏳ Safari (计划中)

### 权限说明
- `activeTab`: 访问当前标签页内容
- `storage`: 保存设置和对话历史
- `tabs`: 创建新标签页进行搜索
- `scripting`: 注入内容脚本
- `contextMenus`: 创建右键菜单

### 安全特性
- 🔒 本地数据存储
- 🔐 API Key 加密保存
- 🛡️ 最小权限原则
- 📖 完全开源透明

---

## 版本说明

### 版本号格式
采用语义化版本号 `MAJOR.MINOR.PATCH`：
- **MAJOR**: 不兼容的 API 修改
- **MINOR**: 向下兼容的功能性新增
- **PATCH**: 向下兼容的问题修正

### 更新类型
- `新增`: 新功能
- `更改`: 对现有功能的更改
- `弃用`: 即将移除的功能
- `移除`: 已移除的功能
- `修复`: 问题修复
- `安全`: 安全相关的修复

### 获取更新
- **自动更新**: Chrome Web Store 自动更新
- **手动更新**: 从 GitHub Releases 下载最新版本
- **开发版本**: 从源码构建最新功能

### 更新注意事项
- 更新前建议备份数据
- 查看更新日志了解重要变更
- 如遇问题请及时反馈

---

📝 **贡献更新日志**: 如果您发现遗漏的重要更改，请提交 Pull Request 或创建 Issue。
