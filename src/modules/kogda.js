/**
 * Returns the correct word form based on Russian pluralization rules.
 * @param {number} number - The number to determine form for.
 * @param {string[]} forms - Array of three word forms [singular, few, many].
 * @returns {string} Correct word form.
 */
function getWordForm(number, forms) {
  if (number % 10 === 1 && number % 100 !== 11) {
    return forms[0];
  } if (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20)) {
    return forms[1];
  }
  return forms[2];
}

/**
 * Calculates time until next midnight UTC.
 * @returns {string} Formatted time string.
 */
function getTimeDiffToNextMidnight() {
  const now = new Date();
  const nextMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0),
  );

  const diff = nextMidnight - now;

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const hourWord = getWordForm(hours, ['час', 'часа', 'часов']);
  const minuteWord = getWordForm(minutes, ['минута', 'минуты', 'минут']);
  const secondWord = getWordForm(seconds, ['секунда', 'секунды', 'секунд']);

  return `наган будет готов через ${hours} ${hourWord} ${minutes} ${minuteWord} и ${seconds} ${secondWord}`;
}

/**
 * Handler for "когда" command.
 * @param {Object} ctx - Telegraf context object.
 */
function main(ctx) {
  ctx.sendMessage(getTimeDiffToNextMidnight());
}

export default main;
