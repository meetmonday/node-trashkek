// bot modules
import trashkek from './modules/trashkek.js';
import hentai from './modules/hentai.js';
import tiktok from './modules/tiktok.js';
import dora from './modules/dora/index.js';

const dti = ({ text }, cmd) => text.includes(cmd);
const dtr = ({ text }, cmd) => text.replace(cmd, '');

function bot(message) {
  if (!message || !('entities' in message) || !dti(message, '/')) return;
  let cmd = null;

  if (message.entities[0].type === 'bot_command') cmd = message.text.slice(message.entities[0].offset, message.entities[0].length);

  if (cmd === '/ping') dora.lyric(message);
  else if (message.text === '/hentai') hentai.random(message);
  else if (cmd === '/hentai') hentai.search(dtr(message, '/hentai'), message);
  else if (cmd === '/dora') dora.clip(message);
  else if (dti(message, '#div_comment')) trashkek(message);
  else if (dti(message, 'tiktok.com/')) tiktok(message);
  else if (dti(message, '/ngforce')) dora.clip(message);
}

export default bot;
