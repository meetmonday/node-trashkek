import { Bot } from "gramio";
import { autoload } from "@gramio/autoload";

const bot = new Bot(process.env.BOT_TOKEN as string)
    .extend(await autoload())
    .onStart(({ info }) => console.log(`Running as @${info.username}`));

bot.start();

export type BotType = typeof bot;