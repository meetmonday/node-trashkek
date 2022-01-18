require('dotenv').config();
const http = require('http');
const axios = require('axios').default;

const b = require('./bot');

if (process.env.REDEBALO === true) {
  (async () => {
    const terminalImage = (await import('terminal-image')).default;
    console.log(await terminalImage.file('misc/red.jpg'));
  })();
}

if (process.argv[2] === '-wh') {
  axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook?url=${process.env.WH_URL}`).then((e) => {
    console.log(e.data);
  });
}

console.log('TRASHKEK RABOTAET...');

http.createServer((req, res) => {
  req.on('data', (chunk) => {
    b.bot(JSON.parse(chunk.toString()).message);
  });
  res.end();
}).listen(process.env.SERVER_PORT);
