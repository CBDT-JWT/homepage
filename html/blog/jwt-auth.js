// JWT 基础认证管理系统 - 仅处理token存储和API调用
class JWTAuthManager {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.sessionKey = 'jwt_token';
    this.userKey = 'current_user';
    this.initialized = false;
    this.apiBaseUrl = window.location.origin; // 使用当前域名
    this.init();
  }

  // 初始化，检查本地存储的token
  async init() {
    const savedToken = localStorage.getItem(this.sessionKey);
    const savedUser = localStorage.getItem(this.userKey);
    
    if (savedToken && savedUser) {
      try {
        this.token = savedToken;
        this.currentUser = JSON.parse(savedUser);
        
        // 验证token是否仍然有效
        const isValid = await this.verifyToken();
        if (!isValid) {
          this.logout();
        }
      } catch (error) {
        this.logout();
      }
    }
    
    this.initialized = true;
  }

  // 等待初始化完成
  async waitForInit() {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // 用户登录
  async login(username, password) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.token = result.token;
        this.currentUser = result.user;
        
        // 保存到本地存储
        localStorage.setItem(this.sessionKey, this.token);
        localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
        
        // 为了兼容性，也保存到旧的key
        localStorage.setItem('token', this.token);
        
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // 验证当前token
  async verifyToken() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.valid;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // 用户登出
  logout() {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.userKey);
    // 清理兼容性token
    localStorage.removeItem('token');
  }

  // 检查用户是否已登录
  isLoggedIn() {
    return this.currentUser !== null && this.token !== null;
  }

  // 获取当前用户信息
  getCurrentUser() {
    return this.currentUser;
  }

  // 检查当前用户是否为管理员
  isAdmin() {
    if (!this.isLoggedIn()) {
      return false;
    }
    
    // 假设管理员用户的username是'admin'或者在用户对象中有role字段
    return this.currentUser && (
      this.currentUser.username === 'admin' || 
      this.currentUser.role === 'admin' ||
      this.currentUser.isAdmin === true
    );
  }

  // 获取认证头
  getAuthHeaders() {
    if (!this.token) {
      return {};
    }
    return {
      'Authorization': `Bearer ${this.token}`
    };
  }

  // 带认证的API请求
  async authenticatedFetch(url, options = {}) {
    const authHeaders = this.getAuthHeaders();
    
    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, requestOptions);
      
      // 如果返回401，说明token无效，自动登出
      if (response.status === 401) {
        this.logout();
        throw new Error('Authentication required');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // 修改密码
  async changePassword(oldPassword, newPassword) {
    if (!this.isLoggedIn()) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('发送密码修改请求到:', `${this.apiBaseUrl}/api/auth/password`);
      
      const response = await this.authenticatedFetch(`${this.apiBaseUrl}/api/auth/password`, {
        method: 'POST',
        body: JSON.stringify({ 
          oldPassword: oldPassword,
          newPassword: newPassword 
        })
      });

      console.log('密码修改响应状态:', response.status);
      
      if (!response.ok) {
        console.error('密码修改HTTP错误:', response.status, response.statusText);
        return { success: false, error: `HTTP错误: ${response.status}` };
      }

      const result = await response.json();
      console.log('密码修改API响应:', result);
      
      return result;
    } catch (error) {
      console.error('密码修改异常:', error);
      return { success: false, error: `网络错误: ${error.message}` };
    }
  }

  // 显示登录对话框
  async showLoginDialog() {
    return new Promise((resolve) => {
      // 创建登录对话框
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        width: 300px;
        max-width: 90vw;
      `;

      dialog.innerHTML = `
        <h3 style="margin-top: 0; text-align: center;">管理员登录</h3>
        <form id="loginForm">
          <div style="margin-bottom: 1rem;">
            <label for="username" style="display: block; margin-bottom: 0.5rem;">用户名:</label>
            <input type="text" id="username" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          <div style="margin-bottom: 1rem;">
            <label for="password" style="display: block; margin-bottom: 0.5rem;">密码:</label>
            <input type="password" id="password" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          <div id="errorMsg" style="color: red; margin-bottom: 1rem; display: none;"></div>
          <div style="display: flex; gap: 1rem;">
            <button type="submit" style="flex: 1; padding: 0.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">登录</button>
            <button type="button" id="cancelBtn" style="flex: 1; padding: 0.5rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
          </div>
        </form>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      const form = dialog.querySelector('#loginForm');
      const errorMsg = dialog.querySelector('#errorMsg');
      const cancelBtn = dialog.querySelector('#cancelBtn');

      const cleanup = () => {
        document.body.removeChild(overlay);
      };

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = dialog.querySelector('#username').value;
        const password = dialog.querySelector('#password').value;

        const result = await this.login(username, password);
        if (result.success) {
          cleanup();
          resolve(true);
        } else {
          errorMsg.textContent = result.error;
          errorMsg.style.display = 'block';
        }
      });

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      // 点击背景关闭
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      });

      // 聚焦到用户名输入框
      setTimeout(() => dialog.querySelector('#username').focus(), 100);
    });
  }

  // 检查是否需要认证，如果需要则显示登录对话框
  async requireAuth() {
    await this.waitForInit();
    
    if (this.isLoggedIn()) {
      return true;
    }
    
    return await this.showLoginDialog();
  }
}

// 创建全局实例
window.authManager = new JWTAuthManager();

// 版本标识 - 用于调试
console.log('JWT Auth v1.1 - isAdmin方法已添加');
