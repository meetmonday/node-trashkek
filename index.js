require('dotenv').config();
const http = require('http');
const b = require('./bot');

http.createServer((req, res) => {
  req.on('data', (chunk) => {
    b.bot(JSON.parse(chunk.toString()).message);
  });
  req.on('end', () => {
    //  end of data
  });
  res.end();
}).listen(9090);

console.log('trashkek rabotaet..........');
