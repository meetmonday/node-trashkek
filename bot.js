const token = process.env.BOT_TOKEN;
const tgAPI = `https://api.telegram.org/bot${token}`;

const axios = require('axios').default;

// bot modules
const tk = require('./modules/trashkek')
const h = require('./modules/hentai')

bot = (d) => {
  if (!d || !('text' in d)) return;
  ctx = [d, out]

  if (d.text.includes('/hehentai')) h.hehentai(ctx)
  if (d.text.includes('/hentai')) h.hentai(d.text.replace('/hentai', ''), ctx)


  // output(d.text, d.chat.id)
}

dout = async (text, msg) => {
  console.log(text)
}

out = async (text, msg, preview = true) => {
  console.log(text)
  const axios = require('axios').default;
  try {
    const req = await axios.post(`${tgAPI}/sendMessage`, {
      text: text,
      chat_id: msg.chat.id,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: !preview
    })
  } catch (err) { console.log(err) }
}

delMsg = async (msg) => {
  try {
    const req = await axios.post(`${tgAPI}/deleteMessage`, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    })
  } catch (err) { console.log(err) }
}

module.exports = { bot, dout, out, delMsg };