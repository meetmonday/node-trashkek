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
 * @param {boolean} edit - Whether to edit existing message instead of sending new one.
 * @param {string} callbackId - Callback ID for answering callback query.
 */
const searchCommand = async (tags, ctx, site = 'danbooru', edit = false, callbackId = null) => {
  await ctx.sendChatAction('upload_photo');

  try {
    const res = await Booru.search(site, tags, { limit: 4, random: true });

    if (!res.posts.length) {
      if (edit && callbackId) {
        await ctx.answerCbQuery('Ничего не найдено');
      } else {
        await ctx.sendMessage('Ничего не найдено');
      }
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

    const keyboard = {
      inline_keyboard: [[{ text: '🔄 Обновить', callback_data: `hentai_refresh:${site}:${tags}` }]],
    };

    try {
      if (edit && ctx.update.callback_query.message) {
        // Delete old message and send new one (can't edit media group directly)
        await ctx.deleteMessage();
        await ctx.sendMediaGroup(photos, { reply_markup: keyboard });
      } else {
        await ctx.sendMediaGroup(photos, { reply_markup: keyboard });
      }
      
      if (callbackId) {
        await ctx.answerCbQuery();
      }
    } catch (err) {
      if (callbackId) {
        await ctx.answerCbQuery(`Ошибка отправки: ${err.message}`);
      } else {
        await ctx.sendMessage(`Ошибка отправки: ${err.message}`);
      }
    }
  } catch (e) {
    if (callbackId) {
      await ctx.answerCbQuery(`Ошибка: ${e.message}`);
    } else {
      await ctx.reply(`Ошибка: ${e.message}`);
    }
  }
};

/**
 * Handles callback query for refreshing hentai images.
 * @param {Object} ctx - Telegraf context object.
 */
const handleRefreshCallback = async (ctx) => {
  const data = ctx.callbackQuery.data;
  const parts = data.split(':');
  
  if (parts[0] !== 'hentai_refresh') return;
  
  const site = parts[1] || 'danbooru';
  const tags = parts.slice(2).join(':') || '';
  
  await searchCommand(tags, ctx, site, true, ctx.callbackQuery.id);
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

export { hentaiRouter as default, handleRefreshCallback };
