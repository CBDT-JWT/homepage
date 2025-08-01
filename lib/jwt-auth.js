const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 简单的JWT实现（用于演示，生产环境建议使用专业库）
class JWTAuth {
  constructor() {
    // JWT密钥，实际部署时应该使用环境变量
    this.secret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
    this.algorithm = 'HS256';
    
    // 用户数据文件路径
    this.usersFilePath = path.join(__dirname, '..', 'data', 'users.json');
    
    // 初始化用户数据
    this.initUserData();
  }

  // 初始化用户数据
  initUserData() {
    try {
      // 确保数据目录存在
      const dataDir = path.dirname(this.usersFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 如果用户文件不存在，创建默认用户
      if (!fs.existsSync(this.usersFilePath)) {
        const defaultUsers = {
          users: [
            {
              id: 1,
              username: 'admin',
              passwordHash: this.hashPassword('cbdt2025'),
              role: 'admin',
              permissions: ['read', 'write', 'admin'],
              email: 'admin@example.com',
              createdAt: new Date().toISOString(),
              lastLogin: null,
              isActive: true
            }
          ]
        };
        this.saveUsers(defaultUsers);
      }
    } catch (error) {
      console.error('初始化用户数据失败:', error);
    }
  }

  // 读取用户数据
  loadUsers() {
    try {
      if (fs.existsSync(this.usersFilePath)) {
        const data = fs.readFileSync(this.usersFilePath, 'utf8');
        return JSON.parse(data);
      }
      return { users: [] };
    } catch (error) {
      console.error('读取用户数据失败:', error);
      return { users: [] };
    }
  }

  // 保存用户数据
  saveUsers(userData) {
    try {
      fs.writeFileSync(this.usersFilePath, JSON.stringify(userData, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('保存用户数据失败:', error);
      return false;
    }
  }

  // 根据用户名查找用户
  findUserByUsername(username) {
    const userData = this.loadUsers();
    return userData.users.find(user => user.username === username && user.isActive);
  }

  // 根据ID查找用户
  findUserById(id) {
    const userData = this.loadUsers();
    return userData.users.find(user => user.id === id && user.isActive);
  }

  // 使用SHA-256哈希算法加密密码
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // 验证密码
  verifyPassword(password, hash) {
    const passwordHash = this.hashPassword(password);
    return passwordHash === hash;
  }

  // Base64 URL编码
  base64urlEscape(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  // Base64 URL解码
  base64urlUnescape(str) {
    str += new Array(5 - str.length % 4).join('=');
    return str.replace(/\-/g, '+').replace(/_/g, '/');
  }

  // 生成JWT Token
  generateToken(payload, expiresIn = '24h') {
    const header = {
      alg: this.algorithm,
      typ: 'JWT'
    };

    // 计算过期时间
    const now = Math.floor(Date.now() / 1000);
    let exp;
    if (expiresIn.endsWith('h')) {
      exp = now + parseInt(expiresIn) * 3600;
    } else if (expiresIn.endsWith('d')) {
      exp = now + parseInt(expiresIn) * 24 * 3600;
    } else {
      exp = now + 24 * 3600; // 默认24小时
    }

    const jwtPayload = {
      ...payload,
      iat: now,
      exp: exp
    };

    // 编码头部和载荷
    const encodedHeader = this.base64urlEscape(Buffer.from(JSON.stringify(header)).toString('base64'));
    const encodedPayload = this.base64urlEscape(Buffer.from(JSON.stringify(jwtPayload)).toString('base64'));

    // 生成签名
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64');
    const encodedSignature = this.base64urlEscape(signature);

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  }

  // 验证JWT Token
  verifyToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }

      const [encodedHeader, encodedPayload, encodedSignature] = parts;

      // 验证签名
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64');
      const expectedEncodedSignature = this.base64urlEscape(expectedSignature);

      if (encodedSignature !== expectedEncodedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      // 解码载荷
      const payload = JSON.parse(Buffer.from(this.base64urlUnescape(encodedPayload), 'base64').toString());

      // 检查过期时间
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: 'Token parsing failed' };
    }
  }

  // 用户登录
  async login(username, password) {
    // 从文件中查找用户
    const user = this.findUserByUsername(username);
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // 验证密码
    if (!this.verifyPassword(password, user.passwordHash)) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // 更新最后登录时间
    this.updateLastLogin(user.id);

    const token = this.generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        email: user.email
      }
    };
  }

  // 中间件：验证请求是否包含有效的JWT
  authenticateRequest(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'No token provided' };
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀
    const verification = this.verifyToken(token);

    if (!verification.valid) {
      return { authenticated: false, error: verification.error };
    }

    // 验证用户是否仍然存在且活跃
    const user = this.findUserById(verification.payload.id);
    if (!user) {
      return { authenticated: false, error: 'User not found or inactive' };
    }

    return { 
      authenticated: true, 
      user: {
        ...verification.payload,
        isAdmin: user.role === 'admin'
      }
    };
  }

  // 更新最后登录时间
  updateLastLogin(userId) {
    try {
      const userData = this.loadUsers();
      const userIndex = userData.users.findIndex(user => user.id === userId);
      
      if (userIndex !== -1) {
        userData.users[userIndex].lastLogin = new Date().toISOString();
        this.saveUsers(userData);
      }
    } catch (error) {
      console.error('更新登录时间失败:', error);
    }
  }

  // 修改用户密码
  updateUserPassword(userId, newPassword) {
    try {
      const userData = this.loadUsers();
      const userIndex = userData.users.findIndex(user => user.id === userId);
      
      if (userIndex !== -1) {
        userData.users[userIndex].passwordHash = this.hashPassword(newPassword);
        return this.saveUsers(userData);
      }
      return false;
    } catch (error) {
      console.error('修改密码失败:', error);
      return false;
    }
  }

  // 验证旧密码并更新新密码
  async changePassword(userId, oldPassword, newPassword) {
    const user = this.findUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!this.verifyPassword(oldPassword, user.passwordHash)) {
      return { success: false, error: 'Current password is incorrect' };
    }

    if (this.updateUserPassword(userId, newPassword)) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to update password' };
    }
  }

  // 添加新用户
  addUser(userData) {
    try {
      const users = this.loadUsers();
      
      // 检查用户名是否已存在
      if (users.users.find(user => user.username === userData.username)) {
        return { success: false, error: 'Username already exists' };
      }

      // 生成新的用户ID
      const newId = Math.max(...users.users.map(u => u.id), 0) + 1;

      const newUser = {
        id: newId,
        username: userData.username,
        passwordHash: this.hashPassword(userData.password),
        role: userData.role || 'user',
        permissions: userData.permissions || ['read'],
        email: userData.email || '',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true
      };

      users.users.push(newUser);
      
      if (this.saveUsers(users)) {
        return { success: true, user: { ...newUser, passwordHash: undefined } };
      } else {
        return { success: false, error: 'Failed to save user' };
      }
    } catch (error) {
      console.error('添加用户失败:', error);
      return { success: false, error: 'Internal error' };
    }
  }

  // 获取所有用户（不包含密码哈希）
  getAllUsers() {
    const userData = this.loadUsers();
    return userData.users.map(user => ({
      ...user,
      passwordHash: undefined
    }));
  }

  // 生成新的密码哈希（用于管理员修改密码）
  updatePassword(newPassword) {
    // 为了向后兼容，保留此方法，但实际应该使用 updateUserPassword
    return this.updateUserPassword(1, newPassword); // 假设管理员用户ID为1
  }
}

module.exports = JWTAuth;
