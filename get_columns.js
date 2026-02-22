const fs = require('fs');
const rawData = fs.readFileSync('client_meta_raw.json', 'utf8');
const data = JSON.parse(rawData);
let out = '--- DETAILED COLUMNS ---\n';
data.columns.forEach(c => {
    out += `Title: "${c.title}" | Column: "${c.column_name}" | Type: ${c.dt} | PK: ${c.pk} | Req: ${c.rqd || false}\n`;
    if (c.colOptions) {
        out += `  Options: ${JSON.stringify(c.colOptions.options || c.colOptions)}\n`;
    }
});
fs.writeFileSync('column_details.txt', out);
console.log('Done writing column_details.txt');
