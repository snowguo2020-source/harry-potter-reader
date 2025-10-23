// ========================================
// 哈利波特阅读器 - JavaScript
// ========================================

class HarryPotterReader {
    constructor() {
        this.chapterData = null;
        this.audioPlayer = document.getElementById('audioPlayer');
        this.currentDifficulty = 'all'; // all, basic, intermediate
        this.showTranslation = true;
        this.currentParagraphId = null;
        
        this.init();
    }
    
    async init() {
        // 加载章节数据
        await this.loadChapterData();
        
        // 初始化UI
        this.initUI();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化音频
        this.initAudio();
    }
    
    // ========================================
    // 数据加载
    // ========================================
    async loadChapterData() {
        try {
            const response = await fetch('../data/chapter1.json');
            this.chapterData = await response.json();
            console.log('章节数据加载成功:', this.chapterData.metadata);
        } catch (error) {
            console.error('加载章节数据失败:', error);
            document.querySelector('.loading').textContent = '❌ 加载失败，请刷新页面重试';
        }
    }
    
    // ========================================
    // UI初始化
    // ========================================
    initUI() {
        if (!this.chapterData) {
            console.error('章节数据为空，无法初始化UI');
            return;
        }
        
        console.log('开始初始化UI，段落数量:', this.chapterData.paragraphs?.length);
        
        // 渲染段落
        this.renderParagraphs();
        
        // 渲染词汇面板
        this.renderVocabularyPanel();
        this.renderPhrasesPanel();
        this.renderSentencesPanel();
    }
    
    renderParagraphs() {
        const container = document.getElementById('paragraphsContainer');
        if (!container) {
            console.error('找不到段落容器元素');
            return;
        }
        
        container.innerHTML = '';
        console.log('开始渲染段落，总数:', this.chapterData.paragraphs.length);
        
        this.chapterData.paragraphs.forEach((para, index) => {
            if (index < 5) {
                console.log(`渲染段落 ${para.id}:`, para.en.substring(0, 50));
            }
            
            const paraDiv = document.createElement('div');
            paraDiv.className = 'paragraph';
            paraDiv.dataset.id = para.id;
            paraDiv.dataset.type = para.type || 'normal';
            
            // 英文段落（带高亮）
            const enDiv = document.createElement('div');
            enDiv.className = 'paragraph-en';
            enDiv.innerHTML = this.highlightText(para.en, para.id);
            
            // 中文翻译
            const zhDiv = document.createElement('div');
            zhDiv.className = 'paragraph-zh';
            zhDiv.textContent = para.zh;
            if (!this.showTranslation) {
                zhDiv.classList.add('hidden');
            }
            
            paraDiv.appendChild(enDiv);
            paraDiv.appendChild(zhDiv);
            container.appendChild(paraDiv);
        });
        
        console.log('段落渲染完成');
    }
    
    highlightText(text, paragraphId) {
        if (!this.chapterData || !text) return text;
        
        let result = text;
        
        // 只高亮词汇，简单直接
        if (this.chapterData.vocabulary && Array.isArray(this.chapterData.vocabulary)) {
            const words = this.chapterData.vocabulary.filter(v => {
                const pids = v.paragraphIds || v.paragraphs || [];
                return Array.isArray(pids) && pids.includes(paragraphId);
            });
            
            words.forEach(vocab => {
                if (!vocab.word) return;
                
                const word = vocab.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b(${word})\\b`, 'gi');
                result = result.replace(regex, (match) => {
                    return `<span class="highlight-word" data-word-id="${vocab.id}" data-word="${vocab.word}">${match}</span>`;
                });
            });
        }
        
        return result;
    }
    
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    renderVocabularyPanel() {
        const container = document.querySelector('#vocabularyTab .vocab-list');
        container.innerHTML = '';
        
        const filteredWords = this.filterByDifficulty(this.chapterData.vocabulary);
        
        if (filteredWords.length === 0) {
            container.innerHTML = '<p class="empty-state">当前难度下没有词汇</p>';
            return;
        }
        
        filteredWords.forEach(vocab => {
            const card = this.createVocabCard(vocab);
            container.appendChild(card);
        });
    }
    
    createVocabCard(vocab) {
        const card = document.createElement('div');
        card.className = `vocab-card ${vocab.difficulty || ''}`;
        card.dataset.wordId = vocab.id;
        
        card.innerHTML = `
            <div class="vocab-header">
                <div>
                    <span class="vocab-word">${vocab.word}</span>
                    <span class="vocab-phonetic">${vocab.phonetic || ''}</span>
                </div>
                <span class="vocab-pos">${vocab.pos || ''}</span>
            </div>
            <div class="vocab-meaning">${vocab.definition || vocab.meaning || ''}</div>
            ${vocab.explanation ? `<div class="vocab-explanation">${vocab.explanation}</div>` : ''}
        `;
        
        card.addEventListener('click', () => {
            const pids = vocab.paragraphIds || vocab.paragraphs || [];
            if (pids.length > 0) {
                this.scrollToParagraph(pids[0]);
            }
        });
        
        return card;
    }
    
    renderPhrasesPanel() {
        const container = document.querySelector('#phrasesTab .phrase-list');
        container.innerHTML = '';
        
        if (this.chapterData.phrases.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无短语数据</p>';
            return;
        }
        
        this.chapterData.phrases.forEach(phrase => {
            const card = this.createPhraseCard(phrase);
            container.appendChild(card);
        });
    }
    
    createPhraseCard(phrase) {
        const card = document.createElement('div');
        card.className = 'phrase-card';
        card.dataset.phraseId = phrase.id;
        
        card.innerHTML = `
            <div class="phrase-header">
                ${phrase.phrase}
                <span class="phrase-type">${this.getPhraseTypeLabel(phrase.type)}</span>
            </div>
            <div class="phrase-meaning">${phrase.meaning || ''}</div>
            ${phrase.usage ? `<div class="phrase-usage">${phrase.usage}</div>` : ''}
        `;
        
        card.addEventListener('click', () => {
            if (phrase.paragraphs && phrase.paragraphs.length > 0) {
                this.scrollToParagraph(phrase.paragraphs[0]);
            }
        });
        
        return card;
    }
    
    getPhraseTypeLabel(type) {
        const labels = {
            'idiom': '习语',
            'phrasal-verb': '动词短语',
            'collocation': '固定搭配'
        };
        return labels[type] || type;
    }
    
    renderSentencesPanel() {
        const container = document.querySelector('#sentencesTab .sentence-list');
        container.innerHTML = '';
        
        if (this.chapterData.sentences.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无重点句子</p>';
            return;
        }
        
        this.chapterData.sentences.forEach(sentence => {
            const card = this.createSentenceCard(sentence);
            container.appendChild(card);
        });
    }
    
    createSentenceCard(sentence) {
        const card = document.createElement('div');
        card.className = 'sentence-card';
        card.dataset.sentenceId = sentence.id;
        
        card.innerHTML = `
            <span class="sentence-type">${this.getSentenceTypeLabel(sentence.type)}</span>
            <div class="sentence-en">${sentence.en}</div>
            <div class="sentence-zh">${sentence.zh}</div>
            <div class="sentence-focus">💡 ${sentence.focus}</div>
            <div class="sentence-analysis">${sentence.analysis}</div>
        `;
        
        card.addEventListener('click', () => {
            this.scrollToParagraph(sentence.paragraph);
        });
        
        return card;
    }
    
    getSentenceTypeLabel(type) {
        const labels = {
            'grammar': '语法重点',
            'plot': '情节关键',
            'culture': '文化表达'
        };
        return labels[type] || type;
    }
    
    // ========================================
    // 事件绑定
    // ========================================
    bindEvents() {
        // 翻译切换
        document.getElementById('toggleTranslation').addEventListener('click', () => {
            this.toggleTranslation();
        });
        
        // 难度切换
        document.getElementById('difficultyBtn').addEventListener('click', () => {
            this.cycleDifficulty();
        });
        
        // 标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // 段落点击
        document.getElementById('paragraphsContainer').addEventListener('click', (e) => {
            // 点击词汇高亮
            if (e.target.classList.contains('highlight-word')) {
                const wordId = parseInt(e.target.dataset.wordId);
                const vocab = this.chapterData.vocabulary.find(v => v.id === wordId);
                if (vocab) {
                    this.showWordDetail(vocab);
                }
                e.stopPropagation();
                return;
            }
            
            // 点击段落本身，跳转音频
            const paraElement = e.target.closest('.paragraph');
            if (paraElement) {
                const paraId = parseInt(paraElement.dataset.id);
                this.jumpToAudio(paraId);
            }
        });
        
        // 音频控制
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        document.getElementById('speedBtn').addEventListener('click', () => {
            this.cycleSpeed();
        });
        
        document.getElementById('progressBar').addEventListener('input', (e) => {
            const time = (e.target.value / 100) * this.audioPlayer.duration;
            this.audioPlayer.currentTime = time;
        });
    }
    
    // ========================================
    // 交互功能
    // ========================================
    toggleTranslation() {
        this.showTranslation = !this.showTranslation;
        document.querySelectorAll('.paragraph-zh').forEach(el => {
            el.classList.toggle('hidden', !this.showTranslation);
        });
    }
    
    cycleDifficulty() {
        const levels = ['all', 'basic', 'intermediate'];
        const currentIndex = levels.indexOf(this.currentDifficulty);
        this.currentDifficulty = levels[(currentIndex + 1) % levels.length];
        
        const labels = {
            'all': '全部',
            'basic': '基础',
            'intermediate': '中级'
        };
        
        document.getElementById('difficultyBtn').textContent = 
            `📊 难度: ${labels[this.currentDifficulty]}`;
        
        this.updateHighlights();
        this.renderVocabularyPanel();
    }
    
    filterByDifficulty(words) {
        if (this.currentDifficulty === 'all') {
            return words;
        } else if (this.currentDifficulty === 'basic') {
            return words.filter(w => w.difficulty === 'basic');
        } else if (this.currentDifficulty === 'intermediate') {
            return words.filter(w => w.difficulty === 'basic' || w.difficulty === 'intermediate');
        }
        return words;
    }
    
    updateHighlights() {
        document.querySelectorAll('.highlight-word').forEach(el => {
            const wordId = parseInt(el.dataset.wordId);
            const vocab = this.chapterData.vocabulary.find(v => v.id === wordId);
            
            if (this.currentDifficulty === 'all') {
                el.style.display = '';
            } else if (this.currentDifficulty === 'basic') {
                el.style.display = vocab.difficulty === 'basic' ? '' : 'none';
            } else if (this.currentDifficulty === 'intermediate') {
                el.style.display = (vocab.difficulty === 'basic' || vocab.difficulty === 'intermediate') ? '' : 'none';
            }
        });
    }
    
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }
    
    
    showWordDetail(vocab) {
        // 切换到词汇标签
        this.switchTab('vocabulary');
        
        // 滚动到对应词汇卡片
        const card = document.querySelector(`.vocab-card[data-word-id="${vocab.id}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.background = '#fff5e6';
            setTimeout(() => {
                card.style.background = '';
            }, 2000);
        }
    }
    
    scrollToParagraph(paraId) {
        const para = document.querySelector(`.paragraph[data-id="${paraId}"]`);
        if (para) {
            para.scrollIntoView({ behavior: 'smooth', block: 'center' });
            para.classList.add('active');
            setTimeout(() => para.classList.remove('active'), 2000);
        }
    }
    
    showWordTooltip(element) {
        const wordId = parseInt(element.dataset.wordId);
        const vocab = this.chapterData.vocabulary.find(v => v.id === wordId);
        if (!vocab) return;
        
        const tooltip = document.getElementById('tooltipCard');
        tooltip.querySelector('.tooltip-content').innerHTML = `
            <div style="font-size: 1.1em; font-weight: 700; margin-bottom: 5px;">
                ${vocab.word} <span style="color: #718096;">${vocab.phonetic || ''}</span>
            </div>
            <div style="color: #667eea; font-size: 0.9em; margin-bottom: 8px;">${vocab.pos || ''}</div>
            <div style="color: #2d3748; margin-bottom: 8px;">${vocab.meaning}</div>
            <div style="color: #718096; font-size: 0.9em; font-style: italic;">"${vocab.context}"</div>
        `;
        
        this.positionTooltip(tooltip, element);
    }
    
    showPhraseTooltip(element) {
        const phraseId = parseInt(element.dataset.phraseId);
        const phrase = this.chapterData.phrases.find(p => p.id === phraseId);
        if (!phrase) return;
        
        const tooltip = document.getElementById('tooltipCard');
        tooltip.querySelector('.tooltip-content').innerHTML = `
            <div style="font-size: 1.1em; font-weight: 700; margin-bottom: 5px;">
                ${phrase.phrase}
            </div>
            <div style="color: #10b981; font-size: 0.9em; margin-bottom: 8px;">
                ${this.getPhraseTypeLabel(phrase.type)}
            </div>
            <div style="color: #2d3748; margin-bottom: 8px;">${phrase.meaning}</div>
            <div style="color: #718096; font-size: 0.9em;">${phrase.usage || ''}</div>
        `;
        
        this.positionTooltip(tooltip, element);
    }
    
    showSentenceTooltip(element) {
        const sentenceId = parseInt(element.dataset.sentenceId);
        const sentence = this.chapterData.sentences.find(s => s.id === sentenceId);
        if (!sentence) return;
        
        const tooltip = document.getElementById('tooltipCard');
        tooltip.querySelector('.tooltip-content').innerHTML = `
            <div style="font-size: 1em; font-weight: 700; margin-bottom: 5px;">
                ${sentence.en}
            </div>
            <div style="color: #718096; margin-bottom: 8px;">${sentence.zh}</div>
            <div style="background: #fff5e6; padding: 8px; border-radius: 5px; margin-bottom: 8px;">
                💡 ${sentence.focus}
            </div>
            <div style="color: #718096; font-size: 0.9em;">${sentence.analysis}</div>
        `;
        
        this.positionTooltip(tooltip, element);
    }
    
    positionTooltip(tooltip, element) {
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + 10}px`;
        tooltip.classList.remove('hidden');
        
        // 点击其他地方隐藏
        setTimeout(() => {
            document.addEventListener('click', () => {
                tooltip.classList.add('hidden');
            }, { once: true });
        }, 100);
    }
    
    // ========================================
    // 音频功能
    // ========================================
    initAudio() {
        // 设置音频源
        this.audioPlayer.src = '../raw/audio/chapter1.mp3';
        
        // 监听音频事件
        this.audioPlayer.addEventListener('loadedmetadata', () => {
            document.getElementById('totalTime').textContent = 
                this.formatTime(this.audioPlayer.duration);
        });
        
        this.audioPlayer.addEventListener('timeupdate', () => {
            this.updateProgress();
            this.updateCurrentParagraph();
        });
        
        this.audioPlayer.addEventListener('ended', () => {
            document.getElementById('playPauseBtn').textContent = '▶️ 播放';
            document.getElementById('playPauseBtn').classList.remove('playing');
        });
    }
    
    togglePlayPause() {
        if (this.audioPlayer.paused) {
            this.audioPlayer.play();
            document.getElementById('playPauseBtn').textContent = '⏸️ 暂停';
            document.getElementById('playPauseBtn').classList.add('playing');
        } else {
            this.audioPlayer.pause();
            document.getElementById('playPauseBtn').textContent = '▶️ 播放';
            document.getElementById('playPauseBtn').classList.remove('playing');
        }
    }
    
    cycleSpeed() {
        const speeds = [1.0, 1.25, 1.5, 0.75];
        const currentSpeed = this.audioPlayer.playbackRate;
        const currentIndex = speeds.indexOf(currentSpeed);
        const newSpeed = speeds[(currentIndex + 1) % speeds.length];
        this.audioPlayer.playbackRate = newSpeed;
        document.getElementById('speedBtn').textContent = `速度: ${newSpeed}x`;
    }
    
    updateProgress() {
        const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        document.getElementById('progressBar').value = progress;
        document.getElementById('currentTime').textContent = 
            this.formatTime(this.audioPlayer.currentTime);
    }
    
    updateCurrentParagraph() {
        const currentTime = this.audioPlayer.currentTime;
        
        // 找到当前时间对应的段落
        for (let i = this.chapterData.paragraphs.length - 1; i >= 0; i--) {
            const para = this.chapterData.paragraphs[i];
            if (para.audioStart && currentTime >= para.audioStart) {
                if (this.currentParagraphId !== para.id) {
                    this.currentParagraphId = para.id;
                    // 计算段落编号（跳过标题类型的段落）
                    const paragraphNumber = this.chapterData.paragraphs
                        .filter((p, idx) => idx <= i && p.type !== 'heading')
                        .length;
                    document.getElementById('currentParagraph').textContent = 
                        paragraphNumber > 0 ? `段落: ${paragraphNumber}` : '标题';
                    this.highlightCurrentParagraph(para.id);
                }
                break;
            }
        }
    }
    
    highlightCurrentParagraph(paraId) {
        document.querySelectorAll('.paragraph').forEach(el => {
            el.classList.remove('active');
        });
        
        const para = document.querySelector(`.paragraph[data-id="${paraId}"]`);
        if (para) {
            para.classList.add('active');
            para.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    jumpToAudio(paraId) {
        const para = this.chapterData.paragraphs.find(p => p.id === paraId);
        if (para && para.audioStart !== undefined) {
            console.log(`跳转到段落 ${paraId}，时间: ${para.audioStart}秒`);
            this.audioPlayer.currentTime = para.audioStart;
            if (this.audioPlayer.paused) {
                this.audioPlayer.play();
                document.getElementById('playPauseBtn').textContent = '⏸️ 暂停';
                document.getElementById('playPauseBtn').classList.add('playing');
            }
        } else {
            console.warn(`段落 ${paraId} 没有音频时间戳`);
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new HarryPotterReader();
});
