import { createServer } from 'http';
import bot from './bot';

fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook?url=${process.env.WH_URL}`);

createServer((req, res) => {
  req.on('data', (chunk) => {
    try {
      bot(JSON.parse(chunk.toString()).message);
    } catch { console.log('bruh'); }
  });
  res.end();
}).listen(process.env.PORT || 8080);
