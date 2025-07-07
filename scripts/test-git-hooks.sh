#!/bin/bash

# Git 钩子测试脚本

echo "🧪 测试 Git 钩子配置"
echo "========================"

# 检查 lint-staged 配置
echo ""
echo "📋 检查 lint-staged 配置..."
if grep -q "lint-staged" package.json; then
    echo "✅ lint-staged 配置存在"
else
    echo "❌ lint-staged 配置缺失"
    exit 1
fi

# 测试 ESLint
echo ""
echo "🔧 测试 ESLint..."
npm run lint -- --max-warnings 0
if [ $? -eq 0 ]; then
    echo "✅ ESLint 检查通过"
else
    echo "❌ ESLint 检查失败"
    exit 1
fi

# 测试 TypeScript 编译
echo ""
echo "📝 测试 TypeScript 编译..."
npx vue-tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ TypeScript 编译通过"
else
    echo "❌ TypeScript 编译失败"
    exit 1
fi

# 测试构建
echo ""
echo "🏗️ 测试构建..."
npm run build:check
if [ $? -eq 0 ]; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
    exit 1
fi

# 检查 Git 钩子文件
echo ""
echo "🔗 检查 Git 钩子文件..."
for hook in pre-commit commit-msg pre-push; do
    if [ -f ".husky/$hook" ]; then
        echo "✅ $hook 钩子存在"
    else
        echo "❌ $hook 钩子不存在"
        exit 1
    fi
done

echo ""
echo "🎉 所有测试通过！Git 钩子配置成功！"
echo ""
echo "📖 使用说明:"
echo "  - 提交时会自动运行代码格式化和检查"
echo "  - 提交信息需要符合规范格式: type(scope): description"
echo "  - 推送前会运行完整的代码检查和构建测试"
echo "  - 详细说明请查看: docs/git-hooks-guide.md"