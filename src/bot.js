import trashkek from '#modules/trashkek';
import hentai from '#modules/hentai';
import tiktok from '#modules/tiktok';
import youtube from '#modules/youtube';
import dora from '#modules/dora/index';
import gdestas from '#modules/gdestas';
import kogda from '#modules/kogda';
import { gptCommand } from '#modules/chatgpt';
import { nagangpt } from '#modules/nagangpt';

const dti = ({ text }, cmd) => text.includes(cmd);

function bot(message) {
  if (!message || !('entities' in message)) return;
  const cmd = message.entities[0].type === 'bot_command' ? message.text.slice(message.entities[0].offset, message.entities[0].length) : null;
  const args = message.text.replace(cmd, '').trim();

  const funcList = {
    '/ping': dora.lyric,
    '/ngforce': dora.clip,
    '/dora': dora.clip,
    '/hentai': hentai,
    '/gdestas': gdestas,
    '/ngwhen': kogda,
    '/gpt': gptCommand,
    '/ng': nagangpt
  };

  if (cmd in funcList) funcList[cmd](message, args);
  else if (dti(message, '#div_comment')) trashkek(message);
  else if (dti(message, 'tiktok.com/')) tiktok(message);
  else if (dti(message, 'youtube.com/') || dti(message, 'youtu.be/')) youtube(message);
}

export default bot;
