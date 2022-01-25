const token = process.env.BOT_TOKEN;
const tgAPI = `https://api.telegram.org/bot${token}`;

const axios = require('axios').default;

// bot modules
const trashkek = require('./modules/trashkek');
const hentai = require('./modules/hentai');
const tiktok = require('./modules/tiktok');
const bratan = require('./modules/bratan');
const meta = require('./modules/meta');

function delMsg(msg) {
  axios.post(`${tgAPI}/deleteMessage`, {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  }).catch((e) => { console.log(e); });
}

function outMsg(text, msg, preview = true, del = false) {
  if (del) delMsg(msg);
  axios.post(`${tgAPI}/sendMessage`, {
    text,
    chat_id: msg.chat.id,
    parse_mode: 'Markdown',
    disable_web_page_preview: !preview,
  }).catch((err) => { console.log(err); });
}

function dti(d, cmd) {
  return d.text.includes(cmd);
}

function dtr(d, cmd) {
  return d.text.replace(cmd, '');
}

function bot(d) {
  if (!d || !('entities' in d)) return;
  let cmd = null;
  const ctx = [d, outMsg];

  if (d.entities[0].type === 'bot_command') cmd = d.text.slice(d.entities[0].offset, d.entities[0].length);

  if (cmd === '/hehentai' || d.text === '/hentai') hentai.random(ctx);
  else if (cmd === '/hentai') hentai.search(dtr(d, '/hentai'), ctx);
  else if (dti(d, '#div_comment')) trashkek.main(d.text, 0, ctx);
  else if (dti(d, 'tiktok.com/')) tiktok.main(d.text, ctx);
  else if (dti(d, '/bruh')) bratan.main(cmd, ctx);
  else if (dti(d, '/meta')) meta.main(cmd, ctx);
}

module.exports = {
  bot, outMsg, delMsg,
};
