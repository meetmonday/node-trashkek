// bot modules
const trashkek = require('./modules/trashkek');
const hentai = require('./modules/hentai');
const tiktok = require('./modules/tiktok');
const dora = require('./modules/dora');

const dti = ({ text }, cmd) => text.includes(cmd);
const dtr = ({ text }, cmd) => text.replace(cmd, '');

function bot(message) {
  if (!message || !('entities' in message) || !dti(message, '/')) return;
  let cmd = null;

  if (message.entities[0].type === 'bot_command') cmd = message.text.slice(message.entities[0].offset, message.entities[0].length);

  if (cmd === '/ping') dora.main(message);
  else if (message.text === '/hentai') hentai.random(message);
  else if (cmd === '/hentai') hentai.search(dtr(message, '/hentai'), message);
  else if (cmd === '/dora') dora.clip(message);
  else if (dti(message, '#div_comment')) trashkek.main(message.text, 0, message);
  else if (dti(message, 'tiktok.com/')) tiktok.main(message.text, message);
  else if (dti(message, '/ngforce')) dora.clip(message);
}

module.exports = { bot };
