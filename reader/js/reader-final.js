// ========================================
// 哈利波特魔法阅读器 - 最终修复版
// ========================================

class MagicReader {
    constructor() {
        this.data = null;
        this.audio = document.getElementById('audioPlayer');
        this.showTranslation = true;
        this.tooltip = null;
        this.isSeekingManually = false; // 标记是否正在手动跳转
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.createTooltip();
        this.renderUI();
        this.bindEvents();
        this.initAudio();
    }
    
    async loadData() {
        try {
            const response = await fetch('../data/chapter1.json');
            this.data = await response.json();
            console.log('✅ 数据加载成功');
            console.log('📊 段落:', this.data.paragraphs.length);
            console.log('📚 词汇:', this.data.vocabulary.length);
            console.log('🔤 短语:', this.data.phrases.length);
            console.log('📝 句子:', this.data.sentences.length);
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
            // 直接设置innerHTML，不使用escapeHtml
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
        // 不使用escapeHtml，保持原文本
        let result = text;
        const replacements = [];
        
        // 收集所有匹配项（包括位置信息）
        const items = [];
        
        // 句子（最长，优先级最高）
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
        
        // 按长度排序，长的优先
        items.sort((a, b) => b.text.length - a.text.length);
        
        // 去重：如果有重叠，保留长的
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
        
        // 构建带标记的HTML
        let offset = 0;
        let newHtml = '';
        
        validItems.forEach(item => {
            // 添加之前的文本
            newHtml += text.substring(offset, item.start);
            
            // 添加高亮标记
            const tooltip = this.getTooltipData(item);
            
            // 调试关键词
            if (['owl', 'drive', 'tantrum'].includes(item.text.toLowerCase())) {
                console.log(`📝 生成tooltip for "${item.text}":`, tooltip);
            }
            
            newHtml += `<span class="highlight-${item.type}" data-type="${item.type}" data-id="${item.id}" data-tooltip='${JSON.stringify(tooltip).replace(/'/g, "&apos;")}'>${item.text}</span>`;
            
            offset = item.end;
        });
        
        // 添加剩余文本
        newHtml += text.substring(offset);
        
        return newHtml;
    }
    
    getTooltipData(item) {
        if (item.type === 'word') {
            const vocab = item.original;
            return {
                type: 'word',
                word: vocab.word || '',
                phonetic: vocab.phonetic || '',
                chinese: vocab.chinese || vocab.definition || ''
            };
        } else if (item.type === 'phrase') {
            const phrase = item.original;
            return {
                type: 'phrase',
                phrase: phrase.phrase || '',
                chinese: phrase.chinese || phrase.explanation || ''
            };
        } else if (item.type === 'sentence') {
            const sent = item.original;
            return {
                type: 'sentence',
                en: sent.en || '',
                zh: sent.zh || ''
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
        
        // 段落点击 - 播放音频
        document.getElementById('paragraphsContainer').addEventListener('click', (e) => {
            // 确保不是点击高亮元素
            if (e.target.closest('.highlight-word, .highlight-phrase, .highlight-sentence')) {
                console.log('⏭️ 点击了高亮词，忽略');
                return;
            }
            
            const para = e.target.closest('.paragraph');
            if (para) {
                const audioStartStr = para.dataset.audioStart;
                const audioStart = parseFloat(audioStartStr);
                
                console.log('====================================');
                console.log('🎵 点击段落 ID:', para.dataset.id);
                console.log('� dataset.audioStart (字符串):', audioStartStr);
                console.log('📍 audioStart (数字):', audioStart);
                console.log('⏱️ 当前时间:', this.audio.currentTime, '秒');
                console.log('🔊 音频状态:', this.audio.paused ? '暂停' : '播放中');
                console.log('🎚️ 音频就绪状态:', this.audio.readyState);
                
                if (!audioStartStr || audioStartStr === 'undefined') {
                    console.error('❌ 段落没有audioStart属性！');
                    return;
                }
                
                if (isNaN(audioStart)) {
                    console.error('❌ audioStart不是有效数字:', audioStartStr);
                    return;
                }
                
                // 先暂停
                if (!this.audio.paused) {
                    this.audio.pause();
                    console.log('⏸️ 先暂停音频');
                }
                
                // 设置时间
                console.log('⏩ 即将设置时间为:', audioStart);
                this.audio.currentTime = audioStart;
                console.log('✓ 时间已设置，currentTime =', this.audio.currentTime);
                
                // 等待100ms确保时间设置生效
                setTimeout(() => {
                    console.log('▶️ 准备播放，验证时间:', this.audio.currentTime);
                    
                    if (Math.abs(this.audio.currentTime - audioStart) > 1) {
                        console.warn('⚠️ 时间设置可能失败，期望:', audioStart, '实际:', this.audio.currentTime);
                    }
                    
                    this.audio.play().then(() => {
                        console.log('✅ 音频开始播放，最终时间:', this.audio.currentTime.toFixed(2));
                        document.getElementById('playPauseBtn').textContent = '⏸ 暂停';
                    }).catch(err => {
                        console.error('❌ 音频播放失败:', err);
                    });
                }, 150);
                
                console.log('====================================');
            } else {
                console.log('⚠️ 未找到.paragraph元素');
            }
        });
        
        // 高亮词鼠标悬停
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
            const highlight = e.target.closest('.highlight-word, .highlight-phrase, .highlight-sentence');
            if (highlight && this.tooltip.style.display === 'block') {
                this.updateTooltipPosition(e);
            }
        });
        
        // 高亮词点击
        document.getElementById('paragraphsContainer').addEventListener('click', (e) => {
            const highlight = e.target.closest('.highlight-word, .highlight-phrase, .highlight-sentence');
            if (highlight) {
                e.stopPropagation();
                const type = highlight.dataset.type;
                const id = highlight.dataset.id; // 不转换为数字，保持字符串
                console.log('👆 点击', type, 'ID:', id);
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
                document.getElementById('playPauseBtn').textContent = '▶ 播放';
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
            const dataStr = element.dataset.tooltip;
            if (!dataStr) {
                console.warn('⚠️ 元素没有tooltip数据');
                return;
            }
            
            const data = JSON.parse(dataStr);
            console.log('💡 显示tooltip:', data);
            
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
                const phrase = data.phrase || '?';
                const chinese = data.chinese || '暂无释义';
                
                content = `
                    <div class="tooltip-phrase">${phrase}</div>
                    <div class="tooltip-chinese">${chinese}</div>
                `;
            } else if (data.type === 'sentence') {
                const zh = data.zh || '暂无翻译';
                
                content = `
                    <div class="tooltip-zh">${zh}</div>
                `;
            }
            
            if (!content) {
                console.warn('⚠️ 无法生成tooltip内容');
                return;
            }
            
            this.tooltip.innerHTML = content;
            this.tooltip.className = `magic-tooltip tooltip-${data.type}`;
            this.tooltip.style.display = 'block';
            this.updateTooltipPosition(event);
        } catch (err) {
            console.error('❌ Tooltip显示错误:', err);
        }
    }
    
    updateTooltipPosition(event) {
        const x = event.pageX + 15;
        const y = event.pageY + 15;
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
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
            let found = false;
            
            cards.forEach(card => {
                card.classList.remove('highlight-active');
                const cardId = card.dataset.id; // 不转换，直接字符串比较
                
                if (cardId === id || cardId == id) { // 使用==允许类型转换
                    card.classList.add('highlight-active');
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    found = true;
                    console.log(`✅ 找到 ${type} ID:${id}`);
                }
            });
            
            if (!found) {
                console.warn(`⚠️ 未找到 ${type} ID:${id}，检查数据...`);
                console.log('可用的IDs:', Array.from(cards).map(c => c.dataset.id));
            }
        }, 150);
    }
    
    initAudio() {
        this.audio.src = '../raw/audio/chapter1.mp3';
        this.audio.preload = 'auto'; // 预加载音频
        
        this.audio.addEventListener('loadedmetadata', () => {
            const totalTime = this.formatTime(this.audio.duration);
            document.getElementById('totalTime').textContent = totalTime;
            console.log('🎵 音频元数据加载完成');
            console.log('📊 总时长:', totalTime, '(' + this.audio.duration + '秒)');
            console.log('🎚️ 就绪状态:', this.audio.readyState);
        });
        
        this.audio.addEventListener('loadeddata', () => {
            console.log('📦 音频数据加载完成，就绪状态:', this.audio.readyState);
        });
        
        this.audio.addEventListener('canplay', () => {
            console.log('✅ 音频可以播放了，就绪状态:', this.audio.readyState);
        });
        
        this.audio.addEventListener('canplaythrough', () => {
            console.log('✅ 音频完全加载，可以流畅播放');
        });
        
        this.audio.addEventListener('timeupdate', () => {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('progressBar').value = progress;
            document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
        });
        
        this.audio.addEventListener('play', () => {
            console.log('▶️ 音频播放中，时间:', this.audio.currentTime.toFixed(2));
        });
        
        this.audio.addEventListener('pause', () => {
            console.log('⏸️ 音频暂停，时间:', this.audio.currentTime.toFixed(2));
        });
        
        this.audio.addEventListener('seeked', () => {
            console.log('⏩ 跳转完成，当前时间:', this.audio.currentTime.toFixed(2));
        });
        
        this.audio.addEventListener('seeking', () => {
            console.log('⏩ 正在跳转到时间:', this.audio.currentTime.toFixed(2));
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('❌ 音频错误:', e);
            console.error('错误代码:', this.audio.error?.code);
            console.error('错误信息:', this.audio.error?.message);
        });
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
