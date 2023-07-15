import { sendMessage } from '#lib/tgApi';


function timeAgo(ts) {
  let fin = null;
  const times = [
    ['сек.', 1],
    ['мин.', 60],
    ['ч.', 3600],
    ['дн.', 86400],
  ];
  const diff = Math.floor(Date.now() / 1000 - ts);
  times.forEach((el) => {
    if (diff / el[1] > 1) fin = `${Math.floor(diff / el[1])} ${el[0]}`;
  });

  return fin;
}



function main(msg) {
  const skolko = timeAgo(1713812400)
  sendMessage(`v armii eshe ${skolko} dn. ebat`, msg);
}

export default main;
