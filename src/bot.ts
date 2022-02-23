// bot modules
// import trashkek from './modules/trashkek';
import hentai from './modules/hentai';
import tiktok from './modules/tiktok';
import dora from './modules/dora/';
import type { Message } from 'telegram-typings';


const dti = (text: string, cmd: string) => text.includes(cmd);
const dtr = (text: string, cmd: string) => text.replace(cmd, '');

function bot(message: Message) {
  if (!message.text || !('entities' in message)) return;

  if (message.text === '/ping') dora.lyric(message);
  else if (message.text === '/hentai') hentai.random(message);
  else if (dti(message.text, '/hentai') && message.text !== '/hentai') hentai.search(dtr(message.text, '/hentai'), message);
  // else if (cmd === '/dora') dora.clip(message);
  else if (dti(message.text, '#div_comment')) dora.clip(message);
  else if (dti(message.text, 'tiktok.com/')) tiktok(message);
  else if (dti(message.text, '/ngforce')) dora.clip(message);
}

export default bot;
