const _ = require('lodash/random');
const axios = require('axios').default;

function hehentai([msg, out]) {
  out(`[Пикча](https://danbooru.donmai.us/posts/${_(5013920)})`, msg);
}

async function hentai(tags, [msg, out]) {
  const req = await axios.get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=sort:random ${tags}`, {
    proxy: {
      host: process.env.HENTAI_PROXY,
      port: process.env.HENTAI_PORT,
    },
  });
  if (req.data.post) {
    const r = `[Пикча](${req.data.post[0].file_url})\nscore: ${req.data.post[0].score} / id: ${req.data.post[0].id}`;
    out(r, msg);
  } else { const r = `${tags} не нашлось`; out(r, msg); }
}

module.exports = { hentai, hehentai };
