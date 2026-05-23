// ===== 公共JavaScript - 所有页面共享 =====

// 页面路由系统
const Router = {
    currentPage: 'home',
    
    // 显示指定页面
    showPage(pageId) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示目标页面
        const target = document.getElementById('page-' + pageId);
        if (target) {
            target.classList.add('active');
        }
        
        // 更新页面标题
        const titles = {
            'home': 'Python星际编程 - 青少年Python入门',
            'course': 'Python初级课程 - 星际编程',
            'intermediate': 'Python中级课程 - 星际编程',
            'advanced': 'Python高级课程 - 星际编程',
            'words': 'Python单词学习 - 星际编程',
            'quiz': 'Python题目解析 - 星际编程',
            'about': '关于课程 - 星际编程'
        };
        document.title = titles[pageId] || 'Python星际编程 - 青少年Python入门';
        
        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });
        const activeLink = document.querySelector('.nav-link[data-page="' + pageId + '"]');
        if (activeLink) {
            activeLink.classList.add('active');
            activeLink.setAttribute('aria-current', 'page');
        }
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 保存当前页面到历史记录
        this.currentPage = pageId;
        
        // 触发页面切换事件
        window.dispatchEvent(new CustomEvent('pagechange', { detail: { page: pageId } }));
        
        return true;
    },
    
    // 初始化路由
    init() {
        // 处理导航点击
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-page]');
            if (navLink && !navLink.closest('.chapter-item')) {
                e.preventDefault();
                const pageId = navLink.dataset.page;
                this.showPage(pageId);
                // 更新URL（可选）
                history.pushState({ page: pageId }, '', '#' + pageId);
            }
        });
        
        // 处理浏览器后退/前进
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.showPage(e.state.page);
            }
        });
        
        // 处理初始hash
        const hash = window.location.hash.slice(1);
        console.log('Router init, hash:', hash);
        if (hash) {
            const targetPage = document.getElementById('page-' + hash);
            console.log('Target page element:', targetPage);
            if (targetPage) {
                console.log('Showing page:', hash);
                this.showPage(hash);
            } else {
                console.log('Page not found:', 'page-' + hash);
            }
        }
    }
};

// 章节展开/收起功能
const ChapterManager = {
    toggle(header) {
        const item = header.parentElement;
        const isExpanded = item.classList.contains('expanded');
        
        // 关闭同级的其他章节（可选）
        const parent = item.parentElement;
        if (parent) {
            parent.querySelectorAll('.chapter-item').forEach(ch => {
                ch.classList.remove('expanded');
                const h = ch.querySelector('.chapter-header');
                if (h) h.setAttribute('aria-expanded', 'false');
            });
        }
        
        // 切换当前章节
        if (!isExpanded) {
            item.classList.add('expanded');
            header.setAttribute('aria-expanded', 'true');
            // 触发代码块增强
            setTimeout(() => {
                if (window.CodeEnhancer) {
                    window.CodeEnhancer.enhance();
                }
            }, 100);
        }
    },
    
    init() {
        document.addEventListener('click', (e) => {
            const header = e.target.closest('[data-toggle="chapter"]');
            if (header) {
                this.toggle(header);
            }
        });
    }
};

// 测验系统
const QuizManager = {
    handleOption(e) {
        const label = e.target.closest('.quiz-option');
        if (!label) return;
        
        const radio = label.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        
        const questionId = label.dataset.question;
        const isCorrect = label.dataset.correct === 'true';
        const parent = label.parentElement;
        const feedback = document.getElementById('feedback-' + questionId);
        
        // 禁用所有选项
        parent.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.remove('correct', 'wrong');
            opt.style.pointerEvents = 'none';
            const r = opt.querySelector('input[type="radio"]');
            if (r) r.disabled = true;
        });
        
        // 显示结果
        if (isCorrect) {
            label.classList.add('correct');
            if (feedback) {
                feedback.textContent = '🌟 天才！你的逻辑简直无懈可击！';
                feedback.className = 'quiz-feedback show correct';
            }
        } else {
            label.classList.add('wrong');
            if (feedback) {
                feedback.textContent = '🛠️ 小Bug而已，顶尖程序员都是修Bug长大的！';
                feedback.className = 'quiz-feedback show wrong';
            }
        }
    },
    
    init() {
        document.addEventListener('click', (e) => {
            const option = e.target.closest('.quiz-option');
            if (option && option.dataset.question) {
                this.handleOption(e);
            }
        });
    }
};

// 代码块增强
const CodeEnhancer = {
    tokenizePython(code) {
        const tokens = [];
        let i = 0;
        
        while (i < code.length) {
            // 多行字符串
            if ((code.substr(i, 3) === '"""') || (code.substr(i, 3) === "'''")) {
                const q = code.substr(i, 3);
                const end = code.indexOf(q, i + 3);
                if (end === -1) {
                    tokens.push({ type: 'string', value: code.substring(i) });
                    break;
                }
                tokens.push({ type: 'string', value: code.substring(i, end + 3) });
                i = end + 3;
            }
            // 单行注释
            else if (code[i] === '#') {
                const nl = code.indexOf('\n', i);
                if (nl === -1) {
                    tokens.push({ type: 'comment', value: code.substring(i) });
                    break;
                }
                tokens.push({ type: 'comment', value: code.substring(i, nl) });
                i = nl;
            }
            // 字符串
            else if (code[i] === '"' || code[i] === "'") {
                const quote = code[i];
                let prefix = '';
                if (i > 0 && 'fFrRuU'.indexOf(code[i-1]) !== -1) {
                    prefix = code[i-1];
                }
                let j = i + 1;
                while (j < code.length && code[j] !== quote) {
                    if (code[j] === '\\') j++;
                    j++;
                }
                if (j < code.length) j++;
                tokens.push({ type: 'string', value: code.substring(i - (prefix ? 1 : 0), j) });
                i = j;
            }
            // 装饰器
            else if (code[i] === '@' && (i === 0 || code[i-1] === '\n')) {
                const m = code.substring(i).match(/^@\w+/);
                if (m) {
                    tokens.push({ type: 'decorator', value: m[0] });
                    i += m[0].length;
                } else {
                    tokens.push({ type: null, value: code[i] });
                    i++;
                }
            }
            // 标识符/关键字
            else if (/[a-zA-Z_]/.test(code[i])) {
                const m = code.substring(i).match(/^[a-zA-Z_]\w*/);
                const word = m[0];
                const keywords = {'import':1,'from':1,'as':1,'class':1,'def':1,'return':1,'if':1,'elif':1,'else':1,'for':1,'while':1,'break':1,'continue':1,'pass':1,'try':1,'except':1,'finally':1,'raise':1,'with':1,'yield':1,'lambda':1,'and':1,'or':1,'not':1,'in':1,'is':1,'del':1,'global':1,'nonlocal':1,'assert':1,'async':1,'await':1};
                const constants = {'True':1,'False':1,'None':1};
                const builtins = {'print':1,'len':1,'range':1,'int':1,'str':1,'float':1,'list':1,'dict':1,'set':1,'tuple':1,'type':1,'input':1,'open':1,'super':1,'isinstance':1,'enumerate':1,'zip':1,'map':1,'filter':1,'sorted':1,'sum':1,'min':1,'max':1,'abs':1,'round':1,'hasattr':1,'getattr':1,'setattr':1,'property':1,'staticmethod':1,'classmethod':1};
                
                if (keywords[word]) {
                    tokens.push({ type: 'keyword', value: word });
                } else if (constants[word]) {
                    tokens.push({ type: 'const', value: word });
                } else if (builtins[word]) {
                    tokens.push({ type: 'builtin', value: word });
                } else if (word === 'self') {
                    tokens.push({ type: 'self', value: word });
                } else {
                    tokens.push({ type: null, value: word });
                }
                i += word.length;
            }
            // 数字
            else if (/\d/.test(code[i])) {
                const m = code.substring(i).match(/^\d+\.?\d*/);
                tokens.push({ type: 'number', value: m[0] });
                i += m[0].length;
            }
            // 其他字符
            else {
                tokens.push({ type: null, value: code[i] });
                i++;
            }
        }
        return tokens;
    },
    
    enhance() {
        const codeBlocks = document.querySelectorAll('.code-block, pre.code-block');
        
        codeBlocks.forEach(block => {
            if (block.dataset.enhanced) return;
            block.dataset.enhanced = 'true';
            
            let codeEl = null;
            if (block.tagName === 'PRE') {
                codeEl = block.querySelector('code') || block;
            } else {
                codeEl = block.querySelector('pre code') || block.querySelector('code');
            }
            if (!codeEl) return;
            
            const rawCode = codeEl.textContent || codeEl.innerText;
            
            // 添加语言标签
            const langTag = document.createElement('span');
            langTag.className = 'code-lang-tag';
            langTag.textContent = 'Python';
            block.appendChild(langTag);
            
            // 添加复制按钮
            const copyBtn = document.createElement('button');
            copyBtn.className = 'code-copy-btn';
            copyBtn.textContent = '复制';
            copyBtn.setAttribute('aria-label', '复制代码');
            block.appendChild(copyBtn);
            
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(rawCode).then(() => {
                    copyBtn.textContent = '已复制 ✓';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.textContent = '复制';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                });
            });
            
            // 语法高亮 + 行号
            const tokens = this.tokenizePython(rawCode);
            let highlighted = '';
            tokens.forEach(t => {
                const escaped = t.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                if (t.type) {
                    highlighted += '<span class="code-' + t.type + '">' + escaped + '</span>';
                } else {
                    highlighted += escaped;
                }
            });
            
            const highlightedLines = highlighted.split('\n');
            let finalHTML = '';
            const maxLineNum = String(highlightedLines.length).length;
            for (let li = 0; li < highlightedLines.length; li++) {
                let lineNum = String(li + 1);
                while (lineNum.length < maxLineNum) lineNum = ' ' + lineNum;
                finalHTML += '<span class="code-ln">' + lineNum + '</span>' + highlightedLines[li] + '\n';
            }
            codeEl.innerHTML = finalHTML.trimEnd();
        });
    },
    
    init() {
        // 延迟执行，确保DOM已加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.enhance());
        } else {
            this.enhance();
        }
    }
};

// 视觉效果管理器
const EffectsManager = {
    // 创建粒子效果
    createParticles() {
        const container = document.querySelector('.particles');
        if (!container) return;
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.opacity = Math.random() * 0.6 + 0.2;
            particle.style.animationDelay = Math.random() * 5 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
            container.appendChild(particle);
        }
        
        // 鼠标交互
        let mouseX = 0, mouseY = 0;
        let rafId = null;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    const particles = document.querySelectorAll('.particle');
                    particles.forEach((particle, index) => {
                        const speed = (index % 3 + 1) * 0.02;
                        const x = (mouseX - window.innerWidth / 2) * speed;
                        const y = (mouseY - window.innerHeight / 2) * speed;
                        particle.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                    });
                    rafId = null;
                });
            }
        });
    },
    
    // 创建星光效果
    createStars() {
        const container = document.getElementById('stars');
        if (!container) return;
        
        for (let j = 0; j < 50; j++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 4 + 2;
            star.style.width = size + 'px';
            star.style.height = size + 'px';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 12 + 's';
            star.style.animationDuration = (Math.random() * 10 + 10) + 's';
            if (Math.random() > 0.5) {
                star.classList.add(Math.random() > 0.5 ? 'big' : 'small');
            }
            container.appendChild(star);
        }
    },
    
    // 滚动进度条
    initProgressBar() {
        const progressBar = document.getElementById('progressBar');
        const nav = document.getElementById('navbar');
        
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            
            if (progressBar) {
                progressBar.style.width = scrolled + '%';
            }
            
            if (nav) {
                if (winScroll > 50) {
                    nav.style.background = 'rgba(10, 10, 26, 0.95)';
                    nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.5)';
                } else {
                    nav.style.background = 'rgba(10, 10, 26, 0.85)';
                    nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
                }
            }
        });
    },
    
    init() {
        this.createParticles();
        this.createStars();
        this.initProgressBar();
    }
};

// 键盘导航支持
const KeyboardManager = {
    init() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target;
                
                if (target.matches('[data-toggle="chapter"]')) {
                    e.preventDefault();
                    ChapterManager.toggle(target);
                } else if (target.matches('[data-page]')) {
                    e.preventDefault();
                    Router.showPage(target.dataset.page);
                }
            }
        });
    }
};

// 初始化所有模块
document.addEventListener('DOMContentLoaded', () => {
    Router.init();
    ChapterManager.init();
    QuizManager.init();
    CodeEnhancer.init();
    EffectsManager.init();
    KeyboardManager.init();
});

// 导出全局变量供其他脚本使用
window.Router = Router;
window.ChapterManager = ChapterManager;
window.QuizManager = QuizManager;
window.CodeEnhancer = CodeEnhancer;
