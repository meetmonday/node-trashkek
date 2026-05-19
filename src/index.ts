import { Bot } from "gramio";
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
  .onStart(({ info }) => console.log(`Running as @${info.username}`));

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  shutdown(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

let shuttingDown = false;

async function shutdown(exitCode = 0): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('Shutting down...');
  bot.stop();

  try {
    const { bipbank } = await import('@/economy');
    bipbank.close();
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
