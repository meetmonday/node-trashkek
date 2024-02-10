import trashkek from '#modules/trashkek';
import hentai from '#modules/hentai';
import tiktok from '#modules/tiktok';
import dora from '#modules/dora/index';
import gdestas from '#modules/gdestas';
import kogda from '#modules/kogda';
import shiza from '#modules/shiza/index';

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
    '/shiza': shiza,
    '/ngwhen': kogda,
  };

  if (cmd in funcList) funcList[cmd](message, args);
  else if (dti(message, '#div_comment')) trashkek(message);
  else if (dti(message, 'tiktok.com/')) tiktok(message);
}

export default bot;
