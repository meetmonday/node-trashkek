import { sendMessage } from '#lib/tgApi';

function main(msg) {
  sendMessage(`doma`, msg);
}

export default main;
