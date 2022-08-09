import axios from 'axios';
import { answerInlineQuery } from '../lib/tgApi';

const config = process.env.HENTAI_PROXY ? {
  proxy: {
    host: process.env.HENTAI_PROXY || null,
    port: process.env.HENTAI_PORT || null,
  },
} : {};

function search(tags, uid) {
  axios.get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=20&tags=sort:random ${tags} -animated`, config).then(({ data }) => {
    if (!data.post) {
      answerInlineQuery(uid, [{
        id: '2287007',
        type: 'photo',
        photo_url: 'https://img3.gelbooru.com//samples/d0/68/sample_d0689786e1f34d6a656690bdccea6884.jpg',
        thumb_url: 'https://img3.gelbooru.com//thumbnails/d0/68/thumbnail_d0689786e1f34d6a656690bdccea6884.jpg',
      }]); return false;
    }
    const results = [];
    data.post.forEach((el) => {
      results.push({
        type: 'photo',
        id: el.id,
        photo_url: el.file_url,
        thumb_url: el.preview_url,
        photo_width: el.width,
        photo_height: el.height,
      });
    });

    return answerInlineQuery(uid, results);
  }).catch((e) => {
    // sendMessage(`Ошибка: ${e.code}`, msg);
    console.log(e);
  });
}

export default search;
