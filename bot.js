const token = process.env.BOT_TOKEN;
const tgAPI = `https://api.telegram.org/bot${token}`;

const axios = require('axios').default;

// bot modules
const tk = require('./modules/trashkek');
const h = require('./modules/hentai');
const tt = require('./modules/tiktok');

async function delMsg(msg) {
  try {
    await axios.post(`${tgAPI}/deleteMessage`, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    });
  } catch (err) { console.log(err); }
}

async function out(text, msg, preview = true, del = false) {
  // console.log(text)
  if (del) delMsg(msg);
  try {
    await axios.post(`${tgAPI}/sendMessage`, {
      text,
      chat_id: msg.chat.id,
      parse_mode: 'Markdown',
      disable_web_page_preview: !preview,
    });
  } catch (err) { console.log(err); }
}

async function bot(d) {
  if (!d || !('text' in d)) return;
  const ctx = [d, out];

  if (d.text.includes('/hehentai')) h.hehentai(ctx);
  if (d.text.includes('tiktok.com/')) tt.grabber(d.text, ctx);
  if (d.text.includes('/hentai')) h.hentai(d.text.replace('/hentai', ''), ctx);
  if (d.text.includes('#div_comment')) tk.trashkekMain(d.text, 0, ctx);
}

async function dout(text) {
  console.log(text);
}

module.exports = {
  bot, dout, out, delMsg,
};
