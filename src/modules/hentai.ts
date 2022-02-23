import axios, { AxiosRequestConfig } from 'axios';
import { sendMessage } from 'kektg';
import { Message } from 'telegram-typings';
import rand from '../lib/rand.js';
import { link } from '../lib/tgFormat.js';

const config: AxiosRequestConfig = {
  proxy: {
    host: process.env.HENTAI_PROXY || '',
    port: parseInt(process.env.HENTAI_PORT || '')
  }
}

function random(msg: Message) {
  sendMessage(link('Пикча', `https://danbooru.donmai.us/posts/${rand(0, 5013920)}`), msg);
}

function search(tags: string, msg: Message) {
  axios.get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=sort:random ${tags}`, config).then(({ data }) => {
    if (data.post) sendMessage(`${link('Пикча', data.post[0].file_url)}\nscore: ${data.post[0].score} / id: ${link(data.post[0].id, `https://gelbooru.com/index.php?page=post&s=view&id=${data.post[0].id}`)}`, msg);
    else sendMessage('Ничего не нашлось', msg);
  }).catch((e) => {
    sendMessage(`Ошибка: ${e.code}`, msg);
  });
}

export default { search, random };
