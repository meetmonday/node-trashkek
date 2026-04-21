import { Database } from 'bun:sqlite';

import type { BotType } from '..';

let dbInstance: Database | null = null;

/**
 * Get or create a singleton instance of the SQLite database
 * @returns {Database} The SQLite database instance
 */
function getDb(): Database {
  if (!dbInstance) {
    dbInstance = new Database('dgdata.db', { readonly: true });
  }
  return dbInstance;
}


/**
 * Get random line from SQLite database
 */
function getRandomLine(): string {
  const db = getDb();
  // Get total count
  const result = db.query('SELECT COUNT(*) as count FROM lines').get() as { count: number };
  const count = result.count;

  if (count === 0) {
    return '';
  }

  // Get random row using efficient method
  const randomOffset = Math.floor(Math.random() * count);
  const row = db.query('SELECT text FROM lines LIMIT 1 OFFSET ?').get(randomOffset) as { text: string } | undefined;

  return row?.text || '';
}

/**
 * Handle inline query
 * @param ctx - Telegram inline query context
 */
const main = async (ctx: any) => {
  const text = getRandomLine();

  ctx.answerInlineQuery([{
    type: 'article',
    id: crypto.randomUUID(),
    title: `Выебать мамку`,
    input_message_content: {
      message_text: text,
    },
  }], {
    cache_time: 1,
  });
};

export default (bot: BotType) =>
    bot.inlineQuery(()=>true, (context) => main(context));