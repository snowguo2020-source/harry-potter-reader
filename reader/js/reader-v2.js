// ========================================
// 哈利波特阅读器 - 完善版
// ========================================

class HarryPotterReader {
    constructor() {
        this.data = null;
        this.audio = document.getElementById('audioPlayer');
        this.showTranslation = true;
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.renderUI();
        this.bindEvents();
        this.initAudio();
    }
    
    async loadData() {
        try {
            const response = await fetch('../data/chapter1.json');
            this.data = await response.json();
            console.log('✅ 数据加载成功:', this.data.metadata);
        } catch (error) {
            console.error('❌ 加载失败:', error);
        }
    }
    
    renderUI() {
        this.renderParagraphs();
        this.renderVocabulary();
        this.renderPhrases();
        this.renderSentences();
    }
    
    // 转义HTML标签，防止XSS和标签混乱
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    renderParagraphs() {
        const container = document.getElementById('paragraphsContainer');
        container.innerHTML = '';
        
        this.data.paragraphs.forEach(para => {
            const div = document.createElement('div');
            div.className = 'paragraph';
            div.dataset.id = para.id;
            
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
        // 先转义HTML
        let result = this.escapeHtml(text);
        
        // 创建所有需要高亮的项目列表
        const items = [];
        
        // 收集句子（最长的，优先匹配）
        this.data.sentences.forEach(sent => {
            items.push({
                text: sent.en,
                type: 'sentence',
                data: sent
            });
        });
        
        // 收集短语
        this.data.phrases.forEach(phrase => {
            items.push({
                text: phrase.phrase,
                type: 'phrase',
                data: phrase
            });
        });
        
        // 收集词汇
        this.data.vocabulary.forEach(vocab => {
            items.push({
                text: vocab.word,
                type: 'word',
                data: vocab
            });
        });
        
        // 按长度排序（长的优先，避免短词覆盖长词）
        items.sort((a, b) => b.text.length - a.text.length);
        
        // 标记已处理的位置
        const processed = new Set();
        
        // 逐个高亮
        items.forEach(item => {
            const regex = new RegExp(`\\b(${this.escapeRegex(item.text)})\\b`, 'gi');
            result = result.replace(regex, (match, p1, offset) => {
                // 检查是否已在其他标签内
                if (this.isInTag(result, offset)) {
                    return match;
                }
                
                const className = `highlight-${item.type}`;
                const tooltip = this.getTooltip(item);
                return `<span class="${className}" data-type="${item.type}" data-id="${item.data.id}" title="${tooltip}">${match}</span>`;
            });
        });
        
        return result;
    }
    
    isInTag(text, position) {
        // 检查位置是否在HTML标签内
        const before = text.substring(0, position);
        const openTags = (before.match(/</g) || []).length;
        const closeTags = (before.match(/>/g) || []).length;
        return openTags > closeTags;
    }
    
    getTooltip(item) {
        // 生成悬停提示文本
        let tooltip = '';
        if (item.type === 'word') {
            tooltip = item.data.chinese || item.data.definition || '';
        } else if (item.type === 'phrase') {
            tooltip = item.data.chinese || '';
        } else if (item.type === 'sentence') {
            tooltip = item.data.zh || '';
        }
        // 转义引号避免破坏属性
        return tooltip.replace(/"/g, '&quot;');
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
            card.innerHTML = `
                <div class="word-title">${vocab.word} ${vocab.phonetic ? vocab.phonetic : ''}</div>
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
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${tab}Tab`).classList.add('active');
            });
        });
        
        // 段落点击 - 播放音频（暂时不实现，因为没有时间戳）
        document.getElementById('paragraphsContainer').addEventListener('click', (e) => {
            const para = e.target.closest('.paragraph');
            if (para && !e.target.closest('.highlight-word, .highlight-phrase, .highlight-sentence')) {
                // 暂不处理段落点击
                console.log('段落点击，但没有音频时间戳');
            }
        });
        
        // 高亮词汇/短语/句子点击 - 跳转到右侧面板
        document.getElementById('paragraphsContainer').addEventListener('click', (e) => {
            const highlight = e.target.closest('.highlight-word, .highlight-phrase, .highlight-sentence');
            if (highlight) {
                e.stopPropagation();
                const type = highlight.dataset.type;
                const id = parseInt(highlight.dataset.id);
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
    
    jumpToDetail(type, id) {
        // 切换到对应标签
        let tabName = '';
        let containerSelector = '';
        
        if (type === 'word') {
            tabName = 'vocabulary';
            containerSelector = '#vocabularyTab .vocab-card';
        } else if (type === 'phrase') {
            tabName = 'phrases';
            containerSelector = '#phrasesTab .phrase-card';
        } else if (type === 'sentence') {
            tabName = 'sentences';
            containerSelector = '#sentencesTab .sentence-card';
        }
        
        // 切换标签
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.click();
            }
        });
        
        // 高亮对应卡片并滚动到视野
        setTimeout(() => {
            const cards = document.querySelectorAll(containerSelector);
            cards.forEach(card => {
                card.classList.remove('highlight-active');
                if (parseInt(card.dataset.id) === id) {
                    card.classList.add('highlight-active');
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }, 100);
    }
    
    initAudio() {
        this.audio.src = '../raw/audio/chapter1.mp3';
        
        this.audio.addEventListener('loadedmetadata', () => {
            document.getElementById('totalTime').textContent = this.formatTime(this.audio.duration);
        });
        
        this.audio.addEventListener('timeupdate', () => {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('progressBar').value = progress;
            document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
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
    new HarryPotterReader();
});
