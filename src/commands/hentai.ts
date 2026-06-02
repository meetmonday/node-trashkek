import { format, link, type MessageContext } from 'gramio';
import { search } from 'booru';
import rand from '@/helpers/rand';
import { bipbank } from '@/economy';

import type { BotType } from '..';
import { ensureBipkiUser } from '@/helpers/shared';
import { distributeRain } from './bipki/activities/rain';

type CmdCtx = MessageContext<BotType> & { args: string | null }

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
 * @param {Object} ctx - Context object.
 */
const random = async (ctx: CmdCtx) => {
  const randomId = rand(0, 11191117);
  const randomImageUrl = `https://danbooru.donmai.us/posts/${randomId}`;
  await ctx.send(format`${link('Пикча', randomImageUrl)}`);
};

/**
 * Searches for images on a booru site and sends them as a media group.
 * @param {string} tags - Search tags.
 * @param ctx - Context object.
 * @param {string} site - Booru site identifier.
 */
const searchCommand = async (ctx: CmdCtx, tags: string, site: string = DEFAULT_SITE) => {
  ctx.sendChatAction('upload_photo');

  try {
    const res = await search(site, tags, { limit: 10, random: true });

    if (!res.posts.length) {
      await ctx.reply('Ничего не найдено');
      return;
    }
    
    const photos = res.posts.map((e) => ({
      type: 'photo' as const,
      media: e.sample_url || e.preview_url || e.file_url || '',
      has_spoiler: e.rating === 'e',
      caption: format`score: ${e.score} / id: ${link(e.id, e.booru.domain + e.booru.site.api.postView + e.id)}`
    }));

    try {
      await ctx.sendMediaGroup(photos);
    } 
    catch {
      ctx.reply('Ошибка отправки медиа');
    }
  } 
  catch {
    ctx.reply('Ошибка поиска');
  }
};

/**
 * Routes hentai command requests based on arguments.
 * @param ctx - Context object.
 */
const hentaiRouter = async (ctx: CmdCtx) => {
  const payload: string = ctx.args ?? '';
  if (payload) {
    const args = extractSite(payload);

    const tagsOnly = ['danbooru', 'db', 'dan', 'dp', 'derp', 'derpi', 'derpibooru'];
    if (tagsOnly.includes(args.site) && !args.tags) {
      ctx.reply('Поиск только с тегами');
      return;
    }

    await searchCommand(ctx, args.tags, args.site);
  } 
  else {
    await random(ctx);
  }

  const userId = ensureBipkiUser(ctx)
  const chatId = ctx.chat?.id
  if (userId && chatId && ctx.chat?.type !== 'private' && rand(1, 100) >= 95) {
    const balance = bipbank.balance(userId)
    const amount = Math.max(4, Math.floor(balance * rand(5, 15) / 100))
    if (balance >= amount) {
      await distributeRain(
        ctx, userId, chatId, amount,
        `👀 Братану настолько понравились картинки, что он брызнул на весь чят`,
      )
    }
  }
};

export default (bot: BotType) =>
    bot.command("hentai", (context) => hentaiRouter(context), 
      { rateLimit: { limit: 10, window: 15 }}
    );