#!/bin/bash

# MkDocs文档构建和部署脚本
echo "🚀 开始构建MkDocs文档..."

# 运行预处理脚本
echo "📝 运行预处理脚本..."
python3 /root/mysite/web/script/magic.py

# 切换到工作目录
cd /root/mysite/web

# 进入EEnotes目录
cd /root/mysite/web/EEnotes

#下载
rm -rf docs
git clone https://github.com/CBDT-JWT/EEnotes.git
if [ ! -d "/root/mysite/web/EEnotes/EEnotes" ]; then
    echo "❌ 错误：/root/mysite/web/EEnotes/EEnotes 目录不存在"
    exit 1
fi
mv /root/mysite/web/EEnotes/EEnotes /root/mysite/web/EEnotes/docs
# 确保自定义CSS文件同步
echo "🔄 同步自定义CSS文件..."
cp themes/css/custom.css stylesheets/custom.css

# 清理并构建MkDocs
echo "🔨 构建MkDocs文档..."
mkdocs build --clean

# 删除旧的部署文件
echo "🗑️  清理旧的部署文件..."
rm -rf /root/mysite/web/html/docs-html/

# 复制构建结果
echo "📂 复制构建结果..."
cp -r ./site /root/mysite/web/html/docs-html/

# 确保stylesheets目录存在
echo "📁 创建stylesheets目录..."
mkdir -p /root/mysite/web/html/docs-html/stylesheets

# 复制自定义CSS文件（这是关键步骤，确保登录按钮样式正确加载）
echo "🎨 复制自定义CSS文件..."
cp stylesheets/*.css /root/mysite/web/html/docs-html/stylesheets/ 2>/dev/null || true

# 复制自定义JS文件
echo "⚡ 复制自定义JS文件..."
cp javascripts/* /root/mysite/web/html/docs-html/javascripts/ 2>/dev/null || true

# 验证关键文件是否存在
echo "✅ 验证部署文件..."
if [ -f "/root/mysite/web/html/docs-html/stylesheets/custom.css" ]; then
    echo "✅ 自定义CSS文件已成功部署"
else
    echo "❌ 警告：自定义CSS文件未找到"
fi

if [ -f "/root/mysite/web/html/docs-html/index.html" ]; then
    echo "✅ 主页文件已成功部署"
else
    echo "❌ 错误：主页文件未找到"
    exit 1
fi

# 检查登录按钮是否在HTML中
if grep -q "auth-buttons" /root/mysite/web/html/docs-html/index.html; then
    echo "✅ 登录按钮HTML结构已正确部署"
else
    echo "❌ 警告：登录按钮HTML结构未找到"
fi

echo "🎉 MkDocs文档构建和部署完成！"
echo "📍 部署位置: /root/mysite/web/html/docs-html/"
echo "🌐 访问地址: http://localhost:3000/docs-html/"

