import axios from 'axios';
import Booru, { search, BooruError, sites } from 'booru'
import { rand, link } from '#lib/helpers';

const config = process.env.HENTAI_PROXY ? {
  proxy: {
    host: process.env.HENTAI_PROXY || null,
    port: process.env.HENTAI_PORT || null,
  },
} : {};

const random = (ctx) => {
  const randomId = rand(0, 5013920);
  const randomImageUrl = `https://danbooru.donmai.us/posts/${randomId}`;
  console.log(link('test', 'https://google.com/'))
  ctx.sendMessage(link('Пикча', randomImageUrl), { parse_mode: 'Markdown' });
};

function searchWOBooru(tags, ctx) {
  ctx.sendChatAction('upload_photo', ()=>{})
  const searchUrl = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=4&tags=sort:random ${tags} -animated`;

  axios.get(searchUrl, config)
    .then(({ data }) => {
      if (data['@attributes'].count == 0) { ctx.sendMessage('Ничего не нашлось'); return false; }
      const photos = data.post.map((e) => {
        return {
          type: 'photo',
          media: e.file_url,
          has_spoiler: e.rating == 'explicit' ? true : false,
          caption: `score: ${e.score} / id: ${link(e.id, 'https://gelbooru.com/index.php?page=post&s=view&id=' + e.id)}`,
        }
      })

      ctx.sendMediaGroup(photos).catch((e)=> {
        setTimeout(()=>{searchWOBooru(ctx.payload, ctx)}, 3000)
      });

    })
    .catch((e) => {
      sendMessage(`Ошибка: ${e.code}`, msg);
    });
}

const searchCommand = (tags, ctx, site = 'gb') => {
  ctx.sendChatAction('upload_photo', ()=>{})
  Booru.search(site, tags, { limit: 4, random: true }).then((res) => {
    if(res.posts == []) { sendMessage('Ничего не найдено', msg); return false; }
    
    const photos = res.posts.map((e) => {
      return {
        type: 'photo',
        media: e.file_url,
        has_spoiler: e.rating == 'e' ? true : false,
        caption: `score: ${e.score} / id: ${link(e.id, 'https://gelbooru.com/index.php?page=post&s=view&id=' + e.id)}`,
        parse_mode: 'Markdown'
      }
    })

    ctx.sendMediaGroup(photos).catch(()=> {
      setTimeout(()=>{searchCommand(ctx.payload, ctx)}, 3000)
    });
  })
}



const hentaiRouter = (ctx) => {
  console.log(ctx)
  if (ctx.payload) {
    searchCommand(ctx.payload, ctx);
  } else {
    random(ctx);
  }
};

export default hentaiRouter;
