import { Telegraf } from 'telegraf';

import tiktok from '#modules/tiktok';
import hentai from '#modules/hentai';
import trashkek from '#modules/trashkek';
import naganWhen from '#modules/kogda';
import getVersion from '#modules/version';

const bot = new Telegraf(process.env.BOT_TOKEN)
if(Bun.version) process.env.WEINBUN = true

bot.hears(/tiktok.com/, tiktok)
bot.hears(/#div_comment_/, trashkek)
bot.hears('когда', naganWhen)
bot.command('hentai', hentai)
bot.command('ver', getVersion)

bot.action(/henSug-/, (ctx) => {
    const list = ctx.update.callback_query.message.text.split('\n').splice(1)
    const ind = ctx.match.input.split('-')[1]

    hentai(ctx, true, list[ind].split('.')[1].split(' = ')[0].trim());
})

bot.launch()

// Enable graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'))
// process.once('SIGTERM', () => bot.stop('SIGTERM'))
