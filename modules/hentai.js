const _ = require('lodash/random');
const axios = require('axios').default;
const f = require('../lib/tgFormat');

function random([msg, out]) {
  out(f.link('Пикча', `https://danbooru.donmai.us/posts/${_(5013920)}`), msg);
}

async function search(tags, [msg, out]) {
  axios.get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=sort:random ${tags}`).then((req) => {
    let r = `${f.code(tags)} не нашлось`;
    if (req.data.post) r = `${f.link('Пикча', req.data.post[0].file_url)}\nscore: ${req.data.post[0].score} / id: ${f.link(req.data.post[0].id, `https://gelbooru.com/index.php?page=post&s=view&id=${req.data.post[0].id}`)}`;
    out(r, msg);
  }).catch((e) => {
    out(`Ошибка: ${f.code(e.code)}`, msg);
  });
}

module.exports = { search, random };
