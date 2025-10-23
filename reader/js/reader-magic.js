// ========================================
// 哈利波特魔法阅读器 - 终极版
// ========================================

class MagicReader {
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
            console.log('✅ 数据加载:', this.data.metadata);
            console.log('📊 段落:', this.data.paragraphs.length);
            console.log('📚 词汇:', this.data.vocabulary.length);
            console.log('🔤 短语:', this.data.phrases.length);
            console.log('📝 句子:', this.data.sentences.length);
        } catch (error) {
            console.error('❌ 加载失败:', error);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        let result = this.escapeHtml(text);
        const items = [];
        
        // 收集所有需要高亮的项（句子优先，因为最长）
        this.data.sentences.forEach(sent => {
            items.push({ text: sent.en, type: 'sentence', id: sent.id });
        });
        
        this.data.phrases.forEach(phrase => {
            items.push({ text: phrase.phrase, type: 'phrase', id: phrase.id });
        });
        
        this.data.vocabulary.forEach(vocab => {
            items.push({ text: vocab.word, type: 'word', id: vocab.id });
        });
        
        // 按长度排序（长的优先）
        items.sort((a, b) => b.text.length - a.text.length);
        
        // 高亮处理
        items.forEach(item => {
            const escaped = this.escapeRegex(item.text);
            const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
            
            result = result.replace(regex, (match) => {
                // 避免重复替换
                if (match.includes('<span')) return match;
                
                const tooltip = this.getTooltipText(item);
                return `<span class="highlight-${item.type}" data-type="${item.type}" data-id="${item.id}" title="${tooltip}">${match}</span>`;
            });
        });
        
        return result;
    }
    
    getTooltipText(item) {
        let tip = '';
        if (item.type === 'word') {
            const vocab = this.data.vocabulary.find(v => v.id === item.id);
            tip = vocab ? (vocab.chinese || vocab.definition || '') : '';
        } else if (item.type === 'phrase') {
            const phrase = this.data.phrases.find(p => p.id === item.id);
            tip = phrase ? (phrase.chinese || '') : '';
        } else if (item.type === 'sentence') {
            const sent = this.data.sentences.find(s => s.id === item.id);
            tip = sent ? (sent.zh || '') : '';
        }
        return tip.replace(/"/g, '&quot;');
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
            
            const wordWithPhonetic = vocab.phonetic 
                ? `${vocab.word}<span class="word-phonetic">${vocab.phonetic}</span>`
                : vocab.word;
            
            card.innerHTML = `
                <div class="word-title">${wordWithPhonetic}</div>
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
            const para = e.target.closest('.paragraph');
            if (para && !e.target.closest('.highlight-word, .highlight-phrase, .highlight-sentence')) {
                const audioStart = parseFloat(para.dataset.audioStart);
                if (audioStart) {
                    console.log(`🎵 跳转到 ${audioStart} 秒`);
                    this.audio.currentTime = audioStart;
                    this.audio.play();
                    document.getElementById('playPauseBtn').textContent = '⏸ 暂停';
                }
            }
        });
        
        // 高亮词点击 - 跳转
        document.getElementById('paragraphsContainer').addEventListener('click', (e) => {
            const highlight = e.target.closest('.highlight-word, .highlight-phrase, .highlight-sentence');
            if (highlight) {
                e.stopPropagation();
                const type = highlight.dataset.type;
                const id = parseInt(highlight.dataset.id);
                console.log(`📍 点击 ${type} ID:${id}`);
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
        
        // 切换标签
        this.switchTab(tabName);
        
        // 延迟高亮和滚动
        setTimeout(() => {
            const cards = document.querySelectorAll(selector);
            let found = false;
            
            cards.forEach(card => {
                card.classList.remove('highlight-active');
                const cardId = parseInt(card.dataset.id);
                
                if (cardId === id) {
                    card.classList.add('highlight-active');
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    found = true;
                    console.log(`✅ 找到并高亮 ${type} ID:${id}`);
                }
            });
            
            if (!found) {
                console.warn(`⚠️ 未找到 ${type} ID:${id}`);
            }
        }, 150);
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

// 启动魔法
document.addEventListener('DOMContentLoaded', () => {
    new MagicReader();
    console.log('⚡ 魔法阅读器已启动！');
});
