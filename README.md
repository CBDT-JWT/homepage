# 简单博客系统

一个基于Node.js的轻量级博客系统，支持Markdown编辑、用户认证、图片上传等功能。

## ✨ 特性

- 📝 **Markdown支持** - 完整的Markdown语法支持，包含数学公式渲染
- 🔐 **用户认证** - 基于JWT的安全认证系统
- 🖼️ **图片管理** - 支持图片上传、预览和管理
- 🎨 **响应式设计** - 适配桌面端和移动端
- 🧮 **数学公式** - 集成KaTeX，支持复杂数学公式
- 💾 **文件存储** - 基于JSON文件的轻量级数据存储
- 🚀 **零配置** - 开箱即用，无需数据库

## 🛠️ 技术栈

- **后端**: Node.js (原生HTTP模块)
- **前端**: 原生JavaScript + CSS
- **认证**: JWT (JSON Web Tokens)
- **数据存储**: JSON文件
- **数学公式**: KaTeX
- **样式**: 响应式CSS设计

## 🚀 快速开始

### 环境要求

- Node.js 14.x 或更高版本
- npm 或 yarn

### 安装和运行

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd simple-blog-system
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **初始化数据**
   ```bash
   # 复制示例数据文件
   cp data/posts.example.json data/posts.json
   cp data/users.example.json data/users.json
   ```

4. **启动服务器**
   ```bash
   npm start
   ```

5. **访问应用**
   
   打开浏览器访问: `http://localhost:8000`

### 默认账户

- **用户名**: `admin`
- **密码**: `hello123`

## 📁 项目结构

```
├── server.js              # 主服务器文件
├── package.json           # 依赖配置
├── lib/                   # 核心库文件
│   └── jwt-auth.js       # JWT认证模块
├── data/                  # 数据存储目录
│   ├── posts.json        # 文章数据
│   ├── users.json        # 用户数据
│   ├── posts.example.json # 示例文章数据
│   └── users.example.json # 示例用户数据
├── uploads/              # 图片上传目录
├── html/                 # 静态HTML文件
│   ├── index.html       # 主页
│   ├── about-the-author.html # 关于页面
│   └── blog/            # 博客相关页面
│       ├── index.html   # 博客首页
│       ├── post.html    # 文章详情页
│       ├── write-post.html # 写文章页面
│       ├── admin.html   # 管理页面
│       └── *.css/.js    # 样式和脚本文件
└── docs-html/           # 文档HTML文件
```

## 🎯 功能特性

### 文章管理
- ✅ 创建、编辑、删除文章
- ✅ Markdown语法支持
- ✅ 数学公式渲染 (KaTeX)
- ✅ 文章分类和标签
- ✅ 文章阅读量统计
- ✅ 文章发布/草稿状态

### 用户系统
- ✅ 用户注册和登录
- ✅ JWT令牌认证
- ✅ 密码加密存储 (SHA-256)
- ✅ 角色权限管理 (admin/editor/user)
- ✅ 用户信息管理

### 图片管理
- ✅ 图片上传 (支持拖拽)
- ✅ 图片预览和管理
- ✅ 图片大小限制 (5MB)
- ✅ 支持多种格式 (jpg, png, gif, webp)

### 界面设计
- ✅ 响应式布局
- ✅ 移动端适配
- ✅ 暗色主题
- ✅ 动画效果
- ✅ 用户友好的交互

## 🔧 配置

### 服务器配置

编辑 `server.js` 文件中的配置:

```javascript
const PORT = process.env.PORT || 8000;  // 服务器端口
const DATA_DIR = path.join(__dirname, 'data');  // 数据目录
const UPLOAD_DIR = path.join(__dirname, 'uploads');  // 上传目录
```

### 环境变量

可以通过环境变量配置:

```bash
PORT=3000 npm start  # 自定义端口
```

## 📝 使用指南

### 创建文章

1. 使用管理员账户登录
2. 点击"写文章"按钮
3. 填写文章标题、分类、摘要
4. 使用Markdown语法编写内容
5. 可选择上传封面图片
6. 预览确认后发布

### 用户管理

1. 登录管理员账户
2. 进入"管理"页面
3. 在用户管理部分可以:
   - 查看所有用户
   - 创建新用户
   - 管理用户权限

### 图片管理

1. 在写文章时点击"图片"按钮
2. 拖拽或选择图片文件上传
3. 系统会自动生成图片链接
4. 在管理页面可以查看和删除图片

## 🛡️ 安全特性

- JWT令牌认证
- 密码SHA-256加密
- 文件上传安全检查
- 路径遍历攻击防护
- CORS跨域配置
- 输入验证和过滤

## 🤝 贡献

欢迎提交Pull Request或Issue！

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

- [KaTeX](https://katex.org/) - 数学公式渲染
- [JWT](https://jwt.io/) - 认证令牌
- 感谢所有贡献者！

---

如果这个项目对您有帮助，请给个⭐️！
