const { tiktokdownload } = require('tiktok-scraper-without-watermark');
const { sendMessage } = require('kektg');
const { link } = require('../lib/tgFormat');

function main(url, msg) {
  tiktokdownload(url)
    .then((result) => {
      if (result.nowm) sendMessage(link('Текток', result.nowm), msg);
      else sendMessage('Чета пошло не так, и текток не скачался', msg);
    })
    .catch((e) => sendMessage(`Чета не так пошло\n||${e}||`, msg));
}

module.exports = { main };
