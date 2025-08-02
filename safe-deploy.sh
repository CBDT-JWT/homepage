#!/bin/bash

# 安全部署脚本 - 保护数据文件
# 使用方法: ./safe-deploy.sh

bash ~/mysite/web/script/makenotes.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/deploy-config.env"

# 加载配置文件
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== 安全博客部署工具 ===${NC}"
echo "🌐 服务器: $SERVER_HOST:$SERVER_PORT"
echo "👤 用户: $SERVER_USER"
echo "📁 路径: $SERVER_PATH"
echo "🚪 端口: $REMOTE_PORT"
echo "🛡️ 数据保护: 启用"
echo "----------------------------------------"

# 确认部署
read -p "确认开始部署? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}部署已取消${NC}"
    exit 0
fi

echo -e "${YELLOW}备份远程数据文件...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << EOF
cd $SERVER_PATH

# 创建备份目录
mkdir -p backup/\$(date +%Y%m%d_%H%M%S)

# 备份数据文件
if [ -f "data/posts.json" ]; then
    cp data/posts.json backup/\$(date +%Y%m%d_%H%M%S)/posts.json.bak
    echo "✅ 已备份 posts.json"
fi

if [ -f "data/comments.json" ]; then
    cp data/comments.json backup/\$(date +%Y%m%d_%H%M%S)/comments.json.bak
    echo "✅ 已备份 comments.json"
fi

echo "📦 备份完成"
EOF

echo -e "${YELLOW}停止服务...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << EOF
cd $SERVER_PATH
pkill -f "node.*server.js" || true
echo "⏹️ 服务已停止"
EOF

echo -e "${YELLOW}上传应用程序文件...${NC}"
# 使用rsync上传，但排除数据文件，确保包含assets等静态资源
sshpass -p "$SERVER_PASSWORD" rsync -avzh \
    --progress \
    --exclude="data/posts.json" \
    --exclude="data/comments.json" \
    --exclude=".git/" \
    --exclude="node_modules/" \
    --exclude="*.log" \
    --exclude="backup/" \
    --include="html/assets/**" \
    --include="html/blog/assets/**" \
    -e "ssh -p $SERVER_PORT -o StrictHostKeyChecking=no" \
    "${SCRIPT_DIR}/" \
    "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 文件上传成功${NC}"
else
    echo -e "${RED}❌ 文件上传失败${NC}"
    exit 1
fi

echo -e "${YELLOW}启动服务...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << EOF
cd $SERVER_PATH

# 确保数据目录存在
mkdir -p data

# 启动服务器
export PORT=$REMOTE_PORT
nohup node server.js > blog.log 2>&1 &

# 等待启动
sleep 3

# 检查是否启动成功
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ 博客服务启动成功!"
    echo "🌐 访问地址: http://$SERVER_HOST:$REMOTE_PORT"
    echo "📝 写文章: http://$SERVER_HOST:$REMOTE_PORT/html/blog/write-post.html"
    echo "📊 管理: http://$SERVER_HOST:$REMOTE_PORT/html/blog/admin.html"
    echo "📋 日志文件: $SERVER_PATH/blog.log"
    echo "🛡️ 数据文件已被保护，不会被覆盖"
else
    echo "❌ 服务启动失败"
    echo "查看日志:"
    tail blog.log
    exit 1
fi
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}========================部署完成========================${NC}"
    echo -e "${GREEN}您的博客已经在线运行，数据已被保护！${NC}"
    echo -e "${BLUE}💡 提示: 数据文件备份在服务器的 backup/ 目录中${NC}"
else
    echo -e "${RED}❌ 部署失败${NC}"
    exit 1
fi
