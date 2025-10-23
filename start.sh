#!/bin/bash

# Harry Potter 阅读器 - 快速启动脚本

echo "🪄 启动 Harry Potter 英语阅读器..."
echo ""

# 检查是否在正确的目录
if [ ! -d "reader" ] || [ ! -d "data" ]; then
    echo "❌ 错误：请在项目根目录下运行此脚本"
    echo "   当前目录：$(pwd)"
    exit 1
fi

# 检查数据文件
if [ ! -f "data/chapter1.json" ]; then
    echo "⚠️  警告：找不到 data/chapter1.json"
    echo "   请确保数据文件存在"
fi

# 检查音频文件
if [ ! -f "raw/audio/chapter1.mp3" ]; then
    echo "⚠️  警告：找不到 raw/audio/chapter1.mp3"
    echo "   音频功能可能无法正常工作"
fi

echo ""
echo "✅ 启动本地服务器..."
echo "📍 访问地址: http://localhost:8000/reader/index.html"
echo ""
echo "💡 提示："
echo "   - 按 Ctrl+C 停止服务器"
echo "   - 在浏览器中打开上述地址开始使用"
echo ""
echo "─────────────────────────────────────"
echo ""

# 启动服务器
python3 -m http.server 8000
