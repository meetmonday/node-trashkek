const tiktok = require('tiktok-scraper-without-watermark');

function grabber(link, [msg, out]) {
  tiktok.tiktokdownload(link)
    .then((result) => {
      if (result) out(`[Текток](${result.nowm})`, msg);
      else out('Чета пошло не так, и текток не скачался', msg);
    })
    .catch((e) => out(`Чета не так пошло\n||${e}||`, msg));
}

module.exports = { grabber };
