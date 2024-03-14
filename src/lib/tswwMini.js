import axios from 'axios';
import cheerio from 'cheerio'
const INSTANCE = 'https://proxitok.pabloferreiro.es/';
function legacyDownload(url) {
  const path = url.match(/tiktok.com\/(.*)\//)[1];
  return new Promise((resolve, reject) => {
    axios.get(`${INSTANCE}/@placeholder/video/${path}`).then((e) => {
      const links = e.data.match(/<a target="_blank" href=".*" /gi);
      resolve(`${decodeURIComponent(links[1].slice(25))}`);
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

function ttd(url) {
     return new Promise((resolve, reject) => {
          Axios.get('https://ttdownloader.com/')
               .then((data) => {
                    const $ = cheerio.load(data.data)
                    const cookie = data.headers['set-cookie'].join('')
                    const dataPost = {
                         url: url,
                         format: '',
                         token: $('#token').attr('value')
                    }
                    // return console.log(cookie);
                    Axios({
                         method: 'POST',
                         url: 'https://ttdownloader.com/search/',
                         headers: {
                              'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                              origin: 'https://ttdownloader.com',
                              referer: 'https://ttdownloader.com/',
                              cookie
                         },
                         data: qs.stringify(dataPost)
                    }).then(({ data }) => {
                         const $ = cheerio.load(data)
                         const result = {
                              nowm: $('#results-list > div:nth-child(2) > div.download > a')?.attr('href'),
                              wm: $('#results-list > div:nth-child(3) > div.download > a')?.attr('href'),
                              audio: $('#results-list > div:nth-child(4) > div.download > a').attr('href')
                         }
                         resolve(result);
                    })
                         .catch(e => {
                              reject({ status: false, message: 'error fetch data', e: e.message })
                         })
               })
               .catch(e => {
                    reject({ status: false, message: 'error fetch data', e: e.message })
               })
     })
}

export { legacyDownload, tiktokdownload, ttd };
