import axios from 'axios';

const INSTANCE = 'https://proxitok.pabloferreiro.es/';
function legacyDownload(url) {
  const path = url.match(/tiktok.com\/(.*)\//)[1];
  return new Promise((resolve, reject) => {
    axios.get(`${INSTANCE}/@placeholder/video/${path}`).then((e) => {
      const links = e.data.match(/<a target="_blank" href=".*" /gi);
      resolve(`${INSTANCE}${decodeURIComponent(links[1].slice(25))}`);
    }).catch((e) => {
      reject(e);
    });
  });
}

function tiktokdownload(url) {
  return new Promise((resolve, reject) => {
    axios.get(`https://developers.tiklydown.me/api/download?url=${url}`).then((e) => {
      if (e.data.video) {
        resolve(e.data.video.noWatermark);
      }
    }).catch((e) => {
      reject(e);
    });
  });
}

export { legacyDownload, tiktokdownload };
