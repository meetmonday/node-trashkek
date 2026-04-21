import { format } from 'gramio';

import type { BotType } from "..";

/** * A command that lists the supported booru sites and their aliases. */
export default (bot: BotType) =>
  bot.command('hsites', (context) => context.send(format`
    e621.net: e6, e621
    e926.net: e9, e926
    hypnohub.net: hh, hypno, hypnohub
    danbooru.donmai.us: db, dan, danbooru
    konachan.com: kc, konac, kcom
    konachan.net: kn, konan, knet
    yande.re: yd, yand, yandere
    safebooru.org: sb, safe, safebooru
    derpibooru.org: dp, derp, derpi, derpibooru
  `)
);