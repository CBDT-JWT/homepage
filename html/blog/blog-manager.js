// 博客管理系统 - 服务器端存储版本
class BlogManager {
    constructor() {
        this.posts = [];
        this.comments = {};  // 评论数据结构: { postId: [comments] }
        this.config = {
            title: "Weitao Jiang's Blog",
            description: "分享技术见解、生活感悟和学习心得",
            author: "Weitao Jiang"
        };
        this.isLoaded = false;
        this.apiBaseUrl = window.location.origin;  // 使用当前域名
    }

    // 从服务器加载博客数据
    async loadData() {
        if (this.isLoaded) return;
        
        try {
            console.log('🔄 开始从服务器加载数据:', `${this.apiBaseUrl}/api/blog/posts`);
            const response = await fetch(`${this.apiBaseUrl}/api/blog/posts`);
            console.log('📡 API响应状态:', response.status, response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📄 接收到的数据:', data);
                this.posts = data.posts || [];
                this.config = data.config || this.config;
                console.log('✅ 从服务器加载数据成功，文章数量:', this.posts.length);
                console.log('📰 文章列表:', this.posts.map(p => ({ id: p.id, title: p.title })));
                this.isLoaded = true;
            } else {
                console.error('❌ 加载数据失败，HTTP状态:', response.status, '使用默认数据');
                this.loadDefaultData();
                this.isLoaded = true;
            }
        } catch (error) {
            console.error('❌ 网络错误，使用默认数据:', error);
            console.error('错误详情:', error.message);
            this.loadDefaultData();
            this.isLoaded = true;
        }
    }

    // 从服务器加载评论数据
    async loadComments() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/blog/comments`);
            if (response.ok) {
                const data = await response.json();
                this.comments = data || {};
            }
        } catch (error) {
            console.error('❌ 加载评论失败:', error);
            this.comments = {};
        }
    }

    // 保存评论数据到服务器
    async saveComments() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/blog/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.comments)
            });

            if (response.ok) {
                console.log('✅ 评论保存成功');
                return true;
            } else {
                console.error('❌ 评论保存失败');
                return false;
            }
        } catch (error) {
            console.error('❌ 保存评论时出错:', error);
            return false;
        }
    }

    // 默认数据
    loadDefaultData() {
        this.posts = [
            {
                id: 1,
                title: "Welcome to My Blog",
                excerpt: "欢迎来到我的博客！这里我会分享一些技术文章、学习心得和生活感悟。",
                category: "生活",
                date: "2025-01-27",
                image: "📝",
                published: true,
                views: 0,
                content: "## 欢迎来到我的博客\n\n这是我的第一篇博客文章！在这里，我会分享：\n\n- 📚 **技术文章**: 编程技巧、工具使用心得\n- 🎯 **学习心得**: 学习方法、经验总结\n- 🌱 **生活感悟**: 日常思考、人生感悟\n\n希望这些内容对你有所帮助！\n\n---\n\n*感谢访问，欢迎常来！* 😊"
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
                content: "## MkDocs 简介\n\nMkDocs 是一个快速、简单、华丽的静态网站生成器，专门用于构建项目文档。\n\n### 主要特性\n\n- 📝 使用 Markdown 语法编写文档\n- 🎨 多种主题可选\n- 🔧 配置简单\n- 🚀 部署方便\n\n### 快速开始\n\n```bash\n# 安装\npip install mkdocs\n\n# 创建项目\nmkdocs new my-project\ncd my-project\n\n# 启动开发服务器\nmkdocs serve\n```\n\n这就是 MkDocs 的基本用法，非常简单实用！"
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
                content: "## Web 开发学习心得\n\n学习 Web 开发是一个循序渐进的过程，以下是我的一些心得：\n\n### 学习路径\n\n1. **HTML** - 网页结构的基础\n2. **CSS** - 样式和布局\n3. **JavaScript** - 交互和动态效果\n4. **框架学习** - React、Vue 等\n\n### 实践建议\n\n- 🔨 **多动手**: 理论与实践相结合\n- 📖 **看文档**: 官方文档是最好的学习资料\n- 🤝 **多交流**: 参与开发者社区\n- 🔄 **持续学习**: Web 技术更新很快\n\n### 有用的资源\n\n- [MDN Web Docs](https://developer.mozilla.org/)\n- [JavaScript.info](https://javascript.info/)\n- [CSS-Tricks](https://css-tricks.com/)\n\n加油，Web 开发的路很有趣！"
            },
            {
                id: 4,
                title: "博客系统搭建记录",
                excerpt: "记录从零开始搭建个人博客系统的完整过程，包括前端设计、数据管理和功能实现。",
                category: "技术",
                date: "2025-01-24",
                cover: {
                    type: "image",
                    value: "/assets/server.jpg"
                },
                published: true,
                views: 0,
                content: "## 博客系统搭建记录\n\n最近完成了个人博客系统的搭建，想记录一下整个过程。\n\n![服务器配置](/assets/server.jpg)\n\n### 技术栈选择\n\n经过考虑，选择了以下技术栈：\n\n- **前端**: HTML5 + CSS3 + JavaScript\n- **样式**: 自定义CSS + 玻璃态效果\n- **数据**: LocalStorage + 未来扩展API\n- **认证**: JWT Token\n\n### 核心功能\n\n#### 1. 文章管理\n- ✅ 文章列表展示\n- ✅ 文章详情页面\n- ✅ Markdown 支持\n- ✅ 图片显示\n\n#### 2. 用户系统\n- ✅ 用户认证\n- ✅ 权限管理\n- ✅ 评论系统\n\n### 设计特色\n\n系统采用了现代化的**玻璃态设计**，具有以下特点：\n\n- 🎨 半透明背景效果\n- ✨ 柔和的阴影和模糊\n- 🌈 渐变色彩搭配\n- 📱 响应式布局\n\n### 下一步计划\n\n- [ ] 添加搜索功能\n- [ ] 实现标签系统\n- [ ] 优化SEO\n- [ ] 添加统计分析\n\n这个博客系统还在不断完善中，期待更多功能的加入！"
            },
            {
                id: 5,
                title: "线上图片测试文章",
                excerpt: "测试线上环境的图片显示功能，使用 /uploads/ 路径。",
                category: "测试",
                date: "2025-01-29",
                cover: {
                    type: "image",
                    value: "/uploads/1753685448883_9ba328684bf50184.png"
                },
                published: true,
                views: 0,
                content: "## 线上图片测试\n\n这是一个测试文章，用于验证线上环境的图片显示功能。\n\n![测试图片](/uploads/1753685448883_9ba328684bf50184.png)\n\n### 测试内容\n\n- 📷 封面图片：使用 `/uploads/` 路径\n- 🖼️ 内容图片：同样使用 `/uploads/` 路径\n- 🔄 备用机制：支持多种路径尝试\n\n如果您能看到上面的图片，说明图片路径处理功能正常工作！"
            },
            {
                id: 6,
                title: "数学公式测试",
                excerpt: "测试博客系统中的 KaTeX 数学公式渲染功能，包含各种复杂的数学表达式和公式。",
                category: "学术",
                date: "2025-08-01",
                cover: {
                    type: "emoji",
                    value: "🧮"
                },
                published: true,
                views: 0,
                content: "# 数学公式测试\n\n这篇文章用来测试博客系统中的 KaTeX 数学公式渲染功能。\n\n## 基础数学公式\n\n### 行内公式\n\n著名的质能方程：$E = mc^2$，这是爱因斯坦在1905年提出的。\n\n圆周率的近似值：$\\pi \\approx 3.14159$\n\n二次方程的解：$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n\n### 块级公式\n\n欧拉恒等式，被誉为数学中最美的公式：\n$$e^{i\\pi} + 1 = 0$$\n\n高斯积分：\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\n## 复杂公式示例\n\n### 微积分\n\n导数的定义：\n$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$\n\n分部积分公式：\n$$\\int u \\, dv = uv - \\int v \\, du$$\n\n### 线性代数\n\n矩阵乘法：\n$$\\begin{pmatrix}\na & b \\\\\\\\\nc & d\n\\end{pmatrix}\n\\begin{pmatrix}\ne & f \\\\\\\\\ng & h\n\\end{pmatrix}\n=\n\\begin{pmatrix}\nae + bg & af + bh \\\\\\\\\nce + dg & cf + dh\n\\end{pmatrix}$$\n\n特征值方程：\n$$\\det(A - \\lambda I) = 0$$\n\n### 物理学公式\n\n麦克斯韦方程组：\n$$\\begin{aligned}\n\\nabla \\times \\vec{\\mathbf{B}} -\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{E}}}{\\partial t} &= \\frac{4\\pi}{c}\\vec{\\mathbf{j}} \\\\\\\\\n\\nabla \\cdot \\vec{\\mathbf{E}} &= 4 \\pi \\rho \\\\\\\\\n\\nabla \\times \\vec{\\mathbf{E}}\\, +\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{B}}}{\\partial t} &= \\vec{\\mathbf{0}} \\\\\\\\\n\\nabla \\cdot \\vec{\\mathbf{B}} &= 0\n\\end{aligned}$$\n\n薛定谔方程：\n$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)$$\n\n### 统计学和概率论\n\n正态分布的概率密度函数：\n$$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$$\n\n贝叶斯定理：\n$$P(A|B) = \\frac{P(B|A)P(A)}{P(B)}$$\n\n## 数学符号和集合\n\n### 集合论\n\n- 自然数集：$\\mathbb{N} = \\{1, 2, 3, \\ldots\\}$\n- 整数集：$\\mathbb{Z} = \\{\\ldots, -2, -1, 0, 1, 2, \\ldots\\}$\n- 有理数集：$\\mathbb{Q}$\n- 实数集：$\\mathbb{R}$\n- 复数集：$\\mathbb{C}$\n\n集合运算：\n$$A \\cup B, \\quad A \\cap B, \\quad A \\setminus B$$\n\n### 求和与极限\n\n无穷级数：\n$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$\n\n极限：\n$$\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e$$\n\n## 总结\n\n通过这些例子，我们可以看到 KaTeX 能够很好地渲染各种数学公式，从简单的行内公式到复杂的多行对齐公式。这使得我们的博客系统能够支持学术性内容的发布。\n\n希望这个测试能够帮助验证数学公式的显示效果！"
            }
        ];
    }

    // 获取博客数据（用于管理页面）
    async getBlogData() {
        await this.loadData();
        return {
            posts: this.posts,
            config: this.config
        };
    }

    // 获取所有文章
    async getAllPosts() {
        await this.loadData();
        return this.posts.filter(post => post.published);
    }

    // 根据ID获取文章
    async getPostById(id) {
        console.log('🔍 getPostById 开始，ID:', id, '类型:', typeof id);
        await this.loadData();
        console.log('📚 当前posts数组:', this.posts.map(p => ({ id: p.id, title: p.title })));
        
        const post = this.posts.find(post => post.id === parseInt(id));
        console.log('🎯 查找结果:', post ? `找到文章: ${post.title}` : '未找到文章');
        
        if (post) {
            // 异步更新阅读量到服务器
            this.updateViewCount(post.id).then(newViews => {
                if (newViews !== null) {
                    post.views = newViews;
                    console.log('✅ 阅读量已更新:', newViews);
                }
            }).catch(error => {
                console.log('⚠️ 阅读量更新失败，但不影响文章显示:', error.message);
            });
            
            console.log('✅ 返回文章:', { id: post.id, title: post.title, content: post.content.substring(0, 50) + '...' });
            return post;
        }
        return null;
    }

    // 更新文章阅读量
    async updateViewCount(postId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/blog/views`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ postId: postId })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ 阅读量更新成功:', result.views);
                return result.views;
            } else {
                console.error('❌ 阅读量更新失败:', response.status);
                return null;
            }
        } catch (error) {
            console.error('❌ 更新阅读量时出错:', error);
            return null;
        }
    }

    // 根据ID获取文章（编辑用，不增加阅读量）
    async getPostByIdForEdit(id) {
        // 强制重新加载数据以确保获取最新信息
        this.isLoaded = false;
        await this.loadData();
        const post = this.posts.find(post => post.id === parseInt(id));
        return post ? { ...post } : null; // 返回副本避免直接修改原数据
    }

    // 获取最近的文章
    async getRecentPosts(limit = 5) {
        await this.loadData();
        return this.posts
            .filter(post => post.published)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    // 根据分类获取文章
    async getPostsByCategory(category) {
        await this.loadData();
        return this.posts.filter(post => post.published && post.category === category);
    }

    // 搜索文章
    async searchPosts(keyword) {
        await this.loadData();
        const lowerKeyword = keyword.toLowerCase();
        return this.posts.filter(post => 
            post.published && (
                post.title.toLowerCase().includes(lowerKeyword) ||
                post.excerpt.toLowerCase().includes(lowerKeyword) ||
                post.content.toLowerCase().includes(lowerKeyword)
            )
        );
    }

    // 添加或更新文章 (需要认证)
    async addOrUpdatePost(postData) {
        await this.loadData();
        if (postData.id) {
            // 更新现有文章
            const index = this.posts.findIndex(post => post.id === postData.id);
            if (index !== -1) {
                this.posts[index] = { ...this.posts[index], ...postData };
                const saved = await this.saveData();
                if (saved) {
                    console.log('✅ 文章更新成功');
                    return this.posts[index];
                } else {
                    console.error('❌ 文章更新失败');
                    return null;
                }
            }
        } else {
            // 添加新文章
            const newId = Math.max(...this.posts.map(post => post.id), 0) + 1;
            const newPost = {
                id: newId,
                views: 0,
                ...postData
            };
            this.posts.push(newPost);
            const saved = await this.saveData();
            if (saved) {
                console.log('✅ 文章添加成功');
                return newPost;
            } else {
                console.error('❌ 文章添加失败');
                return null;
            }
        }
        return null;
    }

    // 添加新文章 (需要认证)
    async addPost(postData) {
        await this.loadData();
        const newId = Math.max(...this.posts.map(p => p.id), 0) + 1;
        const newPost = {
            id: newId,
            ...postData,
            date: new Date().toISOString().split('T')[0],
            published: true,
            views: 0
        };
        this.posts.push(newPost);
        const saved = await this.saveData();
        if (saved) {
            this.isLoaded = false; // 强制下次重新加载，确保新文章显示
            console.log('✅ 文章添加成功');
            return newPost;
        } else {
            // 如果保存失败，回滚操作
            this.posts.pop();
            console.error('❌ 文章保存失败');
            return null;
        }
    }

    // 更新文章 (需要认证)
    async updatePost(id, postData) {
        await this.loadData();
        const index = this.posts.findIndex(post => post.id === parseInt(id));
        if (index !== -1) {
            // 保留原始的id、date、views等字段
            const originalPost = this.posts[index];
            this.posts[index] = { 
                ...originalPost,
                ...postData,
                id: originalPost.id, // 确保ID不变
                date: originalPost.date, // 保留原始发布日期
                views: originalPost.views // 保留浏览量
            };
            
            const saved = await this.saveData();
            if (saved) {
                console.log('✅ 文章更新成功');
                return this.posts[index];
            } else {
                // 如果保存失败，回滚操作
                this.posts[index] = originalPost;
                console.error('❌ 文章更新失败');
                return null;
            }
        }
        return null;
    }

    // 删除文章 (需要认证)
    async deletePost(id) {
        try {
            // 调用服务端DELETE API with JWT认证
            const response = await window.authManager.authenticatedFetch(`${this.apiBaseUrl}/api/blog/posts?id=${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log('✅ 文章删除成功');
                    // 重新加载数据以保持同步
                    this.isLoaded = false;
                    await this.loadData();
                    
                    // 同时删除本地评论缓存
                    delete this.comments[id];
                    await this.saveComments();
                    
                    return true;
                } else {
                    console.error('❌ 删除失败:', result.error);
                    return false;
                }
            } else {
                console.error('❌ 删除请求失败:', response.status);
                // 如果是404等HTTP错误，不要执行回退逻辑
                if (response.status === 404) {
                    console.log('⚠️ 文章不存在，可能已被删除');
                    return false;
                }
                // 对于其他HTTP错误，也不执行回退逻辑
                return false;
            }
        } catch (error) {
            if (error.message === 'Authentication required') {
                throw new Error('需要登录后才能删除文章');
            }
            console.error('❌ 网络或其他错误:', error);
            
            // 只有在网络错误或无法连接到服务器时才回退到本地删除
            // 检查是否是网络错误
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.log('⚠️ 服务器连接失败，回退到本地删除...');
                await this.loadData();
                const index = this.posts.findIndex(post => post.id === parseInt(id));
                if (index !== -1) {
                    const deletedPost = this.posts[index];
                    this.posts.splice(index, 1);
                    
                    // 同时删除相关评论
                    delete this.comments[id];
                    
                    const postSaved = await this.saveData();
                    const commentsSaved = await this.saveComments();
                    
                    if (postSaved && commentsSaved) {
                        console.log('✅ 本地删除成功');
                        return true;
                    } else {
                        // 如果保存失败，回滚操作
                        this.posts.splice(index, 0, deletedPost);
                        console.error('❌ 本地删除失败');
                        return false;
                    }
                }
            }
            return false;
        }
    }

    // 批量删除文章 (需要认证)
    async batchDeletePosts(postIds) {
        let successCount = 0;
        let failedCount = 0;
        
        // 逐个调用认证的删除API
        for (const id of postIds) {
            try {
                const response = await window.authManager.authenticatedFetch(`${this.apiBaseUrl}/api/blog/posts?id=${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        successCount++;
                        console.log(`✅ 文章 ${id} 删除成功`);
                    } else {
                        failedCount++;
                        console.error(`❌ 文章 ${id} 删除失败:`, result.error);
                    }
                } else {
                    failedCount++;
                    console.error(`❌ 文章 ${id} 删除请求失败:`, response.status);
                }
            } catch (error) {
                failedCount++;
                if (error.message === 'Authentication required') {
                    throw new Error('需要登录后才能批量删除文章');
                }
                console.error(`❌ 文章 ${id} 删除出错:`, error);
            }
        }
        
        // 删除完成后重新加载数据和评论
        if (successCount > 0) {
            this.isLoaded = false;
            await this.loadData();
            
            // 清理对应的评论缓存
            for (const id of postIds) {
                delete this.comments[id];
            }
            await this.saveComments();
        }
        
        console.log(`✅ 批量删除完成: 成功 ${successCount} 篇，失败 ${failedCount} 篇`);
        return { success: successCount, failed: failedCount };
    }

    // 获取文章统计信息
    async getStats() {
        await this.loadData();
        const totalPosts = this.posts.filter(post => post.published).length;
        const categories = [...new Set(this.posts.map(post => post.category))];
        const totalViews = this.posts.reduce((sum, post) => sum + (post.views || 0), 0);
        const totalComments = Object.values(this.comments).reduce((sum, comments) => {
            return sum + comments.reduce((commentSum, comment) => {
                return commentSum + 1 + (comment.replies ? comment.replies.length : 0);
            }, 0);
        }, 0);
        
        return {
            totalPosts,
            totalCategories: categories.length,
            totalViews,
            totalComments,
            categories
        };
    }

    // 获取评论
    async getComments(postId) {
        await this.loadComments();
        return this.comments[postId] || [];
    }

    // 添加评论
    async addComment(postId, commentData) {
        await this.loadComments();
        
        if (!this.comments[postId]) {
            this.comments[postId] = [];
        }
        
        const newComment = {
            id: Date.now(),
            ...commentData,
            timestamp: new Date().toISOString(),
            replies: []
        };
        
        this.comments[postId].push(newComment);
        
        const saved = await this.saveComments();
        if (saved) {
            console.log('✅ 评论添加成功');
            return newComment;
        } else {
            console.error('❌ 评论添加失败');
            return null;
        }
    }

    // 添加回复
    async addReply(postId, commentId, replyData) {
        await this.loadComments();
        
        const comments = this.comments[postId] || [];
        const comment = comments.find(c => c.id === commentId);
        
        if (comment) {
            if (!comment.replies) {
                comment.replies = [];
            }
            
            const newReply = {
                id: Date.now(),
                ...replyData,
                timestamp: new Date().toISOString()
            };
            
            comment.replies.push(newReply);
            
            const saved = await this.saveComments();
            if (saved) {
                console.log('✅ 回复添加成功');
                return newReply;
            } else {
                console.error('❌ 回复添加失败');
                return null;
            }
        }
        
        return null;
    }

    // 删除评论
    async deleteComment(postId, commentId) {
        await this.loadComments();
        
        const comments = this.comments[postId] || [];
        const index = comments.findIndex(c => c.id === commentId);
        
        if (index !== -1) {
            comments.splice(index, 1);
            
            const saved = await this.saveComments();
            if (saved) {
                console.log('✅ 评论删除成功');
                return true;
            } else {
                console.error('❌ 评论删除失败');
                return false;
            }
        }
        
        return false;
    }

    // 删除回复
    async deleteReply(postId, commentId, replyId) {
        await this.loadComments();
        
        const comments = this.comments[postId] || [];
        const comment = comments.find(c => c.id === commentId);
        
        if (comment && comment.replies) {
            const replyIndex = comment.replies.findIndex(r => r.id === replyId);
            
            if (replyIndex !== -1) {
                comment.replies.splice(replyIndex, 1);
                
                const saved = await this.saveComments();
                if (saved) {
                    console.log('✅ 回复删除成功');
                    return true;
                } else {
                    console.error('❌ 回复删除失败');
                    return false;
                }
            }
        }
        
        return false;
    }

    // 获取评论统计
    async getCommentStats() {
        await this.loadComments();
        
        let totalComments = 0;
        let totalReplies = 0;
        
        Object.values(this.comments).forEach(comments => {
            totalComments += comments.length;
            comments.forEach(comment => {
                if (comment.replies) {
                    totalReplies += comment.replies.length;
                }
            });
        });
        
        return {
            totalComments,
            totalReplies,
            total: totalComments + totalReplies
        };
    }

    // 获取所有评论（用于管理界面）
    async getAllComments() {
        await this.loadComments();
        
        const allComments = [];
        
        Object.keys(this.comments).forEach(postId => {
            const postComments = this.comments[postId] || [];
            
            postComments.forEach(comment => {
                allComments.push({
                    ...comment,
                    postId: parseInt(postId),
                    type: 'comment'
                });
                
                if (comment.replies) {
                    comment.replies.forEach(reply => {
                        allComments.push({
                            ...reply,
                            postId: parseInt(postId),
                            commentId: comment.id,
                            type: 'reply'
                        });
                    });
                }
            });
        });
        
        return allComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // 导出数据
    async importData(data) {
        if (data.posts) {
            this.posts = data.posts;
        }
        if (data.comments) {
            this.comments = data.comments;
        }
        if (data.config) {
            this.config = data.config;
        }
        const postSaved = await this.saveData();
        const commentsSaved = await this.saveComments();
        return postSaved && commentsSaved;
    }

    // 保存博客数据到服务器
    async saveData() {
        try {
            if (!window.authManager || typeof window.authManager.authenticatedFetch !== 'function') {
                throw new Error('认证系统未加载，无法保存数据');
            }
            const response = await window.authManager.authenticatedFetch(`${this.apiBaseUrl}/api/blog/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ posts: this.posts, config: this.config })
            });
            if (response.ok) {
                console.log('✅ 博客数据保存成功');
                return true;
            } else {
                console.error('❌ 博客数据保存失败:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ 保存博客数据时出错:', error);
            return false;
        }
    }
}


// 确保BlogManager类在全局可用
window.BlogManager = BlogManager;

// 创建全局实例
window.blogManager = new BlogManager();
