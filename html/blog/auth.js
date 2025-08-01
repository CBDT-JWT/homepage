// 兼容性层：重定向到JWT认证系统
// 这个文件保持向后兼容，实际认证由jwt-auth.js处理

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.initialized = false;
    console.warn('⚠️ 使用了旧的auth.js，建议迁移到jwt-auth.js');
    this.init();
  }

  // 初始化
  async init() {
    // 清理旧的localStorage数据
    const oldAuth = localStorage.getItem('blogAuth');
    if (oldAuth) {
      console.log('🧹 清理旧的认证数据...');
      localStorage.removeItem('blogAuth');
    }
    
    // 如果JWT认证系统存在，使用它
    if (window.authManager && window.authManager !== this) {
      console.log('🔄 重定向到JWT认证系统');
      this.currentUser = window.authManager.isLoggedIn() ? 'cbdt' : null;
    }
    
    this.initialized = true;
  }

  // 等待初始化完成
  async waitForInit() {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // 检查是否为管理员（兼容性方法）
  isAdmin() {
    if (window.authManager && window.authManager !== this) {
      return window.authManager.isLoggedIn();
    }
    return this.currentUser !== null;
  }

  // 检查是否已登录（兼容性方法）
  isLoggedIn() {
    if (window.authManager && window.authManager !== this) {
      return window.authManager.isLoggedIn();
    }
    return this.currentUser !== null;
  }

  // 获取当前用户
  getCurrentUser() {
    if (window.authManager && window.authManager !== this) {
      return window.authManager.isLoggedIn() ? 'cbdt' : null;
    }
    return this.currentUser;
  }

  // 登录（重定向到JWT系统）
  async login(username, password) {
    if (window.authManager && window.authManager !== this) {
      console.log('🔄 重定向到JWT登录');
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        if (result.success) {
          localStorage.setItem('jwt_token', result.token);
          this.currentUser = username;
          return { success: true, message: '登录成功' };
        } else {
          return { success: false, message: result.error || '登录失败' };
        }
      } catch (error) {
        return { success: false, message: '网络错误' };
      }
    }
    
    // 降级处理
    console.warn('⚠️ JWT认证系统未找到，请使用jwt-auth.js');
    return { success: false, message: '认证系统不可用' };
  }

  // 登出
  logout() {
    if (window.authManager && window.authManager !== this) {
      console.log('🔄 重定向到JWT登出');
      window.authManager.logout();
    }
    
    this.currentUser = null;
    localStorage.removeItem('blogAuth'); // 清理旧数据
    localStorage.removeItem('jwt_token'); // 清理JWT token
  }

  // 修改密码（重定向到JWT系统）
  async changePassword(oldPassword, newPassword) {
    console.warn('⚠️ 密码修改功能已迁移到JWT系统');
    return { 
      success: false, 
      message: '请使用新的JWT认证系统修改密码' 
    };
  }

  // 检查页面访问权限
  checkPageAccess(page) {
    const protectedPages = ['admin.html', 'write-post.html'];
    if (protectedPages.some(p => page.includes(p))) {
      return this.isLoggedIn();
    }
    return true;
  }

  // 获取登录状态信息
  getLoginStatus() {
    return {
      isLoggedIn: this.isLoggedIn(),
      isAdmin: this.isAdmin(),
      username: this.getCurrentUser(),
      loginTime: null // JWT系统中的时间信息
    };
  }

  // 扩展会话（JWT中不需要）
  extendSession() {
    console.log('ℹ️ JWT系统自动处理会话管理');
  }

  // 哈希密码（兼容性方法）
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 验证密码（兼容性方法）
  async verifyPassword(password, hashedPassword) {
    const hash = await this.hashPassword(password);
    return hash === hashedPassword;
  }

  // 会话验证（兼容性方法）
  isValidSession(authData) {
    if (!authData || !authData.timestamp) return false;
    const now = Date.now();
    const sessionAge = now - authData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    return sessionAge < maxAge;
  }
}

// 如果JWT认证系统不存在，创建兼容性实例
if (!window.authManager) {
  window.authManager = new AuthManager();
} else {
  console.log('✅ JWT认证系统已存在，跳过旧版认证初始化');
}

// 导出用于需要认证的页面的函数
async function requireAuth(redirectPage = 'index.html') {
  await window.authManager.waitForInit();
  
  if (!window.authManager.isLoggedIn()) {
    if (window.authManager.showLoginDialog) {
      // 尝试使用JWT登录对话框
      const loginResult = await window.authManager.showLoginDialog();
      return loginResult;
    } else {
      // 降级到重定向
      alert('您需要登录才能访问此页面！');
      window.location.href = redirectPage;
      return false;
    }
  }
  
  return true;
}

// 更新UI的函数
async function updateUIBasedOnAuth() {
  await window.authManager.waitForInit();
  
  const status = window.authManager.getLoginStatus();
  console.log('🔐 认证状态:', status);
  
  // 这里可以根据认证状态更新UI
  // 例如显示/隐藏管理员功能
}
