import axios from 'axios';
const INSTANCE = 'https://tok.habedieeh.re'
function tiktokdownload(url) {
  const path = url.match(/tiktok.com\/(.*)\//)[1]
  return new Promise((resolve, reject) => {
    axios.get(`${INSTANCE}/@placeholder/video/${path}`).then(e => {
      let links = e.data.match(/<a target="_blank" href=".*" /gi);
      resolve(`${INSTANCE}${decodeURIComponent(links[1].slice(25))}`);
    }).catch(e=>{
      reject();
    })
  })
}


export { tiktokdownload };
