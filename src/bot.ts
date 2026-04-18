import { Bot } from "gramio";
import { autoload } from "@gramio/autoload";

const bot = new Bot(process.env.BOT_TOKEN as string)
    .extend(await autoload());

bot.start();

export type BotType = typeof bot;