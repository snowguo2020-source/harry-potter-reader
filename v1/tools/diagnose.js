const fs = require('fs');

const inputFile = process.argv[2] || '../chapter1 content.txt';
const content = fs.readFileSync(inputFile, 'utf16le');

console.log('🔍 诊断文件格式问题...\n');

// 查找所有以 [词] 开头的行
const lines = content.split('\n');
const wordLines = [];
const problematicLines = [];

lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('[词]')) {
        wordLines.push({ lineNum: index + 1, content: line });
        
        // 检查格式是否标准
        // 标准格式: [词] word (中文) [音标] (词性): 释义
        const standardPattern = /^\[词\]\s+.+?\s+\(.+?\)\s+\[.+?\]\s+\(.+?\):\s+.+$/;
        
        if (!standardPattern.test(trimmed)) {
            problematicLines.push({ 
                lineNum: index + 1, 
                content: trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : '')
            });
        }
    }
});

console.log(`📚 找到 [词] 标记的行数: ${wordLines.length}\n`);

if (problematicLines.length > 0) {
    console.log(`⚠️  发现 ${problematicLines.length} 行格式可能有问题:\n`);
    
    // 只显示前20个问题
    const displayCount = Math.min(20, problematicLines.length);
    problematicLines.slice(0, displayCount).forEach(item => {
        console.log(`   行 ${item.lineNum}: ${item.content}`);
    });
    
    if (problematicLines.length > displayCount) {
        console.log(`   ... 还有 ${problematicLines.length - displayCount} 行问题\n`);
    }
    
    console.log('\n💡 建议检查的格式问题:');
    console.log('   1. 是否缺少音标 [xxx]');
    console.log('   2. 是否缺少词性 (n./v./adj. 等)');
    console.log('   3. 是否缺少冒号 :');
    console.log('   4. 括号是否配对');
    console.log('   5. 是否有多余的换行');
} else {
    console.log('✅ 所有 [词] 行的格式看起来都正确！');
}

// 检查多行生词（被换行打断的）
console.log('\n🔍 检查可能跨行的生词定义...');
const multiLineWords = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('[词]') && !line.includes(':')) {
        // 找到以[词]开头但没有冒号的行，可能是跨行的
        multiLineWords.push({ lineNum: i + 1, content: line.substring(0, 80) });
    }
}

if (multiLineWords.length > 0) {
    console.log(`⚠️  发现 ${multiLineWords.length} 个可能跨行的生词:\n`);
    multiLineWords.slice(0, 10).forEach(item => {
        console.log(`   行 ${item.lineNum}: ${item.content}...`);
    });
} else {
    console.log('✅ 没有发现跨行的生词定义');
}
