const { tiktokdownload } = require('tiktok-scraper-without-watermark');
const { link } = require('../lib/tgFormat');

function main(url, [msg, out]) {
  tiktokdownload(url)
    .then((result) => {
      if (result.nowm) out(link('Текток', result.nowm), msg);
      else out('Чета пошло не так, и текток не скачался', msg);
    })
    .catch((e) => out(`Чета не так пошло\n||${e}||`, msg));
}

module.exports = { main };
