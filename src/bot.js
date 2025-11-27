import { Telegraf } from 'telegraf';

import tiktok from '#modules/tiktok';
import hentai from '#modules/hentai';
import trashkek from '#modules/trashkek';
import naganWhen from '#modules/kogda';
import getVersion from '#modules/version';
import {hsites} from '#modules/static';

import { rand } from '#lib/helpers';
import fs from 'fs';

const bot = new Telegraf(process.env.BOT_TOKEN)



bot.hears(/tiktok.com/, tiktok)
bot.hears(/#div_comment_/, trashkek)
bot.hears('когда', naganWhen)
bot.command('hentai', hentai)
bot.command('ver', getVersion)
bot.command('hentaiSites', hsites)

const lines = fs.readFileSync('dgdata.txt', 'utf8').split("<br>").filter(Boolean);
bot.on('inline_query', (ctx) => {
  const zalupdaId = rand(0, lines.length - 1);
  ctx.answerInlineQuery([
    {
      type: 'article',
      id: zalupdaId,
      title: 'Выебать мамку - ' + zalupdaId,
      input_message_content: {
        message_text: lines[zalupdaId],
      }
    }
  ], 
  {
    cache_time: 1
  })
})


bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
