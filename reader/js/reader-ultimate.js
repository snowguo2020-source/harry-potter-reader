// ========================================
// 哈利波特魔法阅读器 - 最终修复版
// ========================================

class MagicReader {
    constructor() {
        this.data = null;
        this.audio = document.getElementById('audioPlayer');
        this.showTranslation = true;
        this.tooltip = null;
        this.isSeeking = false; // 防止跳转冲突
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.createTooltip();
        this.renderUI();
        this.initAudio();
        this.bindEvents();
    }
    
    async loadData() {
        try {
            const response = await fetch('../data/chapter1.json');
            this.data = await response.json();
            console.log('✅ 数据加载成功');
        } catch (error) {
            console.error('❌ 加载失败:', error);
        }
    }
    
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'magic-tooltip';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);
    }
    
    renderUI() {
        this.renderParagraphs();
        this.renderVocabulary();
        this.renderPhrases();
        this.renderSentences();
    }
    
    renderParagraphs() {
        const container = document.getElementById('paragraphsContainer');
        container.innerHTML = '';
        
        this.data.paragraphs.forEach(para => {
            const div = document.createElement('div');
            div.className = 'paragraph';
            div.dataset.id = para.id;
            div.dataset.audioStart = para.audioStart || 0;
            
            const enDiv = document.createElement('div');
            enDiv.className = 'paragraph-en';
            enDiv.innerHTML = this.highlightText(para.en);
            
            const zhDiv = document.createElement('div');
            zhDiv.className = 'paragraph-zh';
            zhDiv.textContent = para.zh;
            if (!this.showTranslation) zhDiv.style.display = 'none';
            
            div.appendChild(enDiv);
            div.appendChild(zhDiv);
            container.appendChild(div);
        });
    }
    
    highlightText(text) {
        let result = text;
        const replacements = [];
        
        // 收集所有匹配项
        const items = [];
        
        // 句子
        this.data.sentences.forEach(sent => {
            const regex = new RegExp(this.escapeRegex(sent.en), 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                items.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                    type: 'sentence',
                    id: sent.id,
                    original: sent
                });
            }
        });
        
        // 短语
        this.data.phrases.forEach(phrase => {
            const regex = new RegExp(`\\b${this.escapeRegex(phrase.phrase)}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                items.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                    type: 'phrase',
                    id: phrase.id,
                    original: phrase
                });
            }
        });
        
        // 单词
        this.data.vocabulary.forEach(vocab => {
            const regex = new RegExp(`\\b${this.escapeRegex(vocab.word)}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                items.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                    type: 'word',
                    id: vocab.id,
                    original: vocab
                });
            }
        });
        
        // 按长度排序
        items.sort((a, b) => b.text.length - a.text.length);
        
        // 去重
        const validItems = [];
        for (const item of items) {
            const overlaps = validItems.some(v => 
                (item.start >= v.start && item.start < v.end) ||
                (item.end > v.start && item.end <= v.end) ||
                (item.start <= v.start && item.end >= v.end)
            );
            if (!overlaps) {
                validItems.push(item);
            }
        }
        
        // 按位置排序
        validItems.sort((a, b) => a.start - b.start);
        
        // 构建HTML
        let offset = 0;
        let newHtml = '';
        
        validItems.forEach(item => {
            newHtml += text.substring(offset, item.start);
            
            const tooltip = this.getTooltipData(item);
            const tooltipStr = JSON.stringify(tooltip).replace(/'/g, "&apos;");
            newHtml += `<span class="highlight-${item.type}" data-type="${item.type}" data-id="${item.id}" data-tooltip='${tooltipStr}'>${item.text}</span>`;
            
            offset = item.end;
        });
        
        newHtml += text.substring(offset);
        return newHtml;
    }
    
    getTooltipData(item) {
        if (item.type === 'word') {
            const vocab = item.original;
            // 优先使用chinese，如果为空则从definition中提取第一句（括号前的内容）
            let chinese = vocab.chinese || '';
            if (!chinese || chinese.trim() === '') {
                const def = vocab.definition || '';
                // 提取第一句或括号前的内容
                const match = def.match(/^([^(（]+)/);
                chinese = match ? match[1].trim() : def.substring(0, 20);
            }
            
            return {
                type: 'word',
                word: vocab.word || '',
                phonetic: vocab.phonetic || '',
                chinese: chinese
            };
        } else if (item.type === 'phrase') {
            return {
                type: 'phrase',
                phrase: item.original.phrase || '',
                chinese: item.original.chinese || ''
            };
        } else if (item.type === 'sentence') {
            return {
                type: 'sentence',
                zh: item.original.zh || ''
            };
        }
        return {};
    }
    
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    renderVocabulary() {
        const container = document.querySelector('#vocabularyTab .vocab-list');
        container.innerHTML = '';
        
        this.data.vocabulary.forEach(vocab => {
            const card = document.createElement('div');
            card.className = 'vocab-card';
            card.dataset.id = vocab.id;
            
            const wordHtml = vocab.phonetic 
                ? `${vocab.word}<span class="word-phonetic">${vocab.phonetic}</span>`
                : vocab.word;
            
            card.innerHTML = `
                <div class="word-title">${wordHtml}</div>
                <div class="word-pos">${vocab.pos || ''}</div>
                <div class="word-chinese">${vocab.chinese || ''}</div>
                <div class="word-def">${vocab.definition || ''}</div>
            `;
            container.appendChild(card);
        });
    }
    
    renderPhrases() {
        const container = document.querySelector('#phrasesTab .phrase-list');
        container.innerHTML = '';
        
        this.data.phrases.forEach(phrase => {
            const card = document.createElement('div');
            card.className = 'phrase-card';
            card.dataset.id = phrase.id;
            card.innerHTML = `
                <div class="phrase-title">${phrase.phrase}</div>
                <div class="phrase-chinese">${phrase.chinese || ''}</div>
                <div class="phrase-exp">${phrase.explanation || ''}</div>
            `;
            container.appendChild(card);
        });
    }
    
    renderSentences() {
        const container = document.querySelector('#sentencesTab .sentence-list');
        container.innerHTML = '';
        
        this.data.sentences.forEach(sent => {
            const card = document.createElement('div');
            card.className = 'sentence-card';
            card.dataset.id = sent.id;
            card.innerHTML = `
                <div class="sent-en">${sent.en}</div>
                <div class="sent-zh">${sent.zh || ''}</div>
                ${sent.explanation ? `<div class="sent-exp">${sent.explanation}</div>` : ''}
            `;
            container.appendChild(card);
        });
    }
    
    initAudio() {
        this.audio.src = '../raw/audio/chapter1.mp3';
        this.audio.preload = 'auto';
        
        this.audio.addEventListener('loadedmetadata', () => {
            document.getElementById('totalTime').textContent = this.formatTime(this.audio.duration);
            console.log('🎵 音频加载完成，时长:', this.audio.duration);
        });
        
        // ⚠️ 关键修改：timeupdate完全不干预currentTime
        this.audio.addEventListener('timeupdate', () => {
            if (!this.isSeeking) {
                const progress = (this.audio.currentTime / this.audio.duration) * 100;
                document.getElementById('progressBar').value = progress;
                document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
            }
        });
        
        // 🔍 监控所有可能改变currentTime的事件
        ['seeking', 'seeked', 'play', 'pause', 'loadeddata'].forEach(event => {
            this.audio.addEventListener(event, () => {
                console.log(`📢 [${event}] currentTime =`, this.audio.currentTime.toFixed(2));
            });
        });
    }
    
    bindEvents() {
        // 翻译切换
        document.getElementById('toggleTranslation')?.addEventListener('click', () => {
            this.showTranslation = !this.showTranslation;
            document.querySelectorAll('.paragraph-zh').forEach(el => {
                el.style.display = this.showTranslation ? '' : 'none';
            });
        });
        
        // 标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
        
        // ★★★ 段落点击 - 音频跳转 ★★★
        document.getElementById('paragraphsContainer').addEventListener('click', (e) => {
            if (e.target.closest('.highlight-word, .highlight-phrase, .highlight-sentence')) {
                return;
            }
            
            const para = e.target.closest('.paragraph');
            if (para) {
                const audioStart = parseFloat(para.dataset.audioStart);
                
                console.log('═══════════════════════════════════');
                console.log('� 点击段落ID:', para.dataset.id);
                console.log('📍 目标时间:', audioStart, '秒');
                console.log('⏱️ 当前时间:', this.audio.currentTime.toFixed(2), '秒');
                console.log('▶️ 播放状态:', this.audio.paused ? '暂停中' : '播放中');
                
                if (!isNaN(audioStart) && audioStart >= 0) {
                    // 🔥 最直接的方法
                    this.isSeeking = true;
                    
                    // 1. 暂停
                    const wasPaused = this.audio.paused;
                    if (!wasPaused) {
                        this.audio.pause();
                        console.log('⏸️ 已暂停音频');
                    }
                    
                    // 2. 等待一小段时间确保暂停生效
                    setTimeout(() => {
                        console.log('⏩ 设置 currentTime =', audioStart);
                        console.log('📊 设置前 currentTime =', this.audio.currentTime.toFixed(2));
                        
                        // 3. 设置时间
                        this.audio.currentTime = audioStart;
                        
                        console.log('📊 设置后立即读取 currentTime =', this.audio.currentTime.toFixed(2));
                        
                        // 4. 等待seeked事件
                        const onSeeked = () => {
                            console.log('✅ Seeked完成！');
                            console.log('📊 最终 currentTime =', this.audio.currentTime.toFixed(2));
                            console.log('📏 与目标差值 =', Math.abs(this.audio.currentTime - audioStart).toFixed(2), '秒');
                            
                            // 5. 播放
                            this.audio.play()
                                .then(() => {
                                    console.log('▶️ 播放成功！');
                                    document.getElementById('playPauseBtn').textContent = '⏸ 暂停';
                                })
                                .catch(err => {
                                    console.error('❌ 播放失败:', err);
                                })
                                .finally(() => {
                                    this.isSeeking = false;
                                    console.log('═══════════════════════════════════\n');
                                });
                        };
                        
                        this.audio.addEventListener('seeked', onSeeked, { once: true });
                        
                        // 6. 超时保护
                        setTimeout(() => {
                            if (this.isSeeking) {
                                console.warn('⚠️ Seeked事件超时！强制播放');
                                this.isSeeking = false;
                                this.audio.play();
                                console.log('═══════════════════════════════════\n');
                            }
                        }, 2000);
                        
                    }, 50); // 等待50ms确保暂停生效
                    
                } else {
                    console.error('❌ 无效的audioStart:', audioStart);
                    console.log('═══════════════════════════════════\n');
                }
            }
        });
        
        // 高亮词悬停
        document.getElementById('paragraphsContainer').addEventListener('mouseover', (e) => {
            const highlight = e.target.closest('.highlight-word, .highlight-phrase, .highlight-sentence');
            if (highlight) {
                this.showTooltip(highlight, e);
            }
        });
        
        document.getElementById('paragraphsContainer').addEventListener('mouseout', (e) => {
            const highlight = e.target.closest('.highlight-word, .highlight-phrase, .highlight-sentence');
            if (highlight) {
                this.hideTooltip();
            }
        });
        
        document.getElementById('paragraphsContainer').addEventListener('mousemove', (e) => {
            if (this.tooltip.style.display === 'block') {
                this.updateTooltipPosition(e);
            }
        });
        
        // 高亮词点击
        document.getElementById('paragraphsContainer').addEventListener('click', (e) => {
            const highlight = e.target.closest('.highlight-word, .highlight-phrase, .highlight-sentence');
            if (highlight) {
                e.stopPropagation();
                const type = highlight.dataset.type;
                const id = highlight.dataset.id;
                this.jumpToDetail(type, id);
            }
        });
        
        // 音频控制
        document.getElementById('playPauseBtn')?.addEventListener('click', () => {
            if (this.audio.paused) {
                this.audio.play();
                document.getElementById('playPauseBtn').textContent = '⏸ 暂停';
            } else {
                this.audio.pause();
                document.getElementById('playPauseBtn').textContent = '▶️ 播放';
            }
        });
        
        document.getElementById('speedBtn')?.addEventListener('click', () => {
            const speeds = [1.0, 1.25, 1.5, 0.75];
            const currentIndex = speeds.indexOf(this.audio.playbackRate);
            const newSpeed = speeds[(currentIndex + 1) % speeds.length];
            this.audio.playbackRate = newSpeed;
            document.getElementById('speedBtn').textContent = `速度: ${newSpeed}x`;
        });
        
        document.getElementById('progressBar')?.addEventListener('input', (e) => {
            const time = (e.target.value / 100) * this.audio.duration;
            this.audio.currentTime = time;
        });
    }
    
    showTooltip(element, event) {
        try {
            const data = JSON.parse(element.dataset.tooltip);
            
            let content = '';
            if (data.type === 'word') {
                const word = data.word || '?';
                const phonetic = data.phonetic ? `<div class="tooltip-phonetic">${data.phonetic}</div>` : '';
                const chinese = data.chinese || '暂无释义';
                
                content = `
                    <div class="tooltip-word">${word}</div>
                    ${phonetic}
                    <div class="tooltip-chinese">${chinese}</div>
                `;
            } else if (data.type === 'phrase') {
                content = `
                    <div class="tooltip-phrase">${data.phrase || '?'}</div>
                    <div class="tooltip-chinese">${data.chinese || '暂无释义'}</div>
                `;
            } else if (data.type === 'sentence') {
                content = `
                    <div class="tooltip-zh">${data.zh || '暂无翻译'}</div>
                `;
            }
            
            this.tooltip.innerHTML = content;
            this.tooltip.className = `magic-tooltip tooltip-${data.type}`;
            this.tooltip.style.display = 'block';
            this.updateTooltipPosition(event);
        } catch (err) {
            console.error('❌ Tooltip错误:', err);
        }
    }
    
    updateTooltipPosition(event) {
        this.tooltip.style.left = (event.pageX + 15) + 'px';
        this.tooltip.style.top = (event.pageY + 15) + 'px';
    }
    
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }
    
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        const btn = document.querySelector(`[data-tab="${tabName}"]`);
        const content = document.getElementById(`${tabName}Tab`);
        
        if (btn) btn.classList.add('active');
        if (content) content.classList.add('active');
    }
    
    jumpToDetail(type, id) {
        let tabName = '';
        let selector = '';
        
        if (type === 'word') {
            tabName = 'vocabulary';
            selector = '#vocabularyTab .vocab-card';
        } else if (type === 'phrase') {
            tabName = 'phrases';
            selector = '#phrasesTab .phrase-card';
        } else if (type === 'sentence') {
            tabName = 'sentences';
            selector = '#sentencesTab .sentence-card';
        }
        
        this.switchTab(tabName);
        
        setTimeout(() => {
            const cards = document.querySelectorAll(selector);
            cards.forEach(card => {
                card.classList.remove('highlight-active');
                if (card.dataset.id == id) {
                    card.classList.add('highlight-active');
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }, 150);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// 启动
document.addEventListener('DOMContentLoaded', () => {
    new MagicReader();
    console.log('⚡ 魔法阅读器已启动！');
});
