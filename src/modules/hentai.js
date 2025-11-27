import Booru from 'booru'
import { rand, link } from '#lib/helpers';

const extractSite = (input) => {
  const match = input.match(/@\w+/);
  const word = match ? match[0].slice(1) : 'danbooru';
  const updatedString = input.replace(/@\w+/, '').trim();
  return { site: word, tags: updatedString };
};

const random = (ctx) => {
  const randomId = rand(0, 5013920);
  const randomImageUrl = `https://danbooru.donmai.us/posts/${randomId}`;
  ctx.sendMessage(link('Пикча', randomImageUrl), { parse_mode: 'Markdown' });
};

const searchCommand = async (tags, ctx, site = 'danbooru') => {
  ctx.sendChatAction('upload_photo', () => { })
  try {
    const res = await Booru.search(site, tags, { limit: 4, random: true })

    if (!res.posts.length) { ctx.sendMessage('Ничего не найдено'); return false; }
    console.log(res.posts)
    const photos = res.posts.map((e) => {
      return {
        type: 'photo',
        media: e.sample_url || e.preview_url || e.file_url,
        has_spoiler: e.rating == 'e' ? true : false,
        caption: `score: ${e.score} / id: ${link(e.id, e.booru.domain + e.booru.site.api.postView + e.id)}`,
        parse_mode: 'Markdown'
      }
    })

    ctx.sendMediaGroup(photos).catch((err) => {
      ctx.sendMessage('Ну хуй знвет, паша хуй соси\n' + err + '\n' + site + '\n' + tags)
      return false;
    });
  } catch (e) {
    ctx.reply('Ошибка\n' + e)
  }
}

const hentaiRouter = (ctx) => {
  if (ctx.payload) {
    const args = extractSite(ctx.payload);
    if (['gelbooru', 'gb',
      'rule34', 'r34',
      'tb', 'tbib', 'big',
      'xb', 'xbooru',
      'pa', 'paheal',
      'rb', 'realbooru'].includes(args.site)) {
      ctx.reply('Не поддерживается')
      return;
    }

    if (['danbooru', 'db', 'dan',
      'dp', 'derp', 'derpi', 'derpibooru',].includes(args.site) && !args.tags) {
      ctx.reply('Поиск только с тегами')
      return;
    }


    searchCommand(args.tags, ctx, args.site);
  } else {
    random(ctx);
  }
};

export default hentaiRouter;
