var _ = require('lodash/random');
var b = require('../bot');


hehentai = ([msg, out]) => {
  out(`[Пикча](https://danbooru.donmai.us/posts/${_(5013920)})`, msg)
}

hentai = async (tags, [msg, out]) => {
  const axios = require('axios').default;
  const req = await axios.get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=sort:random ${tags}`, {
    proxy: {
      host: process.env.HENTAI_PROXY,
      port: process.env.HENTAI_PORT
    }
  });
  if(req.data.post)
    r = `[Пикча](${req.data.post[0].file_url})\nscore: ${req.data.post[0].score} / id: ${req.data.post[0].id}`
  else r = `${tags} не нашлось`
  out(r, msg)
}

module.exports = { hentai, hehentai };
