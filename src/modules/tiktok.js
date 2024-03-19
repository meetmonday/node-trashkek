import { ttd } from '#lib/tswwMini';
import { deleteMessage, sendMessage, sendVideo } from '#lib/tgApi';

function main(msg) {
  sendMessage('Ща будет текток.........', msg, {}, ({ result: del }) => {
    ttd(msg.text)
      .then((ttres) => {
        sendVideo(msg, { video: ttres.data.video });
        deleteMessage({ chat: { id: del.chat.id }, message_id: del.message_id });
      })
      .catch(() => sendMessage('Чета не так пошло........', msg));
  });
}

export default main;
