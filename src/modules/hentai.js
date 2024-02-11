import axios from 'axios';
import { sendMessage, sendPhoto } from '#lib/tgApi';
import { rand, link } from '#lib/helpers';

const config = process.env.HENTAI_PROXY ? {
  proxy: {
    host: process.env.HENTAI_PROXY || null,
    port: process.env.HENTAI_PORT || null,
  },
} : {};

const random = (msg) => {
  const randomId = rand(0, 5013920);
  const randomImageUrl = `https://danbooru.donmai.us/posts/${randomId}`;
  sendMessage(link('Пикча', randomImageUrl), msg);
};

function search(tags, msg) {
  const searchUrl = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=sort:random ${tags} -animated`;

  axios.get(searchUrl, config)
    .then(({ data }) => {
      if (data.post) {
        const post = data.post[0];
        const photo = post.file_url;
        const caption = `score: ${post.score} / id: ${link(post.id, \`https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`)}`;
        sendPhoto(msg, { photo, caption });
      } else {
        sendMessage('Ничего не нашлось', msg);
      }
    })
    .catch((e) => {
      sendMessage(`Ошибка: ${e.code}`, msg);
    });
}

const hentaiRouter = (msg, args) => {
  if (args) {
    search(args, msg);
  } else {
    random(msg);
  }
};

export default hentaiRouter;