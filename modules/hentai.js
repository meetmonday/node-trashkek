const _ = require('lodash/random');
const axios = require('axios').default;

const proxy = {
  host: process.env.HENTAI_PROXY || null,
  port: process.env.HENTAI_PORT || null,
};

function random([msg, out], add = '') {
  out(`[Пикча](https://danbooru.donmai.us/posts/${_(5013920)})\n${add}`, msg);
}

async function search(tags, [msg, out]) {
  axios.get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=sort:random ${tags}`, {
    proxy,
  }).then((req) => {
    let r = `\`\`\`${tags}\`\`\` не нашлось`;
    if (req.data.post) r = `[Пикча](${req.data.post[0].file_url})\nscore: ${req.data.post[0].score} / id: [${req.data.post[0].id}](https://gelbooru.com/index.php?page=post&s=view&id=${req.data.post[0].id})`;
    out(r, msg);
  }).catch((e) => {
    out(`Ошибка: ${e.code}`, msg);
  });
}

module.exports = { search, random };
