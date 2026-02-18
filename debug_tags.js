const fs = require('fs');
const content = fs.readFileSync(process.argv[2], 'utf8');

let stack = [];
let lineNum = 0;
const lines = content.split('\n');

for (let line of lines) {
    lineNum++;
    // Simple regex for tags. Not perfect for all JSX but good for divs/panels.
    const tokens = line.match(/<[a-zA-Z]+|<\/[a-zA-Z]+>/g);
    if (tokens) {
        for (let token of tokens) {
            if (token.startsWith('</')) {
                const tag = token.slice(2, -1);
                if (stack.length === 0) {
                    console.log(`Extra closing tag </${tag}> at line ${lineNum}`);
                } else {
                    const last = stack.pop();
                    if (last.tag !== tag) {
                        console.log(`Mismatch: opened <${last.tag}> (line ${last.line}) closed with </${tag}> (line ${lineNum})`);
                    }
                }
            } else {
                const tag = token.slice(1);
                // Ignore self-closing for this simple script
                if (!line.includes(`${token}.../>`) && !line.includes(`${tag} />`)) {
                    // Check if it's really self-closing on the same line
                    if (!line.match(new RegExp(`<${tag}[^>]*\/>`))) {
                        stack.push({ tag, line: lineNum });
                    }
                }
            }
        }
    }
}

while (stack.length > 0) {
    const last = stack.pop();
    console.log(`Unclosed tag <${last.tag}> opened at line ${last.line}`);
}
