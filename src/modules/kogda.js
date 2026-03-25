
function getWordForm(number, forms) {
    if (number % 10 == 1 && number % 100 != 11) {
        return forms[0];
    } else if (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20)) {
        return forms[1];
    } else {
        return forms[2];
    }
}

function getTimeDiffToNextMidnight() {
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

    const diff = nextMidnight - now;

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const hourWord = getWordForm(hours, ['час', 'часа', 'часов']);
    const minuteWord = getWordForm(minutes, ['минута', 'минуты', 'минут']);
    const secondWord = getWordForm(seconds, ['секунда', 'секунды', 'секунд']);

    return `наган будет готов через ${hours} ${hourWord} ${minutes} ${minuteWord} и ${seconds} ${secondWord}`;
}

function main(msg) {
    msg.sendMessage(getTimeDiffToNextMidnight())
}

export default main;
