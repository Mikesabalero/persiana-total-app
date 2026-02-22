const fetch = require('node-fetch');
const API = 'http://93.127.212.235:32770';
const TOKEN = 'dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ';
const tableId = 'm0dwlr7ccoim1kf';

async function getCols() {
    const r = await fetch(`${API}/api/v2/meta/tables/${tableId}`, {
        headers: { 'xc-token': TOKEN }
    });
    const data = await r.json();
    data.columns.forEach(c => {
        console.log(`${c.title} | ${c.uidt} | ${c.dtxp || ''}`);
    });
}
getCols();
