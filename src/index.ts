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

bot.start();

export type BotType = typeof bot;