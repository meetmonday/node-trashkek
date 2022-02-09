const { get } = require('axios').default;
const { rand } = require('../lib/rand');
const { link } = require('../lib/tgFormat');

const config = process.env.HENTAI_PROXY ? {
  proxy: {
    host: process.env.HENTAI_PROXY || null,
    port: process.env.HENTAI_PORT || null,
  },
} : {};

function random([msg, out]) {
  out(link('Пикча', `https://danbooru.donmai.us/posts/${rand(0, 5013920)}`), msg);
}

async function search(tags, [msg, out]) {
  get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=sort:random ${tags}`, config).then(({ data }) => {
    if (data.post) out(`${link('Пикча', data.post[0].file_url)}\nscore: ${data.post[0].score} / id: ${link(data.post[0].id, `https://gelbooru.com/index.php?page=post&s=view&id=${data.post[0].id}`)}`, msg);
    else out('Ничего не нашлось', msg);
  }).catch((e) => {
    out(`Ошибка: ${e.code}`, msg);
  });
}

module.exports = { search, random };
