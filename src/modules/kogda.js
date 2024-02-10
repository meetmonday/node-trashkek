import { sendMessage } from '#lib/tgApi';

function declensionOfNoun(number, one, few, many) {
    let n = Math.abs(number) % 100;
    let n1 = n % 10;

    if (n > 10 && n < 20) {
        return many;
    }
    if (n1 > 1 && n1 < 5) {
        return few;
    }
    if (n1 === 1) {
        return one;
    }
    return many;
}

function getTimeUntilMidnightUTC() {
    let now = new Date();
    let midnightUTC = new Date(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0, 0
    );

    let differenceInSeconds = (midnightUTC.getTime() - now.getTime()) / 1000;

    let hours = Math.floor(differenceInSeconds / 3600);
    let minutes = Math.floor((differenceInSeconds % 3600) / 60);
    let seconds = Math.floor(differenceInSeconds % 60);

    let hoursSuffix = declensionOfNoun(hours, 'час', 'часа', 'часов');
    let minutesSuffix = declensionOfNoun(minutes, 'минута', 'минуты', 'минут');
    let secondsSuffix = declensionOfNoun(seconds, 'секунда', 'секунды', 'секунд');

    return `наган будет стрелять через  ${Math.abs(hours)} ${hoursSuffix} ${Math.abs(minutes)} ${minutesSuffix} и ${Math.abs(seconds)} ${secondsSuffix}, а таран лох и не осилил`;
}

function main(msg) {
  sendMessage(getTimeUntilMidnightUTC(), msg);
}

export default main;