import { createServer } from 'http';
import bot from './bot';

fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook?url=${process.env.WH_URL}`);

createServer((req, res) => {
  req.on('data', (chunk) => {
    try {
      const data = JSON.parse(chunk.toString());
      bot(data.message);
    } catch { console.log('bruh'); }
  });
  res.end();
}).listen(process.env.PORT || 8080);
