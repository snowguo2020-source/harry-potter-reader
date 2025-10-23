const fs = require('fs');

const content = fs.readFileSync('chapter1 content.txt', 'utf16le');
const lines = content.split('\n');

for (const line of lines) {
    if (!line.startsWith('[句]')) continue;
    
    // 找到第一个引号
    const content = line.substring(3);
    const idx = content.search(/["""「『]/);
    
    if (idx >= 0) {
        const char = content[idx];
        console.log(`找到引号: "${char}" (Unicode: ${char.charCodeAt(0)})`);
        
        // 找配对的引号
        const idx2 = content.indexOf('"', idx + 1) >= 0 ? content.indexOf('"', idx + 1) : 
                     content.indexOf('"', idx + 1) >= 0 ? content.indexOf('"', idx + 1) :
                     content.indexOf('」', idx + 1) >= 0 ? content.indexOf('」', idx + 1) : -1;
        
        if (idx2 >= 0) {
            const char2 = content[idx2];
            console.log(`配对引号: "${char2}" (Unicode: ${char2.charCodeAt(0)})`);
        }
        
        console.log(`示例: ${content.substring(idx - 10, idx2 + 20)}\n`);
        break;
    }
}
