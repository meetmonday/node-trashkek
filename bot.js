import trashkek from './modules/trashkek';
import hentai from './modules/hentai';
import tiktok from './modules/tiktok';
import dora from './modules/dora/index';
import minecraft from './modules/minecraft';

const dti = ({ text }, cmd) => text.includes(cmd);

function bot(message) {
  if (!message || !('entities' in message)) return;
  const cmd = message.entities[0].type === 'bot_command' ? message.text.slice(message.entities[0].offset, message.entities[0].length) : null;

  const funcList = {
    '/ping': dora.lyric,
    '/ngforce': dora.clip,
    '/dora': dora.clip,
    '/mctaran': minecraft,
    '/hentai': hentai.random,
  };

  if (cmd in funcList) funcList[cmd](message);
  else if (dti(message, '#div_comment')) trashkek(message);
  else if (dti(message, 'tiktok.com/')) tiktok(message);
}

export default bot;
