import { Telegraf } from 'telegraf';

import tiktok from '#modules/tiktok.js';
import hentai, { handleRefreshCallback } from '#modules/hentai.js';
import trashkek from '#modules/trashkek.js';
import naganWhen from '#modules/kogda.js';
import getVersion from '#modules/version.js';
import dotagosu from '#modules/dotagosu.js';
import hsites from '#modules/static.js';

const bot = new Telegraf(process.env.BOT_TOKEN);

// Register message handlers
bot.hears(/tiktok\.com/, tiktok);
bot.hears(/#div_comment_/, trashkek);
bot.hears('когда', naganWhen);

// Register command handlers
bot.command('hentai', hentai);
bot.command('hentaiSites', hsites);
bot.command('ver', getVersion);

// Register inline query handler
bot.on('inline_query', dotagosu);

// Register callback query handler for hentai refresh
bot.on('callback_query', handleRefreshCallback);

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
