#!/bin/bash

# DaoMind & Modulux 2.0.0 - GitHub 推送脚本
# 目标仓库: https://github.com/xinetzone/DaoMind.git
# 目标分支: enter-main

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║       DaoMind & Modulux 2.0.0 - GitHub 推送脚本                        ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# 检查 git 状态
echo "📊 检查 Git 状态..."
git status

echo ""
echo "📦 待推送的提交:"
git log --oneline -5

echo ""
echo "🚀 开始推送到 GitHub..."
echo "   仓库: https://github.com/xinetzone/DaoMind.git"
echo "   分支: main → enter-main"
echo ""

# 确认推送
read -p "确认推送? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 执行推送
    echo "正在推送..."
    git push github main:enter-main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "╔══════════════════════════════════════════════════════════════════════╗"
        echo "║  ✅ 推送成功！                                                         ║"
        echo "╚══════════════════════════════════════════════════════════════════════╝"
        echo ""
        echo "🎉 DaoMind & Modulux 2.0.0 已成功推送到 GitHub！"
        echo "📍 查看仓库: https://github.com/xinetzone/DaoMind/tree/enter-main"
    else
        echo ""
        echo "❌ 推送失败，请检查："
        echo "   1. 网络连接"
        echo "   2. GitHub 凭据配置"
        echo "   3. 仓库访问权限"
        echo ""
        echo "如需帮助，请参考: https://docs.github.com/en/get-started/getting-started-with-git"
    fi
else
    echo "已取消推送"
fi

