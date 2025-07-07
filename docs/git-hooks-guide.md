# Git 钩子配置指南

本项目已配置了 Git 钩子来自动检查代码格式和质量，确保代码库的一致性和质量。

## 已配置的钩子

### 1. pre-commit (提交前检查)

**触发时机**: 执行 `git commit` 时

**功能**:

- 使用 `lint-staged` 对暂存的文件进行检查
- 自动运行 ESLint 修复代码问题
- 自动格式化代码 (Prettier)
- 只处理暂存区的文件，提高效率

**检查范围**:

- `*.{vue,js,jsx,ts,tsx}`: ESLint 检查 + Prettier 格式化
- `*.{css,scss,less,html,json,md}`: Prettier 格式化

### 2. commit-msg (提交信息检查)

**触发时机**: 执行 `git commit` 时

**功能**: 检查提交信息是否符合规范格式

**格式要求**:

```
type(scope): description
```

**支持的类型 (type)**:

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整 (不影响功能)
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `perf`: 性能优化
- `ci`: CI/CD 相关
- `build`: 构建系统相关

**示例**:

```bash
git commit -m "feat(ui): add new sidebar component"
git commit -m "fix(api): resolve authentication issue"
git commit -m "docs: update README with setup instructions"
```

### 3. pre-push (推送前检查)

**触发时机**: 执行 `git push` 时

**功能**:

- TypeScript 类型检查
- 完整的 ESLint 检查
- 构建检查 (确保代码可以正常构建)

## 使用说明

### 正常开发流程

1. **开发代码**

   ```bash
   # 正常编写代码
   ```

2. **添加到暂存区**

   ```bash
   git add .
   ```

3. **提交代码** (会自动触发 pre-commit 和 commit-msg 钩子)

   ```bash
   git commit -m "feat(component): add new feature"
   ```

4. **推送代码** (会自动触发 pre-push 钩子)
   ```bash
   git push
   ```

### 如果钩子检查失败

#### pre-commit 失败

- 查看错误信息，修复代码问题
- 重新添加修改的文件到暂存区
- 再次尝试提交

#### commit-msg 失败

- 检查提交信息格式是否正确
- 使用正确的格式重新提交

#### pre-push 失败

- 根据错误信息修复问题:
  - TypeScript 类型错误
  - ESLint 规则违反
  - 构建失败
- 修复后重新推送

### 跳过钩子 (不推荐)

在特殊情况下，可以跳过钩子:

```bash
# 跳过 pre-commit 钩子
git commit --no-verify -m "message"

# 跳过 pre-push 钩子
git push --no-verify
```

**注意**: 跳过钩子可能导致代码质量问题，请谨慎使用。

## 手动运行检查

### 格式化所有代码

```bash
npm run format
```

### 运行 ESLint 检查

```bash
npm run lint
```

### 运行构建检查

```bash
npm run build:check
```

### 运行 lint-staged (模拟 pre-commit)

```bash
npx lint-staged
```

## 配置文件

- **Husky 配置**: `.husky/` 目录
- **lint-staged 配置**: `package.json` 中的 `lint-staged` 字段
- **ESLint 配置**: `.eslintrc.cjs`
- **Prettier 配置**: `.prettierrc.json`

## 故障排除

### 钩子没有执行

1. 确保已安装依赖: `pnpm install`
2. 重新初始化 husky: `npx husky install`
3. 检查钩子文件权限: `ls -la .husky/`

### 钩子执行失败

1. 查看具体错误信息
2. 手动运行相关命令进行调试
3. 检查 Node.js 和 npm/pnpm 版本

### 性能问题

- lint-staged 只处理暂存文件，性能已优化
- 如果仍然较慢，可以调整 `.eslintignore` 排除不必要的文件

## 团队协作

所有团队成员在克隆项目后需要运行:

```bash
pnpm install
```

这会自动安装依赖并设置 Git 钩子，确保团队代码质量的一致性。
