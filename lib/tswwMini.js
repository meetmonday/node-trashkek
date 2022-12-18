import axios from 'axios';

function tiktokdownload(url) {
  const path = url.match(/tiktok.com\/(.*)\//)[1]
  return new Promise((resolve, reject) => {
    axios.get(`https://tok.habedieeh.re/@placeholder/video/${path}`).then(e => {
      let links = e.data.match(/<a target="_blank" href=".*" /gi);
      resolve(decodeURIComponent(links[0].slice(39)));
    }).catch(e=>{
      reject();
    })
  })
}


export { tiktokdownload };
