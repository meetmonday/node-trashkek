import { deleteMessage, sendMessage, sendVideo } from '#lib/tgApi';
import pkg from 'nayan-media-downloader';
const { ytdown } = pkg;

function main(msg) {
    sendMessage('Ща будет ШОРТС.........', msg, {}, ({result: del}) => {
        ytdown(msg.text)
            .then((ttres) => {
                sendVideo(msg, {video: ttres.data.video});
                deleteMessage({chat: {id: del.chat.id}, message_id: del.message_id});
            })
            .catch(() => sendMessage('Чета не так пошло........', msg));
    });
}

export default main;
