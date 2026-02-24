const fs = require('fs');
const data = JSON.parse(fs.readFileSync('meta_comps.json', 'utf8'));
data.columns.forEach(c => {
    if (c.title === 'Unidad' || c.title === 'Tipo_componente') {
        console.log(c.title, c.dtxp);
    }
});
