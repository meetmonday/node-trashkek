require('dotenv').config();
const http = require('http');

const b = require('./bot');

if (process.env.REDEBALO === true) {
  (async () => {
    const terminalImage = (await import('terminal-image')).default;
    console.log(await terminalImage.file('misc/red.jpg'));
  })();
}
console.log('TRASHKEK RABOTAET...');

http.createServer((req, res) => {
  req.on('data', (chunk) => {
    b.bot(JSON.parse(chunk.toString()).message);
  });
  res.end();
}).listen(process.env.SERVER_PORT);
