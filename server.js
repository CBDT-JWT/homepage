

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const JWTAuth = require('./lib/jwt-auth');

const PORT = process.env.PORT || 8000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// 初始化JWT认证
const auth = new JWTAuth();

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// 获取文件的MIME类型
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// CORS头
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// 处理静态文件
function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
}

// 解析multipart/form-data
function parseMultipart(body, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from('--' + boundary);
  const endBoundaryBuffer = Buffer.from('--' + boundary + '--');
  
  let start = 0;
  let end = body.indexOf(boundaryBuffer, start);
  
  while (end !== -1) {
    if (start > 0) {
      const partData = body.slice(start, end);
      const headerEnd = partData.indexOf('\r\n\r\n');
      
      if (headerEnd !== -1) {
        const headerStr = partData.slice(0, headerEnd).toString();
        const content = partData.slice(headerEnd + 4);
        
        // 解析Content-Disposition头
        const nameMatch = headerStr.match(/name="([^"]+)"/);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);
        const contentTypeMatch = headerStr.match(/Content-Type: ([^\r\n]+)/);
        
        if (nameMatch) {
          const part = {
            name: nameMatch[1],
            data: content
          };
          
          if (filenameMatch) {
            part.filename = filenameMatch[1];
          }
          
          if (contentTypeMatch) {
            part.contentType = contentTypeMatch[1];
          }
          
          parts.push(part);
        }
      }
    }
    
    start = end + boundaryBuffer.length + 2; // +2 for \r\n
    end = body.indexOf(boundaryBuffer, start);
    
    // 检查是否到达结束边界
    if (body.indexOf(endBoundaryBuffer, start) < end || end === -1) {
      break;
    }
  }
  
  return parts;
}

// 生成安全的文件名
function generateSafeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `${timestamp}_${randomStr}${ext}`;
}

// API处理函数
const apiHandlers = {
  // 图片管理API（无express版）
  '/api/images': {
    GET: (req, res) => {
      // 认证
      const authResult = auth.authenticateRequest(req);
      if (!authResult.authenticated || (!authResult.user.isAdmin && authResult.user.role !== 'admin')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden' }));
        return;
      }
      fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '读取失败' }));
          return;
        }
        const result = [];
        files.filter(f => !f.startsWith('.')).forEach(filename => {
          try {
            const stat = fs.statSync(path.join(UPLOAD_DIR, filename));
            if (stat.isFile()) {
              result.push({ filename, size: stat.size });
            }
          } catch (e) {}
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      });
    },
    POST: (req, res) => {
      // 上传图片（multipart）
      const authResult = auth.authenticateRequest(req);
      if (!authResult.authenticated || (!authResult.user.isAdmin && authResult.user.role !== 'admin')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden' }));
        return;
      }
      // 这里只做简单处理，建议用前端上传接口
      res.writeHead(501, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not implemented' }));
    },
  },
  '/api/images/upload': {
    POST: (req, res) => {
      // 认证
      const authResult = auth.authenticateRequest(req);
      if (!authResult.authenticated || (!authResult.user.isAdmin && authResult.user.role !== 'admin')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden' }));
        return;
      }
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }));
        return;
      }
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      if (!boundaryMatch) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing boundary in Content-Type' }));
        return;
      }
      const boundary = boundaryMatch[1];
      let body = Buffer.alloc(0);
      req.on('data', chunk => { body = Buffer.concat([body, chunk]); });
      req.on('end', () => {
        try {
          const parts = parseMultipart(body, boundary);
          let saved = 0;
          parts.forEach(part => {
            if (part.filename && part.data) {
              const dest = path.join(UPLOAD_DIR, part.filename);
              fs.writeFileSync(dest, part.data);
              saved++;
            }
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, saved }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '上传失败' }));
        }
      });
    }
  },
  '/api/images/': {
    DELETE: (req, res) => {
      // 删除图片
      const authResult = auth.authenticateRequest(req);
      if (!authResult.authenticated || (!authResult.user.isAdmin && authResult.user.role !== 'admin')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden' }));
        return;
      }
      const match = req.url.match(/\/api\/images\/([^\/]+)$/);
      if (!match) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少文件名' }));
        return;
      }
      const filename = decodeURIComponent(match[1]);
      const filePath = path.join(UPLOAD_DIR, filename);
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '文件不存在' }));
        return;
      }
      fs.unlink(filePath, err => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '删除失败' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
      });
    },
    POST: (req, res) => {
      // 重命名图片
      const authResult = auth.authenticateRequest(req);
      if (!authResult.authenticated || !authResult.user.isAdmin) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden' }));
        return;
      }
      const match = req.url.match(/\/api\/images\/([^\/]+)\/rename$/);
      if (!match) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少文件名' }));
        return;
      }
      const oldName = decodeURIComponent(match[1]);
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { newName } = JSON.parse(body);
          if (!newName || newName.includes('/') || newName.includes('..')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '非法文件名' }));
            return;
          }
          const oldPath = path.join(UPLOAD_DIR, oldName);
          const newPath = path.join(UPLOAD_DIR, newName);
          if (!fs.existsSync(oldPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '原文件不存在' }));
            return;
          }
          if (fs.existsSync(newPath)) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '目标文件已存在' }));
            return;
          }
          fs.rename(oldPath, newPath, err => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: '重命名失败' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            }
          });
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '请求格式错误' }));
        }
      });
    }
  },
  // 获取博客数据
  '/api/blog/posts': {
    GET: (req, res) => {
      const filePath = path.join(DATA_DIR, 'posts.json');
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          // 如果文件不存在，返回默认数据
          const defaultPosts = {
            posts: [
              {
                id: 1,
                title: "Welcome to My Blog",
                excerpt: "欢迎来到我的博客！这里我会分享一些技术文章、学习心得和生活感悟。",
                category: "生活",
                date: "2025-01-27",
                image: "📝",
                published: true,
                views: 0,
                content: "这是我的第一篇博客文章..."
              },
              {
                id: 2,
                title: "MkDocs 使用指南",
                excerpt: "MkDocs 是一个快速、简单、华丽的静态网站生成器，专门用于构建项目文档。",
                category: "技术",
                date: "2025-01-26",
                image: "📚",
                published: true,
                views: 0,
                content: "MkDocs 是一个很棒的文档生成工具..."
              },
              {
                id: 3,
                title: "Web 开发学习心得",
                excerpt: "分享我在学习 Web 开发过程中的一些心得体会，包括 HTML、CSS、JavaScript 的学习方法和实践经验。",
                category: "技术",
                date: "2025-01-25",
                image: "💻",
                published: true,
                views: 0,
                content: "Web 开发是一个不断学习的过程..."
              }
            ],
            config: {
              title: "Weitao Jiang's Blog",
              description: "分享技术见解、生活感悟和学习心得",
              author: "Weitao Jiang"
            }
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(defaultPosts));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    },
    
    POST: (req, res) => {
      // 验证JWT token
      const authResult = auth.authenticateRequest(req);
      
      if (!authResult.authenticated) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const filePath = path.join(DATA_DIR, 'posts.json');
          console.log('【博客POST】即将写入的数据:', JSON.stringify(data, null, 2));
          fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
            if (err) {
              console.error('【博客POST】写入失败:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to save data' }));
              return;
            }
            console.log('【博客POST】写入成功:', filePath);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
        } catch (e) {
          console.error('【博客POST】JSON解析失败:', e);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    },
    
    DELETE: (req, res) => {
      // 验证JWT token
      const authResult = auth.authenticateRequest(req);
      
      if (!authResult.authenticated) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }

      // 从URL中获取文章ID
      const parsedUrl = url.parse(req.url, true);
      const postId = parsedUrl.query.id;
      
      if (!postId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Post ID is required' }));
        return;
      }
      
      const filePath = path.join(DATA_DIR, 'posts.json');
      
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to read posts data' }));
          return;
        }
        
        try {
          const postsData = JSON.parse(data);
          const initialLength = postsData.posts.length;
          
          // 删除指定ID的文章
          postsData.posts = postsData.posts.filter(post => post.id !== parseInt(postId));
          
          if (postsData.posts.length === initialLength) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Post not found' }));
            return;
          }
          
          // 保存更新后的数据
          fs.writeFile(filePath, JSON.stringify(postsData, null, 2), (err) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to save data' }));
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Post deleted successfully' }));
          });
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid data format' }));
        }
      });
    }
  },

  // 获取评论数据
  '/api/blog/comments': {
    GET: (req, res) => {
      const filePath = path.join(DATA_DIR, 'comments.json');
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{}');
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    },
    
    POST: (req, res) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const filePath = path.join(DATA_DIR, 'comments.json');
          
          fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to save comments' }));
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    }
  },

  // 用户登录
  '/api/auth/login': {
    POST: (req, res) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { username, password } = JSON.parse(body);
          
          if (!username || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Username and password are required' }));
            return;
          }

          const result = await auth.login(username, password);
          
          if (result.success) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              token: result.token,
              user: result.user
            }));
          } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: result.error }));
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    }
  },

  // 更新文章阅读量（无需认证）
  '/api/blog/views': {
    POST: (req, res) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const { postId } = JSON.parse(body);
          
          if (!postId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Post ID is required' }));
            return;
          }
          
          const filePath = path.join(DATA_DIR, 'posts.json');
          
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to read posts data' }));
              return;
            }
            
            try {
              const postsData = JSON.parse(data);
              const post = postsData.posts.find(p => p.id === parseInt(postId));
              
              if (!post) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Post not found' }));
                return;
              }
              
              // 增加阅读量
              post.views = (post.views || 0) + 1;
              
              // 保存更新后的数据
              fs.writeFile(filePath, JSON.stringify(postsData, null, 2), (err) => {
                if (err) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Failed to save data' }));
                  return;
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  success: true, 
                  views: post.views 
                }));
              });
            } catch (e) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid data format' }));
            }
          });
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    }
  },

  // 验证token
  '/api/auth/verify': {
    GET: (req, res) => {
      const authResult = auth.authenticateRequest(req);
      
      if (authResult.authenticated) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          valid: true,
          user: authResult.user
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          valid: false,
          error: authResult.error
        }));
      }
    }
  },

  // 修改密码
  '/api/auth/password': {
    POST: (req, res) => {
      // 先验证当前用户
      const authResult = auth.authenticateRequest(req);
      
      if (!authResult.authenticated) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          console.log('【密码修改】收到请求体:', body);
          const { oldPassword, newPassword } = JSON.parse(body);
          console.log('【密码修改】解析后的数据:', { oldPassword: oldPassword ? '***' : 'undefined', newPassword: newPassword ? '***' : 'undefined' });
          
          if (!oldPassword || !newPassword) {
            console.log('【密码修改】缺少必需参数');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Old password and new password are required' }));
            return;
          }
          
          if (newPassword.length < 6) {
            console.log('【密码修改】新密码长度不足');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'New password must be at least 6 characters' }));
            return;
          }

          console.log('【密码修改】调用auth.changePassword，用户ID:', authResult.user.id);
          // 使用新的密码修改方法
          const result = await auth.changePassword(authResult.user.id, oldPassword, newPassword);
          console.log('【密码修改】auth.changePassword结果:', result);
          
          if (result.success) {
            console.log('【密码修改】成功');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: true, 
              message: 'Password updated successfully' 
            }));
          } else {
            console.log('【密码修改】失败:', result.error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: false,
              error: result.error 
            }));
          }
        } catch (e) {
          console.error('【密码修改】JSON解析错误:', e);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    }
  },

  // 用户管理API
  '/api/users': {
    GET: (req, res) => {
      // 验证管理员权限
      const authResult = auth.authenticateRequest(req);
      if (!authResult.authenticated || (!authResult.user.isAdmin && authResult.user.role !== 'admin')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Admin access required' }));
        return;
      }

      try {
        const users = auth.getAllUsers();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, users }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to load users' }));
      }
    },

    POST: (req, res) => {
      // 验证管理员权限
      const authResult = auth.authenticateRequest(req);
      if (!authResult.authenticated || (!authResult.user.isAdmin && authResult.user.role !== 'admin')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Admin access required' }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const userData = JSON.parse(body);
          
          if (!userData.username || !userData.password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Username and password are required' }));
            return;
          }

          const result = auth.addUser(userData);
          
          if (result.success) {
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    }
  },

  // 图片上传
  '/api/upload/image': {
    POST: (req, res) => {
      // 验证JWT token
      const authResult = auth.authenticateRequest(req);
      
      if (!authResult.authenticated) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }

      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('multipart/form-data')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }));
        return;
      }

      // 提取boundary
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      if (!boundaryMatch) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing boundary in Content-Type' }));
        return;
      }

      const boundary = boundaryMatch[1];
      let body = Buffer.alloc(0);

      req.on('data', chunk => {
        body = Buffer.concat([body, chunk]);
      });

      req.on('end', () => {
        try {
          const parts = parseMultipart(body, boundary);
          const imagePart = parts.find(part => part.filename && part.contentType && part.contentType.startsWith('image/'));

          if (!imagePart) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No image file found' }));
            return;
          }

          // 验证文件类型
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(imagePart.contentType)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unsupported image format. Allowed: jpg, png, gif, webp' }));
            return;
          }

          // 检查文件大小 (5MB 限制)
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (imagePart.data.length > maxSize) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Image size too large. Maximum size is 5MB' }));
            return;
          }

          // 生成安全的文件名
          const safeFilename = generateSafeFilename(imagePart.filename);
          const filePath = path.join(UPLOAD_DIR, safeFilename);

          // 保存文件
          fs.writeFile(filePath, imagePart.data, (err) => {
            if (err) {
              console.error('Failed to save image:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to save image' }));
              return;
            }

            // 返回图片URL
            const imageUrl = `/uploads/${safeFilename}`;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              imageUrl: imageUrl,
              url: imageUrl,  // 保持兼容性
              filename: safeFilename,
              originalName: imagePart.filename,
              size: imagePart.data.length,
              contentType: imagePart.contentType
            }));
          });
        } catch (e) {
          console.error('Error processing upload:', e);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to process upload' }));
        }
      });

      req.on('error', (err) => {
        console.error('Upload request error:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Upload failed' }));
      });
    }
  },

  // 图库管理 - 获取图片列表
  '/api/gallery/list': {
    GET: (req, res) => {
      // 验证JWT token
      const authResult = auth.authenticateRequest(req);
      
      if (!authResult.authenticated) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }

      try {
        // 读取上传目录中的所有图片
        fs.readdir(UPLOAD_DIR, (err, files) => {
          if (err) {
            console.error('读取上传目录失败:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '读取图片目录失败' }));
            return;
          }

          // 过滤出图片文件并获取详细信息
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
          const imagePromises = files
            .filter(file => {
              const ext = path.extname(file).toLowerCase();
              return imageExtensions.includes(ext);
            })
            .map(filename => {
              return new Promise((resolve) => {
                const filePath = path.join(UPLOAD_DIR, filename);
                fs.stat(filePath, (err, stats) => {
                  if (err) {
                    console.error(`获取文件信息失败 ${filename}:`, err);
                    resolve(null);
                    return;
                  }

                  // 尝试获取图片尺寸（简单实现）
                  const imageInfo = {
                    filename: filename,
                    url: `/uploads/${filename}`,
                    size: stats.size,
                    uploadTime: stats.mtime.toISOString(),
                    type: path.extname(filename).toLowerCase().substring(1)
                  };

                  // 对于某些格式，尝试获取图片尺寸
                  try {
                    const buffer = fs.readFileSync(filePath);
                    const dimensions = getImageDimensions(buffer, filename);
                    if (dimensions) {
                      imageInfo.width = dimensions.width;
                      imageInfo.height = dimensions.height;
                    }
                  } catch (e) {
                    // 忽略尺寸获取错误
                  }

                  resolve(imageInfo);
                });
              });
            });

          Promise.all(imagePromises).then(results => {
            const images = results
              .filter(img => img !== null)
              .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime)); // 按上传时间倒序

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              images: images,
              total: images.length
            }));
          });
        });
      } catch (error) {
        console.error('获取图片列表失败:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '获取图片列表失败' }));
      }
    }
  },

  // 图库管理 - 删除图片
  '/api/gallery/delete': {
    POST: (req, res) => {
      // 验证JWT token
      const authResult = auth.authenticateRequest(req);
      
      if (!authResult.authenticated) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const filenames = data.filenames;

          if (!Array.isArray(filenames) || filenames.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '请提供要删除的文件名列表' }));
            return;
          }

          // 删除文件
          const deletePromises = filenames.map(filename => {
            return new Promise((resolve) => {
              // 安全检查：确保文件名不包含路径遍历字符
              if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                resolve({ filename, success: false, error: '非法文件名' });
                return;
              }

              const filePath = path.join(UPLOAD_DIR, filename);
              
              // 检查文件是否存在
              fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                  resolve({ filename, success: false, error: '文件不存在' });
                  return;
                }

                // 删除文件
                fs.unlink(filePath, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error(`删除文件失败 ${filename}:`, unlinkErr);
                    resolve({ filename, success: false, error: '删除失败' });
                  } else {
                    resolve({ filename, success: true });
                  }
                });
              });
            });
          });

          Promise.all(deletePromises).then(results => {
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              deleted: successful.length,
              failed: failed.length,
              results: results,
              message: `成功删除 ${successful.length} 个文件${failed.length > 0 ? `，${failed.length} 个失败` : ''}`
            }));
          });

        } catch (error) {
          console.error('删除图片请求处理失败:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '请求格式错误' }));
        }
      });
    }
  }
};

// 简单的图片尺寸获取函数
function getImageDimensions(buffer, filename) {
  try {
    const ext = path.extname(filename).toLowerCase();
    
    if (ext === '.png') {
      // PNG格式尺寸获取
      if (buffer.length < 24) return null;
      if (buffer.toString('ascii', 1, 4) === 'PNG') {
        return {
          width: buffer.readUInt32BE(16),
          height: buffer.readUInt32BE(20)
        };
      }
    } else if (ext === '.jpg' || ext === '.jpeg') {
      // JPEG格式尺寸获取（简化版）
      let i = 0;
      if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8) {
        i += 2;
        while (i < buffer.length) {
          if (buffer[i] === 0xFF) {
            const marker = buffer[i + 1];
            if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
              return {
                height: (buffer[i + 5] << 8) + buffer[i + 6],
                width: (buffer[i + 7] << 8) + buffer[i + 8]
              };
            }
            i += 2 + ((buffer[i + 2] << 8) + buffer[i + 3]);
          } else {
            i++;
          }
        }
      }
    } else if (ext === '.gif') {
      // GIF格式尺寸获取
      if (buffer.length < 10) return null;
      if (buffer.toString('ascii', 0, 3) === 'GIF') {
        return {
          width: buffer.readUInt16LE(6),
          height: buffer.readUInt16LE(8)
        };
      }
    }
  } catch (e) {
    // 忽略错误
  }
  return null;
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  setCORSHeaders(res);
  
  // 添加请求日志
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // 处理OPTIONS请求（CORS预检）
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // API路由处理
  // 处理 /uploads/ 静态图片
  if (pathname.startsWith('/uploads/')) {
    const filePath = path.join(UPLOAD_DIR, pathname.replace('/uploads/', ''));
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }
      serveStaticFile(filePath, res);
    });
    return;
  }
  if (pathname.startsWith('/api/')) {
    // 动态路由匹配
    if (pathname === '/api/images' && apiHandlers['/api/images'] && apiHandlers['/api/images'][req.method]) {
      apiHandlers['/api/images'][req.method](req, res);
      return;
    }
    if (pathname === '/api/images/upload' && apiHandlers['/api/images/upload'] && apiHandlers['/api/images/upload'][req.method]) {
      apiHandlers['/api/images/upload'][req.method](req, res);
      return;
    }
    // /api/images/:filename/rename
    if (/^\/api\/images\/[^\/]+\/rename$/.test(pathname) && req.method === 'POST') {
      apiHandlers['/api/images/'].POST(req, res);
      return;
    }
    // /api/images/:filename DELETE
    if (/^\/api\/images\/[^\/]+$/.test(pathname) && req.method === 'DELETE') {
      apiHandlers['/api/images/'].DELETE(req, res);
      return;
    }
    // 其它API
    const handler = apiHandlers[pathname];
    if (handler && handler[req.method]) {
      handler[req.method](req, res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }
  
  // 静态文件处理
  let filePath;
  
  // 处理uploads目录下的图片
  if (pathname.startsWith('/uploads/')) {
    filePath = path.join(UPLOAD_DIR, pathname.replace('/uploads/', ''));
  } else {
    filePath = path.join(__dirname, pathname === '/' ? '/index.html' : pathname);
  }
  
  // 安全检查：防止路径遍历攻击
  if (!filePath.startsWith(__dirname) && !filePath.startsWith(UPLOAD_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  // 检查文件是否存在
  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    
    serveStaticFile(filePath, res);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 服务器启动成功！`);
  console.log(`📡 地址: http://localhost:${PORT}`);
  console.log(`📁 数据目录: ${DATA_DIR}`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已安全关闭');
    process.exit(0);
  });
});

// 错误处理
process.on('uncaughtException', (err) => {
  console.error('❌ 未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
});
