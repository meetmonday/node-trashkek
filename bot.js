const token = process.env.BOT_TOKEN;
const tgAPI = `https://api.telegram.org/bot${token}`;

const axios = require('axios').default;

// bot modules
const tk = require('./modules/trashkek');
const h = require('./modules/hentai');
const tt = require('./modules/tiktok');
const bruh = require('./modules/bratan');

async function delMsg(msg) {
  try {
    await axios.post(`${tgAPI}/deleteMessage`, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    });
  } catch (err) { console.log(err); }
}

async function out(text, msg, preview = true, del = false) {
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

function dti(d, cmd) {
  return d.text.includes(cmd);
}

function dtr(d, cmd) {
  return d.text.replace(cmd, '');
}

async function bot(d) {
  if (!d || !('entities' in d)) return;
  let cmd = null;
  const ctx = [d, out];

  if (d.entities[0].type === 'bot_command') cmd = d.text.slice(d.entities[0].offset, d.entities[0].length);

  if (cmd === '/hehentai' || cmd === d.text) h.hehentai(ctx);
  else if (cmd === '/hentai') h.hentai(dtr(d, '/hentai'), ctx);
  else if (dti(d, 'tiktok.com/')) tt.grabber(d.text, ctx);
  else if (dti(d, '#div_comment')) tk.trashkekMain(d.text, 0, ctx);
  else if (dti(d, '/bruh')) bruh.main(cmd, ctx);
}

module.exports = {
  bot, out, delMsg,
};
