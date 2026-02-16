const API = 'http://93.127.212.235:32770';
const TOKEN = 'dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ';
const TBL = {
    presupuestos: 'mn1yyjyovvoyxme',
    unidades: 'mix059xkpsz15um',
    lineas: 'mv1e9trh23j0q3o'
};

async function getMeta(tid, name) {
    try {
        const fetch = (await import('node-fetch')).default;
        let r = await fetch(API + '/api/v2/meta/tables/' + tid, {
            headers: { 'xc-token': TOKEN }
        });
        let d = await r.json();
        console.log(`\n--- ${name} COLUMNS ---`);
        d.columns.forEach(c => {
            if (c.uidt === 'LinkToAnotherRecord') {
                console.log(`Column: ${c.title}, ID: ${c.id}, Type: ${c.uidt}, RefTable: ${c.colOptions?.relatedTableId}`);
            }
        });
    } catch (e) { console.error(e); }
}

(async () => {
    await getMeta(TBL.presupuestos, 'PRESUPUESTOS');
    await getMeta(TBL.unidades, 'UNIDADES');
    await getMeta(TBL.lineas, 'LINEAS');
})();
