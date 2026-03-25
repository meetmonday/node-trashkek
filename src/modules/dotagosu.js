import fs from 'fs';
import { rand } from '#lib/helpers.js';

// Load data file at module initialization
const lines = fs.readFileSync('dgdata.txt', 'utf8').split('<br>').filter(Boolean);

/**
 * Handler for inline queries - returns a random line from dgdata.txt.
 * @param {Object} ctx - Telegraf context object.
 */
const main = (ctx) => {
  const randomId = rand(0, lines.length - 1);

  ctx.answerInlineQuery([{
    type: 'article',
    id: randomId,
    title: `Выебать мамку - ${randomId}`,
    input_message_content: {
      message_text: lines[randomId],
    },
  }], {
    cache_time: 1,
  });
};

export default main;
