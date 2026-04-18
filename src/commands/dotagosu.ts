import fs from 'fs/promises';
import { rand } from '#lib/helpers.js';

// Cache for lines data - loaded once on first access
let linesCache = null;

/**
 * Loads lines from dgdata.txt file with caching.
 * @returns {Promise<string[]>} Array of lines from the file.
 */
async function loadLines() {
  if (!linesCache) {
    const content = await fs.readFile('dgdata.txt', 'utf8');
    linesCache = content.split('<br>').filter(Boolean);
  }
  return linesCache;
}

/**
 * Handler for inline queries - returns a random line from dgdata.txt.
 * @param {Object} ctx - Telegraf context object.
 */
const main = async (ctx) => {
  const lines = await loadLines();
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

export default (bot: BotType) =>
    bot.inlineQuery(()=>true, (context) => main(context));