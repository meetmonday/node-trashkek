import { tiktokdownload } from 'tiktok-scraper-without-watermark';
import { sendMessage, sendVideo } from '../lib/tgApi.js';

function main(msg) {
  tiktokdownload(msg.text)
    .then((result) => {
      if (result.nowm) sendVideo(msg, { video: result.nowm });
      else sendMessage('Чета пошло не так, и текток не скачался', msg);
    })
    .catch((e) => sendMessage(`Чета не так пошло\n||${e}||`, msg));
}

export default main;
