const fs = require('fs');
const readline = require('readline');

async function search() {
    const fileStream = fs.createReadStream('c:\\Users\\Migue\\Desktop\\persiana-total-app\\app.js');
    const logsStream = fs.createWriteStream('c:\\Users\\Migue\\Desktop\\persiana-total-app\\search_results.txt');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineNumber = 0;
    for await (const line of rl) {
        lineNumber++;
        if (line.includes('148')) {
            logsStream.write(`${lineNumber}: ${line.trim()}\n`);
        }
    }
    logsStream.end();
}

search();
