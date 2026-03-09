const https = require('https');

const options = {
  hostname: 'nocodb.srv1323649.hstgr.cloud',
  port: 443,
  path: '/api/v2/tables/mgh9e1zivvhpg26/records?where=(Nombre,like,%25motor%25)&fields=Id,Nombre,Activo&limit=20',
  method: 'GET',
  headers: {
    'xc-token': 'dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const o = JSON.parse(data);
    console.log(JSON.stringify(o.list.map(x => ({id: x.Id, nombre: x.Nombre, activo: x.Activo})), null, 2));
  });
});

req.end();
