import { tiktokdownload } from 'tiktok-scraper-without-watermark';
import { sendMessage } from 'kektg';
import { link } from '../lib/tgFormat';
import { Message } from 'telegram-typings';

type TTLinks = {
  nowm: string,
  wm: string,
  audio: string
}

function main(msg: Message) {
  tiktokdownload(msg.text)
    .then((result: TTLinks) => {
      if (result.nowm) sendMessage(link('Текток', result.nowm), msg);
      else sendMessage('Чета пошло не так, и текток не скачался', msg);
    })
    .catch((e: any) => sendMessage(`Чета не так пошло\n||${e}||`, msg));
}

export default main;
