import { tiktokdownload } from 'tiktok-scraper-without-watermark';
import { sendMessage } from 'kektg';
import { link } from '../lib/tgFormat.js';

function main(msg) {
  tiktokdownload(msg.text)
    .then((result) => {
      if (result.nowm) sendMessage(link('Текток', result.nowm), msg);
      else sendMessage('Чета пошло не так, и текток не скачался', msg);
    })
    .catch((e) => sendMessage(`Чета не так пошло\n||${e}||`, msg));
}

export default main;
