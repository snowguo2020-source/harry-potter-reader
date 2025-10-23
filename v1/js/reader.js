// 全局变量
let chapterData = null;
let audioElement = null;
let showTranslation = true;
let currentParagraphIndex = -1;

// 音频时间戳 (从 PLAN.md)
const timeStamps = [
    [0, 34], [34, 49], [49, 77], [77, 121], [121, 142], [142, 147], [147, 168], [168, 221],
    [221, 285], [285, 329], [329, 351], [351, 357], [357, 366], [366, 409], [409, 420],
    [420, 453], [453, 457], [457, 478], [478, 493], [493, 510], [510, 531], [531, 566],
    [566, 594], [594, 607], [607, 622], [622, 629], [629, 632], [632, 642], [642, 645],
    [645, 652], [652, 670], [670, 674], [674, 678], [678, 681], [681, 688], [688, 705],
    [705, 718], [718, 750], [750, 754], [754, 781], [781, 794], [794, 828], [828, 856],
    [856, 905], [905, 910], [910, 932], [932, 935], [935, 941], [941, 946], [946, 955],
    [955, 957], [957, 986], [986, 994], [994, 1009], [1009, 1030], [1030, 1039], [1039, 1041],
    [1041, 1046], [1046, 1056], [1056, 1089], [1089, 1104], [1104, 1111], [1111, 1117],
    [1117, 1125], [1125, 1139], [1139, 1168], [1168, 1186], [1186, 1191], [1191, 1198],
    [1198, 1206], [1206, 1230], [1230, 1233], [1233, 1251], [1251, 1256], [1256, 1286],
    [1286, 1294], [1294, 1301], [1301, 1326], [1326, 1336], [1336, 1362], [1362, 1386],
    [1386, 1403], [1403, 1405], [1405, 1411], [1411, 1415], [1415, 1426], [1426, 1443],
    [1443, 1476], [1476, 1485], [1485, 1496], [1496, 1498], [1498, 1509], [1509, 1525],
    [1525, 1529], [1529, 1534], [1534, 1537], [1537, 1553], [1553, 1558], [1558, 1574],
    [1574, 1578], [1578, 1593], [1593, 1630], [1630, 1639], [1639, 1649], [1649, 1661],
    [1661, 1671], [1671, 1693], [1693, 1702]
];

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadChapterData();
        initAudioPlayer();
        renderContent();
        renderVocabulary();
        setupEventListeners();
    } catch (error) {
        console.error('初始化失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});

// 加载章节数据
async function loadChapterData() {
    const response = await fetch('data/chapter1.json');
    chapterData = await response.json();
    
    // 更新统计信息
    document.getElementById('paragraph-count').textContent = chapterData.paragraphs.length;
    document.getElementById('word-count').textContent = chapterData.vocabulary.length;
    document.getElementById('phrase-count').textContent = chapterData.phrases.length;
    document.getElementById('sentence-count').textContent = chapterData.sentences.length;
    
    document.getElementById('words-tab-count').textContent = `(${chapterData.vocabulary.length})`;
    document.getElementById('phrases-tab-count').textContent = `(${chapterData.phrases.length})`;
    document.getElementById('sentences-tab-count').textContent = `(${chapterData.sentences.length})`;
}

// 初始化音频播放器
function initAudioPlayer() {
    audioElement = document.getElementById('audio');
    const playBtn = document.getElementById('play-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    
    // 播放/暂停
    playBtn.addEventListener('click', () => {
        if (audioElement.paused) {
            audioElement.play();
            playBtn.textContent = '⏸';
        } else {
            audioElement.pause();
            playBtn.textContent = '▶';
        }
    });
    
    // 更新时间显示和进度条
    audioElement.addEventListener('timeupdate', () => {
        const current = formatTime(audioElement.currentTime);
        document.getElementById('current-time').textContent = current;
        
        // 更新进度条
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressFill.style.width = progress + '%';
        
        // 高亮当前段落
        updateActiveParagraph(audioElement.currentTime);
    });
    
    audioElement.addEventListener('loadedmetadata', () => {
        const duration = formatTime(audioElement.duration);
        document.getElementById('duration').textContent = duration;
    });
    
    // 进度条点击跳转
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        audioElement.currentTime = percentage * audioElement.duration;
    });
    
    // 进度条拖拽
    let isDragging = false;
    
    progressBar.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateProgress(e);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateProgress(e);
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    function updateProgress(e) {
        const rect = progressBar.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = clickX / rect.width;
        audioElement.currentTime = percentage * audioElement.duration;
    }
    
    // 速度控制
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseFloat(btn.dataset.speed);
            audioElement.playbackRate = speed;
            
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// 渲染主内容
function renderContent() {
    const contentArea = document.getElementById('content-area');
    
    chapterData.paragraphs.forEach((para, index) => {
        const paraDiv = document.createElement('div');
        paraDiv.className = 'paragraph';
        paraDiv.dataset.index = index;
        
        // 英文段落（带高亮）
        const englishDiv = document.createElement('div');
        englishDiv.className = 'english';
        englishDiv.innerHTML = highlightText(para);
        
        // 中文翻译
        const chineseDiv = document.createElement('div');
        chineseDiv.className = 'chinese';
        chineseDiv.textContent = para.zh;
        
        paraDiv.appendChild(englishDiv);
        paraDiv.appendChild(chineseDiv);
        
        // 点击段落跳转音频（使用事件委托，确保点击任何地方都有效）
        paraDiv.addEventListener('click', function(e) {
            // 检查是否点击了高亮内容
            const clickedElement = e.target;
            const isHighlight = clickedElement.classList.contains('highlight-word') || 
                               clickedElement.classList.contains('highlight-phrase') ||
                               clickedElement.classList.contains('highlight-sentence');
            
            if (isHighlight) {
                // 点击高亮内容，不跳转音频
                console.log('点击了高亮词汇，不跳转音频');
                return;
            }
            
            // 点击段落其他地方，跳转音频
            console.log(`\n========== 点击段落 ${index} ==========`);
            e.stopPropagation();
            jumpToAudioTime(index);
        });
        
        contentArea.appendChild(paraDiv);
    });
}

// 高亮文本（词、短语、句子）
function highlightText(para) {
    if (!para.annotations) {
        return escapeHtmlText(para.en);
    }
    
    const text = para.en;
    const highlights = [];
    
    // 收集所有需要高亮的项
    if (para.annotations.words) {
        para.annotations.words.forEach(item => {
            highlights.push({
                start: item.start,
                end: item.end,
                type: 'word',
                index: item.vocabIndex
            });
        });
    }
    
    if (para.annotations.phrases) {
        para.annotations.phrases.forEach(item => {
            highlights.push({
                start: item.start,
                end: item.end,
                type: 'phrase',
                index: item.phraseIndex
            });
        });
    }
    
    if (para.annotations.sentences) {
        para.annotations.sentences.forEach(item => {
            highlights.push({
                start: item.start,
                end: item.end,
                type: 'sentence',
                index: item.sentenceIndex
            });
        });
    }
    
    // 如果没有高亮，直接返回
    if (highlights.length === 0) {
        return escapeHtmlText(text);
    }
    
    // 按起始位置排序
    highlights.sort((a, b) => a.start - b.start);
    
    // 构建带高亮的 HTML
    let result = '';
    let lastIndex = 0;
    
    highlights.forEach(item => {
        // 添加高亮之前的普通文本
        if (item.start > lastIndex) {
            result += escapeHtmlText(text.substring(lastIndex, item.start));
        }
        
        // 添加高亮的文本
        const highlightedText = escapeHtmlText(text.substring(item.start, item.end));
        const tooltip = getTooltipText(item.type, item.index);
        const escapedTooltip = escapeHtmlText(tooltip);
        
        result += `<span class="highlight-${item.type}" data-${item.type}-index="${item.index}" data-tooltip="${escapedTooltip}">${highlightedText}</span>`;
        
        lastIndex = item.end;
    });
    
    // 添加最后剩余的文本
    if (lastIndex < text.length) {
        result += escapeHtmlText(text.substring(lastIndex));
    }
    
    return result;
}

// HTML 文本转义（只转义文本内容，不转义整个HTML）
function escapeHtmlText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 获取tooltip文本
function getTooltipText(type, index) {
    if (type === 'word' && chapterData.vocabulary[index]) {
        return chapterData.vocabulary[index].chinese;
    } else if (type === 'phrase' && chapterData.phrases[index]) {
        return chapterData.phrases[index].chinese;
    } else if (type === 'sentence' && chapterData.sentences[index]) {
        return chapterData.sentences[index].zh;
    }
    return '';
}

// 渲染词汇列表
function renderVocabulary() {
    // 渲染生词（去重，保留第一个出现的）
    const wordsList = document.getElementById('words-list');
    const seenWords = new Set();
    
    chapterData.vocabulary.forEach((word, index) => {
        // 使用单词本身作为唯一标识
        const wordKey = word.word.toLowerCase();
        if (!seenWords.has(wordKey)) {
            seenWords.add(wordKey);
            const item = createVocabItem('word', word, index);
            wordsList.appendChild(item);
        }
    });
    
    // 渲染短语（去重）
    const phrasesList = document.getElementById('phrases-list');
    const seenPhrases = new Set();
    
    chapterData.phrases.forEach((phrase, index) => {
        const phraseKey = phrase.phrase.toLowerCase();
        if (!seenPhrases.has(phraseKey)) {
            seenPhrases.add(phraseKey);
            const item = createPhraseItem(phrase, index);
            phrasesList.appendChild(item);
        }
    });
    
    // 渲染句子（去重）
    const sentencesList = document.getElementById('sentences-list');
    const seenSentences = new Set();
    
    chapterData.sentences.forEach((sentence, index) => {
        const sentenceKey = sentence.en.toLowerCase();
        if (!seenSentences.has(sentenceKey)) {
            seenSentences.add(sentenceKey);
            const item = createSentenceItem(sentence, index);
            sentencesList.appendChild(item);
        }
    });
}

// 创建生词项
function createVocabItem(type, vocab, index) {
    const div = document.createElement('div');
    div.className = 'vocab-item';
    div.id = `word-${index}`;
    
    div.innerHTML = `
        <div class="vocab-word">${vocab.word}</div>
        <div class="vocab-phonetic">[${vocab.phonetic}]</div>
        <div class="vocab-chinese">${vocab.chinese}</div>
        <span class="vocab-pos">${vocab.pos}</span>
        <div class="vocab-definition">${vocab.definition}</div>
    `;
    
    return div;
}

// 创建短语项
function createPhraseItem(phrase, index) {
    const div = document.createElement('div');
    div.className = 'vocab-item';
    div.id = `phrase-${index}`;
    
    div.innerHTML = `
        <div class="phrase-text">${phrase.phrase}</div>
        <div class="vocab-chinese">${phrase.chinese}</div>
        <div class="vocab-definition">${phrase.explanation}</div>
    `;
    
    return div;
}

// 创建句子项
function createSentenceItem(sentence, index) {
    const div = document.createElement('div');
    div.className = 'vocab-item';
    div.id = `sentence-${index}`;
    
    const usageHtml = sentence.usage ? `<div class="sentence-usage">[用法说明] ${sentence.usage}</div>` : '';
    
    div.innerHTML = `
        <div class="sentence-en">${sentence.en}</div>
        <div class="sentence-zh">"${sentence.zh}"</div>
        ${usageHtml}
    `;
    
    return div;
}

// 设置事件监听
function setupEventListeners() {
    // 翻译显隐
    document.getElementById('toggle-translation').addEventListener('click', () => {
        showTranslation = !showTranslation;
        const btn = document.getElementById('toggle-translation');
        const chineseElements = document.querySelectorAll('.chinese');
        
        chineseElements.forEach(el => {
            el.classList.toggle('hidden', !showTranslation);
        });
        
        btn.textContent = showTranslation ? '👁️ 隐藏翻译' : '👁️ 显示翻译';
    });
    
    // Tab切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tab}-tab`).classList.add('active');
        });
    });
    
    // 高亮点击事件
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('highlight-word')) {
            const index = parseInt(e.target.dataset.wordIndex);
            scrollToVocabItem('word', index);
        } else if (e.target.classList.contains('highlight-phrase')) {
            const index = parseInt(e.target.dataset.phraseIndex);
            scrollToVocabItem('phrase', index);
        } else if (e.target.classList.contains('highlight-sentence')) {
            const index = parseInt(e.target.dataset.sentenceIndex);
            scrollToVocabItem('sentence', index);
        }
    });
    
    // Hover显示tooltip
    let tooltip = null;
    document.addEventListener('mouseover', (e) => {
        if (e.target.dataset.tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = e.target.dataset.tooltip;
            document.body.appendChild(tooltip);
            
            const rect = e.target.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.bottom + 5) + 'px';
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (tooltip && e.target.dataset.tooltip) {
            tooltip.remove();
            tooltip = null;
        }
    });
}

// 跳转到音频时间
function jumpToAudioTime(paraIndex) {
    if (!audioElement) {
        console.error('音频元素未初始化');
        return;
    }
    
    if (paraIndex >= timeStamps.length) {
        console.error(`段落索引 ${paraIndex} 超出时间戳范围 (共${timeStamps.length}个)`);
        return;
    }
    
    const [startTime, endTime] = timeStamps[paraIndex];
    console.log(`=== 跳转音频 ===`);
    console.log(`段落索引: ${paraIndex}`);
    console.log(`时间范围: ${startTime}s - ${endTime}s`);
    console.log(`音频状态: ${audioElement.paused ? '暂停' : '播放'}`);
    console.log(`音频时长: ${audioElement.duration}s`);
    
    try {
        // 设置音频时间
        audioElement.currentTime = startTime;
        
        // 播放音频
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('✅ 音频播放成功');
                    document.getElementById('play-btn').textContent = '⏸';
                })
                .catch(error => {
                    console.error('❌ 音频播放失败:', error);
                    alert('音频播放失败，请检查音频文件是否存在');
                });
        }
    } catch (error) {
        console.error('跳转音频时发生错误:', error);
    }
}

// 更新当前段落高亮
function updateActiveParagraph(currentTime) {
    for (let i = 0; i < timeStamps.length; i++) {
        const [start, end] = timeStamps[i];
        if (currentTime >= start && currentTime < end) {
            if (currentParagraphIndex !== i) {
                // 移除之前的高亮
                document.querySelectorAll('.paragraph').forEach(p => p.classList.remove('active'));
                
                // 添加当前高亮
                const para = document.querySelector(`[data-index="${i}"]`);
                if (para) {
                    para.classList.add('active');
                    // 滚动到可见区域
                    para.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                currentParagraphIndex = i;
            }
            break;
        }
    }
}

// 滚动到词汇项
function scrollToVocabItem(type, index) {
    const id = `${type}-${index}`;
    const element = document.getElementById(id);
    
    if (element) {
        // 切换到对应tab
        const tabMap = { word: 'words', phrase: 'phrases', sentence: 'sentences' };
        const tabName = tabMap[type];
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.click();
            }
        });
        
        // 滚动并高亮
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // 暂时高亮
            document.querySelectorAll('.vocab-item').forEach(item => item.classList.remove('highlighted'));
            element.classList.add('highlighted');
            
            setTimeout(() => {
                element.classList.remove('highlighted');
            }, 2000);
        }, 100);
    }
}

// 格式化时间
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
