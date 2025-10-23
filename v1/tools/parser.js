#!/usr/bin/env node

/**
 * Harry Potter Content Parser
 * 解析 chapter content.txt 文件，生成结构化的 JSON 数据
 */

const fs = require('fs');
const path = require('path');

class ContentParser {
  constructor(filePath) {
    this.filePath = filePath;
    this.content = '';
    this.result = {
      chapter: '',
      paragraphs: [],
      vocabulary: [],
      phrases: [],
      sentences: [],
      stats: {
        paragraphCount: 0,
        vocabularyCount: 0,
        phraseCount: 0,
        sentenceCount: 0
      }
    };
  }

  // 读取文件
  readFile() {
    try {
      // 尝试不同的编码
      let content;
      
      // 首先尝试 utf16le
      try {
        content = fs.readFileSync(this.filePath, 'utf16le');
        if (!content.includes('[章]') && !content.includes('[段]')) {
          throw new Error('UTF-16LE 解码失败');
        }
      } catch (e) {
        // 回退到 utf-8
        content = fs.readFileSync(this.filePath, 'utf-8');
      }
      
      // 移除 BOM（如果存在）
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      
      this.content = content;
      console.log('✅ 文件读取成功');
      console.log(`   文件大小: ${content.length} 字符`);
      console.log(`   包含[段]: ${content.includes('[段]')}`);
      console.log(`   包含[词]: ${content.includes('[词]')}`);
      return true;
    } catch (error) {
      console.error('❌ 文件读取失败:', error.message);
      return false;
    }
  }

  // 解析章节标题
  parseChapter() {
    const chapterMatch = this.content.match(/\[章\]\s*(.+)/);
    if (chapterMatch) {
      this.result.chapter = chapterMatch[1].trim();
      console.log(`📖 章节: ${this.result.chapter}`);
    }
  }

  // 解析段落和翻译
  parseParagraphs() {
    const lines = this.content.split('\n');
    let currentParagraph = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 匹配段落（保留原始格式，只去掉标记）
      if (line.includes('[段]')) {
        if (currentParagraph) {
          this.result.paragraphs.push(currentParagraph);
        }
        currentParagraph = {
          id: this.result.paragraphs.length,
          en: line.replace('[段]', '').trim(),
          zh: ''
        };
      }
      // 匹配翻译
      else if (line.includes('[译]') && currentParagraph) {
        currentParagraph.zh = line.replace('[译]', '').trim();
      }
    }

    // 添加最后一个段落
    if (currentParagraph) {
      this.result.paragraphs.push(currentParagraph);
    }

    this.result.stats.paragraphCount = this.result.paragraphs.length;
    console.log(`📝 段落数量: ${this.result.stats.paragraphCount}`);
  }

  // 解析生词
  parseVocabulary() {
    // 逐行解析，每个[词]占一行
    // 格式1：[词] word (中文) [phonetic] (pos): definition
    // 格式2：[词] word [phonetic] (pos): definition
    const lines = this.content.split('\n');
    
    for (let line of lines) {
      // 清理可能的干扰字符
      line = line.replace(/^\d+-?\s*/, '').trim();
      
      if (!line.startsWith('[词]')) continue;
      
      // 提取内容
      const content = line.substring(3).trim();
      
      // 先尝试匹配带中文名的格式
      let match = content.match(/^(.+?)\s+\(([^)]+)\)\s+\[([^\]]+)\]\s+\(([^)]+)\):\s+(.+)$/);
      
      if (match) {
        const word = match[1].trim();
        const chinese = match[2].trim();
        const phonetic = match[3].trim();
        const pos = match[4].trim();
        const definition = match[5].trim();

        this.result.vocabulary.push({
          word,
          chinese,
          phonetic,
          pos,
          definition
        });
      } else {
        // 尝试不带中文名的格式：word [phonetic] (pos): definition
        match = content.match(/^(.+?)\s+\[([^\]]+)\]\s+\(([^)]+)\):\s+(.+)$/);
        
        if (match) {
          const word = match[1].trim();
          const phonetic = match[2].trim();
          const pos = match[3].trim();
          const definition = match[4].trim();
          
          // 从定义中提取中文（通常在最前面）
          const chineseMatch = definition.match(/^([^(（]+)/);
          const chinese = chineseMatch ? chineseMatch[1].trim() : '';

          this.result.vocabulary.push({
            word,
            chinese,
            phonetic,
            pos,
            definition
          });
        }
      }
    }

    this.result.stats.vocabularyCount = this.result.vocabulary.length;
    console.log(`📚 生词数量: ${this.result.stats.vocabularyCount}`);
  }

  // 解析短语
  parsePhrases() {
    const lines = this.content.split('\n');
    
    for (const line of lines) {
      if (!line.includes('[短]')) continue;
      
      // 匹配格式：[短] phrase: 中文翻译 (解释说明)
      const match = line.match(/\[短\]\s*(.+?):\s*(.+?)\s+\((.+?)\)/);
      
      if (match) {
        const phrase = match[1].trim();
        const chinese = match[2].trim();
        const explanation = match[3].trim();

        this.result.phrases.push({
          phrase,
          chinese,
          explanation
        });
      }
    }

    this.result.stats.phraseCount = this.result.phrases.length;
    console.log(`💬 短语数量: ${this.result.stats.phraseCount}`);
  }

  // 解析重点句子
  parseSentences() {
    const lines = this.content.split('\n');
    
    for (const line of lines) {
      if (!line.trim().startsWith('[句]')) continue;
      
      // 格式：[句] 英文句子 "中文翻译" [用法说明] 用法说明内容
      const content = line.substring(line.indexOf('[句]') + 3).trim();
      
      // 使用Unicode引号: " (8220) 和 " (8221)
      const leftQuote = String.fromCharCode(8220);  // "
      const rightQuote = String.fromCharCode(8221); // "
      
      const firstQuote = content.indexOf(leftQuote);
      if (firstQuote === -1) continue;
      
      const secondQuote = content.indexOf(rightQuote, firstQuote + 1);
      if (secondQuote === -1) continue;
      
      // 提取各部分
      const en = content.substring(0, firstQuote).trim();
      const zh = content.substring(firstQuote + 1, secondQuote).trim();
      
      // 查找用法说明
      const usageMatch = content.substring(secondQuote + 1).match(/\[用法说明\]\s*(.+)/);
      const usage = usageMatch ? usageMatch[1].trim() : '';

      this.result.sentences.push({
        en,
        zh,
        usage
      });
    }

    this.result.stats.sentenceCount = this.result.sentences.length;
    console.log(`✨ 句子数量: ${this.result.stats.sentenceCount}`);
  }

  // 为段落标注词汇、短语和句子的位置
  annotateParagraphs() {
    console.log('\n🔍 开始标注段落...');

    this.result.paragraphs.forEach((para, paraIndex) => {
      para.annotations = {
        words: [],
        phrases: [],
        sentences: []
      };

      // 标注生词（所有出现位置）
      this.result.vocabulary.forEach((vocab, vocabIndex) => {
        const word = vocab.word;
        const text = para.en;
        
        // 使用正则表达式查找所有出现位置（单词边界）
        const regex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          para.annotations.words.push({
            vocabIndex,
            word: match[0], // 保留原始大小写
            start: match.index,
            end: match.index + match[0].length
          });
        }
      });

      // 标注短语（所有出现位置）
      this.result.phrases.forEach((phrase, phraseIndex) => {
        const phraseText = phrase.phrase;
        const text = para.en;
        
        // 查找所有出现位置
        let startIndex = 0;
        while ((startIndex = text.indexOf(phraseText, startIndex)) !== -1) {
          para.annotations.phrases.push({
            phraseIndex,
            phrase: phraseText,
            start: startIndex,
            end: startIndex + phraseText.length
          });
          startIndex += phraseText.length;
        }
      });

      // 标注重点句子（所有出现位置）
      this.result.sentences.forEach((sent, sentIndex) => {
        const sentText = sent.sentence;
        const text = para.en;
        
        // 查找句子出现位置
        const index = text.indexOf(sentText);
        if (index !== -1) {
          para.annotations.sentences.push({
            sentIndex,
            sentence: sentText,
            start: index,
            end: index + sentText.length
          });
        }
      });

      // 排序所有标注（按起始位置）
      para.annotations.words.sort((a, b) => a.start - b.start);
      para.annotations.phrases.sort((a, b) => a.start - b.start);
      para.annotations.sentences.sort((a, b) => a.start - b.start);
    });

    console.log('✅ 段落标注完成');
  }

  // 转义正则表达式特殊字符
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 执行完整解析
  parse() {
    console.log('\n🚀 开始解析...\n');
    
    if (!this.readFile()) {
      return false;
    }

    this.parseChapter();
    this.parseParagraphs();
    this.parseVocabulary();
    this.parsePhrases();
    this.parseSentences();
    this.annotateParagraphs();

    console.log('\n📊 解析统计:');
    console.log(`   段落: ${this.result.stats.paragraphCount}`);
    console.log(`   生词: ${this.result.stats.vocabularyCount}`);
    console.log(`   短语: ${this.result.stats.phraseCount}`);
    console.log(`   句子: ${this.result.stats.sentenceCount}`);

    return true;
  }

  // 保存为 JSON
  saveToJson(outputPath) {
    try {
      const json = JSON.stringify(this.result, null, 2);
      fs.writeFileSync(outputPath, json, 'utf-8');
      console.log(`\n💾 JSON 文件已保存: ${outputPath}`);
      return true;
    } catch (error) {
      console.error('❌ 保存文件失败:', error.message);
      return false;
    }
  }
}

// 命令行使用
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('使用方法: node parser.js <input.txt> [output.json]');
    console.log('示例: node parser.js "../chapter1 content.txt" "../data/chapter1.json"');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = args[1] 
    ? path.resolve(args[1]) 
    : path.resolve(path.dirname(inputPath), '../data', path.basename(inputPath).replace('.txt', '.json').replace(' content', ''));

  const parser = new ContentParser(inputPath);
  
  if (parser.parse()) {
    parser.saveToJson(outputPath);
    console.log('\n✨ 解析完成！');
  } else {
    console.error('\n❌ 解析失败');
    process.exit(1);
  }
}

module.exports = ContentParser;
