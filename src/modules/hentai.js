import Booru from 'booru'
import { rand, link } from '#lib/helpers';

const extractSite = (input) => {
  const match = input.match(/@\w+/);
    const word = match ? match[0].slice(1) : 'gb';
    const updatedString = input.replace(/@\w+/, '').trim();
  return { site: word, tags: updatedString };
};

const random = (ctx) => {
  const randomId = rand(0, 5013920);
  const randomImageUrl = `https://danbooru.donmai.us/posts/${randomId}`;
  ctx.sendMessage(link('Пикча', randomImageUrl), { parse_mode: 'Markdown' });
};

const searchCommand = (tags, ctx, site = 'gb', t = 0) => {
  ctx.sendChatAction('upload_photo', ()=>{})
  Booru.search(site, tags, { limit: 3, random: true }).then((res) => {
    if(!res.posts.length) { ctx.sendMessage('Ничего не найдено'); return false; }
    
    const photos = res.posts.map((e) => {
      return {
        type: 'photo',
        media: e.file_url,
        has_spoiler: e.rating == 'e' ? true : false,
        caption: `score: ${e.score} / id: ${link(e.id, e.booru.domain+e.booru.site.api.postView+e.id)}`,
        parse_mode: 'Markdown'
      }
    })
  })
}

const hentaiRouter = (ctx) => {
  if (ctx.payload) {
    const args = extractSite(ctx.payload)
    searchCommand(args.tags, ctx, args.site);
  } else {
    random(ctx);
  }
};

export default hentaiRouter;
