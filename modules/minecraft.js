import { ping } from 'minecraft-server-ping';
import { sendMessage } from '../lib/tgApi';

function main(chat) {
  ping('mc.taranovegor.com', 25565).then((e) => {
    if (!e.players.online) { sendMessage('На сервере никого нет', chat); return; }
    sendMessage(`Сейчас на сервере: ${e.players.sample.map((j) => j.name).join(', ')}`, chat);
  });
}

export default main;
