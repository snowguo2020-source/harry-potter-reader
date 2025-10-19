# 哈利波特英语阅读器 📚

一个帮助中国小朋友学习英语原版书籍的简单工具。

## 功能特点

✨ **双语对照** - 点击句子显示中文翻译  
📖 **词汇学习** - 鼠标悬停查看单词释义  
🎧 **音频播放** - 支持播放有声读物（需自行添加）  
🎨 **美观界面** - 简洁易用的设计  

## 使用方法

### 1. 打开应用
双击 `index.html` 文件，在浏览器中打开

### 2. 添加音频（可选）
1. 创建 `audio` 文件夹
2. 将您**合法获得**的音频文件命名为 `chapter1.mp3`
3. 放入 `audio` 文件夹

### 3. 添加更多内容
编辑 `index.html` 文件，按照现有格式添加更多句子：

```html
<div class="sentence" onclick="toggleTranslation(this)">
    <div class="english">
        英文文本
        <span class="vocab-box word" style="background: #c8e6c9;">
            <span class="word">单词</span>
            <span class="vocab-tooltip">释义</span>
        </span>
    </div>
    <div class="chinese">
        中文翻译
    </div>
</div>
```

## 版权说明

⚠️ **重要提示**

- 本项目仅提供技术框架
- 所有内容（文本、音频）需用户自行合法获取
- 请尊重知识产权，不要使用盗版资源

### 合法获取途径

- **Audible** - 购买有声读物
- **图书馆** - 通过 Libby/OverDrive 借阅
- **正版书籍** - 购买实体书或电子书

## 扩展功能

如需要更多功能（如自动同步音频高亮、进度保存等），随时告诉我！

---

💡 这是一个简单的单页应用，无需安装任何依赖，直接在浏览器中运行即可。