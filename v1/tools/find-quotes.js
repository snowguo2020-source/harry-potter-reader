const fs = require('fs');

const content = fs.readFileSync('chapter1 content.txt', 'utf16le');
const lines = content.split('\n');

for (const line of lines) {
    if (!line.trim().startsWith('[句]')) continue;
    
    // 找所有可能是引号的字符
    for (let i = 0; i < Math.min(line.length, 200); i++) {
        const char = line[i];
        const code = char.charCodeAt(0);
        
        // 打印引号相关的字符
        if (code === 34 || code === 8220 || code === 8221 || code === 12300 || code === 12301) {
            console.log(`位置 ${i}: "${char}" (Unicode: ${code})`);
        }
    }
    
    console.log(`\n示例行: ${line.substring(0, 150)}\n`);
    break;
}
