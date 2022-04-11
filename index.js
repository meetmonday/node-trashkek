import axios from 'axios';
import { createServer } from 'http';
import bot from './bot.js';

axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook?url=${process.env.WH_URL}`).then((e) => {
  console.log(e.data);
});

console.log('TRASHKEK RABOTAET... /// PORT:', process.env.PORT || 8080, process.env.WH_URL);

createServer((req, res) => {
  console.log(req)
  req.on('data', (chunk) => {
    try {
      bot(JSON.parse(chunk.toString()).message);
    } catch (e) {
      console.log("Брух, невалидный жсон");
    }
  });
  res.end();
}).listen(process.env.PORT || 8080);
