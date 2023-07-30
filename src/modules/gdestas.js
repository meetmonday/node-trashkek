import { sendMessage } from '#lib/tgApi';

function timeAgo() {
	const date1 = new Date()
	const date2 = new Date("04/23/2024")
	
	var Difference_In_Time = date2.getTime() - date1.getTime()
	var fin = Difference_In_Time / (1000 * 3600 * 24);

	return Math.round(fin)
}

function main(msg) {
  const skolko = timeAgo()
  sendMessage(`v armii eshe ${skolko} dn. ebat`, msg);
}

export default main;
