const token = process.env.BOT_TOKEN;
const tgAPI = `https://api.telegram.org/bot${token}`;

const { post } = require('axios').default;

// bot modules
const trashkek = require('./modules/trashkek');
const hentai = require('./modules/hentai');
const tiktok = require('./modules/tiktok');

function delMsg(msg) {
  post(`${tgAPI}/deleteMessage`, {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  }).catch((e) => { console.log(e); });
}

function outMsg(text, msg, preview = true, del = false) {
  if (del) delMsg(msg);
  post(`${tgAPI}/sendMessage`, {
    text,
    chat_id: msg.chat.id,
    parse_mode: 'Markdown',
    disable_web_page_preview: !preview,
  }).catch((err) => { console.log(err); });
}

const dti = ({ text }, cmd) => text.includes(cmd);
const dtr = ({ text }, cmd) => text.replace(cmd, '');

function bot(d) {
  if (!d || !('entities' in d) || !dti(d, '/')) return;
  let cmd = null;

  const ctx = [d, outMsg];
  if (d.entities[0].type === 'bot_command') cmd = d.text.slice(d.entities[0].offset, d.entities[0].length);

  if (cmd === '/ping') outMsg('Понг, блять.', d);
  else if (cmd === '/hehentai' || d.text === '/hentai') hentai.random(ctx);
  else if (cmd === '/hentai') hentai.search(dtr(d, '/hentai'), ctx);
  else if (dti(d, '#div_comment')) trashkek.main(d.text, 0, ctx);
  else if (dti(d, '/pidor')) outMsg(`Пидор дня: @${d.from.username}\nСоси хуй`, d, false, true);
  else if (dti(d, 'tiktok.com/')) tiktok.main(d.text, ctx);
}

module.exports = {
  bot, outMsg, delMsg,
};
