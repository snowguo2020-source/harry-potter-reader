# 🪄 Harry Potter 英语阅读器

> 为中国6年级学生（相当于美国2-3年级英语水平）打造的交互式《哈利波特》英语学习平台

## ✨ 项目特色

- 📖 **中英对照阅读** - 段落式布局，支持翻译显示/隐藏
- 🎵 **音频同步播放** - 点击段落跳转音频，音频播放自动高亮当前段落
- 🔤 **三级词汇高亮** - 基础词（蓝色）、中级词（黄色）、高级词（粉色）
- � **丰富学习资源** - 450+词汇、120+短语、50+重点句子
- �💡 **悬停即显详解** - 鼠标悬停查看释义、音标、用法、例句
- 🎯 **难度分级学习** - 支持全部/基础/中级三种难度模式
- 🎨 **优雅交互设计** - 现代化UI，流畅的用户体验

## 📁 项目结构

```text
harry-potter-reader/
├── tools/                  # 工具集
│   ├── audio-marker.html   # 音频标记工具（单文件应用）
│   └── text-processor.js   # 文本预处理脚本
├── raw/                    # 原始数据
│   ├── audio/             # 章节音频文件 (.mp3)
│   └── texts/             # 原始文本文件 (.txt)
├── data/                   # 标准化数据
│   ├── chapter1.json      # 第一章完整数据（含时间戳）
│   └── chapter1/          # 开发过程文档
├── reader/                 # 阅读器应用
│   ├── index.html         # 主入口（章节选择）
│   ├── chapter.html       # 章节阅读页面
│   ├── css/
│   │   └── reader.css     # 样式文件
│   └── js/
│       └── reader.js      # 核心逻辑
├── v1/                     # 旧版本（已废弃）
├── PLAN-v3.md             # 项目开发计划
└── README.md              # 本文件
```

## 🚀 快速开始

### 方式一：直接使用（推荐）

1. **启动本地服务器**
   ```bash
   cd harry-potter-reader
   python3 -m http.server 8000
   ```

2. **访问阅读器**
   - 打开浏览器访问：`http://localhost:8000/reader/index.html`
   - 选择 Chapter 1 开始阅读

3. **开始学习**
   - 点击段落跳转音频
   - 点击高亮词汇查看详解
   - 切换难度模式（全部/基础/中级）
   - 显示/隐藏中文翻译

### 方式二：开发新章节

如果你想为其他章节创建数据：

1. **准备原始数据**
   - 将音频文件放入 `raw/audio/chapter2.mp3`
   - 将文本文件放入 `raw/texts/chapter2-paragraphs.txt`

2. **标记音频时间戳**
   - 打开 `tools/audio-marker.html`
   - 加载音频和文本文件
   - 播放音频，标记每个段落的开始时间
   - 导出 JSON 时间戳数据

3. **生成章节数据**
   - 参考 `data/chapter1.json` 的格式
   - 使用 AI（如 GitHub Copilot）生成词汇、短语、句子
   - 合并时间戳数据到章节 JSON

4. **测试新章节**
   - 更新 `reader/index.html` 添加新章节入口
   - 访问 `chapter.html?chapter=2` 测试

## 📊 数据说明

### Chapter 1 数据统计

- **段落数**: 108个
- **词汇量**: 244个（分三级难度）
  - Basic: ~100词（理解文章必需）
  - Intermediate: ~100词（丰富理解）
  - Advanced: ~44词（拓展学习）
- **短语**: 69个（习语、动词短语、固定搭配）
- **重点句子**: 7个（语法、情节、文化）
- **音频时长**: 28分22秒
- **时间戳**: 108个段落全部已标记

### 数据格式示例

**词汇数据**：

```json
{
  "id": 1,
  "word": "director",
  "phonetic": "/dəˈrektər/",
  "pos": "n.",
  "meaning": "主管；董事；经理",
  "difficulty": "basic",
  "importance": "key",
  "readingImportance": "critical",
  "context": "Mr. Dursley was the director of a firm called Grunnings",
  "paragraphs": [2],
  "highlight": true
}
```

**短语数据**：

```json
{
  "id": 1,
  "phrase": "turned on his heel",
  "meaning": "转身",
  "type": "idiom",
  "usage": "表示突然转身离开，通常带有果断或生气的意味",
  "context": "He turned on his heel and with a swish of his cloak...",
  "paragraphs": [105],
  "highlight": true
}
```

**句子数据**：

```json
{
  "id": 1,
  "en": "How very wrong he was.",
  "zh": "他大错特错了。",
  "type": "grammar",
  "focus": "倒装句式用于强调",
  "analysis": "这是一个倒装句，正常语序应为'He was very wrong'...",
  "paragraph": 34,
  "highlight": true
}
```

## 🎨 功能特性

### 1. 智能高亮系统

- **词汇高亮**：三种颜色区分难度
  - 🔵 蓝色：基础词汇（必须掌握）
  - 🟡 黄色：中级词汇（建议学习）
  - 🟣 粉色：高级词汇（拓展提升）

- **短语高亮**：绿色虚线，区分三种类型
  - 习语/成语
  - 动词短语
  - 固定搭配

- **句子高亮**：紫色背景，三种分类
  - 语法重点
  - 情节关键
  - 文化表达

### 2. 难度模式切换

- **全部模式**：显示所有词汇（450+词）
- **基础模式**：只显示基础词汇（~100词）
- **中级模式**：显示基础+中级词汇（~200词）

### 3. 音频同步功能

- 点击段落自动跳转到对应音频位置
- 音频播放时自动高亮当前段落
- 支持倍速播放（0.75x, 1.0x, 1.25x, 1.5x）
- 进度条拖拽跳转
- 快进/快退 15 秒

### 4. 交互式学习面板

- **词汇面板**：显示所有词汇及详解
- **短语面板**：显示所有短语及用法
- **句子面板**：显示重点句子及分析
- 点击卡片自动跳转到对应段落

### 5. 悬停提示

- 鼠标悬停在高亮词汇上，显示详细信息
- 包含音标、词性、释义、例句
- 无需点击，即时显示

## 🔧 技术栈

- **前端**: 纯 HTML + CSS + JavaScript（无框架依赖）
- **数据格式**: JSON
- **音频**: HTML5 Audio API
- **样式**: 现代 CSS（Grid, Flexbox, CSS Variables）
- **字体**: 系统字体栈（中英文优化）

## 📝 开发指南

### 添加新章节的完整流程

1. **准备原始数据**
   ```bash
   # 将音频放入 raw/audio/
   cp chapter2.mp3 raw/audio/
   
   # 将文本放入 raw/texts/
   cp chapter2.txt raw/texts/chapter2-paragraphs.txt
   ```

2. **标记音频时间戳**
   - 打开 `tools/audio-marker.html`
   - 按界面提示操作
   - 导出 JSON 保存

3. **生成学习数据**
   - 使用 AI 工具（GitHub Copilot / Claude / ChatGPT）
   - 参考 `PLAN-v3.md` 中的标准
   - 生成词汇（450-500个）、短语（120-150个）、句子（50个）

4. **整合数据**
   ```bash
   # 创建 data/chapter2.json
   # 合并段落、词汇、短语、句子、时间戳
   ```

5. **更新界面**
   ```html
   <!-- 在 reader/index.html 中添加 -->
   <a href="chapter.html?chapter=2" class="chapter-card available">
       <div class="chapter-number">Chapter 2</div>
       <div class="chapter-title">The Vanishing Glass</div>
       <span class="status-badge">✓ 可用</span>
   </a>
   ```

6. **测试**
   - 启动服务器
   - 访问新章节
   - 测试所有功能

## 🎯 未来规划

- [ ] 添加学习进度跟踪
- [ ] 生词本功能（收藏/标记）
- [ ] 测验模式（根据学习内容出题）
- [ ] 笔记功能（段落批注）
- [ ] 夜间模式
- [ ] 移动端优化
- [ ] PWA 离线支持
- [ ] 完成 Chapter 2-17

## 📄 许可证

本项目仅用于个人学习和研究。《哈利波特》系列版权归 J.K. Rowling 和相关出版社所有。

## 🙏 致谢

- 感谢 J.K. Rowling 创作的精彩故事
- 感谢所有为英语学习做出贡献的教育工作者
- 项目灵感来自对提升中国学生英语阅读能力的热情

---

**Happy Reading! 📚✨**

