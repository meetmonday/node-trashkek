import { sendMessage } from '../lib/tgApi';
import p from '../lib/persist';
import rand from '../lib/rand';

let persist = p.initPersist('shiza');

function shizaSend(msg) {
  sendMessage(persist[rand(0, persist.length - 1)], msg);
}

function shizaAdd(msg) {
  if (msg.from.username !== 'meetmonday') { if (rand(0, 1)) sendMessage('Иди нахуй', msg); return false; }
  persist.push(msg.reply_to_message.text);
  persist = p.updatePersist('shiza', persist);
  return true;
}

function shizaCounter(msg) {
  sendMessage(`В базе сейчас ${persist.length} высеров`, msg);
}

const shizaRouter = (msg, args) => {
  if (!args) shizaSend(msg);
  if (args === 'add') shizaAdd(msg);
  else if (args === 'info') shizaCounter(msg);
};

export default shizaRouter;
