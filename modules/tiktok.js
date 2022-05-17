import { tiktokdownload } from 'tiktok-scraper-without-watermark';
import { deleteMessage, sendMessage, sendVideo } from '../lib/tgApi';

function main(msg) {
  sendMessage('Ща будет текток.........', msg, {}, ({ result: del }) => {
    tiktokdownload(msg.text)
      .then((ttres) => {
        if (!ttres.nowm) { sendMessage('Чета пошло не так, и текток не скачался', msg); return; }
        sendVideo(msg, { video: ttres.nowm });
        deleteMessage({ chat: { id: del.chat.id }, messageId: del.message_id });
      })
      .catch((e) => sendMessage(`Чета не так пошло\n||${e}||`, msg));
  });
}

export default main;
