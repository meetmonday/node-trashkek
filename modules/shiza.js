import { sendMessage } from '../lib/tgApi';
import PShiza from '../lib/persist';
import rand from '../lib/rand';

const psh = new PShiza('pdb/', 'shiza');

function shizaSend(msg) {
  sendMessage(psh.data[rand(0, psh.len())], msg);
}

function shizaAdd(msg) {
  // eslint-disable-next-line max-len
  // if (msg.from.username !== 'meetmonday') { if (rand(0, 1)) sendMessage('Иди нахуй', msg); return false; }
  psh.data.push(msg.reply_to_message.text);
  psh.set(psh.data);
  return true;
}

function shizaCounter(msg) {
  sendMessage(`В базе сейчас ${psh.len()} высеров`, msg);
}

const shizaRouter = (msg, args) => {
  if (!args) shizaSend(msg);
  if (args === 'add') shizaAdd(msg);
  else if (args === 'info') shizaCounter(msg);
};

export default shizaRouter;
