import axios from 'axios';
import { sendMessage, sendPhoto } from '../lib/tgApi';
import rand from '../lib/rand';
import { link } from '../lib/tgFormat';

const config = process.env.HENTAI_PROXY ? {
  proxy: {
    host: process.env.HENTAI_PROXY || null,
    port: process.env.HENTAI_PORT || null,
  },
} : {};

const random = (msg) => sendMessage(link('Пикча', `https://danbooru.donmai.us/posts/${rand(0, 5013920)}`), msg);

function search(tags, msg) {
  axios.get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=sort:random ${tags} -animated`, config).then(({ data }) => {
    if (data.post) sendPhoto(msg, { photo: data.post[0].file_url, caption: `score: ${data.post[0].score} / id: ${link(data.post[0].id, `https://gelbooru.com/index.php?page=post&s=view&id=${data.post[0].id}`)}` });
    else sendMessage('Ничего не нашлось', msg);
  }).catch((e) => {
    sendMessage(`Ошибка: ${e.code}`, msg);
  });
}

const hentaiRouter = (msg, args) => (args ? search(args, msg) : random(msg));

export default hentaiRouter;
