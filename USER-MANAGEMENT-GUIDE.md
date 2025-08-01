# 用户管理系统说明

## 概述
已成功将博客系统的用户认证从硬编码改为基于JSON文件的用户管理系统。

## 文件结构
```
data/
  └── users.json          # 用户数据存储文件

lib/
  └── jwt-auth.js         # JWT认证库，支持文件用户管理

html/blog/
  ├── admin.html          # 管理控制台，包含用户管理界面
  ├── jwt-auth.js         # 前端JWT认证管理
  └── blog-manager.js     # 博客管理器

server.js                 # 服务器，包含用户管理API
```

## 主要功能

### 1. 用户数据存储
- 用户信息存储在 `data/users.json` 文件中
- 包含用户名、加密密码、角色、权限、邮箱等信息
- 支持最后登录时间自动更新

### 2. 用户角色和权限
- **admin**: 管理员权限 (read, write, admin)
- **editor**: 编辑权限 (read, write)  
- **user**: 普通用户权限 (read)

### 3. API接口

#### 登录认证
```
POST /api/auth/login
Body: {"username": "用户名", "password": "密码"}
Response: {"success": true, "token": "JWT令牌", "user": {...}}
```

#### 获取用户列表 (需要管理员权限)
```
GET /api/users
Headers: Authorization: Bearer JWT令牌
Response: {"success": true, "users": [...]}
```

#### 创建新用户 (需要管理员权限)
```
POST /api/users
Headers: Authorization: Bearer JWT令牌
Body: {"username": "用户名", "password": "密码", "role": "角色", "email": "邮箱"}
Response: {"success": true, "user": {...}}
```

#### 修改密码
```
POST /api/auth/password
Headers: Authorization: Bearer JWT令牌
Body: {"oldPassword": "旧密码", "newPassword": "新密码"}
Response: {"success": true}
```

## 默认管理员账户
- 用户名: `admin`
- 密码: `cbdt2025`
- 角色: `admin`

## 安全特性
1. 密码使用 SHA-256 加密存储
2. JWT令牌用于身份验证
3. 管理员权限验证
4. 密码长度限制 (最少6位)
5. 用户名唯一性检查

## 前端管理界面
管理控制台 (`admin.html`) 提供以下功能：
- 用户列表查看
- 创建新用户
- 用户信息显示
- 密码修改
- 统计信息展示

## 使用方法
1. 访问 `/html/blog/admin.html` 进入管理控制台
2. 使用管理员账户登录
3. 在用户管理部分可以查看、创建用户
4. 点击"添加新用户"可以创建新账户

## 注意事项
- 所有用户数据存储在服务器本地 `data/users.json` 文件中
- 建议定期备份用户数据文件
- 生产环境中应该使用更安全的密码加密算法
- JWT密钥应该在生产环境中通过环境变量设置
