// ========================================
// 哈利波特阅读器 - 简化版
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
    
    renderParagraphs() {
        const container = document.getElementById('paragraphsContainer');
        container.innerHTML = '';
        
        this.data.paragraphs.forEach(para => {
            const div = document.createElement('div');
            div.className = 'paragraph';
            div.dataset.id = para.id;
            
            const enDiv = document.createElement('div');
            enDiv.className = 'paragraph-en';
            enDiv.innerHTML = this.highlightWords(para.en, para.id);
            
            const zhDiv = document.createElement('div');
            zhDiv.className = 'paragraph-zh';
            zhDiv.textContent = para.zh;
            if (!this.showTranslation) zhDiv.style.display = 'none';
            
            div.appendChild(enDiv);
            div.appendChild(zhDiv);
            container.appendChild(div);
        });
    }
    
    highlightWords(text, paraId) {
        // 简单直接：查找所有词汇，如果在文本中出现就高亮
        let result = text;
        
        this.data.vocabulary.forEach(vocab => {
            const word = vocab.word;
            // 使用词边界，避免部分匹配
            const regex = new RegExp(`\\b(${this.escapeRegex(word)})\\b`, 'gi');
            result = result.replace(regex, `<span class="word" data-word="${word}">$1</span>`);
        });
        
        return result;
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
            card.innerHTML = `
                <div class="sent-en">${sent.en}</div>
                <div class="sent-zh">${sent.zh || ''}</div>
                <div class="sent-exp">${sent.explanation || ''}</div>
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
        
        // 段落点击 - 播放音频
        document.getElementById('paragraphsContainer').addEventListener('click', (e) => {
            const para = e.target.closest('.paragraph');
            if (para && !e.target.classList.contains('word')) {
                const paraId = parseInt(para.dataset.id);
                this.playParagraph(paraId);
            }
        });
        
        // 词汇点击 - 显示详情（暂时只console.log）
        document.getElementById('paragraphsContainer').addEventListener('click', (e) => {
            if (e.target.classList.contains('word')) {
                const word = e.target.dataset.word;
                console.log('点击词汇:', word);
                const vocab = this.data.vocabulary.find(v => v.word === word);
                if (vocab) {
                    alert(`${vocab.word}\n${vocab.phonetic || ''}\n${vocab.chinese || ''}\n${vocab.definition || ''}`);
                }
                e.stopPropagation();
            }
        });
        
        // 音频控制
        document.getElementById('playPauseBtn')?.addEventListener('click', () => {
            if (this.audio.paused) {
                this.audio.play();
                document.getElementById('playPauseBtn').textContent = '⏸️ 暂停';
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
    
    playParagraph(paraId) {
        const para = this.data.paragraphs.find(p => p.id === paraId);
        if (para && para.audioStart !== undefined) {
            console.log(`播放段落 ${paraId}，时间：${para.audioStart}秒`);
            this.audio.currentTime = para.audioStart;
            this.audio.play();
            document.getElementById('playPauseBtn').textContent = '⏸️ 暂停';
        } else {
            console.warn(`段落 ${paraId} 没有音频时间戳`);
            // 如果没有时间戳，从头播放
            this.audio.currentTime = 0;
            this.audio.play();
            document.getElementById('playPauseBtn').textContent = '⏸️ 暂停';
        }
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
