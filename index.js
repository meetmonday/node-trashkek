import axios from 'axios';
import { createServer } from 'http';
import bot from './bot';

axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook?url=${process.env.WH_URL}`).then((e) => {
  console.log(e.data);
});

createServer((req, res) => {
  req.on('data', (chunk) => {
    try {
      bot(JSON.parse(chunk.toString()).message);
    } catch { console.log('bruh'); }
  });
  res.end();
}).listen(process.env.PORT || 8080);
