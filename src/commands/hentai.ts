import { format, link } from 'gramio';
import { search } from 'booru';
import { rand } from '@/helpers/rand';

import type { BotType } from '..';

const DEFAULT_SITE = 'danbooru'

/**
 * TODO: переработать
 */

/**
 * Extracts site name and tags from input string.
 * @param {string} input - Input string in format "@site tags" or just "tags".
 * @returns {{site: string, tags: string}} Object containing site name and tags.
 */
const extractSite = (input: string): { site: string; tags: string; } => {
  const match = input.match(/@\w+/);
  const site = match ? match[0].slice(1) : DEFAULT_SITE;
  const tags = input.replace(/@\w+/, '').trim();
  return { site, tags };
};

/**
 * Sends a random image from Danbooru.
 * @param {Object} ctx - Telegraf context object.
 */
const random = (ctx: any) => {
  const randomId = rand(0, 11191117);
  const randomImageUrl = `https://danbooru.donmai.us/posts/${randomId}`;
  ctx.send(format`${link('Пикча', randomImageUrl)}`);
};

/**
 * Searches for images on a booru site and sends them as a media group.
 * @param {string} tags - Search tags.
 * @param ctx - Telegraf context object.
 * @param {string} site - Booru site identifier.
 */
const searchCommand = async (tags: string, ctx: any, site: string = DEFAULT_SITE) => {
  ctx.sendChatAction('upload_photo');

  try {
    const res = await search(site, tags, { limit: 10, random: true });

    if (!res.posts.length) {
      await ctx.reply('Ничего не найдено');
      return;
    }
    
    const photos = res.posts.map((e) => ({
      type: 'photo',
      media: e.sample_url || e.preview_url || e.file_url,
      has_spoiler: e.rating === 'e',
      caption: format`score: ${e.score} / id: ${link(e.id, e.booru.domain + e.booru.site.api.postView + e.id)}`
    }));

    try {
      await ctx.sendMediaGroup(photos);
    } catch (err) {
      ctx.reply(`Ошибка отправки: ${(err as Error).message}`);
    }
  } catch (err) {
    ctx.reply(`Ошибка: ${(err as Error).message}`);
  }
};

/**
 * Routes hentai command requests based on arguments.
 * @param ctx - Telegraf context object.
 */
const hentaiRouter = (ctx: any) => {
  const payload: string = ctx.args;
  if (payload) {
    const args = extractSite(payload);

    const unsupportedSites = ['gelbooru', 'gb', 'rule34', 'r34', 'tb', 'tbib', 'big', 'xb', 'xbooru', 'pa', 'paheal', 'rb', 'realbooru'];
    if (unsupportedSites.includes(args.site)) {
      ctx.reply('Сайт не поддерживается');
      return;
    }

    const danbooruVariants = ['danbooru', 'db', 'dan', 'dp', 'derp', 'derpi', 'derpibooru'];
    if (danbooruVariants.includes(args.site) && !args.tags) {
      ctx.reply('Поиск только с тегами');
      return;
    }

    searchCommand(args.tags, ctx, args.site);
  } else {
    random(ctx);
  }
};

export default (bot: BotType) =>
    bot.command("hentai", (context) => hentaiRouter(context), 
      { rateLimit: { limit: 10, window: 15 }}
    );