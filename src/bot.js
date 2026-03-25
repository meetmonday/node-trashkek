import { Telegraf } from 'telegraf';

import tiktok from '#modules/tiktok';
import hentai from '#modules/hentai';
import trashkek from '#modules/trashkek';
import naganWhen from '#modules/kogda';
import getVersion from '#modules/version';
import dotagosu from '#modules/dotagosu';
import {hsites} from '#modules/static';

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.hears(/tiktok.com/, tiktok)
bot.hears(/#div_comment_/, trashkek)
bot.hears('когда', naganWhen)
bot.command('hentai', hentai)
bot.command('hentaiSites', hsites)
bot.command('ver', getVersion)

bot.on('inline_query', dotagosu)


bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
