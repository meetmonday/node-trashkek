import Booru from 'booru';
import { rand, link } from '#lib/helpers.js';

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
  ctx.sendMessage(link('Пикча', randomImageUrl), { parse_mode: 'Markdown' });
};

/**
 * Searches for images on a booru site and sends them as a media group.
 * @param {string} tags - Search tags.
 * @param {Object} ctx - Telegraf context object.
 * @param {string} site - Booru site identifier.
 */
const searchCommand = async (tags, ctx, site = 'danbooru') => {
  await ctx.sendChatAction('upload_photo');

  try {
    const res = await Booru.search(site, tags, { limit: 4, random: true });

    if (!res.posts.length) {
      await ctx.sendMessage('Ничего не найдено');
      return;
    }

    console.log(res.posts);

    const photos = res.posts.map((e) => ({
      type: 'photo',
      media: e.sample_url || e.preview_url || e.file_url,
      has_spoiler: e.rating === 'e',
      caption: `score: ${e.score} / id: ${link(e.id, e.booru.domain + e.booru.site.api.postView + e.id)}`,
      parse_mode: 'Markdown',
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
  if (ctx.payload) {
    const args = extractSite(ctx.payload);

    const unsupportedSites = ['gelbooru', 'gb', 'rule34', 'r34', 'tb', 'tbib', 'big', 'xb', 'xbooru', 'pa', 'paheal', 'rb', 'realbooru'];
    if (unsupportedSites.includes(args.site)) {
      ctx.reply('Не поддерживается');
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

export default hentaiRouter;
