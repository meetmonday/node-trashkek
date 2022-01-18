const tiktok = require('tiktok-scraper-without-watermark');
const f = require('../lib/tgFormat');

function main(link, [msg, out]) {
  tiktok.tiktokdownload(link)
    .then((result) => {
      if (result.nowm) out(f.link('Текток', result.nowm), msg);
      else out('Чета пошло не так, и текток не скачался', msg);
    })
    .catch((e) => out(`Чета не так пошло\n||${e}||`, msg));
}

module.exports = { main };
