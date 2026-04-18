import { search } from 'booru';
import { rand } from '#lib/helpers.js';
import { format, link } from 'gramio';

/**
 * Extracts site name and tags from input string.
 * @param {string} input - Input string in format "@site tags" or just "tags".
 * @returns {{site: string, tags: string}} Object containing site name and tags.
 */
const extractSite = (input) => {
  const match = input.match(/@\w+/);
  const site = match ? match[0].slice(1) : 'danbooru';
  const tags = input.replace(/@\w+/, '').trim();
  return { site, tags };
};

/**
 * Sends a random image from Danbooru.
 * @param {Object} ctx - Telegraf context object.
 */
const random = (ctx) => {
  const randomId = rand(0, 5013920);
  const randomImageUrl = `https://danbooru.donmai.us/posts/${randomId}`;
  ctx.send(format`${link('Пикча', randomImageUrl)}`);
};

/**
 * Searches for images on a booru site and sends them as a media group.
 * @param {string} tags - Search tags.
 * @param {Object} ctx - Telegraf context object.
 * @param {string} site - Booru site identifier.
 */
const searchCommand = async (tags, ctx, site = 'danbooru') => {
  ctx.sendChatAction('upload_photo');

  try {
    const res = await search(site, tags, { limit: 4, random: true });

    if (!res.posts.length) {
      await ctx.send('Ничего не найдено');
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
      await ctx.sendMessage(`Ошибка отправки: ${err.message}`);
    }
  } catch (e) {
    await ctx.reply(`Ошибка: ${e.message}`);
  }
};

/**
 * Routes hentai command requests based on arguments.
 * @param {Object} ctx - Telegraf context object.
 */
const hentaiRouter = (ctx) => {
  const payload = ctx.text.slice(8) || null
  if (payload) {
    const args = extractSite(payload);

    const unsupportedSites = ['gelbooru', 'gb', 'rule34', 'r34', 'tb', 'tbib', 'big', 'xb', 'xbooru', 'pa', 'paheal', 'rb', 'realbooru'];
    if (unsupportedSites.includes(args.site)) {
      ctx.send('Не поддерживается');
      return;
    }

    const danbooruVariants = ['danbooru', 'db', 'dan', 'dp', 'derp', 'derpi', 'derpibooru'];
    if (danbooruVariants.includes(args.site) && !args.tags) {
      ctx.send('Поиск только с тегами');
      return;
    }

    searchCommand(args.tags, ctx, args.site);
  } else {
    random(ctx);
  }
};

export default (bot: BotType) =>
    bot.command("hentai", (context) => hentaiRouter(context));