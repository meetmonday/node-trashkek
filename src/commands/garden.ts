import type { BotType } from "..";
import { InlineKeyboard, MessageContext } from "gramio";
import { generateAuthUrl } from "../mini-apps/auth";

const MINI_APP_URL = process.env.MINI_APP_URL;
const BOT_TOKEN = process.env.BOT_TOKEN ?? "";

type CmdCtx = MessageContext<BotType> & { args: string | null };

export default (bot: BotType) =>
  bot.command("garden", async (ctx: CmdCtx) => {
    if (!MINI_APP_URL) {
      await ctx.reply("🌻 Мини-приложение пока не настроено (MINI_APP_URL)");
      return;
    }

    const chatId = ctx.chat?.id ?? ctx.senderId;
    if (!chatId) return;

    const isPrivate = ctx.chat?.type === "private";

    if (isPrivate) {
      const keyboard = new InlineKeyboard().webApp(
        "🌻 Открыть огород",
        MINI_APP_URL,
      );

      await bot.api.sendMessage({
        chat_id: chatId,
        text: "🌻 Твой огород",
        reply_markup: keyboard,
      });
    } else {
      const userId = ctx.senderId ?? ctx.from?.id;
      if (!userId) return;
      const token = generateAuthUrl(userId, BOT_TOKEN);
      const keyboard = new InlineKeyboard().url(
        "🌻 Открыть огород",
        `${MINI_APP_URL}?auth=${token}`,
      );

      await bot.api.sendMessage({
        chat_id: chatId,
        text: "🌻 Открыть огород",
        reply_markup: keyboard,
      });
    }
  });
