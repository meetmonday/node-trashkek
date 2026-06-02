import { bold, Bot } from "gramio";
import { autoload } from "@gramio/autoload";
import { autoRetry } from "@gramio/auto-retry";
import { rateLimit } from "@gramio/rate-limit";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('BOT_TOKEN is not set');
  process.exit(1);
}

const bot = new Bot(token)
  .extend(
    rateLimit({
      onLimitExceeded: async (ctx) => {
        if (ctx.is("message")) await ctx.reply("Слишком много запросов");
      },
    }),
  )
  .extend(autoRetry())
  .extend(await autoload())
  .onStart(async ({ info }) => {
    console.log(`Running as @${info.username}`);

    const { bipbank: _bipbank } = await import('@/economy');
    bipbankInstance = _bipbank;
    _bipbank.arena.onEvent = (event) => {
      if (event.type === 'week_start') {
        if (event.chatId === 0) return
        bot.api.sendMessage({
          chat_id: event.chatId,
          text: '🏟️ Новая неделя Арены! Ставки и выигрывай, чтобы занять топ!',
        }).catch(() => {})
      }

      if (event.type === 'week_end' && event.prizes) {
        const lines = [`🏟️ Неделя ${event.week} завершена!`]
        for (let i = 0; i < event.top.length && i < event.prizes.length; i++) {
          const t = event.top[i]!
          const p = event.prizes[i]!
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
          lines.push(`${medal} ${bold(`user${t.userId}`)} — ${bold(String(t.score))} бипок | +${bold(String(p.amount))} 🪙`)
        }
        bot.api.sendMessage({ chat_id: event.chatId, text: lines.join('\n'), parse_mode: 'HTML' }).catch(() => {})
      }
    };
  });

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  shutdown(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

let shuttingDown = false;
let bipbankInstance: { close(): void } | null = null;

async function shutdown(exitCode = 0): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('Shutting down...');
  bot.stop();

  try {
    (bipbankInstance ?? (await import('@/economy')).bipbank).close();
  } catch {
    // economy module may not be loaded yet
  }

  console.log('Goodbye.');
  process.exit(exitCode);
}

process.on('SIGTERM', () => shutdown());
process.on('SIGINT', () => shutdown());

bot.start();

export type BotType = typeof bot;
